import {
  ChangeDetectionStrategy, Component, DestroyRef, ElementRef, afterNextRender, computed, effect,
  inject, input, signal, untracked,
} from '@angular/core';
import {
  AnimazioneDto, ESITO_LABEL, FINE_POSSESSO_LABEL, GiocatoreInfo, TERZO_LABEL, pct,
} from '../data/tracking.models';

const L = 52.5;  // mezza lunghezza (105 m)
const W = 34;    // mezza larghezza (68 m)
const FULL_VIEWBOX = '-56 -38 112 76';
const LOOKAHEAD = 4;      // frame usati per la freccia di movimento (0,4 s)
const ARROW_SCALE = 2.2;

/**
 * Riproduce una sequenza a 10 fps su un campo SVG. L'attacco va sempre verso destra.
 * Le opzioni di passaggio attive mostrano un alone proporzionale al valore e la percentuale.
 */
@Component({
  selector: 'tk-sequence-player',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sequence-player.component.html',
  styleUrl: './sequence-player.component.scss',
  host: { '(document:keydown.space)': 'onSpace($event)' },
})
export class SequencePlayerComponent {
  readonly dati = input.required<AnimazioneDto>();
  readonly giocatori = input<Record<string, GiocatoreInfo>>({});

  protected readonly L = L;
  protected readonly W = W;
  protected readonly pct = pct;
  protected readonly esitoLabel = ESITO_LABEL;

  protected readonly indice = signal(0);
  protected readonly playing = signal(true);
  private readonly velocita = signal(1);
  private readonly larghezza = signal(1000);

  protected readonly seq = computed(() => this.dati().sequenza);
  protected readonly frames = computed(() => this.dati().frames);
  protected readonly velocitaLabel = computed(() => `${String(this.velocita()).replace('.', ',')}×`);
  protected readonly terzo = computed(() => TERZO_LABEL[this.seq().terzo ?? ''] ?? this.seq().terzo ?? '');
  protected readonly finePossesso = computed(() =>
    FINE_POSSESSO_LABEL[this.seq().esitoPossesso ?? ''] ?? this.seq().esitoPossesso ?? '—');
  protected readonly inPressione = computed(() =>
    this.indice() >= this.dati().pressInizio && this.indice() <= this.dati().pressFine);

  protected readonly bandaPress = computed(() => {
    const n = Math.max(1, this.frames().length - 1);
    const a = Math.max(0, this.dati().pressInizio) / n;
    const b = Math.min(n, this.dati().pressFine) / n;
    return { left: a * 100, width: Math.max(0.5, (b - a) * 100) };
  });

  protected readonly orologio = computed(() => {
    const s = this.seq();
    const t = s.secondo + this.indice() / 10;
    const m = s.minuto + Math.floor(t / 60);
    return `${String(m).padStart(2, '0')}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
  });

  /** Su schermi stretti inquadro solo la porzione di campo dove si svolge l'azione. */
  protected readonly viewBox = computed(() => {
    if (this.larghezza() >= 640) return FULL_VIEWBOX;
    let a = Infinity, b = -Infinity;
    for (const f of this.frames()) for (const p of f.p) { a = Math.min(a, p[2]); b = Math.max(b, p[2]); }
    a = Math.max(-56, a - 4);
    b = Math.min(56, b + 4);
    if (b - a < 60) { const c = (a + b) / 2; b = Math.min(56, Math.max(-56 + 60, c + 30)); a = b - 60; }
    return `${a} -38 ${b - a} 76`;
  });

  protected readonly vista = computed(() => {
    const frames = this.frames();
    const i = Math.min(this.indice(), frames.length - 1);
    const f = frames[i];
    const next = frames[Math.min(i + LOOKAHEAD, frames.length - 1)];
    const pressori = new Set(this.dati().pressori);
    const inPress = this.inPressione();
    const avanti = new Map(next.p.map(p => [p[0], p]));

    const glows: { id: number; x: number; y: number; r: number }[] = [];
    const arrows: { id: number; x1: number; y1: number; x2: number; y2: number; att: boolean }[] = [];
    const dots: { id: number; x: number; y: number; att: boolean; portatore: boolean; pressore: boolean; nome: string }[] = [];
    const labels: { id: number; x: number; y: number; w: number; testo: string }[] = [];
    let migliore: number | null = null;
    let miglioreNome = '';

    for (const [id, team, x, yRaw] of f.p) {
      const y = -yRaw;               // y SkillCorner verso l'alto, SVG verso il basso
      const att = team === 1;
      const val = f.o[String(id)];
      if (val != null) {
        glows.push({ id, x, y, r: 3 + Math.min(val, 0.2) * 55 });
        const testo = pct(val);
        labels.push({ id, x, y, w: testo.length * 1.25 + 1.2, testo });
        if (migliore == null || val > migliore) { migliore = val; miglioreNome = this.nome(id); }
      }
      const n = avanti.get(id);
      if (n) {
        const dx = (n[2] - x) * ARROW_SCALE, dy = (-n[3] - y) * ARROW_SCALE;
        if (Math.hypot(dx, dy) > 0.9) arrows.push({ id, x1: x, y1: y, x2: x + dx, y2: y + dy, att });
      }
      dots.push({ id, x, y, att, portatore: id === f.c, pressore: inPress && pressori.has(id), nome: this.nome(id) });
    }

    const valori = Object.values(f.o);
    return {
      glows, arrows, dots, labels,
      ball: f.b ? [f.b[0], -f.b[1]] as [number, number] : null,
      nOpzioni: valori.length,
      media: valori.length ? valori.reduce((a, b) => a + b, 0) / valori.length : null,
      migliore,
      miglioreNome,
    };
  });

  constructor() {
    const destroyRef = inject(DestroyRef);
    const host = inject(ElementRef<HTMLElement>);

    // nuova sequenza: si riparte dall'inizio
    effect(() => {
      this.dati();
      untracked(() => this.indice.set(0));
    });

    // 10 fps reali, scalati dalla velocità
    effect(onCleanup => {
      if (!this.playing()) return;
      const ms = 100 / this.velocita();
      const id = setInterval(() => {
        const n = this.frames().length;
        this.indice.update(i => (i + 1) % n);
      }, ms);
      onCleanup(() => clearInterval(id));
    });

    afterNextRender(() => {
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) this.playing.set(false);
      const ro = new ResizeObserver(e => this.larghezza.set(e[0].contentRect.width));
      ro.observe(host.nativeElement);
      destroyRef.onDestroy(() => ro.disconnect());
    });
  }

  protected nome(id: number, fallback = ''): string {
    return this.giocatori()[String(id)]?.nome ?? fallback;
  }

  protected arco(s: number): string {
    const x = s * L - s * 16.5;
    return `M${x} -7.3 A9.15 9.15 0 0 ${s < 0 ? 1 : 0} ${x} 7.3`;
  }

  protected togglePlay(): void {
    this.playing.update(p => !p);
  }

  protected cambiaVelocita(): void {
    this.velocita.update(v => (v === 1 ? 0.5 : v === 0.5 ? 2 : 1));
  }

  protected seek(ev: Event): void {
    this.playing.set(false);
    this.indice.set(Number((ev.target as HTMLInputElement).value));
  }

  protected onSpace(ev: Event): void {
    const t = ev.target as HTMLElement | null;
    if (t && ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(t.tagName)) return;
    ev.preventDefault();
    this.togglePlay();
  }
}
