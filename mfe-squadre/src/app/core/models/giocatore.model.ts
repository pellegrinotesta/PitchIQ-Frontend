export type RuoloGiocatore =
  | 'POR'
  | 'DC' | 'TSD' | 'TSS' | 'LB'
  | 'CDC' | 'CC' | 'MOC' | 'ALD' | 'ALS' | 'W'
  | 'PC' | 'SP' | 'FW';

export type CategoriaRuolo = 'PORTIERE' | 'DIFENSORE' | 'CENTROCAMPISTA' | 'ATTACCANTE';

export const RUOLO_LABEL: Record<RuoloGiocatore, string> = {
  POR: 'Portiere',
  DC: 'Difensore Centrale', TSD: 'Terzino Destro', TSS: 'Terzino Sinistro', LB: 'Libero',
  CDC: 'Mediano', CC: 'Centrocampista', MOC: 'Mezzala Offensiva',
  ALD: 'Ala Destra', ALS: 'Ala Sinistra', W: 'Ala',
  PC: 'Prima Punta', SP: 'Seconda Punta', FW: 'Falso 9',
};

export const RUOLO_CATEGORIA: Record<RuoloGiocatore, CategoriaRuolo> = {
  POR: 'PORTIERE',
  DC: 'DIFENSORE', TSD: 'DIFENSORE', TSS: 'DIFENSORE', LB: 'DIFENSORE',
  CDC: 'CENTROCAMPISTA', CC: 'CENTROCAMPISTA', MOC: 'CENTROCAMPISTA',
  ALD: 'CENTROCAMPISTA', ALS: 'CENTROCAMPISTA', W: 'CENTROCAMPISTA',
  PC: 'ATTACCANTE', SP: 'ATTACCANTE', FW: 'ATTACCANTE',
};

export const RUOLI_PER_CATEGORIA: Record<CategoriaRuolo, RuoloGiocatore[]> = {
  PORTIERE: ['POR'],
  DIFENSORE: ['DC', 'TSD', 'TSS', 'LB'],
  CENTROCAMPISTA: ['CDC', 'CC', 'MOC', 'ALD', 'ALS', 'W'],
  ATTACCANTE: ['PC', 'SP', 'FW'],
};
export type StatoGiocatore = 'ATTIVO' | 'INFORTUNATO' | 'SQUALIFICATO';


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
}

export interface GiocatoreRequest {
  nome: string;
  cognome: string;
  dataNascita: string | null;
  ruolo: RuoloGiocatore;
  numeroMaglia: number;
  piedePreferito: string | null;
  contrattoInizio: string | null;
  contrattoFine: string | null;
  stato: StatoGiocatore;
}