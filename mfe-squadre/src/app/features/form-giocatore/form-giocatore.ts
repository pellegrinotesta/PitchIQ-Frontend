import { Component, EventEmitter, inject, Input, OnInit, Output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { RuoloGiocatore, StatoGiocatore, GiocatoreRequest, Giocatore } from '../../core/models/giocatore.model';
import { GiocatoreService } from '../../core/services/giocatore.service';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectButtonModule } from 'primeng/selectbutton';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';

@Component({
  selector: 'app-form-giocatore',
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    SelectButtonModule,
    MessageModule,
  ],
  templateUrl: './form-giocatore.html',
  styleUrl: './form-giocatore.scss',
})
export class FormGiocatore implements OnInit {
  
  private service = inject(GiocatoreService);
  private fb = inject(FormBuilder);
  private ref = inject(DynamicDialogRef);
  private config = inject(DynamicDialogConfig);

  giocatore: Giocatore | null = null;
  errore = signal<string | null>(null);
  saving = signal(false);

  get isModifica(): boolean { return !!this.giocatore; }

  readonly ruoliOptions = [
    { label: 'Portiere', value: 'PORTIERE' },
    { label: 'Difensore', value: 'DIFENSORE' },
    { label: 'Centrocampista', value: 'CENTROCAMPISTA' },
    { label: 'Attaccante', value: 'ATTACCANTE' },
  ];

  readonly statiOptions = [
    { label: 'Attivo', value: 'ATTIVO' },
    { label: 'Infortunato', value: 'INFORTUNATO' },
    { label: 'Squalificato', value: 'SQUALIFICATO' },
  ];

  readonly piedeOptions = [
    { label: 'Destro', value: 'DESTRO' },
    { label: 'Sinistro', value: 'SINISTRO' },
    { label: 'Ambidestro', value: 'AMBIDESTRO' },
  ];

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
    this.giocatore = this.config.data?.giocatore ?? null;
    if (this.giocatore) {
      this.form.patchValue({ ...this.giocatore });
    }
  }

  submit(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    const req = this.form.getRawValue() as GiocatoreRequest;

    const op$ = this.isModifica
      ? this.service.update(this.giocatore!.id, req)
      : this.service.create(req);

    op$.subscribe({
      next: () => { this.ref.close(true); },
      error: () => { this.errore.set('Salvataggio fallito.'); this.saving.set(false); },
    });
  }

  annulla(): void {
    this.ref.close(false);
  }
}
