import { ungherese, assegnaASlot, distanzaRuolo, fuoriReparto, repartoSlot, repartoZona } from './ruoli';

describe('ruoli', () => {
  it('le ali giocano con naturalezza anche in attacco (prima erano rifiutate sopra il 35%)', () => {
    expect(fuoriReparto('ALS', repartoZona(20))).toBe(false);
    expect(distanzaRuolo('ALD', 'ATTACCANTE')).toBe(1);
  });

  it('segnala i casi davvero fuori reparto', () => {
    expect(fuoriReparto('POR', 'ATTACCANTE')).toBe(true);
    expect(fuoriReparto('DC', 'ATTACCANTE')).toBe(true);
  });

  it('riconosce il reparto degli slot dei moduli', () => {
    expect(repartoSlot('CB2')).toBe('DIFENSORE');
    expect(repartoSlot('LWB')).toBe('DIFENSORE');
    expect(repartoSlot('DM1')).toBe('CENTROCAMPISTA');
    expect(repartoSlot('RW')).toBe('ATTACCANTE');
    expect(repartoSlot('SLOT3')).toBeNull();
  });

  it('cambiando modulo nessun titolare resta fuori e i lati vengono mantenuti', () => {
    // da 4-3-3 a 3-5-2: quattro difensori per tre slot di difesa
    const giocatori = [
      { id: 'Sala', ruolo: 'TSS', x: 20 },
      { id: 'Izzo', ruolo: 'DC', x: 38 },
      { id: 'Simic', ruolo: 'DC', x: 62 },
      { id: 'Missori', ruolo: 'TSD', x: 80 },
    ];
    const slot = [
      { nome: 'CB1', reparto: 'DIFENSORE' as const, x: 25 },
      { nome: 'CB2', reparto: 'DIFENSORE' as const, x: 50 },
      { nome: 'CB3', reparto: 'DIFENSORE' as const, x: 75 },
      { nome: 'LWB', reparto: 'CENTROCAMPISTA' as const, x: 10 },
    ];

    const assegnati = assegnaASlot(giocatori, slot);
    const su = (nome: string) => assegnati.get(slot.find(s => s.nome === nome)!)?.id;

    expect(assegnati.size).toBe(4);
    expect(su('LWB')).toBe('Sala'); // il terzino sinistro diventa quinto a sinistra
    expect(su('CB1')).toBe('Izzo');
    expect(su('CB2')).toBe('Simic');
    expect(su('CB3')).toBe('Missori');
    expect(new Set(assegnati.values()).size).toBe(4);
  });

  it('l\'algoritmo ungherese trova l\'assegnazione di costo minimo anche con matrici rettangolari', () => {
    expect(ungherese([[4, 1, 3], [2, 0, 5], [3, 2, 2]])).toEqual([1, 0, 2]);
    expect(ungherese([[1, 9], [9, 1], [5, 5]])).toEqual([0, 1, -1]); // 3 giocatori, 2 slot
    expect(ungherese([[3, 1, 2]])).toEqual([1]);
    expect(ungherese([])).toEqual([]);
  });
});
