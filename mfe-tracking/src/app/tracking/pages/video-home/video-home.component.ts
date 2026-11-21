import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { VideoAnalysisComponent } from '../../components/video-analysis/video-analysis.component';
import { AnalisiVideoDto } from '../../data/tracking.models';
import { VoceStoricoVideo, leggiStoricoVideo, salvaStoricoVideo } from '../../data/video-history';

@Component({
  selector: 'tk-video-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [VideoAnalysisComponent, DatePipe],
  templateUrl: './video-home.component.html',
  styleUrl: './video-home.component.scss',
})
export class VideoHomeComponent {
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
