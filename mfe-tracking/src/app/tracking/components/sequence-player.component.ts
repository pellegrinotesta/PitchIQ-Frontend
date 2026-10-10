import {
  ChangeDetectionStrategy, Component, DestroyRef, ElementRef, afterNextRender, computed, effect,
  inject, input, signal, untracked,
} from '@angular/core';
import {
  AnimazioneDto, ESITO_LABEL, FINE_POSSESSO_LABEL, GiocatoreInfo, TERZO_LABEL, pct,
} from '../data/tracking.models';
import { TRACKING_TOKENS } from '../tracking.tokens';

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
  template: `
    @let v = vista();
    <div class="lab">
      <div class="screen">
        <div class="top">
          <span><b>{{ seq().squadra }}</b> · {{ nome(seq().portatoreId, seq().portatore) }} · {{ terzo() }}</span>
          <span class="tk-num">{{ orologio() }}@if (inPressione()) { <b class="press"> · PRESSIONE</b> }</span>
        </div>

        <svg class="pitch" [attr.viewBox]="viewBox()" role="img"
             [attr.aria-label]="'Sequenza al minuto ' + seq().minuto + ', pressione ' + esitoLabel[seq().esito].toLowerCase()">
          <defs>
            <radialGradient id="tk-glow">
              <stop offset="0" stop-color="#e8892b" stop-opacity=".85"/>
              <stop offset=".55" stop-color="#e8892b" stop-opacity=".28"/>
              <stop offset="1" stop-color="#e8892b" stop-opacity="0"/>
            </radialGradient>
            <marker id="tk-ah-a" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="4" markerHeight="4" orient="auto">
              <path d="M0 0L6 3L0 6z" fill="#e8892b"/>
            </marker>
            <marker id="tk-ah-d" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="4" markerHeight="4" orient="auto">
              <path d="M0 0L6 3L0 6z" fill="#3d8fe0"/>
            </marker>
          </defs>

          <g fill="none" stroke="#2b3a32" stroke-width=".35">
            <rect [attr.x]="-L" [attr.y]="-W" width="105" height="68"/>
            <line x1="0" [attr.y1]="-W" x2="0" [attr.y2]="W"/>
            <circle cx="0" cy="0" r="9.15"/>
            @for (s of [-1, 1]; track s) {
              <rect [attr.x]="s < 0 ? -L : L - 16.5" y="-20.16" width="16.5" height="40.32"/>
              <rect [attr.x]="s < 0 ? -L : L - 5.5" y="-9.16" width="5.5" height="18.32"/>
              <rect [attr.x]="s < 0 ? -L - 2 : L" y="-3.66" width="2" height="7.32"/>
              <path [attr.d]="arco(s)"/>
            }
          </g>

          <g>
            @for (g of v.glows; track g.id) {
              <circle [attr.cx]="g.x" [attr.cy]="g.y" [attr.r]="g.r" fill="url(#tk-glow)"/>
            }
          </g>
          <g>
            @for (a of v.arrows; track a.id) {
              <line [attr.x1]="a.x1" [attr.y1]="a.y1" [attr.x2]="a.x2" [attr.y2]="a.y2"
                    [attr.stroke]="a.att ? '#e8892b' : '#3d8fe0'" stroke-width=".35" opacity=".85"
                    [attr.marker-end]="a.att ? 'url(#tk-ah-a)' : 'url(#tk-ah-d)'"/>
            }
          </g>
          <g>
            @for (d of v.dots; track d.id) {
              <circle [attr.cx]="d.x" [attr.cy]="d.y" r="1.05" [attr.fill]="d.att ? '#e8892b' : '#3d8fe0'"
                      stroke="#0e1411" stroke-width=".25"><title>{{ d.nome }}</title></circle>
              @if (d.portatore) {
                <circle [attr.cx]="d.x" [attr.cy]="d.y" r="2" fill="none" stroke="#e8892b" stroke-width=".3" stroke-dasharray=".8 .5"/>
              }
              @if (d.pressore) {
                <circle [attr.cx]="d.x" [attr.cy]="d.y" r="1.9" fill="none" stroke="#ffffff" stroke-width=".3"/>
              }
            }
            @if (v.ball; as b) {
              <circle [attr.cx]="b[0]" [attr.cy]="b[1]" r=".6" fill="#ffffff" stroke="#0e1411" stroke-width=".2"/>
            }
          </g>
          <g>
            @for (l of v.labels; track l.id) {
              <rect [attr.x]="l.x - l.w / 2" [attr.y]="l.y - 5.6" [attr.width]="l.w" height="2.9" rx=".4" fill="#e6ece8"/>
              <text [attr.x]="l.x" [attr.y]="l.y - 3.5" text-anchor="middle" font-size="2.1" font-weight="600"
                    font-family="JetBrains Mono, ui-monospace, monospace" fill="#0e1411">{{ l.testo }}</text>
            }
          </g>
        </svg>

        <div class="controls">
          <button type="button" class="ctl" (click)="togglePlay()" [attr.aria-label]="playing() ? 'Pausa' : 'Riproduci'">
            {{ playing() ? '❚❚' : '▶' }}
          </button>
          <div class="scrub">
            <input type="range" id="tk-scrub" min="0" [max]="frames().length - 1" [value]="indice()"
                   (input)="seek($event)" aria-label="Posizione nella sequenza">
            <span class="band" [style.left.%]="bandaPress().left" [style.width.%]="bandaPress().width"
                  title="Finestra della pressione"></span>
          </div>
          <button type="button" class="ctl" (click)="cambiaVelocita()" aria-label="Velocità">{{ velocitaLabel() }}</button>
        </div>
        <div class="legend">
          <span><i class="dot att"></i>Attacco (verso destra)</span>
          <span><i class="dot def"></i>Difesa</span>
          <span><i class="dot ring-att"></i>Portatore</span>
          <span><i class="dot ring"></i>Pressore</span>
          <span>% = minaccia attesa dell'opzione</span>
        </div>
      </div>

      <aside class="panel" aria-live="polite">
        <div class="tk-card stat">
          <span class="tk-label">Esito pressione</span>
          <span><span class="tk-pill {{ seq().esito }}">{{ esitoLabel[seq().esito].toUpperCase() }}</span></span>
          <span class="s">{{ dati().pressori.length }} {{ dati().pressori.length === 1 ? 'pressore' : 'pressori' }}
            · finisce con {{ finePossesso() }}{{ seq().portaAlTiro ? ' · porta al tiro' : '' }}</span>
        </div>
        <div class="tk-card stat">
          <span class="tk-label">Valore portatore</span>
          <span class="v tk-num">{{ pct(seq().valorePortatore) }}</span>
          <span class="s">EPV del possesso all'inizio</span>
        </div>
        <div class="tk-card stat">
          <span class="tk-label">Media opzioni</span>
          <span class="v tk-num">{{ pct(v.media ?? seq().valoreMedio) }}</span>
          <span class="s">{{ v.nOpzioni ? v.nOpzioni + (v.nOpzioni === 1 ? ' opzione attiva ora' : ' opzioni attive ora') : 'media del possesso' }}</span>
        </div>
        <div class="tk-card stat">
          <span class="tk-label">Miglior opzione</span>
          <span class="v tk-num best">{{ pct(v.migliore ?? seq().valoreMigliore) }}</span>
          <span class="s">{{ v.migliore != null ? (v.miglioreNome || 'in questo fotogramma') : 'massimo del possesso' }}</span>
        </div>
      </aside>
    </div>
  `,
  styles: [TRACKING_TOKENS, `
    .lab { display: grid; grid-template-columns: minmax(0, 1fr) 240px; gap: 16px; align-items: start; }
    @media (max-width: 900px) { .lab { grid-template-columns: minmax(0, 1fr); } }
    .screen { background: var(--tk-screen); border-radius: 10px; padding: 14px; display: grid; gap: 10px; min-width: 0; color: #e6ece8; }
    .top { display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; font: 12px/1.4 var(--tk-mono); color: #8fa197; }
    .top b { color: #e6ece8; font-weight: 600; }
    .top b.press { color: #e8892b; }
    .pitch { width: 100%; height: auto; display: block; }
    .controls { display: flex; gap: 10px; align-items: center; }
    .ctl { font: 600 13px var(--tk-mono); background: #1d2822; color: #e6ece8; border: 1px solid var(--tk-screen-line);
      border-radius: 5px; padding: 6px 10px; cursor: pointer; min-width: 44px; }
    .scrub { position: relative; flex: 1; min-width: 0; display: flex; align-items: center; }
    .scrub input { width: 100%; accent-color: #e8892b; position: relative; z-index: 1; }
    .band { position: absolute; top: 50%; height: 14px; transform: translateY(-50%); background: rgba(255,255,255,.08);
      border-left: 1px solid rgba(255,255,255,.35); border-right: 1px solid rgba(255,255,255,.35); pointer-events: none; }
    .legend { display: flex; gap: 14px; flex-wrap: wrap; font-size: 12px; color: #8fa197; }
    .legend span { display: flex; gap: 6px; align-items: center; }
    .dot { width: 9px; height: 9px; border-radius: 50%; display: inline-block; }
    .dot.att { background: #e8892b; } .dot.def { background: #3d8fe0; }
    .dot.ring-att { border: 1.5px dashed #e8892b; } .dot.ring { border: 1.5px solid #fff; }
    .panel { display: grid; gap: 10px; }
    .stat { display: grid; gap: 2px; padding: 12px 14px; }
    .stat .v { font-size: 30px; font-weight: 700; line-height: 1.1; }
    .stat .v.best { color: var(--tk-superata); }
    .stat .s { font-size: 12px; color: var(--tk-muted); }
  `],
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
