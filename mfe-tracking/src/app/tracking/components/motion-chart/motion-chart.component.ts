import {
  ChangeDetectionStrategy, Component, DestroyRef, ElementRef, afterNextRender, computed, inject, input, output, signal,
} from '@angular/core';
import { CampioneMovimentoDto, EventoVideoDto } from '../../data/tracking.models';

const ALTEZZA = 180;
const M = { top: 18, right: 12, bottom: 24, left: 40 };

interface Banda { id: string; n: number; x: number; w: number; }

/**
 * Movimento nel tempo: area del punteggio (normalizzato sul picco del video = 100%),
 * soglia tratteggiata e fasce delle clip estratte. Hover: crosshair + tooltip; click su una fascia: vai alla clip.
 */
@Component({
  selector: 'tk-motion-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './motion-chart.component.html',
  styleUrl: './motion-chart.component.scss',
})
export class MotionChartComponent {
  readonly campioni = input.required<CampioneMovimentoDto[]>();
  readonly soglia = input<number | null>(null);
  readonly eventi = input<EventoVideoDto[]>([]);
  readonly durata = input<number | null>(null);
  readonly metodo = input<'giocatori' | 'pixel' | null | undefined>('pixel');
  readonly seleziona = output<string>();

  private readonly host = inject(ElementRef<HTMLElement>);
  protected readonly larghezza = signal(640);
  protected readonly altezza = ALTEZZA;
  protected readonly m = M;
  protected readonly hover = signal<number | null>(null);
  protected readonly bandaAttiva = signal<string | null>(null);
  protected readonly tabella = signal(false);

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const el = this.host.nativeElement.querySelector('.mc-plot') as HTMLElement | null;
      if (!el || typeof ResizeObserver === 'undefined') return;
      const ro = new ResizeObserver(([entry]) => this.larghezza.set(Math.max(280, Math.round(entry.contentRect.width))));
      ro.observe(el);
      destroyRef.onDestroy(() => ro.disconnect());
    });
  }

  private readonly picco = computed(() => Math.max(...this.campioni().map(c => c.valore), 0.0001));
  private readonly fine = computed(() =>
    Math.max(this.durata() ?? 0, this.campioni().at(-1)?.secondo ?? 0, 1));
  private readonly yMax = computed(() => {
    const soglia = this.sogliaPct() ?? 0;
    return Math.max(100, soglia) * 1.08;
  });

  protected readonly sogliaPct = computed(() => {
    const s = this.soglia();
    return s === null ? null : s / this.picco() * 100;
  });

  protected readonly conGiocatori = computed(() => this.metodo() === 'giocatori');

  protected readonly punti = computed(() => this.campioni().map(c => ({
    secondo: c.secondo,
    pct: c.valore / this.picco() * 100,
    giocatori: c.giocatori ?? null,
    palla: c.palla ?? false,
  })));

  protected readonly pallone = computed(() => this.punti().filter(p => p.palla));

  protected x(secondo: number): number {
    return M.left + secondo / this.fine() * (this.larghezza() - M.left - M.right);
  }

  protected y(pct: number): number {
    return M.top + (1 - pct / this.yMax()) * (ALTEZZA - M.top - M.bottom);
  }

  protected readonly baseline = ALTEZZA - M.bottom;

  protected readonly linea = computed(() =>
    this.punti().map((p, i) => `${i ? 'L' : 'M'}${this.x(p.secondo).toFixed(1)},${this.y(p.pct).toFixed(1)}`).join(''));

  protected readonly area = computed(() => {
    const p = this.punti();
    if (!p.length) return '';
    return `${this.linea()}L${this.x(p.at(-1)!.secondo).toFixed(1)},${this.baseline}`
      + `L${this.x(p[0].secondo).toFixed(1)},${this.baseline}Z`;
  });

  protected readonly bande = computed<Banda[]>(() => this.eventi().map((e, i) => ({
    id: e.id,
    n: i + 1,
    x: this.x(e.inizioSecondi),
    w: Math.max(2, this.x(e.fineSecondi) - this.x(e.inizioSecondi)),
  })));

  protected readonly tickY = [0, 50, 100];

  protected readonly tickX = computed(() => {
    const fine = this.fine();
    const passi = [1, 2, 5, 10, 15, 30, 60];
    const disponibili = Math.max(2, Math.floor((this.larghezza() - M.left - M.right) / 70));
    const passo = passi.find(p => fine / p <= disponibili) ?? 60;
    const ticks: number[] = [];
    for (let t = 0; t <= fine + 1e-6; t += passo) ticks.push(t);
    return ticks;
  });

  protected readonly puntoHover = computed(() => {
    const i = this.hover();
    return i === null ? null : this.punti()[i] ?? null;
  });

  protected readonly tooltip = computed(() => {
    const p = this.puntoHover();
    if (!p) return null;
    const clip = this.eventi().findIndex(e => p.secondo >= e.inizioSecondi && p.secondo <= e.fineSecondi);
    const soglia = this.sogliaPct();
    const left = this.x(p.secondo);
    return {
      tempo: this.timestamp(p.secondo),
      valore: Math.round(p.pct),
      sopra: soglia !== null && p.pct >= soglia,
      clip: clip >= 0 ? clip + 1 : null,
      giocatori: p.giocatori,
      palla: p.palla,
      left,
      allineaDestra: left > this.larghezza() * 0.65,
    };
  });

  protected readonly descrizione = computed(() => {
    const n = this.eventi().length;
    const cosa = this.conGiocatori() ? 'Attività dei giocatori' : 'Movimento';
    return `${cosa} nel tempo su ${this.timestamp(this.fine())}: ${n} ${n === 1 ? 'tratto supera' : 'tratti superano'} la soglia e ${n === 1 ? 'è diventato una clip' : 'sono diventati clip'}.`;
  });

  protected onMove(event: PointerEvent): void {
    const svg = event.currentTarget as SVGSVGElement;
    const box = svg.getBoundingClientRect();
    const px = (event.clientX - box.left) / box.width * this.larghezza();
    const punti = this.punti();
    if (!punti.length) return;
    let migliore = 0;
    let distanza = Infinity;
    punti.forEach((p, i) => {
      const d = Math.abs(this.x(p.secondo) - px);
      if (d < distanza) { distanza = d; migliore = i; }
    });
    this.hover.set(migliore);
    const t = punti[migliore].secondo;
    this.bandaAttiva.set(this.eventi().find(e => t >= e.inizioSecondi && t <= e.fineSecondi)?.id ?? null);
  }

  protected onLeave(): void {
    this.hover.set(null);
    this.bandaAttiva.set(null);
  }

  protected onClick(): void {
    const id = this.bandaAttiva();
    if (id) this.seleziona.emit(id);
  }

  protected timestamp(seconds: number): string {
    const total = Math.round(seconds);
    return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
  }
}
