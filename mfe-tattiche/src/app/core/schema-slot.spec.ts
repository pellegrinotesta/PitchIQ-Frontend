import {
  fasiFormazioneComeSchema, fasiSchemaComeFormazione, nuovoSlot, rinominaSlot, slotDaModulo, spostaSlot, verificaSchema,
} from './schema-slot';
import { FasiSchema } from './model/schema.model';

describe('slot degli schemi', () => {
  it('un nuovo schema parte dal modulo con 11 slot, un portiere e ruoli per reparto', () => {
    const slot = slotDaModulo('4-3-3');

    expect(slot).toHaveLength(11);
    expect(verificaSchema(slot).every(c => c.ok)).toBe(true);
    expect(slot.find(s => s.slotRuolo === 'CB1')?.ruolo).toBe('DIFENSORE');
    expect(slot.find(s => s.slotRuolo === 'LW')?.ruolo).toBe('ATTACCANTE');
  });

  it('un nuovo slot prende nome e ruolo dalla zona (prima: SLOT1, centrocampista ovunque)', () => {
    const slot = slotDaModulo('4-3-3').filter(s => s.slotRuolo !== 'CB2');

    expect(nuovoSlot(slot, 60, 74)).toMatchObject({ slotRuolo: 'CB2', ruolo: 'DIFENSORE' });
    expect(nuovoSlot([], 50, 88)).toMatchObject({ slotRuolo: 'GK', ruolo: 'PORTIERE' });
  });

  it('spostando uno slot il ruolo segue la zona, a meno che sia un ruolo specifico', () => {
    const slot = [{ slotRuolo: 'CM1', ruolo: 'CENTROCAMPISTA', coordX: 50, coordY: 50, note: null },
      { slotRuolo: 'LW', ruolo: 'ALS', coordX: 20, coordY: 20, note: null }];

    const spostati = spostaSlot(spostaSlot(slot, 0, 50, 20), 1, 20, 50);

    expect(spostati[0].ruolo).toBe('ATTACCANTE');
    expect(spostati[1].ruolo).toBe('ALS');
  });

  it('segnala slot mancanti, portieri e nomi ripetuti', () => {
    const controlli = verificaSchema([
      { slotRuolo: 'CB1', ruolo: 'DIFENSORE', coordX: 40, coordY: 75, note: null },
      { slotRuolo: 'cb1', ruolo: 'DIFENSORE', coordX: 60, coordY: 75, note: null },
    ]);

    expect(controlli.map(c => c.testo)).toEqual(['2/11 slot', 'Nessun portiere', 'Nomi ripetuti: CB1']);
  });

  it('le fasi passano dal campo delle fasi allo schema e ritorno, per nome dello slot', () => {
    const slot = slotDaModulo('4-4-2');
    const fasi: FasiSchema = { POSSESSO: { posizioni: [{ slot: 'LB', coordX: 15, coordY: 45 }], frecce: [] } };

    const comeFormazione = fasiSchemaComeFormazione(fasi, slot);
    expect(comeFormazione.POSSESSO?.posizioni[0].giocatoreId).toBe(slot.findIndex(s => s.slotRuolo === 'LB') + 1);
    expect(fasiFormazioneComeSchema(comeFormazione, slot)).toEqual(fasi);
  });

  it('rinominare uno slot aggiorna le fasi', () => {
    const fasi: FasiSchema = { POSSESSO: { posizioni: [{ slot: 'ST', coordX: 50, coordY: 10 }], frecce: [] } };

    expect(rinominaSlot(fasi, 'ST', 'CF')?.POSSESSO?.posizioni[0].slot).toBe('CF');
  });
});
