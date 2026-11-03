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
  protected readonly ricercaCompetizione = signal('');
  protected readonly menuCompetizioniAperto = signal(false);
  protected readonly competizioneSelezionata = signal('');
  protected readonly chiaveCompetizioneSelezionata = signal('');

  protected readonly competizioniUniche = computed(() => {
    const viste = new Set<string>();
    return this.competizioni().filter(c => {
      const k = `${c.competition_id}_${c.season_id}`;
      if (viste.has(k)) return false;
      viste.add(k);
      return true;
    });
  });

  protected readonly competizioniFiltrate = computed(() => {
    const query = this.ricercaCompetizione().trim().toLocaleLowerCase('it-IT');
    return this.competizioniUniche()
      .filter(c => !query || this.etichettaCompetizione(c).toLocaleLowerCase('it-IT').includes(query))
      .sort((a, b) => this.etichettaCompetizione(a).localeCompare(this.etichettaCompetizione(b), 'it'));
  });

  ngOnInit(): void {
    this.api.competizioni().subscribe({
      next: list => this.competizioni.set(list),
    });
  }

  protected etichettaCompetizione(c: Competizione): string {
    return `${c.competition_name} · ${c.season_name} (${c.country_name})`;
  }

  protected optionId(c: Competizione): string {
    return `sb-competizione-${c.competition_id}-${c.season_id}`;
  }

  protected onRicercaInput(event: Event): void {
    this.ricercaCompetizione.set((event.target as HTMLInputElement).value);
    this.menuCompetizioniAperto.set(true);
  }

  protected onRicercaFocus(): void {
    if (this.ricercaCompetizione() === this.competizioneSelezionata()) {
      this.ricercaCompetizione.set('');
    }
    this.menuCompetizioniAperto.set(true);
  }

  protected onRicercaFocusOut(event: FocusEvent): void {
    const contenitore = event.currentTarget as HTMLElement;
    if (!contenitore.contains(event.relatedTarget as Node | null)) {
      this.menuCompetizioniAperto.set(false);
    }
  }

  protected selezionaCompetizione(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    if (!val) return;
    const c = this.competizioniUniche().find(x => `${x.competition_id}_${x.season_id}` === val);
    if (!c) return;
    this.chiaveCompetizioneSelezionata.set(val);
    this.competizioneSelezionata.set(this.etichettaCompetizione(c));
    this.ricercaCompetizione.set(this.etichettaCompetizione(c));
    this.menuCompetizioniAperto.set(false);
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