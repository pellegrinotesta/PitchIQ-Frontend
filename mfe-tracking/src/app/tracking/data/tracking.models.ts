export type EsitoPressione = 'SUPERATA' | 'NEUTRALIZZATA' | 'CONTENUTA';
export type StatoImport = 'IN_CODA' | 'IN_ELABORAZIONE' | 'COMPLETATO' | 'ERRORE';
export type StatoAnalisiVideo = 'IN_CODA' | 'IN_ELABORAZIONE' | 'COMPLETATO' | 'ERRORE';

export type EtichettaEvento = 'TIRO' | 'PASSAGGIO_LUNGO' | 'CONTRASTO' | 'RIPARTENZA' | 'CALCIO_PIAZZATO' | 'NIENTE';

/** Ordine e nomi mostrati all'utente. */
export const ETICHETTE_EVENTO: readonly { valore: EtichettaEvento; nome: string }[] = [
  { valore: 'TIRO', nome: 'Tiro' },
  { valore: 'PASSAGGIO_LUNGO', nome: 'Passaggio lungo' },
  { valore: 'CONTRASTO', nome: 'Contrasto' },
  { valore: 'RIPARTENZA', nome: 'Ripartenza' },
  { valore: 'CALCIO_PIAZZATO', nome: 'Calcio piazzato' },
  { valore: 'NIENTE', nome: 'Niente di rilevante' },
];

export interface PropostaEventoDto {
  etichetta: EtichettaEvento;
  confidenza: number;
}

export interface EventoVideoDto {
  id: string;
  etichetta: string;
  inizioSecondi: number;
  fineSecondi: number;
  intensitaMovimento: number;
  /** Assenti nelle analisi precedenti al classificatore eventi. */
  caratteristiche?: Record<string, number> | null;
  indizi?: string[] | null;
  proposta?: PropostaEventoDto | null;
  etichettaUtente?: EtichettaEvento | null;
}

export interface ModelloEventiDto {
  esempi: number;
  perClasse: Partial<Record<EtichettaEvento, number>>;
  attivo: boolean;
  accuratezzaStimata: number | null;
  minimoPerClasse: number;
}

export interface CampioneMovimentoDto {
  secondo: number;
  valore: number;
  /** Solo con metodo "giocatori". */
  giocatori?: number | null;
  palla?: boolean | null;
}

export interface MovimentoVideoDto {
  /** Assente nelle analisi precedenti: equivale a "pixel". */
  metodo?: 'giocatori' | 'pixel' | null;
  soglia: number | null;
  campioni: CampioneMovimentoDto[];
}

export interface AnalisiVideoDto {
  id: string;
  stato: StatoAnalisiVideo;
  messaggio: string | null;
  durataSecondi: number | null;
  eventi: EventoVideoDto[];
  /** Assente nelle analisi fatte prima dell'introduzione del grafico. */
  movimento?: MovimentoVideoDto | null;
  /** Solo nella risposta di avvio: per i link è il nome risolto dal server. */
  nomeFile?: string | null;
}

export interface ImportDto {
  id: number;
  stato: StatoImport;
  messaggio: string | null;
  matchId: number | null;
  conTracking: boolean;
  nomeFileEventi: string;
  creatoIl: string;
  aggiornatoIl: string;
  ritentabile: boolean;
}

export interface PartitaDto {
  matchId: number;
  dataPartita: string;
  squadraCasa: string;
  squadraTrasferta: string;
  golCasa: number;
  golTrasferta: number;
  competizione: string | null;
  possessiPressati: number;
  pressioniSuperate: number;
}

export interface AggregatoEsitoDto {
  esito: EsitoPressione;
  possessi: number;
  valoreMedio: number;
  valoreMigliore: number;
  /** tra 0 e 1 */
  quotaTiro: number;
}

export interface GiocatoreInfo {
  nome: string;
  teamId: number;
  numero: number | null;
}

export interface PartitaDettaglioDto {
  partita: PartitaDto;
  squadre: { teamId: number; nome: string }[];
  giocatori: Record<string, GiocatoreInfo>;
  aggregati: AggregatoEsitoDto[];
}

export interface SequenzaDto {
  id: number;
  matchId: number;
  esito: EsitoPressione;
  periodo: number;
  minuto: number;
  secondo: number;
  teamId: number;
  squadra: string;
  portatoreId: number;
  portatore: string;
  terzo: string | null;
  nPressori: number;
  nOpzioni: number;
  valorePortatore: number | null;
  valoreMedio: number;
  valoreMigliore: number;
  esitoPossesso: string | null;
  portaAlTiro: boolean;
  haFrame: boolean;
}

/** Un fotogramma (10 fps). Coordinate in metri, centro campo = 0,0, attacco sempre verso destra. */
export interface FrameTracking {
  i: number;
  /** palla [x, y] */
  b: [number, number] | null;
  /** id del portatore */
  c: number | null;
  /** giocatori [id, 1 = squadra in attacco, x, y] */
  p: [number, 0 | 1, number, number][];
  /** valore delle opzioni di passaggio attive, per id giocatore */
  o: Record<string, number>;
}

export interface AnimazioneDto {
  sequenza: SequenzaDto;
  pressori: number[];
  pressInizio: number;
  pressFine: number;
  frames: FrameTracking[];
}

export const ESITO_LABEL: Record<EsitoPressione, string> = {
  SUPERATA: 'Superata',
  NEUTRALIZZATA: 'Neutralizzata',
  CONTENUTA: 'Contenuta',
};

export const ESITI: EsitoPressione[] = ['SUPERATA', 'CONTENUTA', 'NEUTRALIZZATA'];

export const TERZO_LABEL: Record<string, string> = {
  attacking_third: 'trequarti offensiva',
  middle_third: 'centrocampo',
  defensive_third: 'propria trequarti',
};

export const FINE_POSSESSO_LABEL: Record<string, string> = {
  pass: 'passaggio',
  shot: 'tiro',
  possession_loss: 'palla persa',
  clearance: 'spazzata',
  foul_suffered: 'fallo subito',
};

/** 0.0487 -> "4,9%" */
export function pct(v: number | null | undefined, digits = 1): string {
  if (v == null) return '—';
  return (v * 100).toLocaleString('it-IT', { minimumFractionDigits: digits, maximumFractionDigits: digits }) + '%';
}
