import { ChangeDetectionStrategy, Component, ElementRef, computed, input, output, signal, viewChild } from '@angular/core';
import { Fase, FasiFormazione, PosizioneCampo, TipoFreccia } from '../../core/model/formazione.model';
import { TIPI_FRECCIA, aggiungiFreccia, frecceInFase, pinInFase, rimuoviFreccia, sposta } from '../../core/fasi';

type Strumento = 'sposta' | TipoFreccia;

/**
 * Campo di una fase di gioco: i titolari si spostano solo per questa fase, lo schieramento resta
 * in trasparenza; si disegnano frecce di corsa, passaggio e pressione.
 * Usa pointer events: funziona con mouse, penna e dito.
 */
@Component({
  selector: 'app-campo-fase',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './campo-fase.html',
  styleUrl: './campo-fase.scss',
})
export class CampoFase {
  readonly posizioni = input.required<PosizioneCampo[]>();
  readonly fasi = input<FasiFormazione | null | undefined>(null);
  readonly fase = input.required<Fase>();
  readonly fasiChange = output<FasiFormazione>();

  private readonly campo = viewChild.required<ElementRef<HTMLElement>>('campo');

  protected readonly tipi = TIPI_FRECCIA;
  protected readonly strumento = signal<Strumento>('sposta');
  protected readonly frecciaSelezionata = signal<number | null>(null);
  /** Trascinamento in corso: giocatore e posizione provvisoria (non ancora emessa). */
  protected readonly trascina = signal<{ id: number; x: number; y: number } | null>(null);
  protected readonly bozza = signal<{ x1: number; y1: number; x2: number; y2: number } | null>(null);

  protected readonly pin = computed(() => {
    const t = this.trascina();
    return pinInFase(this.posizioni(), this.fasi(), this.fase()).map(p =>
      t && t.id === p.p.giocatoreId ? { ...p, x: t.x, y: t.y, spostato: true } : p);
  });
  protected readonly frecce = computed(() => frecceInFase(this.fasi(), this.fase()));

  /** Da percentuale del campo a unità del disegno (campo 68 x 105). */
  protected X(percentuale: number): number { return percentuale * 0.68; }
  protected Y(percentuale: number): number { return percentuale * 1.05; }

  protected colore(tipo: TipoFreccia): string {
    return this.tipi.find(t => t.valore === tipo)?.colore ?? '#fff';
  }

  private punto(event: PointerEvent): { x: number; y: number } {
    const r = this.campo().nativeElement.getBoundingClientRect();
    return {
      x: Math.min(Math.max(((event.clientX - r.left) / r.width) * 100, 2), 98),
      y: Math.min(Math.max(((event.clientY - r.top) / r.height) * 100, 2), 98),
    };
  }

  // ---- spostamento dei giocatori ----

  protected iniziaSpostamento(event: PointerEvent, giocatoreId: number): void {
    if (this.strumento() !== 'sposta') return;
    event.preventDefault();
    event.stopPropagation();
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    const { x, y } = this.punto(event);
    this.trascina.set({ id: giocatoreId, x, y });
  }

  protected muoviGiocatore(event: PointerEvent): void {
    const t = this.trascina();
    if (!t) return;
    const { x, y } = this.punto(event);
    this.trascina.set({ ...t, x, y });
  }

  protected fineSpostamento(): void {
    const t = this.trascina();
    if (!t) return;
    this.trascina.set(null);
    this.fasiChange.emit(sposta(this.fasi(), this.fase(), t.id, Math.round(t.x * 10) / 10, Math.round(t.y * 10) / 10));
  }

  // ---- frecce ----

  protected iniziaFreccia(event: PointerEvent): void {
    this.frecciaSelezionata.set(null);
    if (this.strumento() === 'sposta') return;
    event.preventDefault();
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    const { x, y } = this.punto(event);
    this.bozza.set({ x1: x, y1: y, x2: x, y2: y });
  }

  protected muoviFreccia(event: PointerEvent): void {
    const b = this.bozza();
    if (!b) return;
    const { x, y } = this.punto(event);
    this.bozza.set({ ...b, x2: x, y2: y });
  }

  protected fineFreccia(): void {
    const b = this.bozza();
    const tipo = this.strumento();
    this.bozza.set(null);
    if (!b || tipo === 'sposta' || Math.hypot(b.x2 - b.x1, b.y2 - b.y1) < 3) return; // un tocco non è una freccia
    const r = (n: number) => Math.round(n * 10) / 10;
    this.fasiChange.emit(aggiungiFreccia(this.fasi(), this.fase(),
      { startX: r(b.x1), startY: r(b.y1), endX: r(b.x2), endY: r(b.y2), tipo }));
  }

  protected selezionaFreccia(event: Event, indice: number): void {
    event.stopPropagation();
    this.frecciaSelezionata.set(this.frecciaSelezionata() === indice ? null : indice);
  }

  protected eliminaFreccia(): void {
    const i = this.frecciaSelezionata();
    if (i === null) return;
    this.frecciaSelezionata.set(null);
    this.fasiChange.emit(rimuoviFreccia(this.fasi(), this.fase(), i));
  }

  protected onTasto(event: KeyboardEvent): void {
    if ((event.key === 'Delete' || event.key === 'Backspace') && this.frecciaSelezionata() !== null) {
      event.preventDefault();
      this.eliminaFreccia();
    }
  }
}
