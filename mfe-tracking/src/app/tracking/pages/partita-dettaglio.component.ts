import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, combineLatest, filter, map, of, switchMap, tap } from 'rxjs';
import { EsitoBarsComponent } from '../components/esito-bars.component';
import { SequencePlayerComponent } from '../components/sequence-player.component';
import { TrackingApi } from '../data/tracking.api';
import {
  AnimazioneDto, ESITI, ESITO_LABEL, EsitoPressione, PartitaDettaglioDto, SequenzaDto, pct,
} from '../data/tracking.models';
import { TRACKING_TOKENS } from '../tracking.tokens';

@Component({
  selector: 'tk-partita-dettaglio',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DatePipe, EsitoBarsComponent, SequencePlayerComponent],
  template: `
    <div class="page">
      <a routerLink="../.." class="back">← Partite caricate</a>

      @if (dettaglio(); as d) {
        <header>
          <div>
            <span class="tk-label">{{ d.partita.competizione ?? 'SkillCorner' }} · {{ d.partita.dataPartita | date: 'dd/MM/yyyy' }}</span>
            <h1>{{ d.partita.squadraCasa }} <span class="tk-num score">{{ d.partita.golCasa }}–{{ d.partita.golTrasferta }}</span> {{ d.partita.squadraTrasferta }}</h1>
            <p class="muted">{{ d.partita.possessiPressati }} possessi pressati, {{ d.partita.pressioniSuperate }} pressioni superate.</p>
          </div>
          <div class="actions">
            @if (confermaElimina()) {
              <button type="button" class="tk-btn danger" (click)="elimina(d.partita.matchId)">Conferma eliminazione</button>
              <button type="button" class="tk-btn" (click)="confermaElimina.set(false)">Annulla</button>
            } @else {
              <button type="button" class="tk-btn" (click)="confermaElimina.set(true)">Elimina partita</button>
            }
          </div>
        </header>

        <tk-esito-bars [aggregati]="d.aggregati" />

        <section class="seq" aria-labelledby="seq-title">
          <div class="filters">
            <h2 id="seq-title">Sequenze</h2>
            <div class="chips" role="group" aria-label="Esito della pressione">
              <button type="button" class="chip" [class.on]="!esito()" (click)="esito.set(null)">Tutte</button>
              @for (e of esiti; track e) {
                <button type="button" class="chip {{ e }}" [class.on]="esito() === e" (click)="esito.set(e)">
                  <i></i>{{ esitoLabel[e] }}
                </button>
              }
            </div>
            <select id="tk-squadra" aria-label="Squadra in possesso" (change)="onSquadra($event)">
              <option value="">Entrambe le squadre</option>
              @for (s of d.squadre; track s.teamId) {
                <option [value]="s.teamId" [selected]="teamId() === s.teamId">{{ s.nome }}</option>
              }
            </select>
            <label class="check">
              <input type="checkbox" id="tk-solo-animate" [checked]="soloAnimate()" (change)="soloAnimate.set($any($event.target).checked)">
              Solo con animazione
            </label>
          </div>

          @if (animazione(); as a) {
            <tk-sequence-player [dati]="a" [giocatori]="d.giocatori" />
          } @else if (erroreAnimazione()) {
            <p class="tk-error">{{ erroreAnimazione() }}</p>
          }

          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Min</th><th>Esito</th><th>Squadra</th><th>Portatore</th>
                  <th class="r">Opzioni</th><th class="r">Media</th><th class="r">Migliore</th><th>Tiro</th><th><span class="sr">Animazione</span></th>
                </tr>
              </thead>
              <tbody>
                @for (s of sequenze(); track s.id) {
                  <tr [class.sel]="s.id === selezionata()" [class.cliccabile]="s.haFrame"
                      (click)="s.haFrame && selezionata.set(s.id)">
                    <td class="tk-num">{{ s.minuto }}'{{ pad(s.secondo) }}</td>
                    <td><span class="tk-pill {{ s.esito }}">{{ esitoLabel[s.esito] }}</span></td>
                    <td>{{ s.squadra }}</td>
                    <td>{{ s.portatore }}</td>
                    <td class="r tk-num">{{ s.nOpzioni }}</td>
                    <td class="r tk-num">{{ pct(s.valoreMedio) }}</td>
                    <td class="r tk-num best">{{ pct(s.valoreMigliore) }}</td>
                    <td>{{ s.portaAlTiro ? 'Sì' : '' }}</td>
                    <td>
                      @if (s.haFrame) {
                        <button type="button" class="play" (click)="selezionata.set(s.id); $event.stopPropagation()"
                                [attr.aria-label]="'Guarda la sequenza del minuto ' + s.minuto">▶</button>
                      }
                    </td>
                  </tr>
                } @empty {
                  <tr><td colspan="9" class="muted">Nessuna sequenza con questi filtri.</td></tr>
                }
              </tbody>
            </table>
          </div>
          <p class="muted note">Le animazioni vengono salvate per tutte le pressioni superate e per le 15 sequenze di maggior valore degli altri esiti.</p>
        </section>
      } @else if (erroreDettaglio()) {
        <p class="tk-error">{{ erroreDettaglio() }}</p>
      }
    </div>
  `,
  styles: [TRACKING_TOKENS, `
    .page { display: grid; gap: 24px; max-width: 1200px; }
    .back { color: var(--tk-muted); text-decoration: none; font-size: 13px; width: fit-content; }
    .back:hover { color: var(--tk-fg); }
    header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap; }
    h1 { margin: 4px 0; font-size: clamp(24px, 4vw, 34px); line-height: 1.15; text-wrap: balance; }
    h2 { margin: 0; font-size: 18px; }
    .muted { color: var(--tk-muted); margin: 0; }
    .score { white-space: nowrap; }
    .actions { display: flex; gap: 8px; }
    .seq { display: grid; gap: 16px; }
    .filters { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }
    .filters h2 { margin-right: auto; }
    .chips { display: flex; flex-wrap: wrap; gap: 6px; }
    .chip { display: inline-flex; align-items: center; gap: 6px; font: 500 13px inherit; font-family: inherit;
      color: var(--tk-fg); background: transparent; border: 1px solid var(--tk-line); border-radius: 999px; padding: 6px 12px; cursor: pointer; }
    .chip.on { border-color: var(--tk-fg); background: var(--tk-surface); }
    .chip i { width: 8px; height: 8px; border-radius: 50%; }
    .chip.SUPERATA i { background: var(--tk-superata); }
    .chip.NEUTRALIZZATA i { background: var(--tk-neutralizzata); }
    .chip.CONTENUTA i { background: var(--tk-contenuta); }
    select { font: 13px inherit; font-family: inherit; color: var(--tk-fg); background: var(--tk-surface);
      border: 1px solid var(--tk-line); border-radius: 6px; padding: 7px 10px; }
    .check { display: flex; gap: 6px; align-items: center; font-size: 13px; }
    .table-wrap { overflow-x: auto; border: 1px solid var(--tk-line); border-radius: 8px; max-height: 520px; overflow-y: auto; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td { text-align: left; padding: 8px 12px; border-bottom: 1px solid var(--tk-line); white-space: nowrap; }
    th { position: sticky; top: 0; background: var(--tk-bg); font: 600 11px var(--tk-mono); letter-spacing: .06em;
      text-transform: uppercase; color: var(--tk-muted); }
    tr.cliccabile { cursor: pointer; }
    tr.cliccabile:hover { background: var(--tk-surface); }
    tr.sel td { background: color-mix(in srgb, var(--tk-att) 14%, transparent); }
    .r { text-align: right; }
    .best { color: var(--tk-superata); }
    .play { background: none; border: 1px solid var(--tk-line); color: var(--tk-att); border-radius: 4px;
      width: 28px; height: 24px; cursor: pointer; font-size: 11px; }
    .sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
    .note { font-size: 12px; }
  `],
})
export class PartitaDettaglioComponent {
  private readonly api = inject(TrackingApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly esiti = ESITI;
  protected readonly esitoLabel = ESITO_LABEL;
  protected readonly pct = pct;

  protected readonly esito = signal<EsitoPressione | null>(null);
  protected readonly teamId = signal<number | null>(null);
  protected readonly soloAnimate = signal(false);
  protected readonly selezionata = signal<number | null>(null);
  protected readonly confermaElimina = signal(false);
  protected readonly erroreDettaglio = signal<string | null>(null);
  protected readonly erroreAnimazione = signal<string | null>(null);

  private readonly matchId = toSignal(
    this.route.paramMap.pipe(map(p => Number(p.get('matchId')))), { initialValue: NaN });

  protected readonly dettaglio = toSignal(
    toObservable(this.matchId).pipe(
      filter(id => !Number.isNaN(id)),
      switchMap(id => this.api.dettaglio(id).pipe(catchError(() => {
        this.erroreDettaglio.set('Partita non trovata o server non raggiungibile.');
        return of(null);
      }))),
    ), { initialValue: null as PartitaDettaglioDto | null });

  private readonly filtri = computed(() => ({
    matchId: this.matchId(), esito: this.esito(), teamId: this.teamId(), soloAnimate: this.soloAnimate(),
  }));

  protected readonly sequenze = toSignal(
    toObservable(this.filtri).pipe(
      filter(f => !Number.isNaN(f.matchId)),
      switchMap(f => this.api.sequenze(f.matchId, f).pipe(catchError(() => of([] as SequenzaDto[])))),
      tap(list => {
        // alla prima apertura: pressione superata che porta al tiro, con l'opzione di maggior valore
        if (this.selezionata() == null) {
          const animate = list.filter(s => s.haFrame);
          const sup = animate.filter(s => s.esito === 'SUPERATA');
          const supTiro = sup.filter(s => s.portaAlTiro);
          const pool = supTiro.length ? supTiro : sup.length ? sup : animate;
          const migliore = pool.reduce<SequenzaDto | null>((m, s) => (!m || s.valoreMigliore > m.valoreMigliore ? s : m), null);
          if (migliore) this.selezionata.set(migliore.id);
        }
      }),
    ), { initialValue: [] as SequenzaDto[] });

  protected readonly animazione = toSignal(
    toObservable(this.selezionata).pipe(
      switchMap(id => {
        this.erroreAnimazione.set(null);
        if (id == null) return of(null);
        return this.api.animazione(id).pipe(catchError(() => {
          this.erroreAnimazione.set('Animazione non disponibile per questa sequenza.');
          return of(null);
        }));
      }),
    ), { initialValue: null as AnimazioneDto | null });

  protected onSquadra(ev: Event): void {
    const v = (ev.target as HTMLSelectElement).value;
    this.teamId.set(v ? Number(v) : null);
  }

  protected pad(n: number): string {
    return String(n).padStart(2, '0');
  }

  protected elimina(matchId: number): void {
    this.api.eliminaPartita(matchId).subscribe({
      next: () => this.router.navigate(['../..'], { relativeTo: this.route }),
      error: () => this.erroreDettaglio.set('Eliminazione non riuscita.'),
    });
  }
}
