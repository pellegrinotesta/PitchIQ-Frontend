import { HttpErrorResponse, HttpEventType } from '@angular/common/http';
import {
  ChangeDetectionStrategy, Component, DestroyRef, OnDestroy, effect, inject, input, output, signal, untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subscription, filter, forkJoin, switchMap, takeWhile, timer } from 'rxjs';
import { ClipLabelComponent } from '../clip-label/clip-label.component';
import { MotionChartComponent } from '../motion-chart/motion-chart.component';
import { TrackingApi } from '../../data/tracking.api';
import { AnalisiVideoDto, EventoVideoDto, ModelloEventiDto } from '../../data/tracking.models';

const DURATA_MIN = 2;
const DURATA_MAX = 120;
const DIMENSIONE_MAX = 250 * 1024 * 1024;

@Component({
  selector: 'tk-video-analysis',
  imports: [MotionChartComponent, ClipLabelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './video-analysis.component.html',
  styleUrl: './video-analysis.component.scss',
})
export class VideoAnalysisComponent implements OnDestroy {
  private readonly api = inject(TrackingApi);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly destroyRef = inject(DestroyRef);

  /** ID di un'analisi già eseguita da riaprire (dallo storico). */
  readonly analisiId = input<string | null>(null);
  readonly avviata = output<{ id: string; nomeFile: string }>();
  readonly aggiornata = output<AnalisiVideoDto>();
  readonly nonTrovata = output<string>();
  readonly chiusa = output<void>();
  readonly modelloAggiornato = output<ModelloEventiDto>();

  protected readonly file = signal<File | null>(null);
  protected readonly durataFile = signal<number | null>(null);
  protected readonly fase = signal<'idle' | 'checking' | 'upload' | 'download' | 'processing' | 'done' | 'error'>('idle');
  protected readonly modalita = signal<'file' | 'link'>('file');
  protected readonly link = signal('');
  protected readonly progresso = signal(0);
  protected readonly analisi = signal<AnalisiVideoDto | null>(null);
  protected readonly errore = signal<string | null>(null);
  protected readonly trascinamento = signal(false);
  protected readonly clipEvidenziata = signal<string | null>(null);

  private sub?: Subscription;
  private readonly clipUrls = new Map<string, string>();
  private readonly clipSources = new Map<string, SafeResourceUrl>();

  constructor() {
    effect(() => {
      const id = this.analisiId();
      untracked(() => {
        if (id && id !== this.analisi()?.id) this.riapri(id);
      });
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.revokeClips();
  }

  protected occupato(): boolean {
    const f = this.fase();
    return f === 'checking' || f === 'upload' || f === 'download' || f === 'processing';
  }

  protected onPick(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    input.value = '';
    if (file) void this.seleziona(file);
  }

  protected onDragOver(event: DragEvent): void {
    if (this.occupato()) return;
    event.preventDefault();
    this.trascinamento.set(true);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.trascinamento.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file && !this.occupato()) void this.seleziona(file);
  }

  protected avvia(): void {
    const file = this.file();
    if (!file || this.occupato()) return;

    this.sub?.unsubscribe();
    this.progresso.set(0);
    this.errore.set(null);
    this.fase.set('upload');
    this.sub = this.api.caricaVideo(file).pipe(
      filter(event => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          this.progresso.set(Math.round(event.loaded / event.total * 100));
        }
        return event.type === HttpEventType.Response;
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: event => {
        const analysis = event.body;
        if (!analysis) return;
        this.avviata.emit({ id: analysis.id, nomeFile: file.name });
        this.monitora(analysis);
      },
      error: (error: HttpErrorResponse) => this.fallisci(error),
    });
  }

  protected cambiaModalita(m: 'file' | 'link'): void {
    if (this.occupato()) return;
    this.modalita.set(m);
    this.errore.set(null);
    if (this.fase() === 'error') this.fase.set('idle');
  }

  protected linkValido(): boolean {
    try {
      const u = new URL(this.link().trim());
      return u.protocol === 'http:' || u.protocol === 'https:';
    } catch {
      return false;
    }
  }

  protected avviaDaLink(): void {
    const url = this.link().trim();
    if (!this.linkValido() || this.occupato()) return;

    this.sub?.unsubscribe();
    this.errore.set(null);
    this.fase.set('download');
    this.sub = this.api.caricaVideoDaUrl(url).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: analysis => {
        this.avviata.emit({ id: analysis.id, nomeFile: analysis.nomeFile ?? this.nomeDaLink(url) });
        this.link.set('');
        this.monitora(analysis);
      },
      error: (error: HttpErrorResponse) => this.fallisci(error),
    });
  }

  private nomeDaLink(url: string): string {
    try {
      const u = new URL(url);
      const ultimo = decodeURIComponent(u.pathname.split('/').filter(Boolean).pop() ?? '');
      return ultimo.replace(/^File:/, '') || u.hostname;
    } catch {
      return url;
    }
  }

  protected nuovaAnalisi(): void {
    this.sub?.unsubscribe();
    this.revokeClips();
    this.analisi.set(null);
    this.file.set(null);
    this.durataFile.set(null);
    this.errore.set(null);
    this.fase.set('idle');
    this.chiusa.emit();
  }

  /** Dopo un'etichetta il modello cambia: si ricaricano le proposte delle altre clip (i video restano). */
  protected onEtichettata(modello: ModelloEventiDto): void {
    this.modelloAggiornato.emit(modello);
    const corrente = this.analisi();
    if (!corrente) return;
    this.api.statoAnalisiVideo(corrente.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: stato => {
        if (this.analisi()?.id === stato.id) this.analisi.set(stato);
      },
      error: () => undefined, // le proposte restano quelle di prima: non è un errore da mostrare
    });
  }

  protected vaiAllaClip(id: string): void {
    this.clipEvidenziata.set(id);
    const card = document.getElementById(`clip-${id}`);
    const smooth = !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    card?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'center' });
    const video = card?.querySelector('video');
    video?.focus({ preventScroll: true });
    void video?.play().catch(() => undefined);
  }

  protected clipUrl(event: EventoVideoDto): SafeResourceUrl | null {
    return this.clipSources.get(event.id) ?? null;
  }

  protected timestamp(seconds: number): string {
    const total = Math.floor(seconds);
    return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
  }

  protected dimensione(bytes: number): string {
    return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(bytes / 1024)} KB`;
  }

  private async seleziona(file: File): Promise<void> {
    this.sub?.unsubscribe();
    this.revokeClips();
    this.file.set(null);
    this.durataFile.set(null);
    this.analisi.set(null);

    const extension = file.name.toLowerCase().split('.').pop();
    if (!['mp4', 'mov', 'webm'].includes(extension ?? '')) {
      return this.erroreLocale('Formati supportati: MP4, MOV e WebM.');
    }
    if (file.size > DIMENSIONE_MAX) {
      return this.erroreLocale('Il video supera il limite di 250 MB.');
    }

    this.errore.set(null);
    this.fase.set('checking');
    const durata = await this.leggiDurata(file);
    if (durata !== null && durata > DURATA_MAX) {
      return this.erroreLocale(`La clip dura ${this.timestamp(durata)}: il limite è 2:00. Tagliala prima di caricarla.`);
    }
    if (durata !== null && durata < DURATA_MIN) {
      return this.erroreLocale('La clip è troppo breve: servono almeno 2 secondi.');
    }

    this.file.set(file);
    this.durataFile.set(durata);
    this.fase.set('idle');
  }

  /** Legge la durata dai metadati; null se il browser non sa decodificare il formato (es. alcuni MOV). */
  private leggiDurata(file: File): Promise<number | null> {
    return new Promise(resolve => {
      const url = URL.createObjectURL(file);
      const video = document.createElement('video');
      const fine = (valore: number | null) => {
        URL.revokeObjectURL(url);
        video.removeAttribute('src');
        resolve(valore);
      };
      video.preload = 'metadata';
      video.onloadedmetadata = () => fine(Number.isFinite(video.duration) ? video.duration : null);
      video.onerror = () => fine(null);
      setTimeout(() => fine(null), 5000);
      video.src = url;
    });
  }

  private riapri(id: string): void {
    this.sub?.unsubscribe();
    this.revokeClips();
    this.file.set(null);
    this.durataFile.set(null);
    this.errore.set(null);
    this.monitora({ id, stato: 'IN_CODA', messaggio: null, durataSecondi: null, eventi: [] });
  }

  private monitora(initial: AnalisiVideoDto): void {
    this.analisi.set(initial);
    this.fase.set('processing');
    this.sub?.unsubscribe();
    this.sub = timer(0, 2000).pipe(
      switchMap(() => this.api.statoAnalisiVideo(initial.id)),
      takeWhile(state => state.stato !== 'COMPLETATO' && state.stato !== 'ERRORE', true),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: state => {
        this.analisi.set(state);
        this.aggiornata.emit(state);
        if (state.stato === 'COMPLETATO') {
          this.file.set(null);
          this.caricaClip(state);
        } else if (state.stato === 'ERRORE') {
          this.errore.set(state.messaggio ?? 'Analisi video non riuscita.');
          this.fase.set('error');
        }
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 404) this.nonTrovata.emit(initial.id);
        this.fallisci(error);
      },
    });
  }

  private caricaClip(state: AnalisiVideoDto): void {
    if (!state.eventi.length) {
      this.fase.set('done');
      return;
    }

    forkJoin(state.eventi.map(event => this.api.clipVideo(state.id, event.id))).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: blobs => {
        state.eventi.forEach((event, index) => {
          const url = URL.createObjectURL(blobs[index]);
          this.clipUrls.set(event.id, url);
          this.clipSources.set(event.id, this.sanitizer.bypassSecurityTrustResourceUrl(url));
        });
        this.fase.set('done');
      },
      error: (error: HttpErrorResponse) => this.fallisci(error),
    });
  }

  private erroreLocale(messaggio: string): void {
    this.errore.set(messaggio);
    this.fase.set('error');
  }

  private fallisci(error: HttpErrorResponse): void {
    this.errore.set(this.messaggioErrore(error));
    this.fase.set('error');
  }

  private revokeClips(): void {
    for (const url of this.clipUrls.values()) URL.revokeObjectURL(url);
    this.clipUrls.clear();
    this.clipSources.clear();
  }

  private messaggioErrore(error: HttpErrorResponse): string {
    if (error.status === 0) return 'Server non raggiungibile. Controlla che il BFF sia avviato.';
    const body = error.error as { message?: string; detail?: string } | null;
    if (error.status === 404 && this.fase() === 'download') {
      return body?.detail ?? 'Importazione da link non disponibile: riavvia il BFF.';
    }
    if (error.status === 404) return 'Analisi non più disponibile sul server.';
    if (error.status === 413) return body?.detail ?? 'Il video supera il limite di upload consentito.';
    return body?.detail ?? body?.message ?? `Analisi video non riuscita (errore ${error.status}).`;
  }
}
