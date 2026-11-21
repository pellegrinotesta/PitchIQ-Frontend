/**
 * Slot degli schemi: generazione dal modulo, nomi e ruoli automatici, e adattamento alle fasi.
 * Il campo delle fasi lavora su "giocatori" (id numerici); per gli schemi ogni slot diventa un
 * giocatore fittizio con id = posizione nell'elenco + 1 e nome = nome dello slot.
 */
import { FasiFormazione, PosizioneCampo } from './model/formazione.model';
import { FasiSchema, SlotSchema } from './model/schema.model';
import { POSIZIONI_MODULO } from './moduli';
import { Reparto, repartoSlot, repartoZona } from './ruoli';

export const MAX_SLOT = 11;

/** Le categorie: con una categoria il ruolo dello slot segue la zona in cui lo metti. */
export const CATEGORIE: readonly { valore: Reparto; nome: string }[] = [
  { valore: 'PORTIERE', nome: 'Portiere' },
  { valore: 'DIFENSORE', nome: 'Difensore' },
  { valore: 'CENTROCAMPISTA', nome: 'Centrocampista' },
  { valore: 'ATTACCANTE', nome: 'Attaccante' },
];

/** Ruoli specifici: uno slot con un ruolo specifico non cambia ruolo se lo sposti. */
export const RUOLI_SPECIFICI: readonly { valore: string; nome: string }[] = [
  { valore: 'POR', nome: 'Portiere (POR)' },
  { valore: 'DC', nome: 'Difensore centrale (DC)' },
  { valore: 'TSD', nome: 'Terzino destro (TSD)' },
  { valore: 'TSS', nome: 'Terzino sinistro (TSS)' },
  { valore: 'CDC', nome: 'Mediano (CDC)' },
  { valore: 'CC', nome: 'Centrocampista centrale (CC)' },
  { valore: 'MOC', nome: 'Trequartista (MOC)' },
  { valore: 'ALD', nome: 'Ala destra (ALD)' },
  { valore: 'ALS', nome: 'Ala sinistra (ALS)' },
  { valore: 'PC', nome: 'Centravanti (PC)' },
  { valore: 'SP', nome: 'Seconda punta (SP)' },
];

const PREFISSO: Record<Reparto, string> = { PORTIERE: 'GK', DIFENSORE: 'CB', CENTROCAMPISTA: 'CM', ATTACCANTE: 'ST' };

export function ruoloAutomatico(ruolo: string): boolean {
  return CATEGORIE.some(c => c.valore === ruolo);
}

/** Slot standard del modulo, con il ruolo dato dal reparto dello slot. */
export function slotDaModulo(modulo: string): SlotSchema[] {
  return (POSIZIONI_MODULO[modulo] ?? []).map(s => ({
    slotRuolo: s.slotRuolo,
    ruolo: repartoSlot(s.slotRuolo) ?? s.categoria,
    coordX: s.coordX,
    coordY: s.coordY,
    note: null,
  }));
}

/** Nome libero per un nuovo slot nella zona: GK, CB1, CB2, CM1… */
export function nomeLibero(slot: SlotSchema[], reparto: Reparto): string {
  const usati = new Set(slot.map(s => s.slotRuolo.toUpperCase()));
  const base = PREFISSO[reparto];
  if (reparto === 'PORTIERE' && !usati.has(base)) return base;
  for (let i = 1; ; i++) if (!usati.has(`${base}${i}`)) return `${base}${i}`;
}

export function nuovoSlot(slot: SlotSchema[], x: number, y: number): SlotSchema {
  const reparto = repartoZona(y);
  return { slotRuolo: nomeLibero(slot, reparto), ruolo: reparto, coordX: x, coordY: y, note: null };
}

/** Sposta uno slot; se il ruolo è una categoria, segue la zona di arrivo. */
export function spostaSlot(slot: SlotSchema[], indice: number, x: number, y: number): SlotSchema[] {
  return slot.map((s, i) => i !== indice ? s : {
    ...s, coordX: x, coordY: y, ruolo: ruoloAutomatico(s.ruolo) ? repartoZona(y) : s.ruolo,
  });
}

/** Rinomina uno slot anche nelle fasi, dove è citato per nome. */
export function rinominaSlot(fasi: FasiSchema | null | undefined, vecchio: string, nuovo: string): FasiSchema | null {
  if (!fasi) return null;
  const out: FasiSchema = {};
  for (const [fase, contenuto] of Object.entries(fasi)) {
    if (!contenuto) continue;
    out[fase as keyof FasiSchema] = {
      ...contenuto,
      posizioni: contenuto.posizioni.map(p => p.slot === vecchio ? { ...p, slot: nuovo } : p),
    };
  }
  return out;
}

export interface ControlloSchema { ok: boolean; testo: string }

export function verificaSchema(slot: SlotSchema[]): ControlloSchema[] {
  const portieri = slot.filter(s => s.ruolo === 'PORTIERE' || s.ruolo === 'POR').length;
  const nomi = slot.map(s => s.slotRuolo.trim().toUpperCase());
  const ripetuti = [...new Set(nomi.filter((n, i) => nomi.indexOf(n) !== i))];
  return [
    { ok: slot.length === MAX_SLOT, testo: `${slot.length}/${MAX_SLOT} slot` },
    { ok: portieri === 1, testo: portieri === 1 ? 'Un portiere' : portieri === 0 ? 'Nessun portiere' : `${portieri} portieri` },
    ...(ripetuti.length ? [{ ok: false, testo: `Nomi ripetuti: ${ripetuti.join(', ')}` }] : []),
  ];
}

// ---- adattamento al campo delle fasi ----

export function slotComePosizioni(slot: SlotSchema[]): PosizioneCampo[] {
  return slot.map((s, i) => ({
    giocatoreId: i + 1, nomeGiocatore: '', cognomeGiocatore: s.slotRuolo, numeroMaglia: null,
    coordX: s.coordX, coordY: s.coordY, slotRuolo: s.slotRuolo, titolare: true,
  }));
}

export function fasiSchemaComeFormazione(fasi: FasiSchema | null | undefined, slot: SlotSchema[]): FasiFormazione {
  const idPerNome = new Map(slot.map((s, i) => [s.slotRuolo, i + 1]));
  const out: FasiFormazione = {};
  for (const [fase, contenuto] of Object.entries(fasi ?? {})) {
    if (!contenuto) continue;
    out[fase as keyof FasiFormazione] = {
      frecce: contenuto.frecce,
      posizioni: contenuto.posizioni
        .filter(p => idPerNome.has(p.slot))
        .map(p => ({ giocatoreId: idPerNome.get(p.slot)!, coordX: p.coordX, coordY: p.coordY })),
    };
  }
  return out;
}

export function fasiFormazioneComeSchema(fasi: FasiFormazione, slot: SlotSchema[]): FasiSchema {
  const out: FasiSchema = {};
  for (const [fase, contenuto] of Object.entries(fasi)) {
    if (!contenuto) continue;
    out[fase as keyof FasiSchema] = {
      frecce: contenuto.frecce,
      posizioni: contenuto.posizioni
        .filter(p => slot[p.giocatoreId - 1])
        .map(p => ({ slot: slot[p.giocatoreId - 1].slotRuolo, coordX: p.coordX, coordY: p.coordY })),
    };
  }
  return out;
}
