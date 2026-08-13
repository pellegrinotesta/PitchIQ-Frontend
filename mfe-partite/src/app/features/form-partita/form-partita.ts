import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Partita, CasaTrasferta } from '../../core/models/partita.model';
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
    } else {
      this.data = new Date().toISOString().split('T')[0];
    }
  }

  submit(): void {
    if (!this.data || !this.avversario) return;
    this.saving.set(true);

    const req = {
      data: this.data,
      avversario: this.avversario,
      competizione: this.competizione || null,
      casaTrasferta: this.casaTrasferta,
      golFatti: this.golFatti,
      golSubiti: this.golSubiti,
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
