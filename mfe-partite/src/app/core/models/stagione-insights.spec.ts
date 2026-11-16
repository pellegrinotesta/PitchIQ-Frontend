import { EventoPartita, Partita, TipoEvento } from './partita.model';
import {
  applicaRegolaCampionato,
  bilancio,
  bilancioPerCampo,
  calendario,
  eSogliaSqualifica,
  filtraPartite,
  forma,
  situazioneDisciplinare,
  stagioneDi,
  stagioniDisponibili,
} from './stagione-insights';

let seq = 0;
const evento = (tipo: TipoEvento, giocatoreId: number | null): EventoPartita => ({
  id: ++seq,
  minuto: 10,
  minutoAggiuntivo: null,
  tipo,
  giocatoreId,
  nomeGiocatore: giocatoreId === null ? null : 'Nome',
  cognomeGiocatore: giocatoreId === null ? null : `G${giocatoreId}`,
  nota: null,
});

const partita = (patch: Partial<Partita> = {}): Partita => ({
  id: ++seq,
  data: '2026-09-01',
  avversario: 'Avversario',
  competizione: 'Serie A',
  casaTrasferta: 'CASA',
  golFatti: 1,
  golSubiti: 0,
  risultato: 'V',
  modulo: null,
  note: null,
  eventi: [],
  statistiche: null,
  ...patch,
});

/** n partite consecutive in cui il giocatore 7 viene ammonito */
const ammonizioniConsecutive = (n: number): Partita[] =>
  Array.from({ length: n }, (_, i) =>
    partita({
      data: `2026-09-${String(i + 1).padStart(2, '0')}`,
      eventi: [evento('AMMONIZIONE', 7)],
    }),
  );

