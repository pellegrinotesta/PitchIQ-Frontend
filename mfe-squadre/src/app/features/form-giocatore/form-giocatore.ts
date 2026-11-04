import { Component, inject, OnInit, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import {
  RuoloGiocatore,
  StatoGiocatore,
  GiocatoreRequest,
  Giocatore,
  RUOLO_LABEL,
} from '../../core/models/giocatore.model';
import { ruoliSecondari } from '../../core/models/rosa-insights';
import { GiocatoreService } from '../../core/services/giocatore.service';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';

@Component({
  selector: 'app-form-giocatore',
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    MultiSelectModule,
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

  get isModifica(): boolean {
    return !!this.giocatore;
  }

  readonly ruoliOptions = Object.entries(RUOLO_LABEL).map(([value, label]) => ({
    value,
    label: `${value} - ${label}`,
  }));
  readonly oggi = new Date(Date.now() - new Date().getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 10);

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

  form = this.fb.group(
    {
      nome: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(100)]],
      cognome: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(100)]],
      dataNascita: [null as string | null],
      ruolo: [null as RuoloGiocatore | null, Validators.required],
      ruoliSecondari: [[] as RuoloGiocatore[]],
      numeroMaglia: [
        null as number | null,
        [Validators.required, Validators.min(1), Validators.max(99), Validators.pattern(/^\d+$/)],
      ],
      piedePreferito: [null as string | null],
      contrattoInizio: [null as string | null],
      contrattoFine: [null as string | null],
      stato: ['ATTIVO' as StatoGiocatore, Validators.required],
      nazionalita: [null as string | null, Validators.maxLength(50)],
      luogoNascita: [null as string | null, Validators.maxLength(100)],
      altezzaCm: [
        null as number | null,
        [Validators.min(100), Validators.max(250), Validators.pattern(/^\d+$/)],
      ],
      pesoKg: [
        null as number | null,
        [Validators.min(30), Validators.max(250), Validators.pattern(/^\d+$/)],
      ],
      valoreMercato: [
        null as number | null,
        [
          Validators.min(0),
          Validators.max(9_999_999_999.99),
          Validators.pattern(/^\d+(\.\d{1,2})?$/),
        ],
      ],
      stipendioAnnuo: [
        null as number | null,
        [
          Validators.min(0),
          Validators.max(9_999_999_999.99),
          Validators.pattern(/^\d+(\.\d{1,2})?$/),
        ],
      ],
      clausola: [
        null as number | null,
        [
          Validators.min(0),
          Validators.max(9_999_999_999.99),
          Validators.pattern(/^\d+(\.\d{1,2})?$/),
        ],
      ],
      agente: [null as string | null, Validators.maxLength(100)],
    },
    {
      validators: (controllo: AbstractControl): ValidationErrors | null => {
        const { dataNascita, contrattoInizio, contrattoFine } = controllo.value;
        if (dataNascita && dataNascita > this.oggi) return { nascitaFutura: true };
        if (contrattoInizio && contrattoFine && contrattoFine < contrattoInizio)
          return { ordineContratto: true };
        return null;
      },
    },
  );

  ngOnInit(): void {
    this.giocatore = this.config.data?.giocatore ?? null;
    if (this.giocatore) {
      this.form.patchValue({ ...this.giocatore, ruoliSecondari: ruoliSecondari(this.giocatore) });
    }
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.saving()) return;
    this.saving.set(true);
    this.errore.set(null);
    const valori = this.form.getRawValue();
    const req: GiocatoreRequest = {
      ...valori,
      nome: valori.nome!.trim(),
      cognome: valori.cognome!.trim(),
      ruolo: valori.ruolo!,
      stato: valori.stato!,
      ruoliSecondari:
        (valori.ruoliSecondari ?? []).filter((ruolo) => ruolo !== valori.ruolo).join(',') || null,
      dataNascita: valori.dataNascita || null,
      contrattoInizio: valori.contrattoInizio || null,
      contrattoFine: valori.contrattoFine || null,
      noteMediche: this.giocatore?.noteMediche ?? null,
    };

    const modifiche = Object.fromEntries(
      Object.entries(req).filter(
        ([campo, valore]) =>
          campo !== 'noteMediche' && valore !== this.giocatore?.[campo as keyof Giocatore],
      ),
    ) as Partial<GiocatoreRequest>;
    const op$ = this.isModifica
      ? this.service.update(this.giocatore!.id, modifiche)
      : this.service.create(req);

    op$.subscribe({
      next: () => {
        this.ref.close(true);
      },
      error: (risposta) => {
        const messaggi = risposta.error?.errors;
        this.errore.set(
          messaggi && typeof messaggi === 'object'
            ? Object.values(messaggi).join('. ')
            : 'Salvataggio fallito. Verifica la connessione e riprova.',
        );
        this.saving.set(false);
      },
    });
  }

  annulla(): void {
    if (!this.saving()) this.ref.close(false);
  }
}
