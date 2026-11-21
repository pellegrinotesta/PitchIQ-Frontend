/**
 * Fasi di gioco: per ogni fase i titolari hanno una posizione propria (di default quella dello
 * schieramento) e la fase ha le sue frecce. Funzioni pure: restituiscono nuove strutture.
 */
import { Fase, FaseFormazione, FasiFormazione, FrecciaFase, PosizioneCampo, TipoFreccia } from './model/formazione.model';

export const FASI: readonly { valore: Fase; nome: string; breve: string }[] = [
  { valore: 'POSSESSO', nome: 'Possesso', breve: 'Possesso' },
  { valore: 'NON_POSSESSO', nome: 'Non possesso', breve: 'Non possesso' },
  { valore: 'TRANSIZIONE_OFFENSIVA', nome: 'Transizione offensiva', breve: 'Trans. off.' },
  { valore: 'TRANSIZIONE_DIFENSIVA', nome: 'Transizione difensiva', breve: 'Trans. dif.' },
];

export const TIPI_FRECCIA: readonly { valore: TipoFreccia; nome: string; colore: string }[] = [
  { valore: 'CORSA', nome: 'Corsa', colore: '#ffffff' },
  { valore: 'PASSAGGIO', nome: 'Passaggio', colore: '#fbbf24' },
  { valore: 'PRESSIONE', nome: 'Pressione', colore: '#f87171' },
];

export interface PinFase {
  p: PosizioneCampo;
  x: number;
  y: number;
  /** true se nella fase il giocatore è lontano dalla sua posizione di schieramento */
  spostato: boolean;
}

const SOGLIA_SPOSTATO = 1.5;

function vuota(): FaseFormazione {
  return { posizioni: [], frecce: [] };
}

/** Titolari con la loro posizione nella fase (quella di schieramento se non definita). */
export function pinInFase(posizioni: PosizioneCampo[], fasi: FasiFormazione | null | undefined, fase: Fase): PinFase[] {
  const proprie = new Map((fasi?.[fase]?.posizioni ?? []).map(p => [p.giocatoreId, p]));
  return posizioni.filter(p => p.titolare).map(p => {
    const inFase = proprie.get(p.giocatoreId);
    const x = inFase?.coordX ?? p.coordX;
    const y = inFase?.coordY ?? p.coordY;
    return { p, x, y, spostato: Math.hypot(x - p.coordX, y - p.coordY) > SOGLIA_SPOSTATO };
  });
}

export function frecceInFase(fasi: FasiFormazione | null | undefined, fase: Fase): FrecciaFase[] {
  return fasi?.[fase]?.frecce ?? [];
}

function conFase(fasi: FasiFormazione | null | undefined, fase: Fase, modifica: (f: FaseFormazione) => FaseFormazione): FasiFormazione {
  return { ...(fasi ?? {}), [fase]: modifica(fasi?.[fase] ?? vuota()) };
}

export function sposta(fasi: FasiFormazione | null | undefined, fase: Fase, giocatoreId: number, x: number, y: number): FasiFormazione {
  return conFase(fasi, fase, f => ({
    ...f,
    posizioni: [...f.posizioni.filter(p => p.giocatoreId !== giocatoreId), { giocatoreId, coordX: x, coordY: y }],
  }));
}

export function aggiungiFreccia(fasi: FasiFormazione | null | undefined, fase: Fase, freccia: FrecciaFase): FasiFormazione {
  return conFase(fasi, fase, f => ({ ...f, frecce: [...f.frecce, freccia] }));
}

export function rimuoviFreccia(fasi: FasiFormazione | null | undefined, fase: Fase, indice: number): FasiFormazione {
  return conFase(fasi, fase, f => ({ ...f, frecce: f.frecce.filter((_, i) => i !== indice) }));
}

/** Riporta la fase allo schieramento: niente posizioni proprie né frecce. */
export function ripristina(fasi: FasiFormazione | null | undefined, fase: Fase): FasiFormazione {
  const copia = { ...(fasi ?? {}) };
  delete copia[fase];
  return copia;
}

/** Copia le posizioni di un'altra fase (es. la transizione difensiva parte dal non possesso). */
export function copiaDa(fasi: FasiFormazione | null | undefined, da: Fase, a: Fase, posizioni: PosizioneCampo[]): FasiFormazione {
  const sorgente = pinInFase(posizioni, fasi, da);
  return conFase(fasi, a, f => ({
    ...f,
    posizioni: sorgente.map(s => ({ giocatoreId: s.p.giocatoreId, coordX: s.x, coordY: s.y })),
  }));
}

export function haContenuto(fasi: FasiFormazione | null | undefined, fase: Fase): boolean {
  const f = fasi?.[fase];
  return !!f && (f.posizioni.length > 0 || f.frecce.length > 0);
}
