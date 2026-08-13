export type TipoSeduta = 'TECNICO' | 'TATTICO' | 'ATLETICO' | 'PARTITELLA';

export interface Presenza {
    id?: number;
    giocatoreId: number;
    nomeGiocatore: string;
    cognomeGiocatore: string;
    numeroMaglia: number | null;
    ruolo: string;
    presente: boolean;
    motivoAssenza: string | null;
    valutazione: number | null;
}

export interface SedutaAllenamento {
    id: number;
    data: string;
    oraInizio: string;
    oraFine: string;
    tipo: TipoSeduta;
    luogo: string | null;
    note: string | null;
    presenze: Presenza[];
    totalePresenti: number;
    totaleAssenti: number;
}

export interface SedutaRequest {
    data: string;
    oraInizio: string;
    oraFine: string;
    tipo: TipoSeduta;
    luogo: string | null;
    note: string | null;
    presenze: {
        giocatoreId: number;
        presente: boolean;
        motivoAssenza: string | null;
        valutazione: number | null;
    }[];
}