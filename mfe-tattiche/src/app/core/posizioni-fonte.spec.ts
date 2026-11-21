import { posizioniDaPartita } from './posizioni-fonte';
import { TitolarePartita } from './model/partita.model';

const t = (id: number, cognome: string, posizione: string | null): TitolarePartita =>
  ({ id, nome: '', cognome, posizione, numeroMaglia: id, moduloFonte: '3-5-2' });

describe('posizioniDaPartita', () => {
  it('converte un 3-5-2 in formato ESPN e allarga i centrali laterali', () => {
    const posizioni = posizioniDaPartita([
      t(50, 'Colonnese', 'G'), t(44, 'Kremer', 'CD-L'), t(53, 'Valsecchi', 'CD'), t(56, 'Archetti', 'CD-R'),
      t(39, 'Lindqvist', 'LM'), t(6, 'Tedeschini', 'CM-L'), t(20, 'Scaramella', 'AM'), t(8, 'Fumagalli', 'CM-R'),
      t(77, 'Raimondi', 'RM'), t(9, 'Corsetti', 'CF-L'), t(14, 'Antonelli', 'CF-R'),
    ]);
    const di = (cognome: string) => posizioni.find(p => p.cognomeGiocatore === cognome)!;

    expect(posizioni).toHaveLength(11);
    expect(posizioni.every(p => p.titolare)).toBe(true);
    expect(di('Colonnese')).toMatchObject({ coordY: 88, slotRuolo: 'GK' });
    expect(di('Kremer').coordX).toBe(27);
    expect(di('Archetti').coordX).toBe(73);
    expect(di('Lindqvist').coordX).toBeLessThan(di('Tedeschini').coordX);
    expect(di('Corsetti').slotRuolo).toBe('ST');
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
