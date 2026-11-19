import { HttpErrorResponse, HttpEventType } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, OnDestroy, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subscription, filter, forkJoin, switchMap, takeWhile, timer } from 'rxjs';
import { TrackingApi } from '../../data/tracking.api';
import { AnalisiVideoDto, EventoVideoDto } from '../../data/tracking.models';

@Component({
  selector: 'tk-video-analysis',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './video-analysis.component.html',
  styleUrl: './video-analysis.component.scss',
})
export class VideoAnalysisComponent implements OnDestroy {
  private readonly api = inject(TrackingApi);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly file = signal<File | null>(null);
  protected readonly fase = signal<'idle' | 'upload' | 'processing' | 'done' | 'error'>('idle');
  protected readonly progresso = signal(0);
  protected readonly analisi = signal<AnalisiVideoDto | null>(null);
  protected readonly errore = signal<string | null>(null);

  private sub?: Subscription;
  private readonly clipUrls = new Map<string, string>();
  private readonly clipSources = new Map<string, SafeResourceUrl>();

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.revokeClips();
  }

  protected onPick(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    input.value = '';
    if (!file) return;
    this.revokeClips();
    this.file.set(null);
    this.analisi.set(null);

    const extension = file.name.toLowerCase().split('.').pop();
    if (!['mp4', 'mov', 'webm'].includes(extension ?? '')) {
      this.errore.set('Formati supportati: MP4, MOV e WebM.');
      this.fase.set('error');
      return;
    }
    if (file.size > 250 * 1024 * 1024) {
      this.errore.set('Il video supera il limite di 250 MB.');
      this.fase.set('error');
      return;
    }

    this.file.set(file);
    this.errore.set(null);
    this.fase.set('idle');
  }

  protected avvia(): void {
    const file = this.file();
    if (!file || this.fase() === 'upload' || this.fase() === 'processing') return;

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
        if (analysis) this.monitora(analysis);
      },
      error: (error: HttpErrorResponse) => {
        this.errore.set(this.messaggioErrore(error));
        this.fase.set('error');
      },
    });
  }

  protected clipUrl(event: EventoVideoDto): SafeResourceUrl | null {
    return this.clipSources.get(event.id) ?? null;
  }

  protected timestamp(seconds: number): string {
    const total = Math.floor(seconds);
    return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
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
        if (state.stato === 'COMPLETATO') {
          this.file.set(null);
          this.caricaClip(state);
        } else if (state.stato === 'ERRORE') {
          this.errore.set(state.messaggio ?? 'Analisi video non riuscita.');
          this.fase.set('error');
        }
      },
      error: (error: HttpErrorResponse) => {
        this.errore.set(this.messaggioErrore(error));
        this.fase.set('error');
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
      error: (error: HttpErrorResponse) => {
        this.errore.set(this.messaggioErrore(error));
        this.fase.set('error');
      },
    });
  }

  private revokeClips(): void {
    for (const url of this.clipUrls.values()) URL.revokeObjectURL(url);
    this.clipUrls.clear();
    this.clipSources.clear();
  }

  private messaggioErrore(error: HttpErrorResponse): string {
    if (error.status === 0) return 'Server non raggiungibile. Controlla che il BFF sia avviato.';
    if (error.status === 413) return 'Il video supera il limite di upload consentito.';
    const body = error.error as { message?: string; detail?: string } | null;
    return body?.detail ?? body?.message ?? `Analisi video non riuscita (errore ${error.status}).`;
  }
}
