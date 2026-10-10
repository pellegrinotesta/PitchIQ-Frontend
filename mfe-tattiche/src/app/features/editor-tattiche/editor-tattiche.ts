import { Component, inject, OnInit, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { DynamicDialogModule, DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { ConfirmationService as CS } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { FormsModule } from '@angular/forms';
import { CampoDiCalcio } from '../campo-di-calcio/campo-di-calcio';
import { Formazione, GiocatoreDisponibile, PosizioneCampo } from '../../core/model/formazione.model';
import { FormazioneService } from '../../core/services/formazione.service';
import { SchemaFormazione, SlotSchema, FrecciaSchema } from '../../core/model/schema.model';
import { CampoSchema } from '../campo-schema/campo-schema';
import { ConfirmService } from '../confirm-dialog/confirm.service';

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
    CampoSchema],
  providers: [MessageService, DialogService, ConfirmService],
  templateUrl: './editor-tattiche.html',
  styleUrl: './editor-tattiche.scss',
})
export class EditorTattiche implements OnInit {
  private service = inject(FormazioneService);
  private messageService = inject(MessageService);
  private confirmService = inject(ConfirmService);

  // Tab attivo
  tabAttivo: 'formazioni' | 'schemi' = 'formazioni';
  readonly history = history;

  // Formazioni
  formazioni = signal<Formazione[]>([]);
  formazioneAttiva = signal<Formazione | null>(null);
  rosa = signal<GiocatoreDisponibile[]>([]);
  moduloSuggerito = signal<string | null>(null);

  // Schemi
  schemi = signal<SchemaFormazione[]>([]);
  schemaAttivo = signal<SchemaFormazione | null>(null);

  loading = signal(false);
  salvando = signal(false);

  readonly moduliOptions = [
    '4-3-3', '4-4-2', '4-2-3-1', '3-5-2', '5-3-2', '3-4-3'
  ];

