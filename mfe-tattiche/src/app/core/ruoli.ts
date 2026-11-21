/**
 * Ruoli, reparti e compatibilità: unica fonte per editor, campo e assegnazione dei moduli.
 *
 * Il campo non vieta più nulla: un allenatore può alzare un terzino o abbassare un mediano.
 * Queste regole servono solo a suggerire (ordinamento dei giocatori) e ad avvisare (fuori reparto).
 */

export type Reparto = 'PORTIERE' | 'DIFENSORE' | 'CENTROCAMPISTA' | 'ATTACCANTE';

export const NOME_REPARTO: Record<Reparto, string> = {
  PORTIERE: 'porta',
  DIFENSORE: 'difesa',
  CENTROCAMPISTA: 'centrocampo',
  ATTACCANTE: 'attacco',
};

/** Reparto principale del ruolo (stessa classificazione del backend, RuoloCategoria). */
const CATEGORIA: Record<string, Reparto> = {
  POR: 'PORTIERE',
  DC: 'DIFENSORE', TSD: 'DIFENSORE', TSS: 'DIFENSORE', LB: 'DIFENSORE',
  CDC: 'CENTROCAMPISTA', CC: 'CENTROCAMPISTA', MOC: 'CENTROCAMPISTA',
  ALD: 'CENTROCAMPISTA', ALS: 'CENTROCAMPISTA', W: 'CENTROCAMPISTA',
  PC: 'ATTACCANTE', SP: 'ATTACCANTE', FW: 'ATTACCANTE',
};

/** Reparti in cui il ruolo gioca con naturalezza: es. le ali (ALS/ALD) anche in attacco, i terzini anche a centrocampo. */
const REPARTI_NATURALI: Record<string, Reparto[]> = {
  POR: ['PORTIERE'],
  DC: ['DIFENSORE'],
  TSD: ['DIFENSORE', 'CENTROCAMPISTA'], TSS: ['DIFENSORE', 'CENTROCAMPISTA'], LB: ['DIFENSORE', 'CENTROCAMPISTA'],
  CDC: ['CENTROCAMPISTA', 'DIFENSORE'],
  CC: ['CENTROCAMPISTA'],
  MOC: ['CENTROCAMPISTA', 'ATTACCANTE'],
  ALD: ['CENTROCAMPISTA', 'ATTACCANTE'], ALS: ['CENTROCAMPISTA', 'ATTACCANTE'], W: ['CENTROCAMPISTA', 'ATTACCANTE'],
  PC: ['ATTACCANTE'], FW: ['ATTACCANTE'],
  SP: ['ATTACCANTE', 'CENTROCAMPISTA'],
};

/** Reparto dello slot di un modulo (es. CB1 → difesa, LW → attacco). */
const REPARTO_SLOT: [RegExp, Reparto][] = [
  [/^GK$/, 'PORTIERE'],
  [/^(CB|LB|RB|LWB|RWB)\d*$/, 'DIFENSORE'],
  [/^(CM|LM|RM|DM|AM)\d*$/, 'CENTROCAMPISTA'],
  [/^(ST|CF|LW|RW)\d*$/, 'ATTACCANTE'],
];

export function categoria(ruolo: string | null | undefined): Reparto | null {
  return (ruolo && CATEGORIA[ruolo]) || null;
}

export function repartoSlot(slot: string | null | undefined): Reparto | null {
  if (!slot) return null;
  const s = slot.toUpperCase();
  return REPARTO_SLOT.find(([re]) => re.test(s))?.[1] ?? null;
}

/** Reparto della zona di campo (y: 0 = porta avversaria, 100 = propria porta). */
export function repartoZona(coordY: number): Reparto {
  if (coordY >= 82) return 'PORTIERE';
  if (coordY >= 60) return 'DIFENSORE';
  if (coordY >= 30) return 'CENTROCAMPISTA';
  return 'ATTACCANTE';
}

/** 0 = reparto principale, 1 = reparto in cui gioca con naturalezza, 3 = fuori reparto. */
export function distanzaRuolo(ruolo: string | null | undefined, reparto: Reparto | null): number {
  if (!ruolo || !reparto) return 1;
  if (categoria(ruolo) === reparto) return 0;
  return (REPARTI_NATURALI[ruolo] ?? []).includes(reparto) ? 1 : 3;
}

export function fuoriReparto(ruolo: string | null | undefined, reparto: Reparto | null): boolean {
  return distanzaRuolo(ruolo, reparto) >= 3;
}

/**
 * Assegna i giocatori agli slot minimizzando i cambi di ruolo e poi lo spostamento laterale.
 * Assegnazione ottima (algoritmo ungherese): un abbinamento "goloso" metterebbe per esempio
 * un difensore centrale da quinto di fascia pur di tenere il terzino al centro.
 * Nessun giocatore viene escluso finché ci sono slot liberi.
 */
export function assegnaASlot<G extends { ruolo: string | null; x: number }, S extends { reparto: Reparto; x: number }>(
  giocatori: G[], slot: S[],
): Map<S, G> {
  const costi = giocatori.map(g => slot.map(s => distanzaRuolo(g.ruolo, s.reparto) * 100 + Math.abs(g.x - s.x)));
  const scelta = ungherese(costi);
  const assegnati = new Map<S, G>();
  scelta.forEach((j, i) => { if (j >= 0) assegnati.set(slot[j], giocatori[i]); });
  return assegnati;
}

/**
 * Algoritmo ungherese (Kuhn-Munkres) su matrice rettangolare righe x colonne.
 * Restituisce per ogni riga la colonna assegnata, -1 se la riga resta senza colonna.
 */
export function ungherese(costi: number[][]): number[] {
  const righe = costi.length;
  const colonne = righe ? costi[0].length : 0;
  const n = Math.max(righe, colonne);
  if (n === 0) return [];
  const MAX = 1e9;
  const c = (i: number, j: number) => (i < righe && j < colonne ? costi[i][j] : MAX / 1e3); // celle fittizie
  const u = new Array(n + 1).fill(0);
  const v = new Array(n + 1).fill(0);
  const p = new Array(n + 1).fill(0); // p[j] = riga assegnata alla colonna j (1-based)
  const via = new Array(n + 1).fill(0);
  for (let i = 1; i <= n; i++) {
    p[0] = i;
    let j0 = 0;
    const minimo = new Array(n + 1).fill(MAX);
    const usata = new Array(n + 1).fill(false);
    do {
      usata[j0] = true;
      const i0 = p[j0];
      let delta = MAX;
      let j1 = 0;
      for (let j = 1; j <= n; j++) {
        if (usata[j]) continue;
        const ridotto = c(i0 - 1, j - 1) - u[i0] - v[j];
        if (ridotto < minimo[j]) { minimo[j] = ridotto; via[j] = j0; }
        if (minimo[j] < delta) { delta = minimo[j]; j1 = j; }
      }
      for (let j = 0; j <= n; j++) {
        if (usata[j]) { u[p[j]] += delta; v[j] -= delta; } else { minimo[j] -= delta; }
      }
      j0 = j1;
    } while (p[j0] !== 0);
    do {
      const j1 = via[j0];
      p[j0] = p[j1];
      j0 = j1;
    } while (j0);
  }
  const risultato = new Array(righe).fill(-1);
  for (let j = 1; j <= n; j++) {
    const i = p[j] - 1;
    if (i >= 0 && i < righe && j - 1 < colonne) risultato[i] = j - 1;
  }
  return risultato;
}
