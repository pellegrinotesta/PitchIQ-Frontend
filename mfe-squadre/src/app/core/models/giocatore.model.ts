export type RuoloGiocatore = 'PORTIERE' | 'DIFENSORE' | 'CENTROCAMPISTA' | 'ATTACCANTE';
export type StatoGiocatore = 'ATTIVO' | 'INFORTUNATO' | 'SQUALIFICATO';


export interface Giocatore {
    id: number;
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