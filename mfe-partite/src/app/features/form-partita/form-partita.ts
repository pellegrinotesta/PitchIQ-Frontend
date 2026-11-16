import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Partita, CasaTrasferta, ScoutingAvversario } from '../../core/models/partita.model';
import { PartitaService } from '../../core/services/partita.service';

@Component({
  selector: 'par-form-partit',
  imports: [FormsModule],
  templateUrl: './form-partita.html',
  styleUrl: './form-partita.scss',
})
export class FormPartita implements OnInit {
  private service = inject(PartitaService);
  private ref = inject(DynamicDialogRef);
  private config = inject(DynamicDialogConfig);

  partita: Partita | null = null;
  saving = signal(false);
  errore = signal<string | null>(null);

  data = '';
  avversario = '';
  competizione = '';
  casaTrasferta: CasaTrasferta = 'CASA';
  golFatti = 0;
  golSubiti = 0;
  /** false = partita in calendario, senza risultato */
  giocata = true;
  oraInizio = '';
  scoutingId: number | null = null;
  scouting = signal<ScoutingAvversario[]>([]);
  modulo = '';
  note = '';

  readonly casaTrasfertaOptions = [
    { label: 'Casa', value: 'CASA' },
    { label: 'Trasferta', value: 'TRASFERTA' },
    { label: 'Neutro', value: 'NEUTRO' },
  ];

  readonly moduliOptions = ['4-3-3', '4-4-2', '4-2-3-1', '3-5-2', '5-3-2', '3-4-3'];

  ngOnInit(): void {
    this.partita = this.config.data?.partita ?? null;
    if (this.partita) {
      this.data = this.partita.data;
      this.avversario = this.partita.avversario;
      this.competizione = this.partita.competizione ?? '';
      this.casaTrasferta = this.partita.casaTrasferta;
      this.golFatti = this.partita.golFatti;
      this.golSubiti = this.partita.golSubiti;
      this.modulo = this.partita.modulo ?? '';
      this.note = this.partita.note ?? '';
      this.giocata = this.config.data?.giocata ?? this.partita.giocata !== false;
      this.oraInizio = (this.partita.oraInizio ?? '').slice(0, 5);
      this.scoutingId = this.partita.scoutingId ?? null;
    } else {
      this.data = new Date().toISOString().split('T')[0];
      this.competizione = this.config.data?.competizione ?? '';
    }
    this.service.getAllScouting().subscribe({
      next: (lista) => { this.scouting.set(lista); this.suggerisciScouting(); },
      error: () => this.scouting.set([]),
    });
  }

  /** Una data futura non può avere un risultato: propone "da giocare". */
  cambiaData(): void {
    if (!this.partita && this.data > new Date().toISOString().split('T')[0]) this.giocata = false;
  }

  /** Collega il report con lo stesso nome dell'avversario, se non ne è già stato scelto uno. */
  suggerisciScouting(): void {
    if (this.scoutingId !== null) return;
    const nome = this.avversario.trim().toLocaleLowerCase('it');
    if (!nome) return;
    this.scoutingId =
      this.scouting().find((s) => s.nome.trim().toLocaleLowerCase('it') === nome)?.id ?? null;
  }

  submit(): void {
    if (!this.data || !this.avversario) return;
    this.saving.set(true);

    const req = {
      data: this.data,
      avversario: this.avversario,
      competizione: this.competizione || null,
      casaTrasferta: this.casaTrasferta,
      golFatti: this.giocata ? this.golFatti : 0,
      golSubiti: this.giocata ? this.golSubiti : 0,
      giocata: this.giocata,
      oraInizio: this.oraInizio || null,
      scoutingId: this.scoutingId,
      modulo: this.modulo || null,
      note: this.note || null,
    };

    const op$ = this.partita
      ? this.service.update(this.partita.id, req)
      : this.service.create(req);

    op$.subscribe({
      next: () => this.ref.close(true),
      error: () => { this.errore.set('Salvataggio fallito.'); this.saving.set(false); },
    });
  }

  annulla(): void { this.ref.close(false); }
}
