import { HttpErrorResponse, HttpEventType } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription, filter, switchMap, takeWhile, timer } from 'rxjs';
import { TrackingApi } from '../data/tracking.api';
import { ImportDto } from '../data/tracking.models';
import { GithubBrowserComponent } from './github-browser.component';

type Slot = 'partita' | 'eventi' | 'tracking';

interface SlotDef {
  key: Slot;
  titolo: string;
  formato: string;
  esempio: string;
  accept: string;
  obbligatorio: boolean;
}

const SLOTS: SlotDef[] = [
  { key: 'partita',  titolo: 'Partita',        formato: '.json',  esempio: '1874553_match.json',                  accept: '.json,application/json', obbligatorio: true },
  { key: 'eventi',   titolo: 'Dynamic events', formato: '.csv',   esempio: '1874553_dynamic_events.csv',          accept: '.csv,text/csv',          obbligatorio: true },
  { key: 'tracking', titolo: 'Tracking',       formato: '.jsonl', esempio: '1874553_tracking_extrapolated.jsonl', accept: '.jsonl',                 obbligatorio: false },
];

@Component({
  selector: 'tk-upload-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [GithubBrowserComponent],
  templateUrl: './upload-panel.component.html',
  styleUrl: './upload-panel.component.scss',
})
export class UploadPanelComponent {
  private readonly api = inject(TrackingApi);
  private readonly destroyRef = inject(DestroyRef);

  readonly concluso = output<ImportDto>();

  protected readonly slots      = SLOTS;
  protected readonly files      = signal<Record<Slot, File | null>>({ partita: null, eventi: null, tracking: null });
  protected readonly dragOver   = signal<Slot | null>(null);
  protected readonly fase       = signal<'idle' | 'upload' | 'elaborazione' | 'completato' | 'errore'>('idle');
  protected readonly progresso  = signal(0);
  protected readonly corrente   = signal<ImportDto | null>(null);
  protected readonly errore     = signal<string | null>(null);
  protected readonly mostraGithub = signal(false);

  protected readonly erroreAbbinamento = computed(() => {
    const ids = Object.values(this.files())
      .filter((file): file is File => file !== null)
      .map(file => file.name.match(/^(\d+)_/)?.[1])
      .filter((id): id is string => !!id);
    return new Set(ids).size > 1
      ? 'I file selezionati sembrano appartenere a partite diverse: controlla gli ID nei nomi.'
      : null;
  });
  protected readonly pronto = computed(() => !!this.files().partita && !!this.files().eventi && !this.erroreAbbinamento());
  protected readonly busy   = computed(() => this.fase() === 'upload' || this.fase() === 'elaborazione');

  private sub?: Subscription;

  protected onPick(ev: Event, slot: Slot): void {
    const input = ev.target as HTMLInputElement;
    this.imposta(slot, input.files?.[0] ?? null);
    input.value = '';
  }

  protected onDragOver(ev: DragEvent, slot: Slot): void {
    if (this.busy()) return;
    ev.preventDefault();
    this.dragOver.set(slot);
  }

  protected onDrop(ev: DragEvent, slot: Slot): void {
    ev.preventDefault();
    this.dragOver.set(null);
    if (this.busy()) return;
    const dropped = Array.from(ev.dataTransfer?.files ?? []);
    if (dropped.length > 1) {
      for (const f of dropped) {
        const n = f.name.toLowerCase();
        if (n.endsWith('.jsonl')) this.imposta('tracking', f);
        else if (n.endsWith('.csv') && n.includes('dynamic_events')) this.imposta('eventi', f);
        else if (n.endsWith('.json') && n.includes('match')) this.imposta('partita', f);
      }
      return;
    }
    this.imposta(slot, dropped[0] ?? null);
  }

  protected reset(): void {
    this.files.set({ partita: null, eventi: null, tracking: null });
    this.fase.set('idle');
    this.errore.set(null);
  }

  protected onImportAvviato(imp: ImportDto): void {
    this.mostraGithub.set(false);
    this.concluso.emit(imp);
  }

  protected invia(): void {
    const { partita, eventi, tracking } = this.files();
    if (!partita || !eventi) return;
    this.sub?.unsubscribe();
    this.fase.set('upload');
    this.progresso.set(0);
    this.errore.set(null);

    this.sub = this.api.caricaFile(partita, eventi, tracking).pipe(
      filter(e => {
        if (e.type === HttpEventType.UploadProgress && e.total) {
          this.progresso.set(Math.round((e.loaded / e.total) * 100));
        }
        return e.type === HttpEventType.Response;
      }),
      switchMap(e => {
        const imp = (e as { body: ImportDto }).body;
        this.corrente.set(imp);
        this.fase.set('elaborazione');
        return timer(0, 1500).pipe(
          switchMap(() => this.api.statoImport(imp.id)),
          takeWhile(s => s.stato !== 'COMPLETATO' && s.stato !== 'ERRORE', true),
        );
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: s => {
        this.corrente.set(s);
        if (s.stato === 'COMPLETATO') {
          this.fase.set('completato');
          this.files.set({ partita: null, eventi: null, tracking: null });
          this.concluso.emit(s);
        } else if (s.stato === 'ERRORE') {
          this.errore.set(s.messaggio ?? 'Elaborazione non riuscita.');
          this.fase.set('errore');
          this.concluso.emit(s);
        }
      },
      error: (err: HttpErrorResponse) => {
        this.errore.set(this.messaggioErrore(err));
        this.fase.set('errore');
      },
    });
  }

  protected dimensione(bytes: number): string {
    if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
    return `${(bytes / 1024 / 1024).toLocaleString('it-IT', { maximumFractionDigits: 1 })} MB`;
  }

  private imposta(slot: Slot, file: File | null): void {
    if (!file) return;
    const def = SLOTS.find(s => s.key === slot)!;
    if (!file.name.toLowerCase().endsWith(def.formato)) {
      this.errore.set(`Il file ${def.titolo.toLowerCase()} deve essere ${def.formato}: hai scelto ${file.name}.`);
      this.fase.set('errore');
      return;
    }
    if (this.fase() === 'errore' || this.fase() === 'completato') this.fase.set('idle');
    this.files.update(f => ({ ...f, [slot]: file }));
  }

  private messaggioErrore(err: HttpErrorResponse): string {
    if (err.status === 0) return 'Server non raggiungibile. Controlla che il BFF sia avviato.';
    if (err.status === 413) return 'File troppo grande per il server (limite multipart di Spring).';
    const body = err.error as { message?: string; detail?: string } | null;
    return body?.detail ?? body?.message ?? `Caricamento non riuscito (errore ${err.status}).`;
  }
}