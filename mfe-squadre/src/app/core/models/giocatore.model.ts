export type RuoloGiocatore = 'PORTIERE' | 'DIFENSORE' | 'CENTROCAMPISTA' | 'ATTACCANTE';
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