describe('stagione-insights', () => {
  it('assegna la stagione sportiva con cambio al 1 luglio', () => {
    expect(stagioneDi('2026-06-30')).toBe('2025/26');
    expect(stagioneDi('2026-07-01')).toBe('2026/27');
    expect(stagioneDi('2000-01-15')).toBe('1999/00');
    expect(stagioneDi('non-una-data')).toBeNull();
    expect(
      stagioniDisponibili([partita({ data: '2025-10-01' }), partita({ data: '2026-10-01' })]),
    ).toEqual(['2026/27', '2025/26']);
  });

  it('filtra per stagione e competizione e ordina dalla più recente', () => {
    const lista = [
      partita({ id: 1, data: '2026-08-20' }),
      partita({ id: 2, data: '2026-10-05', competizione: 'Coppa Italia' }),
      partita({ id: 3, data: '2026-11-01' }),
      partita({ id: 4, data: '2026-03-01' }),
    ];
    expect(filtraPartite(lista, '2026/27', 'Serie A').map((p) => p.id)).toEqual([3, 1]);
    expect(filtraPartite(lista, null, null).map((p) => p.id)).toEqual([3, 2, 1, 4]);
  });

  it('calcola punti, media punti e bilancio casa/trasferta', () => {
    const lista = [
      partita({ risultato: 'V', golFatti: 2, golSubiti: 0 }),
      partita({ risultato: 'N', golFatti: 1, golSubiti: 1, casaTrasferta: 'TRASFERTA' }),
      partita({ risultato: 'P', golFatti: 0, golSubiti: 3, casaTrasferta: 'TRASFERTA' }),
    ];
    expect(bilancio(lista)).toMatchObject({
      giocate: 3, vittorie: 1, pareggi: 1, sconfitte: 1,
      golFatti: 3, golSubiti: 4, differenzaReti: -1, punti: 4, porteInviolate: 1,
    });
    expect(bilancio(lista).mediaPunti).toBeCloseTo(4 / 3);
    expect(bilancioPerCampo(lista, 'TRASFERTA')).toMatchObject({ giocate: 2, punti: 1 });
    expect(bilancio([]).mediaPunti).toBeNull();
  });

  it('restituisce la forma dalla partita più recente', () => {
    const lista = [
      partita({ data: '2026-09-01', risultato: 'P' }),
      partita({ data: '2026-09-20', risultato: 'V' }),
      partita({ data: '2026-09-10', risultato: 'N' }),
    ];
    expect(forma(lista, 2).map((p) => p.risultato)).toEqual(['V', 'N']);
  });

  it('tiene le partite in calendario fuori da rendimento, forma e disciplina', () => {
    const lista = [
      partita({ id: 1, data: '2026-09-01', risultato: 'V', eventi: [evento('ESPULSIONE', 4)] }),
      partita({ id: 2, data: '2026-12-01', risultato: null, giocata: false, golFatti: 0, golSubiti: 0 }),
    ];
    expect(bilancio(lista)).toMatchObject({ giocate: 1, punti: 3, pareggi: 0, porteInviolate: 1 });
    expect(forma(lista).map((p) => p.id)).toEqual([1]);
    // L'espulsione nell'ultima gara giocata resta da scontare anche con gare in calendario
    expect(situazioneDisciplinare(lista, true).righe[0].stato).toBe('SQUALIFICATO');
  });

  it('ordina il calendario dalla gara più vicina e segnala i risultati mancanti', () => {
    const lista = [
      partita({ id: 1, data: '2026-12-10', giocata: false, risultato: null }),
      partita({ id: 2, data: '2026-11-22', giocata: false, risultato: null, oraInizio: '20:45:00' }),
      partita({ id: 3, data: '2026-11-22', giocata: false, risultato: null, oraInizio: '15:00:00' }),
      partita({ id: 4, data: '2026-11-08', giocata: false, risultato: null }),
      partita({ id: 5, data: '2026-11-01' }),
    ];
    const c = calendario(lista, '2026-11-16');
    expect(c.map((p) => p.id)).toEqual([4, 3, 2, 1]);
    expect(c.map((p) => p.daAggiornare)).toEqual([true, false, false, false]);
  });

  it('riconosce le soglie di squalifica del campionato', () => {
    const soglie = Array.from({ length: 22 }, (_, i) => i + 1).filter(eSogliaSqualifica);
    expect(soglie).toEqual([5, 10, 14, 17, 19, 20, 21, 22]);
    expect(applicaRegolaCampionato('Serie A')).toBe(true);
    expect(applicaRegolaCampionato('Coppa Italia')).toBe(false);
  });

  it('segnala il diffidato alla quarta ammonizione', () => {
    const { righe } = situazioneDisciplinare(ammonizioniConsecutive(4), true);
    expect(righe).toEqual([
      expect.objectContaining({ giocatoreId: 7, ammonizioni: 4, stato: 'DIFFIDATO' }),
    ]);
  });

  it('squalifica alla quinta ammonizione solo per la gara successiva', () => {
    const cinque = ammonizioniConsecutive(5);
    expect(situazioneDisciplinare(cinque, true).righe[0]).toMatchObject({
      ammonizioni: 5, stato: 'SQUALIFICATO', motivo: '5ª ammonizione',
    });

    // Giocata un'altra partita, la squalifica è scontata
    const dopo = [...cinque, partita({ data: '2026-10-01' })];
    expect(situazioneDisciplinare(dopo, true).righe[0]).toMatchObject({
      ammonizioni: 5, stato: 'REGOLARE',
    });
  });

  it('non applica le diffide fuori dal campionato', () => {
    const { righe, regolaCampionato } = situazioneDisciplinare(ammonizioniConsecutive(5), false);
    expect(regolaCampionato).toBe(false);
    expect(righe[0]).toMatchObject({ ammonizioni: 5, stato: 'REGOLARE' });
  });

  it('gestisce espulsione diretta e doppia ammonizione', () => {
    const diretta = situazioneDisciplinare(
      [partita({ eventi: [evento('AMMONIZIONE', 3), evento('ESPULSIONE', 3)] })],
      true,
    ).righe[0];
    expect(diretta).toMatchObject({ ammonizioni: 1, espulsioni: 1, stato: 'SQUALIFICATO' });

    const doppia = situazioneDisciplinare(
      [
        partita({
          eventi: [evento('AMMONIZIONE', 3), evento('AMMONIZIONE', 3), evento('ESPULSIONE', 3)],
        }),
      ],
      true,
    ).righe[0];
    expect(doppia).toMatchObject({
      ammonizioni: 0, espulsioni: 1, stato: 'SQUALIFICATO',
      motivo: 'Espulsione per doppia ammonizione',
    });
  });

  it('esclude i cartellini senza giocatore e ordina squalificati, diffidati, altri', () => {
    const partite = [
      ...ammonizioniConsecutive(4),
      partita({
        data: '2026-10-01',
        eventi: [evento('AMMONIZIONE', null), evento('AMMONIZIONE', 9), evento('ESPULSIONE', 11)],
      }),
    ];
    const s = situazioneDisciplinare(partite, true);
    expect(s.cartelliniNonAttribuiti).toBe(1);
    expect(s.righe.map((r) => [r.giocatoreId, r.stato])).toEqual([
      [11, 'SQUALIFICATO'],
      [7, 'DIFFIDATO'],
      [9, 'REGOLARE'],
    ]);
  });
});
