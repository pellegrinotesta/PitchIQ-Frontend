import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AllenamentoService } from '../../core/services/allenamento.service';
import { SedutaAllenamento, TipoSeduta } from '../../core/models/allenamento.model';
import { DynamicDialogModule, DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ConfirmationService } from 'primeng/api';
import { FormSeduta } from '../form-seduta/form-seduta';


@Component({
  selector: 'all-lista',
  imports: [RouterLink, FormsModule, DynamicDialogModule],
  providers: [DialogService, ConfirmationService],
  templateUrl: './lista-allenamenti.html',
  styleUrl: './lista-allenamenti.css',
})
export class ListaAllenamenti implements OnInit {
  private service       = inject(AllenamentoService);
  private dialogService = inject(DialogService);
  private confirmService = inject(ConfirmationService);
  private ref: DynamicDialogRef | null = null;
  readonly history = history;

  sedute  = signal<SedutaAllenamento[]>([]);
  loading = signal(true);
  errore  = signal<string | null>(null);

  readonly tipiOptions: { label: string; value: TipoSeduta | '' }[] = [
    { label: 'Tutti i tipi', value: '' },
    { label: 'Tecnico',      value: 'TECNICO' },
    { label: 'Tattico',      value: 'TATTICO' },
    { label: 'Atletico',     value: 'ATLETICO' },
    { label: 'Partitella',   value: 'PARTITELLA' },
  ];

  ngOnInit(): void { this.carica(); }

  carica(): void {
    this.loading.set(true);
    this.service.getAll().subscribe({
      next: (list) => { this.sedute.set(list); this.loading.set(false); },
      error: () => { this.errore.set('Errore nel caricamento'); this.loading.set(false); },
    });
  }

  apriNuova(): void {
    this.ref = this.dialogService.open(FormSeduta, {
      header: 'Nuova seduta',
      width: '540px',
      modal: true,
      data: { seduta: null },
    });
    this.ref?.onClose.subscribe((ok) => { if (ok) this.carica(); });
  }

  apriModifica(s: SedutaAllenamento): void {
    this.ref = this.dialogService.open(FormSeduta, {
      header: 'Modifica seduta',
      width: '540px',
      modal: true,
      data: { seduta: s },
    });
    this.ref?.onClose.subscribe((ok) => { if (ok) this.carica(); });
  }

  elimina(s: SedutaAllenamento): void {
    this.confirmService.confirm({
      message: `Eliminare la seduta del ${s.data}?`,
      header: 'Conferma',
      acceptLabel: 'Elimina',
      rejectLabel: 'Annulla',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.service.delete(s.id).subscribe({ next: () => this.carica() });
      },
    });
  }

  getTipoClass(tipo: TipoSeduta): string {
    const map: Record<TipoSeduta, string> = {
      TECNICO: 'tecnico', TATTICO: 'tattico',
      ATLETICO: 'atletico', PARTITELLA: 'partitella',
    };
    return map[tipo];
  }

  getTipoIcon(tipo: TipoSeduta): string {
    const map: Record<TipoSeduta, string> = {
      TECNICO: 'pi pi-star', TATTICO: 'pi pi-sitemap',
      ATLETICO: 'pi pi-bolt', PARTITELLA: 'pi pi-users',
    };
    return map[tipo];
  }

  goToDashboard(): void {
    window.location.href = '/dashboard';
  }
}
