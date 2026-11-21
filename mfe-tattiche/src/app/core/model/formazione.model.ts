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
    posizioni: PosizioneCampo[];
}

export interface FormazioneRequest {
    nome: string;
    modulo: string;
    data: string | null;
    note: string | null;
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