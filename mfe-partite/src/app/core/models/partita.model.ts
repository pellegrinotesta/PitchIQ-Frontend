export type CasaTrasferta = 'CASA' | 'TRASFERTA' | 'NEUTRO';
export type Risultato = 'V' | 'N' | 'P';
export type TipoEvento =
    | 'GOL' | 'ASSIST' | 'AMMONIZIONE' | 'ESPULSIONE'
    | 'SOSTITUZIONE_IN' | 'SOSTITUZIONE_OUT'
    | 'TIRO' | 'PARATA' | 'RECUPERO' | 'FALLO';

export interface EventoPartita {
    id: number;
    minuto: number;
    minutoAggiuntivo: number | null;
    tipo: TipoEvento;
    giocatoreId: number | null;
    nomeGiocatore: string | null;
    cognomeGiocatore: string | null;
    nota: string | null;
}

export interface StatistichePartita {
    possessoPct: number | null;
    tiriTotali: number | null;
    tiriInPorta: number | null;
    passaggi: number | null;
    passaggiRiusciti: number | null;
    duelliVinti: number | null;
    duelliTotali: number | null;
    corner: number | null;
    falli: number | null;
    fuorigioco: number | null;
    xg: number | null;
    fonte: string | null;
}

export interface Partita {
    id: number;
    data: string;
    avversario: string;
    competizione: string | null;
    casaTrasferta: CasaTrasferta;
    golFatti: number;
    golSubiti: number;
    /** null se la partita è in calendario e non ancora giocata */
    risultato: Risultato | null;
    /** false = in calendario; assente nei dati precedenti al calendario, che sono tutte gare giocate */
    giocata?: boolean;
    /** "HH:mm[:ss]" */
    oraInizio?: string | null;
    /** Report di scouting dell'avversario */
    scoutingId?: number | null;
    modulo: string | null;
    note: string | null;
    eventi: EventoPartita[];
    statistiche: StatistichePartita | null;
}

export interface Titolare {
    id: number;
    nome: string;
    cognome: string;
    posizione: string | null;
    numeroMaglia: number | null;
    moduloFonte: string | null;
}

export interface HeatmapZona {
    id?: number;
    giocatoreId: number;
    coordX: number;
    coordY: number;
    intensita: number;
}

export interface ScoutingAvversario {
    id: number;
    nome: string;
    modulo: string | null;
    puntiForza: string | null;
    debolezze: string | null;
    giocatoriChiave: string | null;
    note: string | null;
}

export interface GiocatoreBase {
    id: number;
    nome: string;
    cognome: string;
    numeroMaglia: number | null;
    ruolo: string;
}