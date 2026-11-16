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
    /** Minuti svolti; null = intera durata della seduta */
    minuti?: number | null;
    /** Sforzo percepito 1-10 */
    rpe?: number | null;
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
        minuti?: number | null;
        rpe?: number | null;
    }[];
}

/** Carico di un giocatore alla data di riferimento (session-RPE: RPE × minuti). */
export interface CaricoGiocatore {
    giocatoreId: number;
    nomeGiocatore: string;
    cognomeGiocatore: string;
    numeroMaglia: number | null;
    ruolo: string;
    /** Somma dei carichi degli ultimi 7 giorni */
    caricoAcuto: number;
    /** Media settimanale degli ultimi 28 giorni */
    caricoCronico: number;
    /** Acuto / cronico; null se il cronico è zero */
    acwr: number | null;
    seduteConRpe: number;
    seduteSenzaRpe: number;
    storicoInsufficiente: boolean;
}

export type ZonaCarico = 'NON_VALUTABILE' | 'BASSO' | 'OTTIMALE' | 'ATTENZIONE' | 'ALTO';

/** Soglie d'uso comune per il rapporto acuto/cronico: 0,8 – 1,3 ottimale, oltre 1,5 alto. */
export function zonaCarico(c: CaricoGiocatore): ZonaCarico {
    if (c.acwr === null || c.storicoInsufficiente) return 'NON_VALUTABILE';
    if (c.acwr < 0.8) return 'BASSO';
    if (c.acwr <= 1.3) return 'OTTIMALE';
    if (c.acwr <= 1.5) return 'ATTENZIONE';
    return 'ALTO';
}

/** Durata in minuti tra due orari "HH:mm[:ss]"; 0 se non calcolabile. */
export function durataMinuti(oraInizio: string, oraFine: string): number {
    const minuti = (ora: string) => {
        const m = /^(\d{1,2}):(\d{2})/.exec(ora ?? '');
        return m ? Number(m[1]) * 60 + Number(m[2]) : NaN;
    };
    const durata = minuti(oraFine) - minuti(oraInizio);
    return Number.isFinite(durata) && durata > 0 ? durata : 0;
}