import { CasaTrasferta, Partita, Risultato } from './partita.model';

export const SENZA_COMPETIZIONE = 'Senza competizione';

/**
 * Soglie di squalifica per somma di ammonizioni in campionato (Codice di Giustizia
 * Sportiva FIGC): una giornata alla 5ª, 10ª, 14ª, 17ª e 19ª ammonizione, poi a ogni
 * ammonizione successiva.
 */
export const SOGLIE_AMMONIZIONI = [5, 10, 14, 17, 19];

export function eSogliaSqualifica(ammonizioni: number): boolean {
  const ultima = SOGLIE_AMMONIZIONI[SOGLIE_AMMONIZIONI.length - 1];
  return SOGLIE_AMMONIZIONI.includes(ammonizioni) || ammonizioni > ultima;
}

/** Le soglie valgono per il campionato: le coppe hanno regole proprie. */
export function applicaRegolaCampionato(competizione: string): boolean {
  return /serie\s*a|campionato/i.test(competizione);
}

/** Stagione sportiva (1 luglio – 30 giugno) di una data ISO, es. "2026/27". */
export function stagioneDi(data: string): string | null {
  const m = /^(\d{4})-(\d{2})-\d{2}/.exec(data ?? '');
  if (!m) return null;
  const anno = Number(m[1]) - (Number(m[2]) >= 7 ? 0 : 1);
  return `${anno}/${String((anno + 1) % 100).padStart(2, '0')}`;
}

/** Le partite in calendario non hanno risultato e non entrano nel rendimento. */
export function eGiocata(partita: Partita): boolean {
  return partita.giocata !== false;
}

export interface PartitaInCalendario extends Partita {
  /** Data già passata senza risultato inserito */
  daAggiornare: boolean;
}

/** Partite ancora da giocare, dalla più vicina. `oggi` in formato ISO (YYYY-MM-DD). */
export function calendario(partite: Partita[], oggi: string): PartitaInCalendario[] {
  return partite
    .filter((p) => !eGiocata(p))
    .sort(
      (a, b) =>
        a.data.localeCompare(b.data) ||
        (a.oraInizio ?? '').localeCompare(b.oraInizio ?? '') ||
        a.id - b.id,
    )
    .map((p) => ({ ...p, daAggiornare: p.data < oggi }));
}

export function competizioneDi(partita: Partita): string {
  return partita.competizione?.trim() || SENZA_COMPETIZIONE;
}

export function stagioniDisponibili(partite: Partita[]): string[] {
  const stagioni = partite.flatMap((p) => stagioneDi(p.data) ?? []);
  return [...new Set(stagioni)].sort().reverse();
}

export function competizioniDisponibili(partite: Partita[]): string[] {
  return [...new Set(partite.map(competizioneDi))].sort((a, b) => a.localeCompare(b, 'it'));
}

export function filtraPartite(
  partite: Partita[],
  stagione: string | null,
  competizione: string | null,
): Partita[] {
  return partite
    .filter(
      (p) =>
        (!stagione || stagioneDi(p.data) === stagione) &&
        (!competizione || competizioneDi(p) === competizione),
    )
    .sort((a, b) => b.data.localeCompare(a.data) || b.id - a.id);
}

export interface Bilancio {
  giocate: number;
  vittorie: number;
  pareggi: number;
  sconfitte: number;
  golFatti: number;
  golSubiti: number;
  differenzaReti: number;
  punti: number;
  /** null se non ci sono partite */
  mediaPunti: number | null;
  porteInviolate: number;
}

export function bilancio(tutte: Partita[]): Bilancio {
  const partite = tutte.filter(eGiocata);
  const conta = (r: Risultato) => partite.filter((p) => p.risultato === r).length;
  const vittorie = conta('V');
  const pareggi = conta('N');
  const golFatti = partite.reduce((s, p) => s + p.golFatti, 0);
  const golSubiti = partite.reduce((s, p) => s + p.golSubiti, 0);
  const punti = vittorie * 3 + pareggi;
  return {
    giocate: partite.length,
    vittorie,
    pareggi,
    sconfitte: conta('P'),
    golFatti,
    golSubiti,
    differenzaReti: golFatti - golSubiti,
    punti,
    mediaPunti: partite.length ? punti / partite.length : null,
    porteInviolate: partite.filter((p) => p.golSubiti === 0).length,
  };
}

export function bilancioPerCampo(partite: Partita[], campo: CasaTrasferta): Bilancio {
  return bilancio(partite.filter((p) => p.casaTrasferta === campo));
}

/** Ultime partite, dalla più recente. */
export function forma(partite: Partita[], quante = 5): Partita[] {
  return partite
    .filter(eGiocata)
    .sort((a, b) => b.data.localeCompare(a.data) || b.id - a.id)
    .slice(0, quante);
}

