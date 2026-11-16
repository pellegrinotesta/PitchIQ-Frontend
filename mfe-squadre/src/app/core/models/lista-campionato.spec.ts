import { FormazioneVivaio, Giocatore } from './giocatore.model';
import { annoStagione, eUnder22, sogliaUnder22, verificaLista } from './lista-campionato';

const OGGI = new Date(2026, 10, 16);
let seq = 0;
const giocatore = (patch: Partial<Giocatore> = {}): Giocatore =>
  ({
    id: ++seq,
    nome: 'Nome',
    cognome: `Cognome${String(seq).padStart(3, '0')}`,
    dataNascita: '1998-05-01',
    eta: 28,
    ruolo: 'CC',
    stato: 'ATTIVO',
    formazione: 'ALTRO',
    fuoriLista: false,
    ...patch,
  }) as Giocatore;
const gruppo = (n: number, formazione: FormazioneVivaio | null, patch: Partial<Giocatore> = {}) =>
  Array.from({ length: n }, () => giocatore({ formazione, ...patch }));
const conteggi = (rosa: Giocatore[]) =>
  verificaLista(rosa, OGGI).fasce.map((f) => f.giocatori.length);

describe('lista dei 25', () => {
  it('cambia stagione al 1 luglio e calcola la soglia Under 22', () => {
    expect(annoStagione(new Date(2026, 5, 30))).toBe(2025);
    expect(annoStagione(new Date(2026, 6, 1))).toBe(2026);
    expect(sogliaUnder22(2026)).toBe('2004-01-01');
    expect(eUnder22(giocatore({ dataNascita: '2004-01-01' }), 2026)).toBe(true);
    expect(eUnder22(giocatore({ dataNascita: '2003-12-31' }), 2026)).toBe(false);
    expect(eUnder22(giocatore({ dataNascita: null }), 2026)).toBeNull();
  });

  it('accetta una lista piena 4 + 4 + 17 e non conta gli Under 22', () => {
    const rosa = [
      ...gruppo(4, 'CLUB'),
      ...gruppo(4, 'ITALIA'),
      ...gruppo(17, 'ALTRO'),
      ...gruppo(6, 'ALTRO', { dataNascita: '2005-03-01' }),
    ];
    const v = verificaLista(rosa, OGGI);
    expect(conteggi(rosa)).toEqual([4, 4, 17]);
    expect(v).toMatchObject({ inLista: 25, conforme: true, problemi: [] });
    expect(v.under22).toHaveLength(6);
  });

  it('i posti riservati non sono utilizzabili da chi non è formato localmente', () => {
    const rosa = [...gruppo(2, 'CLUB'), ...gruppo(1, 'ITALIA'), ...gruppo(18, 'ALTRO')];
    const v = verificaLista(rosa, OGGI);
    expect(conteggi(rosa)).toEqual([2, 1, 17]);
    expect(v.conforme).toBe(false);
    expect(v.eccedenza).toHaveLength(1);
    expect(v.eccedenza[0].formazione).toBe('ALTRO');
  });

  it('i formati nel club in eccedenza scalano sui posti Italia e poi sui liberi', () => {
    const rosa = [...gruppo(10, 'CLUB'), ...gruppo(1, 'ITALIA'), ...gruppo(14, 'ALTRO')];
    expect(conteggi(rosa)).toEqual([4, 4, 17]);
    expect(verificaLista(rosa, OGGI).conforme).toBe(true);
    // I formati in Italia non possono occupare i posti riservati al club
    expect(conteggi([...gruppo(6, 'ITALIA')])).toEqual([0, 4, 2]);
  });

  it('escludere un giocatore dalla lista libera un posto', () => {
    const rosa = [...gruppo(18, 'ALTRO')];
    expect(verificaLista(rosa, OGGI).conforme).toBe(false);
    rosa[0] = { ...rosa[0], fuoriLista: true };
    const v = verificaLista(rosa, OGGI);
    expect(v.conforme).toBe(true);
    expect(v.fuoriLista).toHaveLength(1);
  });

  it('conta nel caso peggiore chi non ha data di nascita o formazione e lo segnala', () => {
    const rosa = [
      giocatore({ dataNascita: null, formazione: 'CLUB' }),
      giocatore({ formazione: null }),
      giocatore({ formazione: undefined }),
    ];
    const v = verificaLista(rosa, OGGI);
    expect(v.under22).toHaveLength(0);
    expect(conteggi(rosa)).toEqual([1, 0, 2]);
    expect(v.daClassificare).toHaveLength(3);
    expect(v.problemi).toHaveLength(1);
  });
});
