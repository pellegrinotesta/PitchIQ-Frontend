/**
 * Conversione delle posizioni delle formazioni reali (codici ESPN usati nelle partite importate,
 * es. "G", "CD-L", "AM-R", "CF-L") in punti del campo dell'editor e in slot riconosciuti dal modulo.
 * Il codice indica un ruolo, non una coordinata: i punti sono quelli tipici del ruolo.
 */
import { PosizioneCampo } from './model/formazione.model';
import { TitolarePartita } from './model/partita.model';

interface Punto { x: number; y: number; slot: string }

/** y: 88 = porta propria, 14 = attacco. x: 0 = sinistra, 100 = destra. */
const PUNTI: Record<string, Punto> = {
  'G': { x: 50, y: 88, slot: 'GK' }, 'GK': { x: 50, y: 88, slot: 'GK' },
  'CD': { x: 50, y: 76, slot: 'CB' }, 'CD-L': { x: 38, y: 75, slot: 'CB' }, 'CD-R': { x: 62, y: 75, slot: 'CB' },
  'LB': { x: 18, y: 72, slot: 'LB' }, 'RB': { x: 82, y: 72, slot: 'RB' },
  'LWB': { x: 10, y: 58, slot: 'LWB' }, 'RWB': { x: 90, y: 58, slot: 'RWB' },
  'DM': { x: 50, y: 62, slot: 'DM' }, 'DM-L': { x: 38, y: 60, slot: 'DM' }, 'DM-R': { x: 62, y: 60, slot: 'DM' },
  'M': { x: 50, y: 50, slot: 'CM' }, 'CM': { x: 50, y: 48, slot: 'CM' },
  'CM-L': { x: 33, y: 50, slot: 'CM' }, 'CM-R': { x: 67, y: 50, slot: 'CM' },
  'LM': { x: 14, y: 50, slot: 'LM' }, 'RM': { x: 86, y: 50, slot: 'RM' },
  'AM': { x: 50, y: 32, slot: 'AM' }, 'AM-L': { x: 20, y: 30, slot: 'LW' }, 'AM-R': { x: 80, y: 30, slot: 'RW' },
  'LW': { x: 18, y: 22, slot: 'LW' }, 'RW': { x: 82, y: 22, slot: 'RW' },
  'F': { x: 50, y: 14, slot: 'ST' }, 'CF': { x: 50, y: 14, slot: 'ST' }, 'ST': { x: 50, y: 14, slot: 'ST' },
  'CF-L': { x: 38, y: 16, slot: 'ST' }, 'CF-R': { x: 62, y: 16, slot: 'ST' },
  'LF': { x: 32, y: 18, slot: 'ST' }, 'RF': { x: 68, y: 18, slot: 'ST' },
};

const DISTANZA_MINIMA = 9;

/**
 * Converte i titolari di una partita in posizioni dell'editor.
 * Con tre centrali ("CD", "CD-L", "CD-R") i laterali si allargano; giocatori finiti sullo stesso
 * punto (codici sconosciuti o ripetuti) vengono distanziati in orizzontale.
 */
export function posizioniDaPartita(titolari: TitolarePartita[]): PosizioneCampo[] {
  const codici = new Set(titolari.map(t => (t.posizione ?? '').toUpperCase()));
  const difesaATre = codici.has('CD') && (codici.has('CD-L') || codici.has('CD-R'));

  const punti = titolari.map(t => {
    const codice = (t.posizione ?? '').toUpperCase();
    const noto: Punto | undefined = PUNTI[codice];
    let x = noto?.x ?? 50;  // codice sconosciuto: a centrocampo, poi distanziato
    if (difesaATre && codice === 'CD-L') x = 27;
    if (difesaATre && codice === 'CD-R') x = 73;
    return { t, x, y: noto?.y ?? 50, slot: noto?.slot ?? null };
  });

  // distanzia chi è sovrapposto, procedendo per righe
  for (let i = 0; i < punti.length; i++) {
    for (let j = 0; j < i; j++) {
      if (Math.hypot(punti[i].x - punti[j].x, punti[i].y - punti[j].y) < DISTANZA_MINIMA) {
        punti[i].x = Math.min(92, Math.max(8, punti[j].x + (punti[i].x >= 50 ? DISTANZA_MINIMA * 1.6 : -DISTANZA_MINIMA * 1.6)));
      }
    }
  }

  return punti.map(({ t, x, y, slot }) => ({
    giocatoreId: t.id,
    nomeGiocatore: t.nome,
    cognomeGiocatore: t.cognome,
    numeroMaglia: t.numeroMaglia,
    coordX: x,
    coordY: y,
    slotRuolo: slot,
    titolare: true,
  }));
}
