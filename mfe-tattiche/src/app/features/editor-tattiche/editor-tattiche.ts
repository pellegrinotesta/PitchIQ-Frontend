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
import { SchemaFormazione, SlotSchema, FrecciaSchema } from '../../core/model/schema.model';
import { CampoSchema } from '../campo-schema/campo-schema';

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
    CampoSchema
  ],
  providers: [DialogService, ConfirmationService, MessageService],
  templateUrl: './editor-tattiche.html',
  styleUrl: './editor-tattiche.scss',
})
export class EditorTattiche implements OnInit {
  private service = inject(FormazioneService);
  private confirmService = inject(ConfirmationService);
  private messageService = inject(MessageService);

  // Tab attivo
  tabAttivo: 'formazioni' | 'schemi' = 'formazioni';
  readonly history = history;

  // Formazioni
  formazioni = signal<Formazione[]>([]);
  formazioneAttiva = signal<Formazione | null>(null);
  rosa = signal<GiocatoreDisponibile[]>([]);

  // Schemi
  schemi = signal<SchemaFormazione[]>([]);
  schemaAttivo = signal<SchemaFormazione | null>(null);

  loading = signal(false);
  salvando = signal(false);

  readonly moduliOptions = [
    '4-3-3', '4-4-2', '4-2-3-1', '3-5-2', '5-3-2', '3-4-3'
  ];

  readonly ruoliSlot = [
    { label: 'Portiere', value: 'PORTIERE' },
    { label: 'Difensore', value: 'DIFENSORE' },
    { label: 'Centrocampista', value: 'CENTROCAMPISTA' },
    { label: 'Attaccante', value: 'ATTACCANTE' },
  ];

  ngOnInit(): void {
    this.caricaFormazioni();
    this.caricaRosa();
    this.caricaSchemi();
  }

  // ===== TAB =====
  cambiaTab(tab: 'formazioni' | 'schemi'): void {
    this.tabAttivo = tab;
  }

  // ===== FORMAZIONI =====
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
    this.formazioneAttiva.set({
      id: 0, nome: 'Nuova formazione',
      modulo: '4-3-3', data: null, note: null, posizioni: [],
    });
  }

  onPosizioniChange(posizioni: PosizioneCampo[]): void {
    const f = this.formazioneAttiva();
    if (f) this.formazioneAttiva.set({ ...f, posizioni });
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

  salvaFormazione(): void {
    const f = this.formazioneAttiva();
    if (!f) return;
    this.salvando.set(true);

    const req = {
      nome: f.nome, modulo: f.modulo, data: f.data, note: f.note,
      posizioni: f.posizioni.map(p => ({
        giocatoreId: p.giocatoreId, coordX: p.coordX, coordY: p.coordY,
        slotRuolo: p.slotRuolo, titolare: p.titolare,
      })),
    };

    const op$ = f.id
      ? this.service.update(f.id, req)
      : this.service.create(req);

    op$.subscribe({
      next: (saved) => {
        this.salvando.set(false);
        this.formazioneAttiva.set(saved);
        this.caricaFormazioni();
        this.toast('success', 'Formazione salvata');
      },
      error: () => { this.salvando.set(false); this.toast('error', 'Salvataggio fallito'); },
    });
  }

  eliminaFormazione(f: Formazione): void {
    this.confirmService.confirm({
      message: `Eliminare "${f.nome}"?`,
      header: 'Conferma',
      acceptLabel: 'Elimina',
      rejectLabel: 'Annulla',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.service.delete(f.id).subscribe({
          next: () => {
            if (this.formazioneAttiva()?.id === f.id) this.formazioneAttiva.set(null);
            this.caricaFormazioni();
          },
        });
      },
    });
  }

  // ===== SCHEMI =====
  caricaSchemi(): void {
    this.service.getAllSchemi().subscribe({
      next: (list) => this.schemi.set(list),
    });
  }

  selezionaSchema(s: SchemaFormazione): void {
    this.service.getSchemaById(s.id).subscribe({
      next: (full) => this.schemaAttivo.set(full),
    });
  }

  nuovoSchema(): void {
    this.schemaAttivo.set({
      id: 0, nome: 'Nuovo schema',
      modulo: '4-3-3', descrizione: null, slot: [], frecce: [],
    });
  }

  onSlotChange(slot: SlotSchema[]): void {
    const s = this.schemaAttivo();
    if (s) this.schemaAttivo.set({ ...s, slot });
  }

  onFrecceChange(frecce: FrecciaSchema[]): void {
    const s = this.schemaAttivo();
    if (s) this.schemaAttivo.set({ ...s, frecce });
  }

  onNomeSchemaChange(nome: string): void {
    const s = this.schemaAttivo();
    if (s) this.schemaAttivo.set({ ...s, nome });
  }

  onModuloSchemaChange(modulo: string): void {
    const s = this.schemaAttivo();
    if (s) this.schemaAttivo.set({ ...s, modulo });
  }

  salvaSchema(): void {
    const s = this.schemaAttivo();
    if (!s) return;
    this.salvando.set(true);

    const req = {
      nome: s.nome, modulo: s.modulo, descrizione: s.descrizione,
      slot: s.slot.map(sl => ({
        slotRuolo: sl.slotRuolo, ruolo: sl.ruolo,
        coordX: sl.coordX, coordY: sl.coordY, note: sl.note,
      })),
      frecce: s.frecce.map(fr => ({
        startX: fr.startX, startY: fr.startY,
        endX: fr.endX, endY: fr.endY,
        colore: fr.colore, etichetta: fr.etichetta,
      })),
    };

    const op$ = s.id
      ? this.service.updateSchema(s.id, req)
      : this.service.createSchema(req);

    op$.subscribe({
      next: (saved) => {
        this.salvando.set(false);
        this.schemaAttivo.set(saved);
        this.caricaSchemi();
        this.toast('success', 'Schema salvato');
      },
      error: () => { this.salvando.set(false); this.toast('error', 'Salvataggio fallito'); },
    });
  }

  eliminaSchema(s: SchemaFormazione): void {
    this.confirmService.confirm({
      message: `Eliminare "${s.nome}"?`,
      header: 'Conferma',
      acceptLabel: 'Elimina',
      rejectLabel: 'Annulla',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.service.deleteSchema(s.id).subscribe({
          next: () => {
            if (this.schemaAttivo()?.id === s.id) this.schemaAttivo.set(null);
            this.caricaSchemi();
          },
        });
      },
    });
  }

  // Applica schema alla formazione attiva
  applicaSchema(s: SchemaFormazione): void {
    const f = this.formazioneAttiva();
    if (!f?.id) {
      this.toast('error', 'Salva prima la formazione');
      return;
    }
    this.confirmService.confirm({
      message: `Applicare "${s.nome}" a "${f.nome}"? Le posizioni attuali verranno sovrascritte.`,
      header: 'Applica schema',
      acceptLabel: 'Applica',
      rejectLabel: 'Annulla',
      accept: () => {
        this.service.applicaSchema(s.id, f.id).subscribe({
          next: (updated) => {
            this.formazioneAttiva.set(updated);
            this.cambiaTab('formazioni');
            this.toast('success', 'Schema applicato');
          },
          error: () => this.toast('error', 'Applicazione fallita'),
        });
      },
    });
  }

  private toast(severity: 'success' | 'error', detail: string): void {
    this.messageService.add({ severity, summary: severity === 'success' ? 'OK' : 'Errore', detail });
  }
}
