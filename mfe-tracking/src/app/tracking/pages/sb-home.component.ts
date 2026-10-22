import { ChangeDetectionStrategy, Component, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SbApiService, Competizione, PartitaSb } from '../data/sb-api.service';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'sb-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DatePipe],
  host: {
    style: 'display: block; padding: 2rem 2.5rem; min-height: 100vh; background: #0a0a0a;'
  },
  templateUrl: './sb-home.component.html',
  styleUrl: './sb-home.component.scss',
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