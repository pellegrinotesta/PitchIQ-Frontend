/**
 * Disponibilità della rosa e controlli sulla formazione (titolari, portieri, indisponibili, lista, carico).
 * Nessun controllo blocca il salvataggio: l'allenatore può preparare una partita futura con un
 * infortunato in recupero. Gli errori sono evidenziati, non vietati.
 */
import { CaricoGiocatore, GiocatoreDisponibile, PosizioneCampo } from './model/formazione.model';

/** Soglie del rapporto acuto/cronico usate anche in Allenamenti (mfe-allenamenti, zonaCarico). */
export const ACWR_ALTO = 1.5;

export type Gravita = 'ok' | 'info' | 'avviso' | 'errore';

export interface Controllo {
  id: string;
  gravita: Gravita;
  testo: string;
}

export interface Segnale {
  testo: string;
  gravita: Exclude<Gravita, 'ok'>;
}

export function indisponibile(g: GiocatoreDisponibile | undefined): boolean {
  return !!g && (g.stato === 'INFORTUNATO' || g.stato === 'SQUALIFICATO');
}

export function caricoAlto(c: CaricoGiocatore | undefined): boolean {
  return !!c && !c.storicoInsufficiente && c.acwr !== null && c.acwr > ACWR_ALTO;
}

/** Etichette da mostrare accanto al giocatore nella rosa e in panchina. */
export function segnali(g: GiocatoreDisponibile, carico?: CaricoGiocatore): Segnale[] {
  const out: Segnale[] = [];
  if (g.stato === 'INFORTUNATO') out.push({ testo: 'Infortunato', gravita: 'errore' });
  if (g.stato === 'SQUALIFICATO') out.push({ testo: 'Squalificato', gravita: 'errore' });
  if (g.fuoriLista) out.push({ testo: 'Fuori lista', gravita: 'avviso' });
  if (caricoAlto(carico)) {
    out.push({ testo: `Carico alto · ${carico!.acwr!.toFixed(1).replace('.', ',')}`, gravita: 'info' });
  }
  return out;
}

function nomi(ids: number[], rosa: Map<number, GiocatoreDisponibile>): string {
  return ids.map(id => rosa.get(id)?.cognome ?? `#${id}`).join(', ');
}

export function verificaFormazione(
  posizioni: PosizioneCampo[],
  rosaLista: GiocatoreDisponibile[],
  carichi: Map<number, CaricoGiocatore>,
): Controllo[] {
  const rosa = new Map(rosaLista.map(g => [g.id, g]));
  const titolari = posizioni.filter(p => p.titolare).map(p => p.giocatoreId);
  const panchina = posizioni.filter(p => !p.titolare).map(p => p.giocatoreId);
  const tutti = [...titolari, ...panchina];
  const portiere = (id: number) => rosa.get(id)?.ruolo === 'POR';
  const controlli: Controllo[] = [];

  controlli.push(titolari.length === 11
    ? { id: 'titolari', gravita: 'ok', testo: '11 titolari' }
    : { id: 'titolari', gravita: 'errore', testo: `${titolari.length}/11 titolari` });

  const portieri = titolari.filter(portiere).length;
  controlli.push(portieri === 1
    ? { id: 'portiere', gravita: 'ok', testo: 'Un portiere titolare' }
    : { id: 'portiere', gravita: 'errore', testo: portieri === 0 ? 'Nessun portiere titolare' : `${portieri} portieri titolari` });

  if (panchina.length > 0 && !panchina.some(portiere)) {
    controlli.push({ id: 'portiere-riserva', gravita: 'avviso', testo: 'Nessun portiere in panchina' });
  }

  const fuori = tutti.filter(id => indisponibile(rosa.get(id)));
  if (fuori.length) {
    controlli.push({ id: 'indisponibili', gravita: 'errore', testo: `Non disponibili: ${nomi(fuori, rosa)}` });
  }

  const nonInLista = tutti.filter(id => rosa.get(id)?.fuoriLista);
  if (nonInLista.length) {
    controlli.push({ id: 'lista', gravita: 'avviso', testo: `Fuori lista, non schierabili in campionato: ${nomi(nonInLista, rosa)}` });
  }

  const affaticati = titolari.filter(id => caricoAlto(carichi.get(id)));
  if (affaticati.length) {
    controlli.push({ id: 'carico', gravita: 'info', testo: `Carico di allenamento alto: ${nomi(affaticati, rosa)}` });
  }
  return controlli;
}
