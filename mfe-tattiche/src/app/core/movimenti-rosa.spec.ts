import { inCampo, inPanchina, scambia } from './movimenti-rosa';
import { GiocatoreDisponibile, PosizioneCampo } from './model/formazione.model';

const g = (id: number, cognome = `G${id}`): GiocatoreDisponibile =>
  ({ id, nome: '', cognome, numeroMaglia: id, ruolo: 'CC', categoriaRuolo: 'CENTROCAMPISTA' });
const p = (id: number, titolare: boolean, x = 50, y = 50, slotRuolo: string | null = null): PosizioneCampo =>
  ({ giocatoreId: id, nomeGiocatore: '', cognomeGiocatore: `G${id}`, numeroMaglia: id, coordX: x, coordY: y, slotRuolo, titolare });

describe('movimenti tra campo e panchina', () => {
  it('dalla panchina al campo senza duplicare il giocatore', () => {
    const esito = inCampo([p(1, false)], g(1), 30, 40);

    expect('posizioni' in esito && esito.posizioni).toEqual([p(1, true, 30, 40)]);
  });

  it('rifiuta il dodicesimo titolare ma permette di spostare un titolare', () => {
    const undici = Array.from({ length: 11 }, (_, i) => p(i + 1, true));

    expect('errore' in inCampo(undici, g(99), 10, 10)).toBe(true);
    expect('posizioni' in inCampo(undici, g(3), 10, 10)).toBe(true);
  });

  it('in panchina conserva la posizione per il rientro', () => {
    expect(inPanchina([p(1, true, 20, 70)], g(1))).toEqual([p(1, false, 20, 70)]);
    expect(inPanchina([], g(2))[0].titolare).toBe(false);
  });

  it('cambio con un panchinaro: l\'entrante prende posto e slot, l\'uscente va in panchina', () => {
    const risultato = scambia([p(1, true, 20, 70, 'LB'), p(2, false, 0, 0)], 1, g(2));

    expect(risultato.find(x => x.giocatoreId === 2)).toMatchObject({ titolare: true, coordX: 20, coordY: 70, slotRuolo: 'LB' });
    expect(risultato.find(x => x.giocatoreId === 1)).toMatchObject({ titolare: false });
  });

  it('cambio con un giocatore della rosa: l\'uscente lascia la formazione', () => {
    const risultato = scambia([p(1, true, 20, 70, 'LB')], 1, g(7, 'Nuovo'));

    expect(risultato).toHaveLength(1);
    expect(risultato[0]).toMatchObject({ giocatoreId: 7, cognomeGiocatore: 'Nuovo', coordX: 20, slotRuolo: 'LB', titolare: true });
  });
});
