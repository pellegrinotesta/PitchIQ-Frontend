import { Component, inject, OnInit, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { DynamicDialogModule, DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ConfirmationService } from 'primeng/api';
import { ConfirmationService as CS } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { FormsModule } from '@angular/forms';
import { CampoDiCalcio } from '../campo-di-calcio/campo-di-calcio';
import { Formazione, GiocatoreDisponibile, PosizioneCampo } from '../../core/model/formazione.model';
import { FormazioneService } from '../../core/services/formazione.service';

@Component({
  selector: 'app-editor-tattiche',
  imports: [
    FormsModule,
    ButtonModule,
    SelectModule,
    InputTextModule,
    DynamicDialogModule,
    ToastModule,
    CampoDiCalcio,
  ],
  providers: [DialogService, CS, MessageService],
  templateUrl: './editor-tattiche.html',
  styleUrl: './editor-tattiche.scss',
})
export class EditorTattiche implements OnInit {
  private service = inject(FormazioneService);
  private dialogService = inject(DialogService);
  private confirmService = inject(CS);
  private messageService = inject(MessageService);

  formazioni = signal<Formazione[]>([]);
  formazioneAttiva = signal<Formazione | null>(null);
  rosa = signal<GiocatoreDisponibile[]>([]);
  loading = signal(false);
  salvando = signal(false);

  readonly moduliOptions = [
    { label: '4-3-3', value: '4-3-3' },
    { label: '4-4-2', value: '4-4-2' },
    { label: '4-2-3-1', value: '4-2-3-1' },
    { label: '3-5-2', value: '3-5-2' },
    { label: '5-3-2', value: '5-3-2' },
    { label: '3-4-3', value: '3-4-3' },
  ];

  ngOnInit(): void {
    this.caricaFormazioni();
    this.caricaRosa();
  }

  caricaFormazioni(): void {
    this.loading.set(true);
    this.service.getAll().subscribe({
      next: (list) => { this.formazioni.set(list); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  caricaRosa(): void {
    this.service.getRosaDisponibile().subscribe({
      next: (rosa) => this.rosa.set(rosa),
    });
  }

  selezionaFormazione(f: Formazione): void {
    this.service.getById(f.id).subscribe({
      next: (full) => this.formazioneAttiva.set(full),
    });
  }

  nuovaFormazione(): void {
    const f: Formazione = {
      id: 0,
      nome: 'Nuova formazione',
      modulo: '4-3-3',
      data: null,
      note: null,
      posizioni: [],
    };
    this.formazioneAttiva.set(f);
  }

  onPosizioniChange(posizioni: PosizioneCampo[]): void {
    const f = this.formazioneAttiva();
    if (!f) return;
    this.formazioneAttiva.set({ ...f, posizioni });
  }

  salva(): void {
    const f = this.formazioneAttiva();
    if (!f) return;

    this.salvando.set(true);
    const req = {
      nome: f.nome,
      modulo: f.modulo,
      data: f.data,
      note: f.note,
      posizioni: f.posizioni.map(p => ({
        giocatoreId: p.giocatoreId,
        coordX: p.coordX,
        coordY: p.coordY,
        slotRuolo: p.slotRuolo,
        titolare: p.titolare,
      })),
    };

    const op$ = f.id
      ? this.service.update(f.id, req)
      : this.service.create(req);

    op$.subscribe({
      next: (saved) => {
        this.salvando.set(false);
        // Aggiorna la formazione attiva con la risposta completa (posizioni incluse)
        this.formazioneAttiva.set(saved);
        // Aggiorna solo la lista sidebar senza toccare la formazione attiva
        this.caricaFormazioni();
        this.messageService.add({
          severity: 'success',
          summary: 'Salvato',
          detail: 'Formazione salvata con successo',
        });
      },
      error: () => {
        this.salvando.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Errore',
          detail: 'Salvataggio fallito',
        });
      },
    });
  }

  elimina(f: Formazione): void {
    this.confirmService.confirm({
      message: `Eliminare "${f.nome}"?`,
      header: 'Conferma',
      icon: 'pi pi-trash',
      acceptLabel: 'Elimina',
      rejectLabel: 'Annulla',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.service.delete(f.id).subscribe({
          next: () => {
            if (this.formazioneAttiva()?.id === f.id) {
              this.formazioneAttiva.set(null);
            }
            this.caricaFormazioni();
          },
        });
      },
    });
  }

  onNomeChange(nome: string): void {
    const f = this.formazioneAttiva();
    if (f) this.formazioneAttiva.set({ ...f, nome });
  }

  onModuloChange(modulo: string): void {
    const f = this.formazioneAttiva();
    if (f) this.formazioneAttiva.set({ ...f, modulo });
  }

  onDragStart(event: DragEvent, g: GiocatoreDisponibile): void {
    event.dataTransfer?.setData('giocatore', JSON.stringify(g));
  }
}
