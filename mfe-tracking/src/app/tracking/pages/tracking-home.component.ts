import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { EsitoBarsComponent } from '../components/esito-bars.component';
import { UploadPanelComponent } from '../components/upload-panel.component';
import { TrackingApi } from '../data/tracking.api';
import { AggregatoEsitoDto, ImportDto, PartitaDto } from '../data/tracking.models';
import { TRACKING_TOKENS } from '../tracking.tokens';

@Component({
  selector: 'tk-tracking-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UploadPanelComponent, EsitoBarsComponent, RouterLink, DatePipe],
  template: `
    <div class="page">

      <header class="page-header">
        <div>
          <p class="page-label">ANALISI AVANZATA · DATI DI TRACKING SKILLCORNER</p>
          <h1>Laboratorio pressione</h1>
          <p class="page-sub">
            Per ogni possesso pressato misuriamo quanto valgono le opzioni di passaggio,
            e se cambia quando la pressione viene superata.
          </p>
        </div>
      </header>

      <tk-upload-panel (concluso)="onImportConcluso($event)" />

      @if (errore()) {
        <div class="errore-box">
          <i class="pi pi-exclamation-triangle"></i> {{ errore() }}
        </div>
      }

      <!-- Partite caricate -->
      <section class="sezione" aria-labelledby="partite-title">
        <h2 id="partite-title" class="sezione-titolo">Partite caricate</h2>

        @if (partite().length) {
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Partita</th>
                  <th>Competizione</th>
                  <th class="r">Possessi pressati</th>
                  <th class="r">Superate</th>
                </tr>
              </thead>
              <tbody>
                @for (p of partite(); track p.matchId) {
                  <tr [class.nuova]="p.matchId === ultimaCaricata()">
                    <td class="mono muted">{{ p.dataPartita | date: 'dd/MM/yyyy' }}</td>
                    <td>
                      <a [routerLink]="['partita', p.matchId]">
                        {{ p.squadraCasa }} {{ p.golCasa }}–{{ p.golTrasferta }} {{ p.squadraTrasferta }}
                      </a>
                    </td>
                    <td class="muted">{{ p.competizione ?? '—' }}</td>
                    <td class="r mono">{{ p.possessiPressati }}</td>
                    <td class="r mono">{{ p.pressioniSuperate }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        } @else if (!caricamento()) {
          <p class="vuoto">
            Nessuna partita ancora. I dati aperti di SkillCorner sono su
            <a href="https://github.com/SkillCorner/opendata" target="_blank" rel="noopener">
              github.com/SkillCorner/opendata
            </a>
            (cartella data/matches).
          </p>
        }
      </section>

      <!-- Aggregati globali -->
      @if (partite().length) {
        <section class="sezione" aria-labelledby="agg-title">
          <h2 id="agg-title" class="sezione-titolo">Tutte le partite</h2>
          <tk-esito-bars [aggregati]="aggregati()" />
        </section>
      }

      <!-- Storico import -->
      @if (importRecenti().length) {
        <section class="sezione" aria-labelledby="storico-title">
          <h2 id="storico-title" class="sezione-titolo">Ultimi caricamenti</h2>
          <div class="storico-list">
            @for (i of importRecenti(); track i.id) {
              <div class="storico-item">
                <span class="stato-badge stato-{{ i.stato }}">{{ statoLabel[i.stato] }}</span>
                <span class="mono muted">{{ i.creatoIl | date: 'dd/MM HH:mm' }}</span>
                <span class="storico-file">{{ i.nomeFileEventi }}{{ i.conTracking ? '' : ' · senza tracking' }}</span>
                @if (i.messaggio) {
                  <span class="storico-msg" [class.errore-testo]="i.stato === 'ERRORE'">{{ i.messaggio }}</span>
                }
              </div>
            }
          </div>
        </section>
      }

    </div>
  `,
  styles: [TRACKING_TOKENS, `
    .page {
      display: grid;
      gap: 2rem;
      max-width: 1200px;
      padding: 2rem 2.5rem;
      min-height: 100vh;
      background: #0a0a0a;
      color: #fff;
    }

    /* Header */
    .page-label {
      font-size: .72rem;
      font-weight: 700;
      color: #00ff87;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-bottom: .5rem;
      display: block;
    }

    h1 {
      margin: 0 0 .5rem;
      font-size: clamp(1.6rem, 4vw, 2.2rem);
      font-weight: 800;
      letter-spacing: -1px;
      line-height: 1.1;
      color: #fff;
    }

    .page-sub {
      margin: 0;
      font-size: .9rem;
      color: #555;
      max-width: 60ch;
    }

    /* Sezioni */
    .sezione { display: grid; gap: .75rem; }

    .sezione-titolo {
      margin: 0;
      font-size: 1rem;
      font-weight: 700;
      color: #fff;
      letter-spacing: -.3px;
    }

    /* Tabella */
    .table-wrap {
      overflow-x: auto;
      background: #111;
      border: 1px solid #1e1e1e;
      border-radius: 12px;
      overflow: hidden;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: .88rem;
    }

    th {
      text-align: left;
      padding: .6rem 1rem;
      font-size: .7rem;
      font-weight: 700;
      letter-spacing: .5px;
      text-transform: uppercase;
      color: #555;
      border-bottom: 1px solid #1e1e1e;
      white-space: nowrap;
    }

    td {
      text-align: left;
      padding: .85rem 1rem;
      border-bottom: 1px solid #141414;
      white-space: nowrap;
      color: #ddd;
    }

    tbody tr:last-child td { border-bottom: none; }

    tbody tr:hover td { background: #161616; }

    tr.nuova td { background: rgba(0,255,135,.05); }

    .r { text-align: right; }
    .mono { font-family: "JetBrains Mono", ui-monospace, monospace; font-variant-numeric: tabular-nums; }
    .muted { color: #555; }

    a {
      color: #fff;
      font-weight: 600;
      text-decoration: none;
      border-bottom: 1px solid rgba(0,255,135,.4);
      transition: color .15s, border-color .15s;
    }

    a:hover { color: #00ff87; border-bottom-color: #00ff87; }

    /* Errore */
    .errore-box {
      background: rgba(255,100,100,.08);
      border: 1px solid rgba(255,100,100,.2);
      color: #ff6464;
      padding: .75rem 1rem;
      border-radius: 8px;
      font-size: .88rem;
      display: flex;
      align-items: center;
      gap: .5rem;
    }

    /* Vuoto */
    .vuoto {
      font-size: .88rem;
      color: #444;
      margin: 0;
    }

    /* Storico */
    .storico-list {
      display: grid;
      gap: .5rem;
    }

    .storico-item {
      display: flex;
      flex-wrap: wrap;
      gap: .4rem .75rem;
      align-items: baseline;
      padding: .75rem 1rem;
      background: #111;
      border: 1px solid #1e1e1e;
      border-radius: 8px;
      font-size: .82rem;
    }

    .stato-badge {
      font-size: .68rem;
      font-weight: 700;
      font-family: "JetBrains Mono", ui-monospace, monospace;
      letter-spacing: .5px;
      text-transform: uppercase;
      padding: .2rem .5rem;
      border-radius: 999px;
    }

    .stato-COMPLETATO     { background: rgba(0,255,135,.1);  color: #00ff87; }
    .stato-ERRORE         { background: rgba(255,100,100,.1); color: #ff6464; }
    .stato-IN_CODA        { background: rgba(255,255,255,.05); color: #888; }
    .stato-IN_ELABORAZIONE{ background: rgba(255,180,0,.1);  color: #ffb400; }

    .storico-file { overflow-wrap: anywhere; color: #888; }

    .storico-msg {
      flex-basis: 100%;
      color: #555;
      font-size: .8rem;
    }

    .errore-testo { color: #ff6464; }

    @media (max-width: 640px) {
      .page { padding: 1.25rem; }
    }
  `],
})
export class TrackingHomeComponent {
  private readonly api = inject(TrackingApi);

