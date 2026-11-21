import { Fase, FrecciaFase } from './formazione.model';

export interface SlotSchema {
    id?: number;
    slotRuolo: string;
    ruolo: string;
    coordX: number;
    coordY: number;
    note: string | null;
}

export interface FrecciaSchema {
    id?: number;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    colore: string;
    etichetta: string | null;
}

export interface SchemaFormazione {
    id: number;
    nome: string;
    modulo: string;
    descrizione: string | null;
    slot: SlotSchema[];
    frecce: FrecciaSchema[];
    /** Fasi di gioco per nome dello slot. */
    fasi?: FasiSchema | null;
}

/** Fase di uno schema: come per le formazioni, ma le posizioni si riferiscono agli slot per nome. */
export interface FaseSchema {
    posizioni: { slot: string; coordX: number; coordY: number }[];
    frecce: FrecciaFase[];
}

export type FasiSchema = Partial<Record<Fase, FaseSchema>>;

export interface SchemaFormazioneRequest {
    nome: string;
    modulo: string;
    descrizione: string | null;
    slot: Omit<SlotSchema, 'id'>[];
    frecce: Omit<FrecciaSchema, 'id'>[];
    fasi: FasiSchema | null;
}