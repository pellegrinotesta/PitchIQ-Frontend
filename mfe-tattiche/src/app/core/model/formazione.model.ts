export interface PosizioneCampo {
    id?: number;
    giocatoreId: number;
    nomeGiocatore: string;
    cognomeGiocatore: string;
    numeroMaglia: number | null;
    coordX: number;
    coordY: number;
    slotRuolo: string | null;
    titolare: boolean;
}

export interface Formazione {
    id: number;
    nome: string;
    modulo: string;
    data: string | null;
    note: string | null;
    /** Partita del calendario per cui è preparata; null per le formazioni generiche. */
    partitaId: number | null;
    posizioni: PosizioneCampo[];
    /** Disposizione dei titolari nelle fasi di gioco; assente o vuoto se non definita. */
    fasi?: FasiFormazione | null;
}

export type Fase = 'POSSESSO' | 'NON_POSSESSO' | 'TRANSIZIONE_OFFENSIVA' | 'TRANSIZIONE_DIFENSIVA';
export type TipoFreccia = 'CORSA' | 'PASSAGGIO' | 'PRESSIONE';

export interface FrecciaFase {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    tipo: TipoFreccia;
}

export interface FaseFormazione {
    posizioni: { giocatoreId: number; coordX: number; coordY: number }[];
    frecce: FrecciaFase[];
}

export type FasiFormazione = Partial<Record<Fase, FaseFormazione>>;

export interface FormazioneRequest {
    nome: string;
    modulo: string;
    data: string | null;
    note: string | null;
    partitaId: number | null;
    fasi: FasiFormazione | null;
    posizioni: {
        giocatoreId: number;
        coordX: number;
        coordY: number;
        slotRuolo: string | null;
        titolare: boolean;
    }[];
}

export interface GiocatoreDisponibile {
    id: number;
    nome: string;
    cognome: string;
    numeroMaglia: number | null;
    ruolo: string;
    categoriaRuolo: string; // PORTIERE | DIFENSORE | CENTROCAMPISTA | ATTACCANTE
    stato?: 'ATTIVO' | 'INFORTUNATO' | 'SQUALIFICATO';
    /** Escluso dalla lista dei 25: non schierabile in campionato. */
    fuoriLista?: boolean;
  }

/** Carico di allenamento (da /api/allenamenti/carico), solo i campi che servono alle tattiche. */
export interface CaricoGiocatore {
    giocatoreId: number;
    acwr: number | null;
    storicoInsufficiente: boolean;
}