  protected readonly partite = signal<PartitaDto[]>([]);
  protected readonly aggregati = signal<AggregatoEsitoDto[]>([]);
  protected readonly importRecenti = signal<ImportDto[]>([]);
  protected readonly ultimaCaricata = signal<number | null>(null);
  protected readonly caricamento = signal(true);
  protected readonly errore = signal<string | null>(null);

  protected readonly statoLabel: Record<ImportDto['stato'], string> = {
    IN_CODA: 'In coda', IN_ELABORAZIONE: 'In elaborazione', COMPLETATO: 'Completato', ERRORE: 'Errore',
  };

  constructor() { this.ricarica(); }

  protected onImportConcluso(imp: ImportDto): void {
    if (imp.stato === 'COMPLETATO') this.ultimaCaricata.set(imp.matchId);
    this.ricarica();
  }

  private ricarica(): void {
    forkJoin({ partite: this.api.partite(), aggregati: this.api.aggregati(), recenti: this.api.importRecenti() })
      .subscribe({
        next: r => {
          this.partite.set(r.partite);
          this.aggregati.set(r.aggregati);
          this.importRecenti.set(r.recenti);
          this.errore.set(null);
          this.caricamento.set(false);
        },
        error: () => {
          this.errore.set('Non riesco a leggere i dati di tracking dal server.');
          this.caricamento.set(false);
        },
      });
  }
}