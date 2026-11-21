import { segnali, verificaFormazione } from './disponibilita';
import { CaricoGiocatore, GiocatoreDisponibile, PosizioneCampo } from './model/formazione.model';

function g(id: number, cognome: string, ruolo: string, extra: Partial<GiocatoreDisponibile> = {}): GiocatoreDisponibile {
  return { id, nome: '', cognome, numeroMaglia: id, ruolo, categoriaRuolo: '', stato: 'ATTIVO', fuoriLista: false, ...extra };
}

function pos(giocatoreId: number, titolare = true): PosizioneCampo {
  return { giocatoreId, nomeGiocatore: '', cognomeGiocatore: '', numeroMaglia: null, coordX: 50, coordY: 50, slotRuolo: null, titolare };
}

const rosa = [
  g(1, 'Ferrarin', 'POR'), g(2, 'Sartini', 'POR'),
  ...Array.from({ length: 10 }, (_, i) => g(10 + i, `Gioc${i}`, 'CC')),
  g(30, 'Valsecchi', 'DC', { stato: 'INFORTUNATO' }),
  g(31, 'Lunardi', 'DC', { fuoriLista: true }),
];
const undici = [pos(1), ...Array.from({ length: 10 }, (_, i) => pos(10 + i))];
const nessunCarico = new Map<number, CaricoGiocatore>();
const gravita = (controlli: ReturnType<typeof verificaFormazione>, id: string) => controlli.find(c => c.id === id)?.gravita;

describe('verificaFormazione', () => {
  it('formazione completa con portiere di riserva: tutto ok', () => {
    const controlli = verificaFormazione([...undici, pos(2, false)], rosa, nessunCarico);

    expect(controlli.every(c => c.gravita === 'ok')).toBe(true);
  });

  it('segnala titolari mancanti e portiere assente', () => {
    const controlli = verificaFormazione(undici.slice(1), rosa, nessunCarico);

    expect(controlli.find(c => c.id === 'titolari')?.testo).toBe('10/11 titolari');
    expect(gravita(controlli, 'portiere')).toBe('errore');
  });

  it('segnala indisponibili e fuori lista anche se sono solo in panchina', () => {
    const controlli = verificaFormazione([...undici, pos(30, false), pos(31, false)], rosa, nessunCarico);

    expect(controlli.find(c => c.id === 'indisponibili')?.testo).toContain('Valsecchi');
    expect(controlli.find(c => c.id === 'lista')?.testo).toContain('Lunardi');
    expect(gravita(controlli, 'portiere-riserva')).toBe('avviso');
  });

  it('il carico alto conta solo per i titolari e solo con uno storico affidabile', () => {
    const carichi = new Map<number, CaricoGiocatore>([
      [10, { giocatoreId: 10, acwr: 1.7, storicoInsufficiente: false }],
      [11, { giocatoreId: 11, acwr: 1.9, storicoInsufficiente: true }],
    ]);

    const controlli = verificaFormazione(undici, rosa, carichi);

    expect(controlli.find(c => c.id === 'carico')?.testo).toBe('Carico di allenamento alto: Gioc0');
  });
});

describe('segnali', () => {
  it('mostra stato, lista e carico', () => {
    const testi = segnali(g(5, 'X', 'DC', { stato: 'SQUALIFICATO', fuoriLista: true }),
      { giocatoreId: 5, acwr: 1.62, storicoInsufficiente: false }).map(s => s.testo);

    expect(testi).toEqual(['Squalificato', 'Fuori lista', 'Carico alto · 1,6']);
  });
});
