/** Spostamenti di giocatori tra rosa, campo e panchina. Funzioni pure: restituiscono nuove posizioni. */
import { GiocatoreDisponibile, PosizioneCampo } from './model/formazione.model';

export const MAX_TITOLARI = 11;

export type EsitoMovimento = { posizioni: PosizioneCampo[] } | { errore: string };

function nuovaPosizione(g: GiocatoreDisponibile, titolare: boolean, x = 0, y = 0): PosizioneCampo {
  return {
    giocatoreId: g.id, nomeGiocatore: g.nome, cognomeGiocatore: g.cognome, numeroMaglia: g.numeroMaglia,
    coordX: x, coordY: y, slotRuolo: null, titolare,
  };
}

const titolari = (posizioni: PosizioneCampo[]) => posizioni.filter(p => p.titolare).length;

/** Mette il giocatore in campo nel punto indicato: dalla rosa, dalla panchina o spostandolo se è già titolare. */
export function inCampo(posizioni: PosizioneCampo[], g: GiocatoreDisponibile, x: number, y: number): EsitoMovimento {
  const attuale = posizioni.find(p => p.giocatoreId === g.id);
  if (!attuale?.titolare && titolari(posizioni) >= MAX_TITOLARI) {
    return { errore: 'Hai già 11 giocatori in campo: togline uno o fai un cambio trascinandolo su un titolare' };
  }
  if (attuale) {
    return { posizioni: posizioni.map(p => p === attuale ? { ...p, coordX: x, coordY: y, titolare: true } : p) };
  }
  return { posizioni: [...posizioni, nuovaPosizione(g, true, x, y)] };
}

/** Manda il giocatore in panchina (dal campo o dalla rosa); la posizione in campo viene conservata per un eventuale rientro. */
export function inPanchina(posizioni: PosizioneCampo[], g: GiocatoreDisponibile): PosizioneCampo[] {
  const attuale = posizioni.find(p => p.giocatoreId === g.id);
  if (attuale) return posizioni.map(p => p === attuale ? { ...p, titolare: false } : p);
  return [...posizioni, nuovaPosizione(g, false)];
}

/**
 * Cambio: l'entrante prende posto e ruolo del titolare; il titolare va dove stava l'entrante
 * (in panchina se veniva dalla panchina, fuori dalla formazione se veniva dalla rosa).
 * Se l'entrante è anch'esso titolare i due si scambiano di posizione.
 */
export function scambia(posizioni: PosizioneCampo[], titolareId: number, entrante: GiocatoreDisponibile): PosizioneCampo[] {
  const uscente = posizioni.find(p => p.giocatoreId === titolareId && p.titolare);
  if (!uscente || entrante.id === titolareId) return posizioni;
  const posto = { coordX: uscente.coordX, coordY: uscente.coordY, slotRuolo: uscente.slotRuolo };
  const precedente = posizioni.find(p => p.giocatoreId === entrante.id);

  if (!precedente) {
    return posizioni.map(p => p === uscente ? { ...nuovaPosizione(entrante, true), ...posto } : p);
  }
  return posizioni.map(p => {
    if (p === uscente) {
      return { ...p, coordX: precedente.coordX, coordY: precedente.coordY, slotRuolo: precedente.slotRuolo, titolare: precedente.titolare };
    }
    if (p === precedente) return { ...p, ...posto, titolare: true };
    return p;
  });
}

export function rimuovi(posizioni: PosizioneCampo[], giocatoreId: number): PosizioneCampo[] {
  return posizioni.filter(p => p.giocatoreId !== giocatoreId);
}
