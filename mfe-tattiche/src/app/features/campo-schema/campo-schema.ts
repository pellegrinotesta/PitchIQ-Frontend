import { ChangeDetectionStrategy, Component, ElementRef, computed, input, output, signal, viewChild } from '@angular/core';
import { SlotSchema } from '../../core/model/schema.model';
import {
  CATEGORIE, MAX_SLOT, RUOLI_SPECIFICI, nuovoSlot, ruoloAutomatico, spostaSlot, verificaSchema,
} from '../../core/schema-slot';

/**
 * Schieramento di uno schema: tocca il campo per aggiungere uno slot (nome e ruolo dalla zona),
 * trascina per spostarlo, tocca uno slot per configurarlo. Pointer events: mouse, penna e dito.
 * Le frecce si disegnano nelle fasi di gioco.
 */
@Component({
  selector: 'app-campo-schema',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './campo-schema.html',
  styleUrl: './campo-schema.scss',
})
export class CampoSchema {
  readonly slot = input.required<SlotSchema[]>();
  readonly slotChange = output<SlotSchema[]>();
  /** Rinomina: serve all'editor per aggiornare le fasi, dove gli slot sono citati per nome. */
  readonly slotRinominato = output<{ vecchio: string; nuovo: string }>();

  private readonly campo = viewChild.required<ElementRef<HTMLElement>>('campo');

  protected readonly categorie = CATEGORIE;
  protected readonly ruoliSpecifici = RUOLI_SPECIFICI;
  protected readonly selezionato = signal<number | null>(null);
  protected readonly trascina = signal<{ indice: number; x: number; y: number; mosso: boolean } | null>(null);
  protected readonly avviso = signal<string | null>(null);

  protected readonly controlli = computed(() => verificaSchema(this.slot()));
  protected readonly slotSelezionato = computed(() => {
    const i = this.selezionato();
    return i === null ? null : this.slot()[i] ?? null;
  });
  protected readonly vista = computed(() => {
    const t = this.trascina();
    return this.slot().map((s, i) => t?.indice === i && t.mosso ? { ...s, coordX: t.x, coordY: t.y } : s);
  });

  protected automatico(ruolo: string): boolean {
    return ruoloAutomatico(ruolo);
  }

  private punto(event: PointerEvent): { x: number; y: number } {
    const r = this.campo().nativeElement.getBoundingClientRect();
    const tondo = (n: number) => Math.round(Math.min(Math.max(n, 3), 97) * 10) / 10;
    return { x: tondo(((event.clientX - r.left) / r.width) * 100), y: tondo(((event.clientY - r.top) / r.height) * 100) };
  }

  /** Tocco sul campo vuoto: nuovo slot. */
  protected onCampo(event: PointerEvent): void {
    if (event.target !== this.campo().nativeElement && !(event.target as Element).closest('.linee')) return;
    if (this.slot().length >= MAX_SLOT) {
      this.selezionato.set(null);
      this.mostra('Lo schema ha già 11 slot: spostane uno o toglilo');
      return;
    }
    const { x, y } = this.punto(event);
    const indice = this.slot().length; // calcolato prima: il genitore può aggiornare subito l'elenco
    this.slotChange.emit([...this.slot(), nuovoSlot(this.slot(), x, y)]);
    this.selezionato.set(indice);
  }

  protected giuSlot(event: PointerEvent, indice: number): void {
    event.stopPropagation();
    event.preventDefault();
    (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
    const s = this.slot()[indice];
    this.trascina.set({ indice, x: s.coordX, y: s.coordY, mosso: false });
  }

  protected muoviSlot(event: PointerEvent): void {
    const t = this.trascina();
    if (!t) return;
    const { x, y } = this.punto(event);
    const s = this.slot()[t.indice];
    const mosso = t.mosso || Math.hypot(x - s.coordX, y - s.coordY) > 1.5;
    this.trascina.set({ ...t, x, y, mosso });
  }

  protected suSlot(): void {
    const t = this.trascina();
    this.trascina.set(null);
    if (!t) return;
    if (!t.mosso) {
      // tocco senza spostamento: seleziona o deseleziona
      this.selezionato.set(this.selezionato() === t.indice ? null : t.indice);
      return;
    }
    this.slotChange.emit(spostaSlot(this.slot(), t.indice, t.x, t.y));
  }

  protected aggiorna(campo: 'slotRuolo' | 'ruolo' | 'note', valore: string): void {
    const i = this.selezionato();
    if (i === null) return;
    const vecchio = this.slot()[i];
    const nuovoValore = campo === 'note' ? (valore || null) : valore;
    if (campo === 'slotRuolo') {
      const nome = valore.trim().toUpperCase().slice(0, 20);
      if (!nome) return;
      if (this.slot().some((s, j) => j !== i && s.slotRuolo.toUpperCase() === nome)) {
        this.mostra(`Esiste già uno slot ${nome}`);
        return;
      }
      this.slotChange.emit(this.slot().map((s, j) => j === i ? { ...s, slotRuolo: nome } : s));
      this.slotRinominato.emit({ vecchio: vecchio.slotRuolo, nuovo: nome });
      return;
    }
    this.slotChange.emit(this.slot().map((s, j) => j === i ? { ...s, [campo]: nuovoValore } : s));
  }

  protected rimuovi(): void {
    const i = this.selezionato();
    if (i === null) return;
    this.selezionato.set(null);
    this.slotChange.emit(this.slot().filter((_, j) => j !== i));
  }

  private mostra(testo: string): void {
    this.avviso.set(testo);
    setTimeout(() => this.avviso.set(null), 3000);
  }
}
