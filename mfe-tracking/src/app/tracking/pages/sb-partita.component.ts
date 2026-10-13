import { ChangeDetectionStrategy, Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { SbApiService, TiroSb } from '../data/sb-api.service';
import { TRACKING_TOKENS } from '../../tracking/tracking.tokens';

@Component({
    selector: 'sb-partita',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [RouterLink],
    host: {
        style: 'display: block; padding: 2rem 2.5rem; min-height: 100vh; background: #0a0a0a;'
    },
    template: `
    <nav class="breadcrumb">
      <a routerLink=".."><i class="pi pi-arrow-left"></i> Partite</a>
    </nav>

    @if (caricamento()) {
      <div class="stato-box"><span class="spinner"></span> Caricamento…</div>
    } @else {

      <header class="page-header">
        <div>
          <p class="page-label">SHOT MAP · xG</p>
          <h1>Analisi tiri</h1>
        </div>
        <div class="xg-totali">
          @for (squadra of squadre(); track squadra.nome) {
            <div class="xg-box">
              <span class="xg-nome">{{ squadra.nome }}</span>
              <span class="xg-valore">{{ squadra.xgTotale.toFixed(2) }} xG</span>
              <span class="xg-gol">{{ squadra.gol }} gol · {{ squadra.tiri }} tiri</span>
            </div>
          }
        </div>
      </header>

      <!-- Filtri squadra -->
      <div class="filtri">
        <button class="chip" [class.on]="squadraFiltro() === null"
          (click)="squadraFiltro.set(null)">Entrambe</button>
        @for (s of squadre(); track s.nome) {
          <button class="chip" [class.on]="squadraFiltro() === s.nome"
            (click)="squadraFiltro.set(s.nome)">{{ s.nome }}</button>
        }
      </div>

      <!-- Shot map SVG -->
      <div class="campo-wrap">
        <svg class="campo" viewBox="0 0 120 80" xmlns="http://www.w3.org/2000/svg">
          <!-- Campo -->
          <rect width="120" height="80" fill="#0d1a0d" rx="2"/>
          <rect x="1" y="1" width="118" height="78" fill="none"
            stroke="rgba(255,255,255,.15)" stroke-width=".5"/>
          <!-- Linea centrocampo -->
          <line x1="60" y1="1" x2="60" y2="79"
            stroke="rgba(255,255,255,.15)" stroke-width=".5"/>
          <circle cx="60" cy="40" r="9.15" fill="none"
            stroke="rgba(255,255,255,.15)" stroke-width=".5"/>
          <!-- Area grande destra -->
          <rect x="102" y="18" width="18" height="44" fill="none"
            stroke="rgba(255,255,255,.15)" stroke-width=".5"/>
          <!-- Area piccola destra -->
          <rect x="114" y="30" width="6" height="20" fill="none"
            stroke="rgba(255,255,255,.15)" stroke-width=".5"/>
          <!-- Porta destra -->
          <rect x="120" y="36" width="2" height="8" fill="none"
            stroke="rgba(255,255,255,.3)" stroke-width=".8"/>
          <!-- Area grande sinistra -->
          <rect x="0" y="18" width="18" height="44" fill="none"
            stroke="rgba(255,255,255,.15)" stroke-width=".5"/>
          <!-- Area piccola sinistra -->
          <rect x="0" y="30" width="6" height="20" fill="none"
            stroke="rgba(255,255,255,.15)" stroke-width=".5"/>
          <!-- Porta sinistra -->
          <rect x="-2" y="36" width="2" height="8" fill="none"
            stroke="rgba(255,255,255,.3)" stroke-width=".8"/>

          <!-- Tiri -->
          @for (t of tiriFiltrati(); track t.id) {
            <g (mouseenter)="tooltipTiro.set(t)" (mouseleave)="tooltipTiro.set(null)">
              @if (t.gol) {
                <!-- Gol: stella -->
                <circle [attr.cx]="t.x" [attr.cy]="t.y"
                  [attr.r]="2 + t.xg * 8"
                  [attr.fill]="coloreSquadra(t.squadra)"
                  opacity=".9" stroke="#fff" stroke-width=".3"/>
                <text [attr.x]="t.x" [attr.y]="t.y + .5"
                  text-anchor="middle" dominant-baseline="middle"
                  font-size="2" fill="#000">⚽</text>
              } @else {
                <!-- Tiro non gol: cerchio -->
                <circle [attr.cx]="t.x" [attr.cy]="t.y"
                  [attr.r]="1.5 + t.xg * 6"
                  [attr.fill]="coloreSquadra(t.squadra)"
                  opacity=".4" stroke-width=".2"
                  [attr.stroke]="coloreSquadra(t.squadra)"/>
              }
            </g>
          }
        </svg>

        <!-- Tooltip -->
        @if (tooltipTiro(); as t) {
          <div class="tooltip">
            <strong>{{ t.giocatore }}</strong>
            <span>{{ t.minuto }}'{{ pad(t.secondo) }}</span>
            <span class="xg-chip">xG {{ t.xg.toFixed(3) }}</span>
            <span>{{ t.tecnica }} · {{ t.parteCorpo }}</span>
            <span [class.gol]="t.gol">{{ t.esito }}</span>
          </div>
        }
      </div>

      <!-- Legenda -->
      <div class="legenda">
        @for (s of squadre(); track s.nome) {
          <div class="legenda-item">
            <div class="legenda-dot" [style.background]="coloreSquadra(s.nome)"></div>
            {{ s.nome }}
          </div>
        }
        <div class="legenda-item">
          <div class="legenda-dot gol-dot"></div>
          Gol (cerchio pieno)
        </div>
        <span class="legenda-note">Dimensione proporzionale all'xG</span>
      </div>

      <!-- Tabella tiri -->
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Min</th><th>Giocatore</th><th>Squadra</th>
              <th class="r">xG</th><th>Tecnica</th><th>Esito</th>
            </tr>
          </thead>
          <tbody>
            @for (t of tiriFiltrati(); track t.id) {
              <tr [class.gol-row]="t.gol">
                <td class="mono">{{ t.minuto }}'{{ pad(t.secondo) }}</td>
                <td>{{ t.giocatore }}</td>
                <td class="muted">{{ t.squadra }}</td>
                <td class="r mono xg-cell">{{ t.xg.toFixed(3) }}</td>
                <td class="muted">{{ t.tecnica }}</td>
                <td>
                  <span class="esito-badge" [class.gol]="t.gol">{{ t.esito }}</span>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  `,
    styles: [TRACKING_TOKENS, `
    .breadcrumb a {
      color: #555; text-decoration: none; font-size: .88rem;
      display: inline-flex; align-items: center; gap: .4rem;
      margin-bottom: 1.5rem; display: block; transition: color .15s;
    }
    .breadcrumb a:hover { color: #00ff87; }

    .page-header {
      display: flex; justify-content: space-between;
      align-items: flex-start; gap: 1rem; margin-bottom: 1.5rem;
    }

    .page-label {
      font-size: .72rem; font-weight: 700; color: #00ff87;
      letter-spacing: 2px; text-transform: uppercase;
      margin-bottom: .4rem; display: block;
    }

    h1 { margin: 0; font-size: 2rem; font-weight: 800; letter-spacing: -1px; }

    .xg-totali { display: flex; gap: 1rem; }

    .xg-box {
      background: #111; border: 1px solid #1e1e1e;
      border-radius: 10px; padding: .75rem 1rem;
      display: flex; flex-direction: column; gap: .2rem;
      min-width: 160px;
    }

    .xg-nome { font-size: .72rem; font-weight: 700; color: #555; text-transform: uppercase; }
    .xg-valore { font-size: 1.3rem; font-weight: 800; color: #00ff87; }
    .xg-gol { font-size: .75rem; color: #555; }

    /* Filtri */
    .filtri { display: flex; gap: .5rem; margin-bottom: 1rem; flex-wrap: wrap; }

    .chip {
      padding: .4rem .9rem; background: transparent;
      border: 1px solid #2a2a2a; border-radius: 999px;
      color: #555; font-size: .82rem; cursor: pointer;
      transition: border-color .15s, color .15s; font-family: inherit;
    }
    .chip:hover { border-color: #555; color: #888; }
    .chip.on { border-color: #00ff87; color: #00ff87; background: rgba(0,255,135,.06); }

    /* Campo */
    .campo-wrap {
      position: relative;
      background: #111; border: 1px solid #1e1e1e;
      border-radius: 12px; padding: 1rem;
      margin-bottom: 1rem;
    }

    .campo { width: 100%; height: auto; display: block; cursor: crosshair; }

    /* Tooltip */
    .tooltip {
      position: absolute; top: 1rem; right: 1rem;
      background: #1a1a1a; border: 1px solid #2a2a2a;
      border-radius: 10px; padding: .75rem 1rem;
      display: flex; flex-direction: column; gap: .25rem;
      font-size: .82rem; color: #ccc; min-width: 180px;
      pointer-events: none;
    }

    .tooltip strong { color: #fff; font-size: .9rem; }

    .xg-chip {
      background: rgba(0,255,135,.1); color: #00ff87;
      padding: .15rem .5rem; border-radius: 999px;
      font-size: .75rem; font-weight: 700; width: fit-content;
    }

    .tooltip .gol { color: #00ff87; font-weight: 700; }

    /* Legenda */
    .legenda {
      display: flex; gap: 1.5rem; flex-wrap: wrap;
      align-items: center; font-size: .82rem; color: #555;
      margin-bottom: 1.5rem;
    }

    .legenda-item { display: flex; align-items: center; gap: .5rem; }

    .legenda-dot {
      width: 12px; height: 12px; border-radius: 50%;
    }

    .gol-dot { background: #fff; border: 2px solid #00ff87; }
    .legenda-note { font-size: .75rem; color: #444; }

    /* Tabella */
    .table-wrap {
      background: #111; border: 1px solid #1e1e1e;
      border-radius: 12px; overflow: hidden; overflow-x: auto;
    }

    table { width: 100%; border-collapse: collapse; font-size: .85rem; }

    th {
      text-align: left; padding: .6rem 1rem;
      font-size: .68rem; font-weight: 700;
      letter-spacing: .5px; text-transform: uppercase;
      color: #555; border-bottom: 1px solid #1e1e1e;
    }

    td {
      padding: .75rem 1rem; border-bottom: 1px solid #141414;
      color: #ddd; white-space: nowrap;
    }

    tbody tr:last-child td { border-bottom: none; }
    tbody tr:hover td { background: #161616; }
    tbody tr.gol-row td { background: rgba(0,255,135,.04); }

    .r { text-align: right; }
    .mono { font-family: "JetBrains Mono", monospace; }
    .muted { color: #555; }
    .xg-cell { color: #00ff87; font-weight: 700; }

    .esito-badge {
      padding: .2rem .5rem; border-radius: 999px;
      font-size: .72rem; font-weight: 700;
      background: rgba(255,255,255,.05); color: #555;
    }
    .esito-badge.gol {
      background: rgba(0,255,135,.1); color: #00ff87;
    }

    /* Stato */
    .stato-box {
      display: flex; align-items: center; gap: .75rem;
      padding: 4rem; justify-content: center;
      color: #555; font-size: .88rem;
    }

    .spinner {
      width: 16px; height: 16px;
      border: 2px solid #2a2a2a; border-top-color: #00ff87;
      border-radius: 50%; animation: spin .8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `],
})
export class SbPartitaComponent implements OnInit {
    private readonly api = inject(SbApiService);
    private readonly route = inject(ActivatedRoute);

    protected readonly tiri = signal<TiroSb[]>([]);
    protected readonly caricamento = signal(true);
    protected readonly squadraFiltro = signal<string | null>(null);
    protected readonly tooltipTiro = signal<TiroSb | null>(null);

    private readonly colori = new Map<string, string>();
    private readonly palette = ['#00ff87', '#60a5fa', '#f59e0b', '#ef4444'];
    private coloreIdx = 0;

    protected readonly squadre = computed(() => {
        const map = new Map<string, { nome: string; xgTotale: number; gol: number; tiri: number }>();
        for (const t of this.tiri()) {
            const s = map.get(t.squadra) ?? { nome: t.squadra, xgTotale: 0, gol: 0, tiri: 0 };
            s.xgTotale += t.xg;
            s.tiri++;
            if (t.gol) s.gol++;
            map.set(t.squadra, s);
        }
        return [...map.values()];
    });

    protected readonly tiriFiltrati = computed(() => {
        const f = this.squadraFiltro();
        return f ? this.tiri().filter(t => t.squadra === f) : this.tiri();
    });

    ngOnInit(): void {
        const matchId = Number(this.route.snapshot.paramMap.get('matchId'));
        this.api.tiri(matchId).subscribe({
            next: tiri => {
                this.tiri.set(tiri);
                this.caricamento.set(false);
            },
            error: () => this.caricamento.set(false),
        });
    }

    protected coloreSquadra(nome: string): string {
        if (!this.colori.has(nome)) {
            this.colori.set(nome, this.palette[this.coloreIdx++ % this.palette.length]);
        }
        return this.colori.get(nome)!;
    }

    protected pad(s: number): string {
        return String(s).padStart(2, '0');
    }
}