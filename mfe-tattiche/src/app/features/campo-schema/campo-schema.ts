import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FrecciaSchema, SlotSchema } from '../../core/model/schema.model';

type Modalita = 'slot' | 'freccia';

@Component({
  selector: 'app-campo-schema',
  imports: [FormsModule],
  templateUrl: './campo-schema.html',
  styleUrl: './campo-schema.scss',
})
export class CampoSchema {
  @Input() slot: SlotSchema[] = [];
  @Input() frecce: FrecciaSchema[] = [];
  @Input() modulo = '4-3-3';
  @Output() slotChange = new EventEmitter<SlotSchema[]>();
  @Output() frecceChange = new EventEmitter<FrecciaSchema[]>();

  modalita: Modalita = 'slot';
  slotSelezionato: SlotSchema | null = null;

  // Stato disegno freccia
  disegnandoFreccia = false;
  frecciaInCorso: { startX: number; startY: number } | null = null;
  mouseX = 0;
  mouseY = 0;

  readonly ruoliOptions = [
    { label: 'Portiere', value: 'PORTIERE' },
    { label: 'Difensore', value: 'DIFENSORE' },
    { label: 'Centrocampista', value: 'CENTROCAMPISTA' },
    { label: 'Attaccante', value: 'ATTACCANTE' },
  ];

  readonly coloriOptions = [
    { label: 'Verde', value: '#00ff87' },
    { label: 'Rosso', value: '#ff6464' },
    { label: 'Giallo', value: '#ffb400' },
    { label: 'Bianco', value: '#ffffff' },
    { label: 'Azzurro', value: '#60a5fa' },
  ];

  onCampoClick(event: MouseEvent): void {
    if (this.modalita !== 'slot') return;
    const { x, y } = this.getCoord(event);

    const nuovoSlot: SlotSchema = {
      slotRuolo: `SLOT${this.slot.length + 1}`,
      ruolo: 'CENTROCAMPISTA',
      coordX: x,
      coordY: y,
      note: null,
    };

    this.slotChange.emit([...this.slot, nuovoSlot]);
    this.slotSelezionato = nuovoSlot;
  }

  onCampoMouseDown(event: MouseEvent): void {
    if (this.modalita !== 'freccia') return;
    event.preventDefault();
    const { x, y } = this.getCoord(event);
    this.disegnandoFreccia = true;
    this.frecciaInCorso = { startX: x, startY: y };
  }

  onCampoMouseMove(event: MouseEvent): void {
    if (!this.disegnandoFreccia || !this.frecciaInCorso) return;
    const { x, y } = this.getCoord(event);
    this.mouseX = x;
    this.mouseY = y;
  }

  onCampoMouseUp(event: MouseEvent): void {
    if (!this.disegnandoFreccia || !this.frecciaInCorso) return;
    const { x, y } = this.getCoord(event);

    // Ignora click senza movimento
    const dist = Math.sqrt(
      Math.pow(x - this.frecciaInCorso.startX, 2) +
      Math.pow(y - this.frecciaInCorso.startY, 2)
    );
    if (dist > 3) {
      const nuovaFreccia: FrecciaSchema = {
        startX: this.frecciaInCorso.startX,
        startY: this.frecciaInCorso.startY,
        endX: x,
        endY: y,
        colore: '#00ff87',
        etichetta: null,
      };
      this.frecceChange.emit([...this.frecce, nuovaFreccia]);
    }

    this.disegnandoFreccia = false;
    this.frecciaInCorso = null;
  }

  selezionaSlot(slot: SlotSchema, event: MouseEvent): void {
    event.stopPropagation();
    this.slotSelezionato = this.slotSelezionato === slot ? null : slot;
  }

  aggiornaSlot(index: number, campo: keyof SlotSchema, valore: any): void {
    const updated = this.slot.map((s, i) =>
      i === index ? { ...s, [campo]: valore } : s
    );
    this.slotChange.emit(updated);
    this.slotSelezionato = updated[index];
  }

  rimuoviSlot(index: number, event: MouseEvent): void {
    event.stopPropagation();
    this.slotSelezionato = null;
    this.slotChange.emit(this.slot.filter((_, i) => i !== index));
  }

  rimuoviFreccia(index: number): void {
    this.frecceChange.emit(this.frecce.filter((_, i) => i !== index));
  }

  draggingSlotIndex: number | null = null;

  onSlotDragStart(event: DragEvent, index: number): void {
    this.draggingSlotIndex = index;
  }

  onCampoDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onCampoDrop(event: DragEvent): void {
    if (this.draggingSlotIndex === null) return;
    const { x, y } = this.getCoord(event);
    const updated = this.slot.map((s, i) =>
      i === this.draggingSlotIndex ? { ...s, coordX: x, coordY: y } : s
    );
    this.slotChange.emit(updated);
    this.draggingSlotIndex = null;
  }

  private getCoord(event: MouseEvent): { x: number; y: number } {
    const el = (event.currentTarget as HTMLElement).closest('.campo') as HTMLElement;
    const rect = el.getBoundingClientRect();
    return {
      x: Math.min(Math.max(((event.clientX - rect.left) / rect.width) * 100, 2), 98),
      y: Math.min(Math.max(((event.clientY - rect.top) / rect.height) * 100, 2), 98),
    };
  }

  getSlotIndex(slot: SlotSchema): number {
    return this.slot.indexOf(slot);
  }
}
