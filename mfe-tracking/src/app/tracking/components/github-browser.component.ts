import { ChangeDetectionStrategy, Component, OnInit, inject, output, signal } from '@angular/core';
import { GithubSkillcornerService, PartitaGitHub } from '../data/github-skillcorner.service';
import { TRACKING_TOKENS } from '../tracking.tokens';
import { DatePipe } from '@angular/common';

export interface FilesCaricati {
    partita: File;
    eventi: File;
    tracking: File | null;
}

@Component({
    selector: 'tk-github-browser',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [DatePipe],
    template: `
    <div class="gh-browser">

      <div class="gh-header">
        <div>
          <p class="gh-label">SKILLCORNER OPEN DATA</p>
          <h3>Sfoglia partite disponibili</h3>
          <p class="gh-sub">Seleziona una partita per importarla direttamente senza scaricare nulla.</p>
        </div>
        <button class="btn-ghost" (click)="chiudi.emit()" title="Chiudi">
          <i class="pi pi-times"></i>
        </button>
      </div>

      @if (caricamento()) {
        <div class="stato-box">
          <span class="spinner"></span>
          <span>Lettura repository GitHub…</span>
        </div>
      } @else if (errore()) {
        <div class="errore-box">
          <i class="pi pi-exclamation-triangle"></i>
          {{ errore() }}
        </div>
      } @else {
        <div class="partite-list">
          @for (p of partite(); track p.id) {
            <div class="partita-row" [class.downloading]="scaricando() === p.id">

              <div class="partita-info">
                <span class="partita-match">
                  @if (p.squadraCasa) {
                    <strong>{{ p.squadraCasa }}</strong>
                    <span class="vs">vs</span>
                    <strong>{{ p.squadraTrasferta }}</strong>
                  } @else {
                    <span class="id-partita">#{{ p.id }}</span>
                  }
                </span>
                <div class="partita-meta">
                  @if (p.data) { <span>{{ p.data | date: 'dd/MM/yyyy' }}</span> }
                  @if (p.competizione) { <span>{{ p.competizione }}</span> }
                  @if (p.trackingJsonl) {
                    <span class="badge-tracking">+ tracking</span>
                  } @else {
                    <span class="badge-no-tracking">solo statistiche</span>
                  }
                </div>
              </div>

              <button
                class="btn-importa"
                [disabled]="!!scaricando()"
                (click)="importa(p)"
              >
                @if (scaricando() === p.id) {
                  <span class="spinner-sm"></span>
                  {{ progresso() }}%
                } @else {
                  <i class="pi pi-download"></i>
                  Importa
                }
              </button>

            </div>
          }
        </div>
      }

    </div>
  `,
    styles: [TRACKING_TOKENS, `
    .gh-browser {
      background: #111;
      border: 1px solid #1e1e1e;
      border-radius: 12px;
      padding: 1.25rem;
      display: grid;
      gap: 1rem;
    }

    .gh-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
    }

    .gh-label {
      font-size: .7rem;
      font-weight: 700;
      color: #00ff87;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin: 0 0 .3rem;
    }

    .gh-header h3 {
      margin: 0 0 .25rem;
      font-size: .95rem;
      font-weight: 700;
      color: #fff;
    }

    .gh-sub {
      margin: 0;
      font-size: .82rem;
      color: #555;
    }

    .btn-ghost {
      width: 32px;
      height: 32px;
      background: transparent;
      border: 1px solid #2a2a2a;
      border-radius: 6px;
      color: #555;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      font-size: .85rem;
      transition: border-color .15s, color .15s;
    }

    .btn-ghost:hover { border-color: #555; color: #fff; }

    /* Lista partite */
    .partite-list {
      display: grid;
      gap: .4rem;
      max-height: 360px;
      overflow-y: auto;
      padding-right: .25rem;
    }

    .partite-list::-webkit-scrollbar { width: 4px; }
    .partite-list::-webkit-scrollbar-track { background: #1a1a1a; border-radius: 2px; }
    .partite-list::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 2px; }

    .partita-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: .75rem 1rem;
      background: #0a0a0a;
      border: 1px solid #1a1a1a;
      border-radius: 8px;
      transition: border-color .15s;
    }

    .partita-row:hover { border-color: #2a2a2a; }
    .partita-row.downloading { border-color: rgba(0,255,135,.2); background: rgba(0,255,135,.02); }

    .partita-info {
      display: flex;
      flex-direction: column;
      gap: .25rem;
      min-width: 0;
    }

    .partita-match {
      font-size: .9rem;
      color: #fff;
      display: flex;
      align-items: center;
      gap: .4rem;
    }

    .vs { color: #444; font-size: .8rem; }

    .id-partita { color: #555; font-size: .85rem; }

    .partita-meta {
      display: flex;
      gap: .5rem;
      flex-wrap: wrap;
      align-items: center;
      font-size: .75rem;
      color: #555;
    }

    .badge-tracking {
      padding: .15rem .5rem;
      background: rgba(0,255,135,.08);
      color: #00ff87;
      border-radius: 999px;
      font-size: .68rem;
      font-weight: 700;
    }

    .badge-no-tracking {
      padding: .15rem .5rem;
      background: rgba(255,255,255,.04);
      color: #444;
      border-radius: 999px;
      font-size: .68rem;
    }

    .btn-importa {
      display: flex;
      align-items: center;
      gap: .4rem;
      padding: .45rem .9rem;
      background: rgba(0,255,135,.1);
      border: 1px solid rgba(0,255,135,.2);
      border-radius: 7px;
      color: #00ff87;
      font-size: .82rem;
      font-weight: 700;
      cursor: pointer;
      white-space: nowrap;
      flex-shrink: 0;
      transition: background .15s;
      font-family: inherit;
    }

    .btn-importa:hover:not(:disabled) { background: rgba(0,255,135,.18); }
    .btn-importa:disabled { opacity: .4; cursor: not-allowed; }

    /* Stato */
    .stato-box {
      display: flex;
      align-items: center;
      gap: .75rem;
      padding: 1.5rem;
      justify-content: center;
      color: #555;
      font-size: .88rem;
    }

    .errore-box {
      background: rgba(255,100,100,.08);
      border: 1px solid rgba(255,100,100,.2);
      color: #ff6464;
      padding: .75rem 1rem;
      border-radius: 8px;
      font-size: .85rem;
      display: flex;
      align-items: center;
      gap: .5rem;
    }

    /* Spinner */
    .spinner {
      width: 16px; height: 16px;
      border: 2px solid #2a2a2a;
      border-top-color: #00ff87;
      border-radius: 50%;
      animation: spin .8s linear infinite;
      flex-shrink: 0;
    }

    .spinner-sm {
      width: 12px; height: 12px;
      border: 2px solid rgba(0,255,135,.3);
      border-top-color: #00ff87;
      border-radius: 50%;
      animation: spin .8s linear infinite;
      flex-shrink: 0;
    }

    @keyframes spin { to { transform: rotate(360deg); } }
    @media (prefers-reduced-motion: reduce) { .spinner, .spinner-sm { animation: none; } }
  `],
})
export class GithubBrowserComponent implements OnInit {
    private readonly gh = inject(GithubSkillcornerService);