export type StatoDisciplinare = 'SQUALIFICATO' | 'DIFFIDATO' | 'REGOLARE';

export interface RigaDisciplinare {
  giocatoreId: number;
  nome: string;
  ammonizioni: number;
  espulsioni: number;
  stato: StatoDisciplinare;
  /** Motivo della squalifica, se in corso */
  motivo: string | null;
}

export interface SituazioneDisciplinare {
  righe: RigaDisciplinare[];
  /** Cartellini senza giocatore della rosa collegato (es. eventi importati): esclusi dal calcolo */
  cartelliniNonAttribuiti: number;
  regolaCampionato: boolean;
}

/**
 * Diffidati e squalificati per una singola competizione e stagione.
 * `partite` deve contenere gli eventi (dettaglio partita, non l'elenco).
 *
 * Regole applicate:
 * - le ammonizioni di una gara chiusa con espulsione per doppia ammonizione non
 *   entrano nel conteggio (si sconta l'espulsione);
 * - è squalificato per la prossima gara chi, nell'ultima partita giocata, ha
 *   raggiunto una soglia oppure è stato espulso. La durata delle squalifiche per
 *   espulsione la stabilisce il Giudice Sportivo: qui si segnala solo il turno minimo.
 */
export function situazioneDisciplinare(
  partite: Partita[],
  regolaCampionato: boolean,
): SituazioneDisciplinare {
  const ordinate = partite
    .filter(eGiocata)
    .sort((a, b) => a.data.localeCompare(b.data) || a.id - b.id);
  const ultima = ordinate[ordinate.length - 1];
  const giocatori = new Map<number, RigaDisciplinare>();
  let cartelliniNonAttribuiti = 0;

  for (const partita of ordinate) {
    const perGiocatore = new Map<number, { gialli: number; rossi: number; nome: string }>();
    for (const e of partita.eventi ?? []) {
      if (e.tipo !== 'AMMONIZIONE' && e.tipo !== 'ESPULSIONE') continue;
      if (e.giocatoreId === null) {
        cartelliniNonAttribuiti++;
        continue;
      }
      const g = perGiocatore.get(e.giocatoreId) ?? {
        gialli: 0,
        rossi: 0,
        nome: `${e.cognomeGiocatore ?? ''} ${e.nomeGiocatore ?? ''}`.trim() || `#${e.giocatoreId}`,
      };
      if (e.tipo === 'AMMONIZIONE') g.gialli++;
      else g.rossi++;
      perGiocatore.set(e.giocatoreId, g);
    }

    for (const [id, gara] of perGiocatore) {
      const riga = giocatori.get(id) ?? {
        giocatoreId: id,
        nome: gara.nome,
        ammonizioni: 0,
        espulsioni: 0,
        stato: 'REGOLARE' as StatoDisciplinare,
        motivo: null,
      };
      const doppiaAmmonizione = gara.rossi > 0 && gara.gialli >= 2;
      const gialliValidi = doppiaAmmonizione ? 0 : Math.min(gara.gialli, 1);
      riga.ammonizioni += gialliValidi;
      riga.espulsioni += gara.rossi > 0 ? 1 : 0;

      if (partita === ultima) {
        if (gara.rossi > 0) {
          riga.stato = 'SQUALIFICATO';
          riga.motivo = doppiaAmmonizione
            ? 'Espulsione per doppia ammonizione'
            : 'Espulsione: durata da comunicato del Giudice Sportivo';
        } else if (regolaCampionato && gialliValidi > 0 && eSogliaSqualifica(riga.ammonizioni)) {
          riga.stato = 'SQUALIFICATO';
          riga.motivo = `${riga.ammonizioni}ª ammonizione`;
        }
      }
      giocatori.set(id, riga);
    }
  }

  const ordine: Record<StatoDisciplinare, number> = { SQUALIFICATO: 0, DIFFIDATO: 1, REGOLARE: 2 };
  const righe = [...giocatori.values()]
    .map((riga) =>
      regolaCampionato && riga.stato === 'REGOLARE' && eSogliaSqualifica(riga.ammonizioni + 1)
        ? { ...riga, stato: 'DIFFIDATO' as StatoDisciplinare }
        : riga,
    )
    .sort(
      (a, b) =>
        ordine[a.stato] - ordine[b.stato] ||
        b.ammonizioni - a.ammonizioni ||
        b.espulsioni - a.espulsioni ||
        a.nome.localeCompare(b.nome, 'it'),
    );

  return { righe, cartelliniNonAttribuiti, regolaCampionato };
}
