import { Component, EventEmitter, Input, Output } from '@angular/core';
import { HeatmapZona } from '../../core/models/partita.model';

@Component({
  selector: 'par-heatmap-campo',
  imports: [],
  templateUrl: './heatmap-campo.html',
  styleUrl: './heatmap-campo.scss',
})
export class HeatmapCampo {
  @Input() zone: HeatmapZona[] = [];
  @Input() giocatoreId: number | null = null;
  @Output() zoneChange = new EventEmitter<HeatmapZona[]>();

  onCampoClick(event: MouseEvent): void {
    if (event.button !== 0) return;
    const { x, y } = this.getCoord(event);

    // Controlla se c'è già un punto vicino (raggio 4%)
    const vicino = this.zone.findIndex(z =>
      Math.abs(z.coordX - x) < 4 && Math.abs(z.coordY - y) < 4
    );

    if (vicino >= 0) {
      // Aumenta intensità (max 5)
      const updated = this.zone.map((z, i) =>
        i === vicino ? { ...z, intensita: Math.min(5, z.intensita + 1) } : z
      );
      this.zoneChange.emit(updated);
    } else {
      // Aggiunge nuovo punto
      const nuova: HeatmapZona = {
        giocatoreId: this.giocatoreId!,
        coordX: x,
        coordY: y,
        intensita: 1,
      };
      this.zoneChange.emit([...this.zone, nuova]);
    }
  }

  onCampoRightClick(event: MouseEvent): void {
    event.preventDefault();
    const { x, y } = this.getCoord(event);

    // Rimuove il punto più vicino
    const vicino = this.zone.findIndex(z =>
      Math.abs(z.coordX - x) < 5 && Math.abs(z.coordY - y) < 5
    );

    if (vicino >= 0) {
      this.zoneChange.emit(this.zone.filter((_, i) => i !== vicino));
    }
  }

  getColore(intensita: number): string {
    const colori = ['', 'rgba(0,255,135,.3)', 'rgba(0,255,135,.5)', 'rgba(255,180,0,.6)', 'rgba(255,100,0,.7)', 'rgba(255,50,50,.85)'];
    return colori[intensita] ?? colori[1];
  }

  getRaggio(intensita: number): number {
    return 3 + intensita * 1.5;
  }

  private getCoord(event: MouseEvent): { x: number; y: number } {
    const el = event.currentTarget as SVGElement;
    const rect = el.getBoundingClientRect();
    return {
      x: Math.round(((event.clientX - rect.left) / rect.width) * 100),
      y: Math.round(((event.clientY - rect.top) / rect.height) * 100),
    };
  }
}
