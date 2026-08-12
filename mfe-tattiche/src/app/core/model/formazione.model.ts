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
}