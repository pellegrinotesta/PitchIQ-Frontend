/** Disposizioni standard dei moduli: coordinate (0-100, 88 = propria porta) e nome dello slot. */
export interface SlotModulo {
  coordX: number;
  coordY: number;
  slotRuolo: string;
  categoria: string;
}

export const MODULI = ['4-3-3', '4-4-2', '4-2-3-1', '3-5-2', '5-3-2', '3-4-3'] as const;

export const POSIZIONI_MODULO: Record<string, SlotModulo[]> = {
    '4-3-3': [
      { coordX: 50, coordY: 88, slotRuolo: 'GK', categoria: 'PORTIERE' },
      { coordX: 20, coordY: 72, slotRuolo: 'LB', categoria: 'DIFENSORE' },
      { coordX: 38, coordY: 75, slotRuolo: 'CB1', categoria: 'DIFENSORE' },
      { coordX: 62, coordY: 75, slotRuolo: 'CB2', categoria: 'DIFENSORE' },
      { coordX: 80, coordY: 72, slotRuolo: 'RB', categoria: 'DIFENSORE' },
      { coordX: 25, coordY: 50, slotRuolo: 'CM1', categoria: 'CENTROCAMPISTA' },
      { coordX: 50, coordY: 44, slotRuolo: 'CM2', categoria: 'CENTROCAMPISTA' },
      { coordX: 75, coordY: 50, slotRuolo: 'CM3', categoria: 'CENTROCAMPISTA' },
      { coordX: 18, coordY: 20, slotRuolo: 'LW', categoria: 'CENTROCAMPISTA' },
      { coordX: 50, coordY: 14, slotRuolo: 'ST', categoria: 'ATTACCANTE' },
      { coordX: 82, coordY: 20, slotRuolo: 'RW', categoria: 'CENTROCAMPISTA' },
    ],
    '4-4-2': [
      { coordX: 50, coordY: 88, slotRuolo: 'GK', categoria: 'PORTIERE' },
      { coordX: 15, coordY: 72, slotRuolo: 'LB', categoria: 'DIFENSORE' },
      { coordX: 38, coordY: 75, slotRuolo: 'CB1', categoria: 'DIFENSORE' },
      { coordX: 62, coordY: 75, slotRuolo: 'CB2', categoria: 'DIFENSORE' },
      { coordX: 85, coordY: 72, slotRuolo: 'RB', categoria: 'DIFENSORE' },
      { coordX: 15, coordY: 50, slotRuolo: 'LM', categoria: 'CENTROCAMPISTA' },
      { coordX: 38, coordY: 52, slotRuolo: 'CM1', categoria: 'CENTROCAMPISTA' },
      { coordX: 62, coordY: 52, slotRuolo: 'CM2', categoria: 'CENTROCAMPISTA' },
      { coordX: 85, coordY: 50, slotRuolo: 'RM', categoria: 'CENTROCAMPISTA' },
      { coordX: 35, coordY: 18, slotRuolo: 'ST1', categoria: 'ATTACCANTE' },
      { coordX: 65, coordY: 18, slotRuolo: 'ST2', categoria: 'ATTACCANTE' },
    ],
    '4-2-3-1': [
      { coordX: 50, coordY: 88, slotRuolo: 'GK', categoria: 'PORTIERE' },
      { coordX: 15, coordY: 72, slotRuolo: 'LB', categoria: 'DIFENSORE' },
      { coordX: 38, coordY: 75, slotRuolo: 'CB1', categoria: 'DIFENSORE' },
      { coordX: 62, coordY: 75, slotRuolo: 'CB2', categoria: 'DIFENSORE' },
      { coordX: 85, coordY: 72, slotRuolo: 'RB', categoria: 'DIFENSORE' },
      { coordX: 35, coordY: 57, slotRuolo: 'DM1', categoria: 'CENTROCAMPISTA' },
      { coordX: 65, coordY: 57, slotRuolo: 'DM2', categoria: 'CENTROCAMPISTA' },
      { coordX: 18, coordY: 35, slotRuolo: 'LW', categoria: 'CENTROCAMPISTA' },
      { coordX: 50, coordY: 32, slotRuolo: 'AM', categoria: 'CENTROCAMPISTA' },
      { coordX: 82, coordY: 35, slotRuolo: 'RW', categoria: 'CENTROCAMPISTA' },
      { coordX: 50, coordY: 14, slotRuolo: 'ST', categoria: 'ATTACCANTE' },
    ],
    '3-5-2': [
      { coordX: 50, coordY: 88, slotRuolo: 'GK', categoria: 'PORTIERE' },
      { coordX: 25, coordY: 74, slotRuolo: 'CB1', categoria: 'DIFENSORE' },
      { coordX: 50, coordY: 76, slotRuolo: 'CB2', categoria: 'DIFENSORE' },
      { coordX: 75, coordY: 74, slotRuolo: 'CB3', categoria: 'DIFENSORE' },
      { coordX: 10, coordY: 52, slotRuolo: 'LWB', categoria: 'CENTROCAMPISTA' },
      { coordX: 30, coordY: 48, slotRuolo: 'CM1', categoria: 'CENTROCAMPISTA' },
      { coordX: 50, coordY: 44, slotRuolo: 'CM2', categoria: 'CENTROCAMPISTA' },
      { coordX: 70, coordY: 48, slotRuolo: 'CM3', categoria: 'CENTROCAMPISTA' },
      { coordX: 90, coordY: 52, slotRuolo: 'RWB', categoria: 'CENTROCAMPISTA' },
      { coordX: 35, coordY: 18, slotRuolo: 'ST1', categoria: 'ATTACCANTE' },
      { coordX: 65, coordY: 18, slotRuolo: 'ST2', categoria: 'ATTACCANTE' },
    ],
    '5-3-2': [
      { coordX: 50, coordY: 88, slotRuolo: 'GK', categoria: 'PORTIERE' },
      { coordX: 10, coordY: 68, slotRuolo: 'LWB', categoria: 'DIFENSORE' },
      { coordX: 28, coordY: 74, slotRuolo: 'CB1', categoria: 'DIFENSORE' },
      { coordX: 50, coordY: 76, slotRuolo: 'CB2', categoria: 'DIFENSORE' },
      { coordX: 72, coordY: 74, slotRuolo: 'CB3', categoria: 'DIFENSORE' },
      { coordX: 90, coordY: 68, slotRuolo: 'RWB', categoria: 'DIFENSORE' },
      { coordX: 25, coordY: 48, slotRuolo: 'CM1', categoria: 'CENTROCAMPISTA' },
      { coordX: 50, coordY: 44, slotRuolo: 'CM2', categoria: 'CENTROCAMPISTA' },
      { coordX: 75, coordY: 48, slotRuolo: 'CM3', categoria: 'CENTROCAMPISTA' },
      { coordX: 35, coordY: 18, slotRuolo: 'ST1', categoria: 'ATTACCANTE' },
      { coordX: 65, coordY: 18, slotRuolo: 'ST2', categoria: 'ATTACCANTE' },
    ],
    '3-4-3': [
      { coordX: 50, coordY: 88, slotRuolo: 'GK', categoria: 'PORTIERE' },
      { coordX: 25, coordY: 74, slotRuolo: 'CB1', categoria: 'DIFENSORE' },
      { coordX: 50, coordY: 76, slotRuolo: 'CB2', categoria: 'DIFENSORE' },
      { coordX: 75, coordY: 74, slotRuolo: 'CB3', categoria: 'DIFENSORE' },
      { coordX: 15, coordY: 52, slotRuolo: 'LM', categoria: 'CENTROCAMPISTA' },
      { coordX: 38, coordY: 50, slotRuolo: 'CM1', categoria: 'CENTROCAMPISTA' },
      { coordX: 62, coordY: 50, slotRuolo: 'CM2', categoria: 'CENTROCAMPISTA' },
      { coordX: 85, coordY: 52, slotRuolo: 'RM', categoria: 'CENTROCAMPISTA' },
      { coordX: 18, coordY: 20, slotRuolo: 'LW', categoria: 'CENTROCAMPISTA' },
      { coordX: 50, coordY: 14, slotRuolo: 'ST', categoria: 'ATTACCANTE' },
      { coordX: 82, coordY: 20, slotRuolo: 'RW', categoria: 'CENTROCAMPISTA' },
    ],
  };
