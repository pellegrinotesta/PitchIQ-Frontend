import { posizioniDaPartita } from './posizioni-fonte';
import { TitolarePartita } from './model/partita.model';

const t = (id: number, cognome: string, posizione: string | null): TitolarePartita =>
  ({ id, nome: '', cognome, posizione, numeroMaglia: id, moduloFonte: '3-5-2' });

describe('posizioniDaPartita', () => {
  it('converte un 3-5-2 reale dell\'Avellino e allarga i centrali laterali', () => {
    const posizioni = posizioniDaPartita([
      t(50, 'Martinelli', 'G'), t(44, 'Simic', 'CD-L'), t(53, 'Izzo', 'CD'), t(56, 'Venturi', 'CD-R'),
      t(39, 'Besaggio', 'LM'), t(6, 'Palmiero', 'CM-L'), t(20, 'Palumbo', 'AM'), t(8, 'Di Maggio', 'CM-R'),
      t(77, 'Di Paolo', 'RM'), t(9, 'Cheddira', 'CF-L'), t(14, 'Biasci', 'CF-R'),
    ]);
    const di = (cognome: string) => posizioni.find(p => p.cognomeGiocatore === cognome)!;

    expect(posizioni).toHaveLength(11);
    expect(posizioni.every(p => p.titolare)).toBe(true);
    expect(di('Martinelli')).toMatchObject({ coordY: 88, slotRuolo: 'GK' });
    expect(di('Simic').coordX).toBe(27);
    expect(di('Venturi').coordX).toBe(73);
    expect(di('Besaggio').coordX).toBeLessThan(di('Palmiero').coordX);
    expect(di('Cheddira').slotRuolo).toBe('ST');
  });

  it('nessun giocatore resta sovrapposto, anche con codici sconosciuti o ripetuti', () => {
    const posizioni = posizioniDaPartita([t(1, 'A', 'CM'), t(2, 'B', 'M'), t(3, 'C', 'XYZ'), t(4, 'D', null)]);

    for (let i = 0; i < posizioni.length; i++) {
      for (let j = 0; j < i; j++) {
        const d = Math.hypot(posizioni[i].coordX - posizioni[j].coordX, posizioni[i].coordY - posizioni[j].coordY);
        expect(d).toBeGreaterThanOrEqual(8);
      }
    }
    expect(posizioni.find(p => p.cognomeGiocatore === 'C')!.slotRuolo).toBeNull();
  });
});
