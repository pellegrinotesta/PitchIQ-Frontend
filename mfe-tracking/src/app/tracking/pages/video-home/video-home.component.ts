import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { VideoAnalysisComponent } from '../../components/video-analysis/video-analysis.component';
import { TrackingApi } from '../../data/tracking.api';
import { AnalisiVideoDto, ETICHETTE_EVENTO, ModelloEventiDto } from '../../data/tracking.models';
import { VoceStoricoVideo, leggiStoricoVideo, salvaStoricoVideo } from '../../data/video-history';

@Component({
  selector: 'tk-video-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [VideoAnalysisComponent, DatePipe],
  templateUrl: './video-home.component.html',
  styleUrl: './video-home.component.scss',
})
export class VideoHomeComponent {
  private readonly api = inject(TrackingApi);
  protected readonly modello = signal<ModelloEventiDto | null>(null);
  protected readonly erroreModello = signal(false);

  /** Esempi per tipo, con l'avanzamento verso il minimo che serve al modello per usarlo. */
  protected readonly classi = computed(() => {
    const m = this.modello();
    if (!m) return [];
    return ETICHETTE_EVENTO.map(e => {
      const n = m.perClasse[e.valore] ?? 0;
      return { ...e, n, pct: Math.min(100, n / m.minimoPerClasse * 100), pronta: n >= m.minimoPerClasse };
    });
  });

  constructor() {
    this.api.modelloEventi().pipe(takeUntilDestroyed(inject(DestroyRef))).subscribe({
      next: m => this.modello.set(m),
      error: () => this.erroreModello.set(true),
    });
  }

  protected onModelloAggiornato(m: ModelloEventiDto): void {
    this.modello.set(m);
    this.erroreModello.set(false);
  }

  protected readonly storico = signal<VoceStoricoVideo[]>(leggiStoricoVideo());
  protected readonly selezionata = signal<string | null>(null);

  protected readonly comandoTaglio = 'ffmpeg -ss 00:12:30 -i partita.mp4 -t 90 -c copy clip.mp4';

  protected readonly statoLabel: Record<string, string> = {
    IN_CODA: 'In coda', IN_ELABORAZIONE: 'In corso', COMPLETATO: 'Completata', ERRORE: 'Errore',
  };

  protected onAvviata(e: { id: string; nomeFile: string }): void {
    this.selezionata.set(e.id);
    this.aggiorna([{ id: e.id, nomeFile: e.nomeFile, creataIl: new Date().toISOString(), stato: 'IN_CODA' },
      ...this.storico().filter(v => v.id !== e.id)]);
  }

  protected onAggiornata(a: AnalisiVideoDto): void {
    this.aggiorna(this.storico().map(v => v.id === a.id
      ? { ...v, stato: a.stato, clip: a.stato === 'COMPLETATO' ? a.eventi.length : v.clip }
      : v));
  }

  protected onNonTrovata(id: string): void {
    this.aggiorna(this.storico().filter(v => v.id !== id));
  }

  protected apri(id: string): void {
    this.selezionata.set(id);
  }

  protected rimuovi(id: string): void {
    if (this.selezionata() === id) this.selezionata.set(null);
    this.aggiorna(this.storico().filter(v => v.id !== id));
  }

  private aggiorna(lista: VoceStoricoVideo[]): void {
    this.storico.set(lista);
    salvaStoricoVideo(lista);
  }
}
