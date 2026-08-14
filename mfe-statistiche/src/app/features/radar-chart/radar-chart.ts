import { Component, Input, OnChanges } from '@angular/core';
import { GiocatoreRadar } from '../../core/models/statistica.model';

interface PuntoSVG {
  x: number;
  y: number;
}

@Component({
  selector: 'app-radar-chart',
  imports: [],
  templateUrl: './radar-chart.html',
  styleUrl: './radar-chart.css',
})
export class RadarChart implements OnChanges {
  @Input() giocatore1!: GiocatoreRadar;
  @Input() giocatore2!: GiocatoreRadar;

  readonly CX = 200;
  readonly CY = 200;
  readonly R = 150;

  assi: { label: string; x: number; y: number; lx: number; ly: number }[] = [];
  griglia: string[] = [];
  path1 = '';
  path2 = '';
  punti1: PuntoSVG[] = [];
  punti2: PuntoSVG[] = [];

  tooltip: { visible: boolean; x: number; y: number; label: string; v1: number; v2: number } =
    { visible: false, x: 0, y: 0, label: '', v1: 0, v2: 0 };

  ngOnChanges(): void {
    if (this.giocatore1 && this.giocatore2) {
      this.calcolaRadar();
    }
  }

  private calcolaRadar(): void {
    const n = this.giocatore1.valori.length;
    const angleStep = (2 * Math.PI) / n;

    // Assi
    this.assi = this.giocatore1.valori.map((v, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const x = this.CX + this.R * Math.cos(angle);
      const y = this.CY + this.R * Math.sin(angle);

      // Label leggermente oltre la fine dell'asse
      const lx = this.CX + (this.R + 22) * Math.cos(angle);
      const ly = this.CY + (this.R + 22) * Math.sin(angle);

      return { label: v.label, x, y, lx, ly };
    });

    // Griglia (5 livelli)
    this.griglia = [20, 40, 60, 80, 100].map(pct => {
      const r = (this.R * pct) / 100;
      return this.giocatore1.valori.map((_, i) => {
        const angle = i * angleStep - Math.PI / 2;
        const x = this.CX + r * Math.cos(angle);
        const y = this.CY + r * Math.sin(angle);
        return `${i === 0 ? 'M' : 'L'}${x},${y}`;
      }).join(' ') + ' Z';
    });

    // Path giocatori
    this.punti1 = this.getPoints(this.giocatore1.valori.map(v => v.valorePct), n, angleStep);
    this.punti2 = this.getPoints(this.giocatore2.valori.map(v => v.valorePct), n, angleStep);

    this.path1 = this.toPath(this.punti1);
    this.path2 = this.toPath(this.punti2);
  }

  private getPoints(valoriPct: number[], n: number, angleStep: number): PuntoSVG[] {
    return valoriPct.map((pct, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const r = (this.R * Math.min(100, Math.max(0, pct))) / 100;
      return {
        x: this.CX + r * Math.cos(angle),
        y: this.CY + r * Math.sin(angle),
      };
    });
  }

  private toPath(punti: PuntoSVG[]): string {
    return punti.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + ' Z';
  }

  mostraTooltip(i: number): void {
    const v1 = this.giocatore1.valori[i];
    const v2 = this.giocatore2.valori[i];
    const asse = this.assi[i];
    this.tooltip = {
      visible: true,
      x: asse.x,
      y: asse.y,
      label: v1.label,
      v1: v1.valore,
      v2: v2.valore,
    };
  }

  nascondiTooltip(): void {
    this.tooltip = { ...this.tooltip, visible: false };
  }
}