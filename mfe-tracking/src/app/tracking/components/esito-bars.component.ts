import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { AggregatoEsitoDto, ESITI, ESITO_LABEL, pct } from '../data/tracking.models';

/** Confronto per esito: valore della miglior opzione e quota di possessi che arrivano al tiro. */
@Component({
  selector: 'tk-esito-bars',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './esito-bars.component.html',
  styleUrl: './esito-bars.component.scss',
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
