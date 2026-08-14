export type CategoriaMetrica =
    | 'VALUTAZIONE_MEDIA'
    | 'PRESENZE_PCT'
    | 'VELOCITA'
    | 'RESISTENZA'
    | 'FORZA'
    | 'MINUTI_GIOCATI'
    | 'GOL'
    | 'ASSIST'
    | 'AMMONIZIONI';

export type Tendenza = 'CRESCITA' | 'STABILE' | 'CALO';

export interface PuntoTrend {
    periodo: string;
    valore: number;
}

export interface TrendDto {
    giocatoreId: number;
    nomeGiocatore: string;
    categoria: CategoriaMetrica;
    storico: PuntoTrend[];
    proiezione: PuntoTrend[];
    indiceCrescita: number;
    tendenza: Tendenza;
}

export interface StatisticaRequest {
    giocatoreId: number;
    periodo: string;
    categoria: CategoriaMetrica;
    valore: number;
}

export interface GiocatoreStatistica {
    id: number;
    nome: string;
    cognome: string;
    numeroMaglia: number | null;
    ruolo: string;
}

export interface PuntoRadar {
    categoria: CategoriaMetrica;
    label: string;
    valore: number;
    valorePct: number;
}

export interface GiocatoreRadar {
    giocatoreId: number;
    nomeGiocatore: string;
    valori: PuntoRadar[];
}

export interface ConfrontoDto {
    giocatore1: GiocatoreRadar;
    giocatore2: GiocatoreRadar;
}