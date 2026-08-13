import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { SedutaAllenamento, TipoSeduta } from '../../core/models/allenamento.model';
import { AllenamentoService } from '../../core/services/allenamento.service';

@Component({
  selector: 'all-form-seduta',
  imports: [FormsModule],
  templateUrl: './form-seduta.html',
  styleUrl: './form-seduta.css',
})
export class FormSeduta implements OnInit {
  private service = inject(AllenamentoService);
  private ref = inject(DynamicDialogRef);
  private config = inject(DynamicDialogConfig);

  seduta: SedutaAllenamento | null = null;
  saving = signal(false);
  errore = signal<string | null>(null);

  // Campi form
  data = '';
  oraInizio = '09:00';
  oraFine = '11:00';
  tipo: TipoSeduta = 'TECNICO';
  luogo = '';
  note = '';

  readonly tipiOptions: { label: string; value: TipoSeduta }[] = [
    { label: 'Tecnico', value: 'TECNICO' },
    { label: 'Tattico', value: 'TATTICO' },
    { label: 'Atletico', value: 'ATLETICO' },
    { label: 'Partitella', value: 'PARTITELLA' },
  ];

  ngOnInit(): void {
    this.seduta = this.config.data?.seduta ?? null;
    if (this.seduta) {
      this.data = this.seduta.data;
      this.oraInizio = this.seduta.oraInizio;
      this.oraFine = this.seduta.oraFine;
      this.tipo = this.seduta.tipo;
      this.luogo = this.seduta.luogo ?? '';
      this.note = this.seduta.note ?? '';
    } else {
      // Default: oggi
      this.data = new Date().toISOString().split('T')[0];
    }
  }

  submit(): void {
    if (!this.data || !this.oraInizio || !this.oraFine) return;
    this.saving.set(true);

    const req = {
      data: this.data,
      oraInizio: this.oraInizio,
      oraFine: this.oraFine,
      tipo: this.tipo,
      luogo: this.luogo || null,
      note: this.note || null,
      presenze: [],
    };

    const op$ = this.seduta
      ? this.service.update(this.seduta.id, req)
      : this.service.create(req);

    op$.subscribe({
      next: () => this.ref.close(true),
      error: () => { this.errore.set('Salvataggio fallito.'); this.saving.set(false); },
    });
  }

  annulla(): void { this.ref.close(false); }
}
