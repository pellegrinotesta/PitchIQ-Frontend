import { aggiungiFreccia, copiaDa, haContenuto, pinInFase, rimuoviFreccia, ripristina, sposta } from './fasi';
import { PosizioneCampo } from './model/formazione.model';

const p = (id: number, x: number, y: number, titolare = true): PosizioneCampo =>
  ({ giocatoreId: id, nomeGiocatore: '', cognomeGiocatore: `G${id}`, numeroMaglia: id, coordX: x, coordY: y, slotRuolo: null, titolare });

const schieramento = [p(1, 18, 72), p(2, 50, 76), p(9, 50, 14), p(30, 0, 0, false)];

describe('fasi di gioco', () => {
  it('senza fase definita i titolari restano allo schieramento e la panchina non compare', () => {
    const pin = pinInFase(schieramento, null, 'POSSESSO');

    expect(pin.map(x => x.p.giocatoreId)).toEqual([1, 2, 9]);
    expect(pin[0]).toMatchObject({ x: 18, y: 72, spostato: false });
  });

  it('spostare in una fase non tocca lo schieramento né le altre fasi', () => {
    const fasi = sposta(null, 'POSSESSO', 1, 15, 45); // il terzino si alza in possesso

    expect(pinInFase(schieramento, fasi, 'POSSESSO')[0]).toMatchObject({ x: 15, y: 45, spostato: true });
    expect(pinInFase(schieramento, fasi, 'NON_POSSESSO')[0]).toMatchObject({ x: 18, y: 72 });
    expect(schieramento[0].coordY).toBe(72);
  });

  it('spostare due volte lo stesso giocatore tiene solo l\'ultima posizione', () => {
    const fasi = sposta(sposta(null, 'POSSESSO', 1, 15, 45), 'POSSESSO', 1, 20, 40);

    expect(fasi.POSSESSO!.posizioni).toEqual([{ giocatoreId: 1, coordX: 20, coordY: 40 }]);
  });

  it('frecce: aggiunta, rimozione e ripristino della fase', () => {
    let fasi = aggiungiFreccia(null, 'NON_POSSESSO', { startX: 50, startY: 14, endX: 50, endY: 30, tipo: 'PRESSIONE' });
    fasi = aggiungiFreccia(fasi, 'NON_POSSESSO', { startX: 18, startY: 72, endX: 30, endY: 72, tipo: 'CORSA' });
    fasi = rimuoviFreccia(fasi, 'NON_POSSESSO', 0);

    expect(fasi.NON_POSSESSO!.frecce.map(f => f.tipo)).toEqual(['CORSA']);
    expect(haContenuto(ripristina(fasi, 'NON_POSSESSO'), 'NON_POSSESSO')).toBe(false);
  });

  it('copia le posizioni da un\'altra fase', () => {
    const fasi = copiaDa(sposta(null, 'NON_POSSESSO', 9, 50, 40), 'NON_POSSESSO', 'TRANSIZIONE_DIFENSIVA', schieramento);

    expect(pinInFase(schieramento, fasi, 'TRANSIZIONE_DIFENSIVA').find(x => x.p.giocatoreId === 9)).toMatchObject({ x: 50, y: 40 });
  });
});
