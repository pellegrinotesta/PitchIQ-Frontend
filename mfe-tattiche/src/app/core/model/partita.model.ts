/** Partita del calendario (sottoinsieme di PartitaDto del BFF usato dalle tattiche). */
export interface Partita {
  id: number;
  data: string;
  avversario: string;
  competizione: string | null;
  casaTrasferta: 'CASA' | 'TRASFERTA';
  golFatti: number | null;
  golSubiti: number | null;
  /** "V" | "P" | "N"; null se non ancora giocata */
  risultato: 'V' | 'P' | 'N' | null;
  giocata: boolean;
  oraInizio: string | null;
  scoutingId: number | null;
  modulo: string | null;
}

export interface Scouting {
  id: number;
  nome: string;
  modulo: string | null;
  puntiForza: string | null;
  debolezze: string | null;
  giocatoriChiave: string | null;
  note: string | null;
}

/** Titolare di una partita giocata, con la posizione nel formato della fonte (es. ESPN: "CD-L", "AM-R"). */
export interface TitolarePartita {
  id: number;
  nome: string;
  cognome: string;
  posizione: string | null;
  numeroMaglia: number | null;
  moduloFonte: string | null;
}