  // Coordinate standard per modulo (coordX, coordY, slotRuolo)
  private readonly POSIZIONI_MODULO: Record<string, { coordX: number; coordY: number; slotRuolo: string; categoria: string }[]> = {
    '4-3-3': [
      { coordX: 50, coordY: 88, slotRuolo: 'GK', categoria: 'PORTIERE' },
      { coordX: 20, coordY: 72, slotRuolo: 'LB', categoria: 'DIFENSORE' },
      { coordX: 38, coordY: 75, slotRuolo: 'CB1', categoria: 'DIFENSORE' },
      { coordX: 62, coordY: 75, slotRuolo: 'CB2', categoria: 'DIFENSORE' },
      { coordX: 80, coordY: 72, slotRuolo: 'RB', categoria: 'DIFENSORE' },
      { coordX: 25, coordY: 50, slotRuolo: 'CM1', categoria: 'CENTROCAMPISTA' },
      { coordX: 50, coordY: 44, slotRuolo: 'CM2', categoria: 'CENTROCAMPISTA' },
      { coordX: 75, coordY: 50, slotRuolo: 'CM3', categoria: 'CENTROCAMPISTA' },
      { coordX: 18, coordY: 20, slotRuolo: 'LW', categoria: 'CENTROCAMPISTA' },
      { coordX: 50, coordY: 14, slotRuolo: 'ST', categoria: 'ATTACCANTE' },
      { coordX: 82, coordY: 20, slotRuolo: 'RW', categoria: 'CENTROCAMPISTA' },
    ],
    '4-4-2': [
      { coordX: 50, coordY: 88, slotRuolo: 'GK', categoria: 'PORTIERE' },
      { coordX: 15, coordY: 72, slotRuolo: 'LB', categoria: 'DIFENSORE' },
      { coordX: 38, coordY: 75, slotRuolo: 'CB1', categoria: 'DIFENSORE' },
      { coordX: 62, coordY: 75, slotRuolo: 'CB2', categoria: 'DIFENSORE' },
      { coordX: 85, coordY: 72, slotRuolo: 'RB', categoria: 'DIFENSORE' },
      { coordX: 15, coordY: 50, slotRuolo: 'LM', categoria: 'CENTROCAMPISTA' },
      { coordX: 38, coordY: 52, slotRuolo: 'CM1', categoria: 'CENTROCAMPISTA' },
      { coordX: 62, coordY: 52, slotRuolo: 'CM2', categoria: 'CENTROCAMPISTA' },
      { coordX: 85, coordY: 50, slotRuolo: 'RM', categoria: 'CENTROCAMPISTA' },
      { coordX: 35, coordY: 18, slotRuolo: 'ST1', categoria: 'ATTACCANTE' },
      { coordX: 65, coordY: 18, slotRuolo: 'ST2', categoria: 'ATTACCANTE' },
    ],
    '4-2-3-1': [
      { coordX: 50, coordY: 88, slotRuolo: 'GK', categoria: 'PORTIERE' },
      { coordX: 15, coordY: 72, slotRuolo: 'LB', categoria: 'DIFENSORE' },
      { coordX: 38, coordY: 75, slotRuolo: 'CB1', categoria: 'DIFENSORE' },
      { coordX: 62, coordY: 75, slotRuolo: 'CB2', categoria: 'DIFENSORE' },
      { coordX: 85, coordY: 72, slotRuolo: 'RB', categoria: 'DIFENSORE' },
      { coordX: 35, coordY: 57, slotRuolo: 'DM1', categoria: 'CENTROCAMPISTA' },
      { coordX: 65, coordY: 57, slotRuolo: 'DM2', categoria: 'CENTROCAMPISTA' },
      { coordX: 18, coordY: 35, slotRuolo: 'LW', categoria: 'CENTROCAMPISTA' },
      { coordX: 50, coordY: 32, slotRuolo: 'AM', categoria: 'CENTROCAMPISTA' },
      { coordX: 82, coordY: 35, slotRuolo: 'RW', categoria: 'CENTROCAMPISTA' },
      { coordX: 50, coordY: 14, slotRuolo: 'ST', categoria: 'ATTACCANTE' },
    ],
    '3-5-2': [
      { coordX: 50, coordY: 88, slotRuolo: 'GK', categoria: 'PORTIERE' },
      { coordX: 25, coordY: 74, slotRuolo: 'CB1', categoria: 'DIFENSORE' },
      { coordX: 50, coordY: 76, slotRuolo: 'CB2', categoria: 'DIFENSORE' },
      { coordX: 75, coordY: 74, slotRuolo: 'CB3', categoria: 'DIFENSORE' },
      { coordX: 10, coordY: 52, slotRuolo: 'LWB', categoria: 'CENTROCAMPISTA' },
      { coordX: 30, coordY: 48, slotRuolo: 'CM1', categoria: 'CENTROCAMPISTA' },
      { coordX: 50, coordY: 44, slotRuolo: 'CM2', categoria: 'CENTROCAMPISTA' },
      { coordX: 70, coordY: 48, slotRuolo: 'CM3', categoria: 'CENTROCAMPISTA' },
      { coordX: 90, coordY: 52, slotRuolo: 'RWB', categoria: 'CENTROCAMPISTA' },
      { coordX: 35, coordY: 18, slotRuolo: 'ST1', categoria: 'ATTACCANTE' },
      { coordX: 65, coordY: 18, slotRuolo: 'ST2', categoria: 'ATTACCANTE' },
    ],
    '5-3-2': [
      { coordX: 50, coordY: 88, slotRuolo: 'GK', categoria: 'PORTIERE' },
      { coordX: 10, coordY: 68, slotRuolo: 'LWB', categoria: 'DIFENSORE' },
      { coordX: 28, coordY: 74, slotRuolo: 'CB1', categoria: 'DIFENSORE' },
      { coordX: 50, coordY: 76, slotRuolo: 'CB2', categoria: 'DIFENSORE' },
      { coordX: 72, coordY: 74, slotRuolo: 'CB3', categoria: 'DIFENSORE' },
      { coordX: 90, coordY: 68, slotRuolo: 'RWB', categoria: 'DIFENSORE' },
      { coordX: 25, coordY: 48, slotRuolo: 'CM1', categoria: 'CENTROCAMPISTA' },
      { coordX: 50, coordY: 44, slotRuolo: 'CM2', categoria: 'CENTROCAMPISTA' },
      { coordX: 75, coordY: 48, slotRuolo: 'CM3', categoria: 'CENTROCAMPISTA' },
      { coordX: 35, coordY: 18, slotRuolo: 'ST1', categoria: 'ATTACCANTE' },
      { coordX: 65, coordY: 18, slotRuolo: 'ST2', categoria: 'ATTACCANTE' },
    ],
    '3-4-3': [
      { coordX: 50, coordY: 88, slotRuolo: 'GK', categoria: 'PORTIERE' },
      { coordX: 25, coordY: 74, slotRuolo: 'CB1', categoria: 'DIFENSORE' },
      { coordX: 50, coordY: 76, slotRuolo: 'CB2', categoria: 'DIFENSORE' },
      { coordX: 75, coordY: 74, slotRuolo: 'CB3', categoria: 'DIFENSORE' },
      { coordX: 15, coordY: 52, slotRuolo: 'LM', categoria: 'CENTROCAMPISTA' },
      { coordX: 38, coordY: 50, slotRuolo: 'CM1', categoria: 'CENTROCAMPISTA' },
      { coordX: 62, coordY: 50, slotRuolo: 'CM2', categoria: 'CENTROCAMPISTA' },
      { coordX: 85, coordY: 52, slotRuolo: 'RM', categoria: 'CENTROCAMPISTA' },
      { coordX: 18, coordY: 20, slotRuolo: 'LW', categoria: 'CENTROCAMPISTA' },
      { coordX: 50, coordY: 14, slotRuolo: 'ST', categoria: 'ATTACCANTE' },
      { coordX: 82, coordY: 20, slotRuolo: 'RW', categoria: 'CENTROCAMPISTA' },
    ],
  };

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
    if (!f) return;

