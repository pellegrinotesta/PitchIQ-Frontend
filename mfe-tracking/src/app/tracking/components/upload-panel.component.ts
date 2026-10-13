import { HttpErrorResponse, HttpEventType } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription, filter, switchMap, takeWhile, timer } from 'rxjs';
import { TrackingApi } from '../data/tracking.api';
import { ImportDto } from '../data/tracking.models';
import { TRACKING_TOKENS } from '../tracking.tokens';
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
  template: `
    <section class="upload-card" aria-labelledby="upload-title">

      <div class="upload-head">
        <h2 id="upload-title">Carica una partita</h2>
        <p>File SkillCorner della stessa partita. Senza il tracking ottieni le statistiche ma non le animazioni.</p>
      </div>

      <div class="slots">
        @for (s of slots; track s.key) {
          <label class="slot"
            [class.filled]="files()[s.key]"
            [class.drag]="dragOver() === s.key"
            (dragover)="onDragOver($event, s.key)"
            (dragleave)="dragOver.set(null)"
            (drop)="onDrop($event, s.key)">

            <input type="file" [id]="'tk-file-' + s.key" [accept]="s.accept"
              [disabled]="busy()" (change)="onPick($event, s.key)">

            <span class="slot-label">
              {{ s.titolo }} · {{ s.formato }}
              @if (!s.obbligatorio) { <span class="facoltativo">· facoltativo</span> }
            </span>

            @if (files()[s.key]; as f) {
              <span class="slot-nome">{{ f.name }}</span>
              <span class="slot-size">{{ dimensione(f.size) }}</span>
            } @else {
              <span class="slot-hint">Trascina qui o tocca per scegliere</span>
              <span class="slot-size">es. {{ s.esempio }}</span>
            }
          </label>
        }
      </div>

      <div class="upload-foot">
        <div class="upload-azioni">
          <button type="button" class="btn-primary" [disabled]="!pronto() || busy()" (click)="invia()">
            @if (busy()) {
              <span class="spinner"></span> Elaborazione…
            } @else {
              <i class="pi pi-upload"></i> Carica ed elabora
            }
          </button>
          <button type="button" class="btn-ghost" (click)="mostraGithub.set(!mostraGithub())">
            <i class="pi pi-github"></i>
            {{ mostraGithub() ? 'Chiudi' : 'Sfoglia GitHub' }}
          </button>
          @if (!busy() && (files().partita || files().eventi || files().tracking)) {
            <button type="button" class="btn-ghost" (click)="reset()">Svuota</button>
          }
        </div>

        <div class="status" aria-live="polite">
          @switch (fase()) {
            @case ('upload') {
              <div class="progress-wrap">
                <div class="progress-bar">
                  <div class="progress-fill" [style.width.%]="progresso()"></div>
                </div>
                <span class="status-testo">Invio file {{ progresso() }}%</span>
              </div>
            }
            @case ('elaborazione') {
              <div class="status-row">
                <span class="spinner-sm"></span>
                <span class="status-testo">{{ corrente()?.stato === 'IN_CODA' ? 'In coda' : 'Calcolo delle sequenze' }}…</span>
              </div>
            }
            @case ('completato') {
              <div class="status-row">
                <i class="pi pi-check-circle status-ok"></i>
                <span class="status-ok">{{ corrente()?.messaggio }}</span>
              </div>
            }
            @case ('errore') {
              <div class="status-row">
                <i class="pi pi-times-circle status-err"></i>
                <span class="status-err">{{ errore() }}</span>
              </div>
            }
          }
        </div>
      </div>

      @if (mostraGithub()) {
        <tk-github-browser
          (importAvviato)="onImportAvviato($event)"
          (chiudi)="mostraGithub.set(false)"
        />
      }

    </section>
  `,
  styles: [TRACKING_TOKENS, `
    .upload-card {
      background: #111;
      border: 1px solid #1e1e1e;
      border-radius: 12px;
      padding: 1.5rem;
      display: grid;
      gap: 1.25rem;
    }
    .upload-head h2 { margin: 0 0 .35rem; font-size: 1.1rem; font-weight: 700; color: #fff; }
    .upload-head p { margin: 0; font-size: .85rem; color: #555; }
    .slots {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 200px), 1fr));
      gap: .75rem;
    }
    .slot {
      position: relative; display: grid; gap: .3rem; padding: 1rem;
      background: #0a0a0a; border: 1.5px dashed #2a2a2a; border-radius: 10px;
      cursor: pointer; min-width: 0; transition: border-color .15s, background .15s;
    }
    .slot:hover { border-color: #444; }
    .slot.drag { border-color: #00ff87; background: rgba(0,255,135,.04); }
    .slot.filled { border-style: solid; border-color: rgba(0,255,135,.4); background: rgba(0,255,135,.04); }
    .slot input { position: absolute; inset: 0; opacity: 0; cursor: pointer; width: 100%; height: 100%; }
    .slot input:focus-visible ~ .slot-label { outline: 2px solid #00ff87; outline-offset: 4px; }
    .slot-label { font-size: .7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #555; }
    .facoltativo { color: #444; }
    .slot-nome { font-size: .88rem; font-weight: 600; color: #00ff87; overflow-wrap: anywhere; }
    .slot-hint { font-size: .88rem; font-weight: 500; color: #888; }
    .slot-size { font-size: .75rem; color: #444; overflow-wrap: anywhere; }
    .upload-foot { display: flex; flex-wrap: wrap; gap: 1rem; align-items: center; }
    .upload-azioni { display: flex; gap: .5rem; align-items: center; }
    .btn-primary {
      display: flex; align-items: center; gap: .4rem; padding: .6rem 1.2rem;
      background: #00ff87; color: #000; border: none; border-radius: 8px;
      font-size: .9rem; font-weight: 700; cursor: pointer; transition: background .15s; font-family: inherit;
    }
    .btn-primary:hover:not(:disabled) { background: #00cc6a; }
    .btn-primary:disabled { opacity: .4; cursor: not-allowed; }
    .btn-ghost {
      padding: .6rem 1rem; background: transparent; border: 1px solid #2a2a2a;
      border-radius: 8px; color: #888; font-size: .9rem; cursor: pointer;
      transition: border-color .15s, color .15s; font-family: inherit;
    }
    .btn-ghost:hover { border-color: #555; color: #fff; }
    .status { flex: 1 1 240px; min-width: 0; }
    .status-row { display: flex; align-items: center; gap: .5rem; font-size: .85rem; }
    .status-testo { font-size: .85rem; color: #888; }
    .status-ok { color: #00ff87; font-size: .85rem; }
    .status-err { color: #ff6464; font-size: .85rem; }
    .progress-wrap { display: flex; flex-direction: column; gap: .35rem; }
    .progress-bar { width: 180px; height: 4px; background: #1e1e1e; border-radius: 999px; overflow: hidden; }
    .progress-fill { height: 100%; background: #00ff87; border-radius: 999px; transition: width .2s; }
    .spinner {
      width: 14px; height: 14px; border: 2px solid #2a2a2a; border-top-color: #00ff87;
      border-radius: 50%; animation: spin .8s linear infinite; display: inline-block; flex-shrink: 0;
    }
    .spinner-sm {
      width: 12px; height: 12px; border: 2px solid #2a2a2a; border-top-color: #00ff87;
      border-radius: 50%; animation: spin .8s linear infinite; display: inline-block; flex-shrink: 0;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    @media (prefers-reduced-motion: reduce) { .spinner, .spinner-sm { animation: none; } }
  `],
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

  protected readonly pronto = computed(() => !!this.files().partita && !!this.files().eventi);
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