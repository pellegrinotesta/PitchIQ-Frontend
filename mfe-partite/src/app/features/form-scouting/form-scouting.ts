import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { ScoutingAvversario } from '../../core/models/partita.model';
import { PartitaService } from '../../core/services/partita.service';

@Component({
  selector: 'app-form-scouting',
  imports: [FormsModule],
  templateUrl: './form-scouting.html',
  styleUrl: './form-scouting.scss',
})
export class FormScouting implements OnInit {
  private service = inject(PartitaService);
  private ref = inject(DynamicDialogRef);
  private config = inject(DynamicDialogConfig);

  avversario: ScoutingAvversario | null = null;
  saving = signal(false);

  nome = '';
  modulo = '';
  puntiForza = '';
  debolezze = '';
  giocatoriChiave = '';
  note = '';

  readonly moduliOptions = ['4-3-3', '4-4-2', '4-2-3-1', '3-5-2', '5-3-2', '3-4-3'];

  ngOnInit(): void {
    this.avversario = this.config.data?.avversario ?? null;
    if (this.avversario) {
      this.nome = this.avversario.nome;
      this.modulo = this.avversario.modulo ?? '';
      this.puntiForza = this.avversario.puntiForza ?? '';
      this.debolezze = this.avversario.debolezze ?? '';
      this.giocatoriChiave = this.avversario.giocatoriChiave ?? '';
      this.note = this.avversario.note ?? '';
    }
  }

  submit(): void {
    if (!this.nome) return;
    this.saving.set(true);

    const req = {
      nome: this.nome,
      modulo: this.modulo || null,
      puntiForza: this.puntiForza || null,
      debolezze: this.debolezze || null,
      giocatoriChiave: this.giocatoriChiave || null,
      note: this.note || null,
    };

    const op$ = this.avversario
      ? this.service.updateScouting(this.avversario.id, req)
      : this.service.createScouting(req);

    op$.subscribe({
      next: () => this.ref.close(true),
      error: () => this.saving.set(false),
    });
  }

  annulla(): void { this.ref.close(false); }
}
