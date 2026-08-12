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
}

export interface SchemaFormazioneRequest {
    nome: string;
    modulo: string;
    descrizione: string | null;
    slot: Omit<SlotSchema, 'id'>[];
    frecce: Omit<FrecciaSchema, 'id'>[];
}