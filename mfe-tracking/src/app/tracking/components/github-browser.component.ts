import { ChangeDetectionStrategy, Component, OnInit, inject, output, signal } from '@angular/core';
import { GithubSkillcornerService } from '../data/github-skillcorner.service';
import { ImportDto } from '../data/tracking.models';
import { DatePipe } from '@angular/common';

interface PartitaGH {
  matchId: string;
  squadraCasa?: string;
  squadraTrasferta?: string;
  data?: string;
  competizione?: string;
  conTracking?: boolean;
}

@Component({
  selector: 'tk-github-browser',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe],
  templateUrl: './github-browser.component.html',
  styleUrl: './github-browser.component.scss',
})
export class GithubBrowserComponent implements OnInit {
  private readonly gh = inject(GithubSkillcornerService);

  readonly importAvviato = output<ImportDto>();
  readonly chiudi        = output<void>();

  protected readonly partite    = signal<PartitaGH[]>([]);
  protected readonly caricamento = signal(true);
  protected readonly errore     = signal<string | null>(null);
  protected readonly scaricando = signal<string | null>(null);

  ngOnInit(): void {
    this.gh.listaPartite().subscribe({
      next: list => {
        this.partite.set(list);
        this.caricamento.set(false);
      },
      error: () => {
        this.errore.set('Impossibile accedere al repository. Controlla la connessione.');
        this.caricamento.set(false);
      },
    });
  }

  protected importa(matchId: string): void {
    if (this.scaricando()) return;
    this.scaricando.set(matchId);

    this.gh.importa(matchId).subscribe({
      next: imp => {
        this.scaricando.set(null);
        this.importAvviato.emit(imp);
        this.chiudi.emit();
      },
      error: () => {
        this.scaricando.set(null);
        this.errore.set(`Download fallito per la partita #${matchId}. Riprova.`);
      },
    });
  }
}