import { Component, computed, input, output, signal } from '@angular/core';
import { Giocatore, MovimentoTattico, MOVIMENTI_LABEL, RUOLO_LABEL, RuoloGiocatore } from '../../../core/models/giocatore.model';
import { ruoliSecondari } from '../../../core/models/rosa-insights';

export const POSIZIONI_RUOLO: Record<RuoloGiocatore, { x: number; y: number }> = {
  POR: { x: 340, y: 900 }, DC: { x: 290, y: 760 }, TSD: { x: 555, y: 740 },
  TSS: { x: 125, y: 740 }, LB: { x: 340, y: 820 }, CDC: { x: 340, y: 650 },
  CC: { x: 285, y: 540 }, MOC: { x: 340, y: 385 }, ALD: { x: 555, y: 350 },
  ALS: { x: 125, y: 350 }, W: { x: 555, y: 440 }, PC: { x: 340, y: 210 },
  SP: { x: 250, y: 300 }, FW: { x: 340, y: 330 },
};

export function traiettoriaMovimento(ruolo: RuoloGiocatore, movimento: MovimentoTattico) {
  const origine = POSIZIONI_RUOLO[ruolo];
  const lato = origine.x >= 340 ? 1 : -1;
  const spostamenti: Record<MovimentoTattico, [number, number]> = {
    SOVRAPPOSIZIONE: [lato * 70, -240], SOTTOPOSIZIONE: [-lato * 110, -210],
    INSERIMENTO: [0, -235], TAGLIO_INTERNO: [-lato * 160, -185],
    ATTACCO_PROFONDITA: [lato * 35, -280], SMARCAMENTO_INCONTRO: [0, 155],
    AMPIEZZA: [lato * 160, -35], RIPIEGAMENTO: [0, 240],
    SCIVOLAMENTO_LATERALE: [-lato * 160, 0], COPERTURA: [-lato * 90, 160],
    USCITA_PALLA: [0, -150],
  };
  const [deltaX, deltaY] = spostamenti[movimento];
  const destinazione = { x: Math.max(70, Math.min(610, origine.x + deltaX)), y: Math.max(90, Math.min(960, origine.y + deltaY)) };
  return { origine, destinazione, percorso: `M ${origine.x} ${origine.y} Q ${origine.x} ${(origine.y + destinazione.y) / 2} ${destinazione.x} ${destinazione.y}` };
}

@Component({
  selector: 'app-profilo-tattico',
  templateUrl: './profilo-tattico.html',
  styleUrl: './profilo-tattico.scss',
})
export class ProfiloTattico {
  private static sequenza = 0;
  readonly idFreccia = `freccia-tattica-${ProfiloTattico.sequenza++}`;
  readonly giocatore = input.required<Giocatore>();
  readonly modifica = output<void>();
  readonly ruoloScelto = signal<RuoloGiocatore | null>(null);
  readonly movimentoScelto = signal<MovimentoTattico | null>(null);
  readonly ruoloLabel = RUOLO_LABEL;
  readonly movimentiLabel = MOVIMENTI_LABEL;
  readonly posizioni = POSIZIONI_RUOLO;
  readonly ruoli = computed(() => [this.giocatore().ruolo, ...ruoliSecondari(this.giocatore())]);
  readonly ruoloAttivo = computed(() => this.ruoli().includes(this.ruoloScelto()!) ? this.ruoloScelto()! : this.giocatore().ruolo);
  readonly movimenti = computed(() => [...new Set(this.giocatore().movimentiConsentiti ?? [])].filter((codice) => Object.hasOwn(MOVIMENTI_LABEL, codice)));
  readonly movimentoAttivo = computed(() => this.movimenti().includes(this.movimentoScelto()!) ? this.movimentoScelto() : this.movimenti()[0] ?? null);
  readonly traiettoria = computed(() => this.movimentoAttivo() ? traiettoriaMovimento(this.ruoloAttivo(), this.movimentoAttivo()!) : null);
  readonly fase = computed(() => ['RIPIEGAMENTO', 'SCIVOLAMENTO_LATERALE', 'COPERTURA'].includes(this.movimentoAttivo() ?? '') ? 'Non possesso' : 'Possesso / sviluppo');
}