import { FormazioneVivaio, Giocatore } from './giocatore.model';

/**
 * Lista dei 25 del campionato di Serie A:
 * - al massimo 25 calciatori, di cui 4 posti riservati ai formati nel club e
 *   4 ai formati in Italia; gli altri 17 posti sono liberi;
 * - gli Under 22 sono utilizzabili senza limiti e non occupano posti.
 * Un formato nel club in eccedenza può occupare un posto "formati in Italia",
 * e un formato localmente in eccedenza un posto libero; mai il contrario.
 */
export const POSTI_LISTA = { club: 4, italia: 4, liberi: 17 } as const;
export const POSTI_TOTALI = POSTI_LISTA.club + POSTI_LISTA.italia + POSTI_LISTA.liberi;

export const FORMAZIONE_LABEL: Record<FormazioneVivaio, string> = {
  CLUB: 'Formato nel club',
  ITALIA: 'Formato in Italia',
  ALTRO: 'Nessuna formazione locale',
};

/** Anno di inizio della stagione sportiva (1 luglio – 30 giugno) in corso alla data indicata. */
export function annoStagione(oggi: Date): number {
  return oggi.getFullYear() - (oggi.getMonth() >= 6 ? 0 : 1);
}

export function etichettaStagione(anno: number): string {
  return `${anno}/${String((anno + 1) % 100).padStart(2, '0')}`;
}

/** Prima data di nascita che rende Under 22 nella stagione: 1 gennaio di (anno di inizio − 22). */
export function sogliaUnder22(anno: number): string {
  return `${anno - 22}-01-01`;
}

/** null se la data di nascita manca: il giocatore non può essere considerato Under 22. */
export function eUnder22(giocatore: Giocatore, anno: number): boolean | null {
  if (!giocatore.dataNascita || !/^\d{4}-\d{2}-\d{2}/.test(giocatore.dataNascita)) return null;
  return giocatore.dataNascita.slice(0, 10) >= sogliaUnder22(anno);
}

export interface FasciaLista {
  chiave: 'club' | 'italia' | 'liberi';
  label: string;
  posti: number;
  giocatori: Giocatore[];
}

export interface VerificaLista {
  anno: number;
  fasce: FasciaLista[];
  /** Over 22 in lista */
  inLista: number;
  /** Over 22 che non trovano posto con l'attuale composizione */
  eccedenza: Giocatore[];
  under22: Giocatore[];
  fuoriLista: Giocatore[];
  /** In lista ma senza data di nascita o formazione: contati nel caso peggiore */
  daClassificare: Giocatore[];
  problemi: string[];
  conforme: boolean;
}

const perCognome = (a: Giocatore, b: Giocatore) =>
  a.cognome.localeCompare(b.cognome, 'it') || a.nome.localeCompare(b.nome, 'it');

export function verificaLista(rosa: Giocatore[], oggi = new Date()): VerificaLista {
  const anno = annoStagione(oggi);
  const ordinata = [...rosa].sort(perCognome);
  const under22 = ordinata.filter((g) => eUnder22(g, anno) === true);
  const over = ordinata.filter((g) => eUnder22(g, anno) !== true);
  const fuoriLista = over.filter((g) => g.fuoriLista);
  const candidati = over.filter((g) => !g.fuoriLista);
  const daClassificare = candidati.filter((g) => eUnder22(g, anno) === null || !g.formazione);

  const club: Giocatore[] = [];
  const italia: Giocatore[] = [];
  const liberi: Giocatore[] = [];
  const eccedenza: Giocatore[] = [];

  // Prima i formati nel club, poi in Italia, poi gli altri: ognuno nel posto più vincolato disponibile
  const priorita: Record<string, number> = { CLUB: 0, ITALIA: 1 };
  const inOrdine = [...candidati].sort(
    (a, b) => (priorita[a.formazione ?? ''] ?? 2) - (priorita[b.formazione ?? ''] ?? 2),
  );
  for (const g of inOrdine) {
    if (g.formazione === 'CLUB' && club.length < POSTI_LISTA.club) club.push(g);
    else if (
      (g.formazione === 'CLUB' || g.formazione === 'ITALIA') &&
      italia.length < POSTI_LISTA.italia
    )
      italia.push(g);
    else if (liberi.length < POSTI_LISTA.liberi) liberi.push(g);
    else eccedenza.push(g);
  }

  const problemi: string[] = [];
  if (eccedenza.length) {
    problemi.push(
      `${eccedenza.length} over 22 senza posto in lista: vanno esclusi dalla lista o ceduti.`,
    );
  }
  if (daClassificare.length) {
    problemi.push(
      `${daClassificare.length} giocatori senza data di nascita o formazione: sono contati come over 22 senza formazione locale.`,
    );
  }

  return {
    anno,
    fasce: [
      { chiave: 'club', label: 'Formati nel club', posti: POSTI_LISTA.club, giocatori: club },
      { chiave: 'italia', label: 'Formati in Italia', posti: POSTI_LISTA.italia, giocatori: italia },
      { chiave: 'liberi', label: 'Posti liberi', posti: POSTI_LISTA.liberi, giocatori: liberi },
    ],
    inLista: club.length + italia.length + liberi.length,
    eccedenza,
    under22,
    fuoriLista,
    daClassificare,
    problemi,
    conforme: eccedenza.length === 0,
  };
}
