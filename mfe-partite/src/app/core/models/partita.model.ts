export type CasaTrasferta = 'CASA' | 'TRASFERTA' | 'NEUTRO';
export type Risultato = 'V' | 'N' | 'P';
export type TipoEvento =
    | 'GOL' | 'ASSIST' | 'AMMONIZIONE' | 'ESPULSIONE'
    | 'SOSTITUZIONE_IN' | 'SOSTITUZIONE_OUT'
    | 'TIRO' | 'PARATA' | 'RECUPERO' | 'FALLO';

export interface EventoPartita {
    id: number;
    minuto: number;
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
}

export interface Partita {
    id: number;
    data: string;
    avversario: string;
    competizione: string | null;
    casaTrasferta: CasaTrasferta;
    golFatti: number;
    golSubiti: number;
    risultato: Risultato;
    modulo: string | null;
    note: string | null;
    eventi: EventoPartita[];
    statistiche: StatistichePartita | null;
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