    /** Emesso quando i file sono pronti — passali all'UploadPanel */
    readonly filesCaricati = output<FilesCaricati>();
    readonly chiudi = output<void>();

    protected readonly partite = signal<PartitaGitHub[]>([]);
    protected readonly caricamento = signal(true);
    protected readonly errore = signal<string | null>(null);
    protected readonly scaricando = signal<string | null>(null);
    protected readonly progresso = signal(0);

    ngOnInit(): void {
        this.gh.listaPartite().subscribe({
            next: list => {
                this.partite.set(list);
                this.caricamento.set(false);
                // Carica i metadati in background per mostrare nomi squadre
                this.caricaMetadati(list);
            },
            error: () => {
                this.errore.set('Impossibile accedere al repository GitHub. Controlla la connessione o il rate limit API.');
                this.caricamento.set(false);
            },
        });
    }

    protected importa(p: PartitaGitHub): void {
        if (this.scaricando()) return;
        this.scaricando.set(p.id);
        this.progresso.set(0);

        // Simula progresso durante il download
        const tick = setInterval(() => {
            this.progresso.update(v => Math.min(v + 8, 90));
        }, 400);

        this.gh.scaricaTutto(p).subscribe({
            next: files => {
                clearInterval(tick);
                this.progresso.set(100);
                setTimeout(() => {
                    this.scaricando.set(null);
                    this.filesCaricati.emit(files);
                    this.chiudi.emit();
                }, 300);
            },
            error: () => {
                clearInterval(tick);
                this.scaricando.set(null);
                this.errore.set(`Download fallito per la partita #${p.id}. Riprova.`);
            },
        });
    }

    private caricaMetadati(list: PartitaGitHub[]): void {
        list.forEach(p => {
            if (!p.matchJson) return;
            this.gh.metadati(p.matchJson).subscribe({
                next: meta => {
                    this.partite.update(partite =>
                        partite.map(x => x.id === p.id ? { ...x, ...meta } : x)
                    );
                },
                error: () => { }, // silenzioso — mostra solo l'id
            });
        });
    }
}