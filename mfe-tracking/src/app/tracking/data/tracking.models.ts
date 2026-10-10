export type EsitoPressione = 'SUPERATA' | 'NEUTRALIZZATA' | 'CONTENUTA';
export type StatoImport = 'IN_CODA' | 'IN_ELABORAZIONE' | 'COMPLETATO' | 'ERRORE';

export interface ImportDto {
  id: number;
  stato: StatoImport;
  messaggio: string | null;
  matchId: number | null;
  conTracking: boolean;
  nomeFileEventi: string;
  creatoIl: string;
  aggiornatoIl: string;
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
