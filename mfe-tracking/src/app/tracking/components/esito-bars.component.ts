import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { AggregatoEsitoDto, ESITI, ESITO_LABEL, pct } from '../data/tracking.models';
import { TRACKING_TOKENS } from '../tracking.tokens';

/** Confronto per esito: valore della miglior opzione e quota di possessi che arrivano al tiro. */
@Component({
  selector: 'tk-esito-bars',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (righe().length) {
      <div class="grid">
        <div class="tk-card">
          <h3>Valore medio della miglior opzione</h3>
          @for (r of righe(); track r.esito) {
            <div class="bar">
              <span>{{ label[r.esito] }} <span class="n">({{ r.possessi.toLocaleString('it-IT') }})</span></span>
              <span class="track"><span class="fill {{ r.esito }}" [style.width.%]="r.migliorePct"></span></span>
              <span class="tk-num">{{ pct(r.valoreMigliore) }}</span>
            </div>
          }
        </div>
        <div class="tk-card">
          <h3>Possessi che arrivano al tiro</h3>
          @for (r of righe(); track r.esito) {
            <div class="bar">
              <span>{{ label[r.esito] }} <span class="n">({{ r.possessi.toLocaleString('it-IT') }})</span></span>
              <span class="track"><span class="fill {{ r.esito }}" [style.width.%]="r.tiroPct"></span></span>
              <span class="tk-num">{{ pct(r.quotaTiro, 0) }}</span>
            </div>
          }
        </div>
      </div>
      @if (sintesi(); as s) { <p class="sintesi">{{ s }}</p> }
    } @else {
      <p class="sintesi">Nessun possesso pressato ancora. Carica una partita per vedere il confronto.</p>
    }
  `,
  styles: [TRACKING_TOKENS, `
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr)); gap: 16px; }
    h3 { margin: 0 0 12px; font-size: 14px; font-weight: 600; }
    .bar { display: grid; grid-template-columns: 130px minmax(0, 1fr) 56px; gap: 10px; align-items: center; font-size: 13px; padding-block: 5px; }
    .n { color: var(--tk-muted); }
    .track { height: 12px; background: var(--tk-line); border-radius: 3px; overflow: hidden; }
    .fill { display: block; height: 100%; border-radius: 3px; }
    .fill.SUPERATA { background: var(--tk-superata); }
    .fill.NEUTRALIZZATA { background: var(--tk-neutralizzata); }
    .fill.CONTENUTA { background: var(--tk-contenuta); }
    .tk-num { text-align: right; }
    .sintesi { margin: 12px 0 0; font-size: 13px; color: var(--tk-muted); max-width: 80ch; }
  `],
})
export class EsitoBarsComponent {
  readonly aggregati = input.required<AggregatoEsitoDto[]>();

  protected readonly label = ESITO_LABEL;
  protected readonly pct = pct;

  protected readonly righe = computed(() => {
    const a = this.aggregati();
    const maxMigliore = Math.max(...a.map(x => x.valoreMigliore), 0.0001);
    const maxTiro = Math.max(...a.map(x => x.quotaTiro), 0.0001);
    return ESITI
      .map(e => a.find(x => x.esito === e))
      .filter((x): x is AggregatoEsitoDto => !!x)
      .map(x => ({ ...x, migliorePct: (x.valoreMigliore / maxMigliore) * 100, tiroPct: (x.quotaTiro / maxTiro) * 100 }));
  });

  protected readonly sintesi = computed(() => {
    const a = this.aggregati();
    const sup = a.find(x => x.esito === 'SUPERATA');
    const cont = a.find(x => x.esito === 'CONTENUTA');
    if (!sup || !cont || !cont.valoreMigliore) return null;
    const volte = (sup.valoreMigliore / cont.valoreMigliore).toLocaleString('it-IT', { maximumFractionDigits: 1 });
    return `Quando la pressione viene superata la miglior opzione vale ${volte} volte di più che quando viene solo contenuta, `
      + `e il possesso arriva al tiro ${Math.round(sup.quotaTiro * 100)} volte su 100 contro ${Math.round(cont.quotaTiro * 100)}.`;
  });
}