    if (f.posizioni.length === 0) {
      this.formazioneAttiva.set({ ...f, modulo });
      return;
    }

    const nuoveCoordinate = this.POSIZIONI_MODULO[modulo];
    if (!nuoveCoordinate) {
      this.formazioneAttiva.set({ ...f, modulo });
      return;
    }

    // Raggruppa per categoria leggendo dalla rosa
    const giocatoriPerCategoria: Record<string, PosizioneCampo[]> = {
      PORTIERE: [], DIFENSORE: [], CENTROCAMPISTA: [], ATTACCANTE: [],
    };

    f.posizioni.forEach(p => {
      const g = this.rosa().find(r => r.id === p.giocatoreId);
      if (!g) return;

      // Inferisci categoria dal ruolo
      const categoria = this.inferisciCategoria(g.ruolo);
      if (giocatoriPerCategoria[categoria]) {
        giocatoriPerCategoria[categoria].push(p);
      }
    });

    const contatori: Record<string, number> = {
      PORTIERE: 0, DIFENSORE: 0, CENTROCAMPISTA: 0, ATTACCANTE: 0,
    };

    const nuovePosizioni: PosizioneCampo[] = nuoveCoordinate.map(slot => {
      const giocatoriCategoria = giocatoriPerCategoria[slot.categoria] ?? [];
      const indice = contatori[slot.categoria] ?? 0;
      const giocatore = giocatoriCategoria[indice];
      contatori[slot.categoria] = indice + 1;

      if (!giocatore) return null;

      return {
        ...giocatore,
        coordX: slot.coordX,
        coordY: slot.coordY,
        slotRuolo: slot.slotRuolo as string | null,
      } as PosizioneCampo;
    }).filter((p): p is PosizioneCampo => p !== null);

    this.formazioneAttiva.set({ ...f, modulo, posizioni: nuovePosizioni });
    this.moduloSuggerito.set(null);
  }

  // Aggiungi questo metodo nel componente
  private inferisciCategoria(ruolo: string): string {
    const portieri = ['POR'];
    const difensori = ['DC', 'TSD', 'TSS', 'LB'];
    const centrocampisti = ['CDC', 'CC', 'MOC', 'ALD', 'ALS', 'W'];
    const attaccanti = ['PC', 'SP', 'FW'];

    if (portieri.includes(ruolo)) return 'PORTIERE';
    if (difensori.includes(ruolo)) return 'DIFENSORE';
    if (centrocampisti.includes(ruolo)) return 'CENTROCAMPISTA';
    if (attaccanti.includes(ruolo)) return 'ATTACCANTE';
    return 'CENTROCAMPISTA';
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
    this.confirmService.conferma({
      header: 'Elimina formazione',
      messaggio: `Eliminare "${f.nome}"? L'operazione non può essere annullata.`,
      labelConferma: 'Elimina',
      labelAnnulla: 'Annulla',
      pericoloso: true,
    }).subscribe(confermato => {
      if (!confermato) return;
      this.service.delete(f.id).subscribe({
        next: () => {
          if (this.formazioneAttiva()?.id === f.id) this.formazioneAttiva.set(null);
          this.caricaFormazioni();
        },
      });
    });
  }

  onModuloSuggerito(modulo: string): void {
    this.moduloSuggerito.set(modulo);
  }

  accettaModuloSuggerito(): void {
    const m = this.moduloSuggerito();
    if (m) {
      this.onModuloChange(m);
      this.moduloSuggerito.set(null);
    }
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
    this.confirmService.conferma({
      messaggio: `Eliminare "${s.nome}"? L'operazione non può essere annullata.`,
      header: 'Conferma',
      labelConferma: 'Elimina',
      labelAnnulla: 'Annulla',
      pericoloso: true,
    }).subscribe(confermato => {
      if (!confermato) return;
      this.service.delete(s.id).subscribe({
        next: () => {
          if (this.schemaAttivo()?.id === s.id) this.schemaAttivo.set(null);
          this.caricaSchemi();
        },
      });
    });
  }

  // Applica schema alla formazione attiva
  applicaSchema(s: SchemaFormazione): void {
    const f = this.formazioneAttiva();
    if (!f?.id) {
      this.toast('error', 'Salva prima la formazione');
      return;
    }
    this.confirmService.conferma({
      messaggio: `Applicare "${s.nome}" a "${f.nome}"? Le posizioni attuali verranno sovrascritte.`,
      header: 'Applica schema',
      labelConferma: 'Applica',
      labelAnnulla: 'Annulla',
      pericoloso: false,
    }).subscribe(confermato => {
      if (!confermato) return;
      this.service.applicaSchema(s.id, f.id).subscribe({
        next: (updated) => {
          this.formazioneAttiva.set(updated);
          this.cambiaTab('formazioni');
          this.toast('success', 'Schema applicato');
        },
        error: () => this.toast('error', 'Applicazione fallita'),
      });
    });
  }

  private toast(severity: 'success' | 'error', detail: string): void {
    this.messageService.add({ severity, summary: severity === 'success' ? 'OK' : 'Errore', detail });
  }
}
