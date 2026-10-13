import { ChangeDetectionStrategy, Component, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SbApiService, Competizione, PartitaSb } from '../data/sb-api.service';
import { TRACKING_TOKENS } from '../../tracking/tracking.tokens';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'sb-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DatePipe],
  host: {
    style: 'display: block; padding: 2rem 2.5rem; min-height: 100vh; background: #0a0a0a;'
  },
  template: `
    <header class="page-header">
      <div>
        <p class="page-label">ANALISI EVENTI · STATSBOMB OPEN DATA</p>
        <h1>Analisi partite</h1>
        <p class="page-sub">
          Dati aperti StatsBomb — shot map, xG, pass network e pressioni
          su oltre 4.000 partite di serie A, Champions League, Mondiali e altro.
        </p>
      </div>
      <a routerLink="/tracking" class="btn-back">
        <i class="pi pi-arrow-left"></i> Laboratorio pressione
      </a>
    </header>

    <!-- Selezione competizione -->
    <div class="filtri-card">
      <div class="field">
        <label class="field-label">Competizione</label>
        <select class="inp" (change)="onCompetizione($event)">
          <option value="">Seleziona competizione…</option>
          @for (c of competizioniUniche(); track c.competition_id + '_' + c.season_id) {
            <option [value]="c.competition_id + '_' + c.season_id">
              {{ c.competition_name }} · {{ c.season_name }} ({{ c.country_name }})
            </option>
          }
        </select>
      </div>
    </div>

    <!-- Lista partite -->
    @if (caricamentoPartite()) {
      <div class="stato-box">
        <span class="spinner"></span> Caricamento partite…
      </div>
    } @else if (partite().length) {
      <div class="partite-grid">
        @for (p of partite(); track p.match_id) {
          <a [routerLink]="[p.match_id]" class="partita-card">
            <div class="partita-score">
              <span class="team">{{ p.home_team.home_team_name }}</span>
              <span class="score">{{ p.home_score }} – {{ p.away_score }}</span>
              <span class="team">{{ p.away_team.away_team_name }}</span>
            </div>
            <div class="partita-meta">
              <span>{{ p.match_date | date: 'dd/MM/yyyy' }}</span>
            </div>
            <div class="card-arrow"><i class="pi pi-arrow-right"></i></div>
          </a>
        }
      </div>
    }
  `,
  styles: [TRACKING_TOKENS, `
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .page-label {
      font-size: .72rem;
      font-weight: 700;
      color: #00ff87;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-bottom: .4rem;
      display: block;
    }

    h1 {
      margin: 0 0 .4rem;
      font-size: clamp(1.6rem, 4vw, 2.2rem);
      font-weight: 800;
      letter-spacing: -1px;
      color: #fff;
    }

    .page-sub { margin: 0; font-size: .88rem; color: #555; max-width: 60ch; }

    .btn-back {
      display: flex; align-items: center; gap: .4rem;
      padding: .55rem 1rem;
      background: transparent; border: 1px solid #2a2a2a;
      border-radius: 8px; color: #888; font-size: .88rem;
      text-decoration: none; white-space: nowrap;
      transition: border-color .15s, color .15s;
    }
    .btn-back:hover { border-color: #555; color: #fff; }

    .filtri-card {
      background: #111; border: 1px solid #1e1e1e;
      border-radius: 12px; padding: 1.25rem;
      margin-bottom: 1.5rem;
    }

    .field { display: flex; flex-direction: column; gap: .4rem; }

    .field-label {
      font-size: .72rem; font-weight: 700;
      text-transform: uppercase; letter-spacing: .5px; color: #555;
    }

    .inp {
      height: 42px; padding: 0 .75rem;
      background: #0a0a0a; border: 1px solid #2a2a2a;
      border-radius: 8px; color: #fff; font-size: .9rem;
      outline: none; color-scheme: dark; max-width: 500px;
      transition: border-color .15s;
    }
    .inp:focus { border-color: #00ff87; }

    .stato-box {
      display: flex; align-items: center; gap: .75rem;
      padding: 2rem; justify-content: center;
      color: #555; font-size: .88rem;
    }

    .partite-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: .75rem;
    }

    .partita-card {
      background: #111; border: 1px solid #1e1e1e;
      border-radius: 12px; padding: 1.25rem;
      text-decoration: none; color: #fff;
      display: flex; flex-direction: column; gap: .5rem;
      position: relative; cursor: pointer;
      transition: border-color .15s, transform .15s;
    }
    .partita-card:hover { border-color: #2a2a2a; transform: translateY(-2px); }

    .partita-score {
      display: flex; align-items: center;
      justify-content: space-between; gap: .5rem;
    }

    .team { font-size: .88rem; font-weight: 600; color: #fff; flex: 1; }
    .team:last-child { text-align: right; }

    .score {
      font-size: 1.1rem; font-weight: 800;
      color: #00ff87; white-space: nowrap; padding: 0 .5rem;
    }

    .partita-meta { font-size: .75rem; color: #555; }

    .card-arrow {
      position: absolute; bottom: 1rem; right: 1rem;
      color: #2a2a2a; font-size: .85rem;
      transition: color .15s, transform .15s;
    }
    .partita-card:hover .card-arrow { color: #00ff87; transform: translateX(3px); }

    .spinner {
      width: 16px; height: 16px;
      border: 2px solid #2a2a2a; border-top-color: #00ff87;
      border-radius: 50%; animation: spin .8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `],
})
export class SbHomeComponent implements OnInit {
  private readonly api = inject(SbApiService);

  protected readonly competizioni = signal<Competizione[]>([]);
  protected readonly partite = signal<PartitaSb[]>([]);
  protected readonly caricamentoPartite = signal(false);

  protected readonly competizioniUniche = computed(() => {
    const viste = new Set<string>();
    return this.competizioni().filter(c => {
      const k = `${c.competition_id}_${c.season_id}`;
      if (viste.has(k)) return false;
      viste.add(k);
      return true;
    });
  });

  ngOnInit(): void {
    this.api.competizioni().subscribe({
      next: list => this.competizioni.set(list),
    });
  }

  protected onCompetizione(ev: Event): void {
    const val = (ev.target as HTMLSelectElement).value;
    if (!val) return;
    const [compId, seasonId] = val.split('_').map(Number);
    this.caricamentoPartite.set(true);
    this.api.partite(compId, seasonId).subscribe({
      next: list => {
        this.partite.set(list);
        this.caricamentoPartite.set(false);
      },
      error: () => this.caricamentoPartite.set(false),
    });
  }
}