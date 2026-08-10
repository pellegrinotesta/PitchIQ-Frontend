import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { RuoloGiocatore, StatoGiocatore, GiocatoreRequest } from '../../core/models/giocatore.model';
import { GiocatoreService } from '../../core/services/giocatore.service';

@Component({
  selector: 'app-form-giocatore',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './form-giocatore.html',
  styleUrl: './form-giocatore.scss',
})
export class FormGiocatore {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private service = inject(GiocatoreService);
  private fb = inject(FormBuilder);

  // Se c'è un :id nella rotta, siamo in modalità modifica
  id: number | null = null;
  isModifica = false;
  errore = signal<string | null>(null);
  saving = signal(false);

  readonly ruoli: RuoloGiocatore[] = ['PORTIERE', 'DIFENSORE', 'CENTROCAMPISTA', 'ATTACCANTE'];
  readonly stati: StatoGiocatore[] = ['ATTIVO', 'INFORTUNATO', 'SQUALIFICATO'];

  form = this.fb.group({
    nome: ['', [Validators.required, Validators.maxLength(100)]],
    cognome: ['', [Validators.required, Validators.maxLength(100)]],
    dataNascita: [null as string | null],
    ruolo: [null as RuoloGiocatore | null, Validators.required],
    numeroMaglia: [null as number | null, [Validators.min(1), Validators.max(99)]],
    piedePreferito: [null as string | null],
    contrattoInizio: [null as string | null],
    contrattoFine: [null as string | null],
    stato: ['ATTIVO' as StatoGiocatore],
  });

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.id = Number(idParam);
      this.isModifica = true;
      this.caricaGiocatore(this.id);
    }
  }

  private caricaGiocatore(id: number): void {
    this.service.getById(id).subscribe({
      next: (g) => this.form.patchValue({ ...g }),
      error: () => this.errore.set('Impossibile caricare i dati del giocatore.'),
    });
  }

  submit(): void {
    if (this.form.invalid) return;

    this.saving.set(true);
    const req = this.form.getRawValue() as GiocatoreRequest;

    const op$ = this.isModifica
      ? this.service.update(this.id!, req)
      : this.service.create(req);

    op$.subscribe({
      next: (g) => this.router.navigate(['..', g.id], { relativeTo: this.route }),
      error: () => {
        this.errore.set('Salvataggio fallito. Controlla i dati e riprova.');
        this.saving.set(false);
      },
    });
  }
}
