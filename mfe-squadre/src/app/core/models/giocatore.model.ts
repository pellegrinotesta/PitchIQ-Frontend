export type RuoloGiocatore =
  | 'POR'
  | 'DC'
  | 'TSD'
  | 'TSS'
  | 'LB'
  | 'CDC'
  | 'CC'
  | 'MOC'
  | 'ALD'
  | 'ALS'
  | 'W'
  | 'PC'
  | 'SP'
  | 'FW';

export type CategoriaRuolo = 'PORTIERE' | 'DIFENSORE' | 'CENTROCAMPISTA' | 'ATTACCANTE';

export const RUOLO_LABEL: Record<RuoloGiocatore, string> = {
  POR: 'Portiere',
  DC: 'Difensore Centrale',
  TSD: 'Terzino Destro',
  TSS: 'Terzino Sinistro',
  LB: 'Libero',
  CDC: 'Mediano',
  CC: 'Centrocampista',
  MOC: 'Mezzala Offensiva',
  ALD: 'Ala Destra',
  ALS: 'Ala Sinistra',
  W: 'Ala',
  PC: 'Prima Punta',
  SP: 'Seconda Punta',
  FW: 'Falso 9',
};

export const RUOLO_CATEGORIA: Record<RuoloGiocatore, CategoriaRuolo> = {
  POR: 'PORTIERE',
  DC: 'DIFENSORE',
  TSD: 'DIFENSORE',
  TSS: 'DIFENSORE',
  LB: 'DIFENSORE',
  CDC: 'CENTROCAMPISTA',
  CC: 'CENTROCAMPISTA',
  MOC: 'CENTROCAMPISTA',
  ALD: 'CENTROCAMPISTA',
  ALS: 'CENTROCAMPISTA',
  W: 'CENTROCAMPISTA',
  PC: 'ATTACCANTE',
  SP: 'ATTACCANTE',
  FW: 'ATTACCANTE',
};

export const RUOLI_PER_CATEGORIA: Record<CategoriaRuolo, RuoloGiocatore[]> = {
  PORTIERE: ['POR'],
  DIFENSORE: ['DC', 'TSD', 'TSS', 'LB'],
  CENTROCAMPISTA: ['CDC', 'CC', 'MOC', 'ALD', 'ALS', 'W'],
  ATTACCANTE: ['PC', 'SP', 'FW'],
};
export type StatoGiocatore = 'ATTIVO' | 'INFORTUNATO' | 'SQUALIFICATO';
/** Formazione nel vivaio ai fini della lista dei 25 */
export type FormazioneVivaio = 'CLUB' | 'ITALIA' | 'ALTRO';

export const MOVIMENTI_LABEL = {
  SOVRAPPOSIZIONE: 'Sovrapposizione',
  SOTTOPOSIZIONE: 'Sottoposizione',
  INSERIMENTO: 'Inserimento',
  TAGLIO_INTERNO: 'Taglio interno',
  ATTACCO_PROFONDITA: 'Attacco della profondità',
  SMARCAMENTO_INCONTRO: 'Smarcamento incontro',
  AMPIEZZA: 'Ricerca di ampiezza',
  RIPIEGAMENTO: 'Ripiegamento',
  SCIVOLAMENTO_LATERALE: 'Scivolamento laterale',
  COPERTURA: 'Copertura',
  USCITA_PALLA: 'Uscita palla',
} as const;

export type MovimentoTattico = keyof typeof MOVIMENTI_LABEL;

export interface Giocatore {
  id: number;
  nome: string;
  cognome: string;
  dataNascita: string | null;
  eta: number | null;
  ruolo: RuoloGiocatore;
  ruoliSecondari: string | null;
  numeroMaglia: number | null;
  piedePreferito: string | null;
  contrattoInizio: string | null;
  contrattoFine: string | null;
  stato: StatoGiocatore;
  nazionalita: string | null;
  luogoNascita: string | null;
  altezzaCm: number | null;
  pesoKg: number | null;
  stipendioAnnuo: number | null;
  valoreMercato: number | null;
  clausola: number | null;
  noteMediche: string | null;
  agente: string | null;
  movimentiConsentiti?: MovimentoTattico[] | null;
  /** null: non ancora classificato */
  formazione?: FormazioneVivaio | null;
  /** Over 22 tesserato ma escluso dalla lista dei 25 */
  fuoriLista?: boolean;
  /** false: stipendio, clausola e agente arrivano null perché riservati al ruolo dell'utente */
  datiEconomiciVisibili?: boolean;
  /** false: le note mediche arrivano null perché riservate al ruolo dell'utente */
  datiMediciVisibili?: boolean;
}

export type GiocatoreRequest = Omit<
  Giocatore,
  'id' | 'eta' | 'datiEconomiciVisibili' | 'datiMediciVisibili'
>;

export const economiciVisibili = (g: Giocatore): boolean => g.datiEconomiciVisibili !== false;
export const mediciVisibili = (g: Giocatore): boolean => g.datiMediciVisibili !== false;
