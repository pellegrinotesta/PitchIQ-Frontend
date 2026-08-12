import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Giocatore, StatoGiocatore } from '../../core/models/giocatore.model';
import { GiocatoreService } from '../../core/services/giocatore.service';

import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageModule } from 'primeng/message';
import { DividerModule } from 'primeng/divider';


@Component({
  selector: 'app-scheda-giocatore',
  imports: [
    RouterLink,
    ButtonModule,
    TagModule,
    CardModule,
    ProgressSpinnerModule,
    MessageModule,
    DividerModule,
  ],
  templateUrl: './scheda-giocatore.html',
  styleUrl: './scheda-giocatore.scss',
})
export class SchedaGiocatore implements OnInit {
  private route = inject(ActivatedRoute);
  private service = inject(GiocatoreService);

  giocatore = signal<Giocatore | null>(null);
  loading = signal(true);
  errore = signal<string | null>(null);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.service.getById(id).subscribe({
      next: (g) => { this.giocatore.set(g); this.loading.set(false); },
      error: () => { this.errore.set('Giocatore non trovato.'); this.loading.set(false); },
    });
  }

  getSeverity(stato: StatoGiocatore): 'success' | 'danger' | 'warn' {
    const map: Record<StatoGiocatore, 'success' | 'danger' | 'warn'> = {
      ATTIVO: 'success', INFORTUNATO: 'danger', SQUALIFICATO: 'warn',
    };
    return map[stato];
  }
}
