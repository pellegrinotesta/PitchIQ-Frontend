import { Component, ElementRef, EventEmitter, HostListener, inject, Input, Output, signal } from '@angular/core';
import { PosizioneCampo, GiocatoreDisponibile } from '../../core/model/formazione.model';

@Component({
  selector: 'app-campo-di-calcio',
  imports: [],
  templateUrl: './campo-di-calcio.html',
  styleUrl: './campo-di-calcio.scss',
})
export class CampoDiCalcio {
  @Input() posizioni: PosizioneCampo[] = [];
  @Input() modulo = '4-3-3';
  @Output() posizioniChange = new EventEmitter<PosizioneCampo[]>();
  @Output() moduloChange = new EventEmitter<string>();
  @Input() rosa: GiocatoreDisponibile[] = [];

  giocatoreSelezionato: PosizioneCampo | null = null;
  draggingPosizione: PosizioneCampo | null = null;
  pinAperto: PosizioneCampo | null = null;
  private el = inject(ElementRef);

  @HostListener('dragenter')
  onDragEnter(): void {
    (this.el.nativeElement as HTMLElement)
      .querySelector('.campo')?.setAttribute('data-dragging', '');
  }

  @HostListener('dragleave')
  onDragLeave(): void {
    (this.el.nativeElement as HTMLElement)
      .querySelector('.campo')?.removeAttribute('data-dragging');
  }

  // Mappa slot → categoria ruolo attesa
  private readonly SLOT_CATEGORIA: Record<string, string> = {
    'GK': 'PORTIERE',
    'CB': 'DIFENSORE', 'CB1': 'DIFENSORE', 'CB2': 'DIFENSORE', 'CB3': 'DIFENSORE',
    'LB': 'DIFENSORE', 'RB': 'DIFENSORE', 'LWB': 'DIFENSORE', 'RWB': 'DIFENSORE',
    'CM': 'CENTROCAMPISTA', 'CM1': 'CENTROCAMPISTA', 'CM2': 'CENTROCAMPISTA', 'CM3': 'CENTROCAMPISTA',
    'LM': 'CENTROCAMPISTA', 'RM': 'CENTROCAMPISTA', 'DM': 'CENTROCAMPISTA',
    'AM': 'CENTROCAMPISTA', 'LW': 'CENTROCAMPISTA', 'RW': 'CENTROCAMPISTA',
    'ST': 'ATTACCANTE', 'ST1': 'ATTACCANTE', 'ST2': 'ATTACCANTE', 'CF': 'ATTACCANTE',
  };

  // Determina la categoria della zona campo in base alla coordinata Y
  private getCategoriaZona(coordY: number): string {
    if (coordY >= 80) return 'PORTIERE';
    if (coordY >= 60) return 'DIFENSORE';
    if (coordY >= 35) return 'CENTROCAMPISTA';
    return 'ATTACCANTE';
  }

  // Verifica se il giocatore può essere posizionato in quella zona
  private isCompatibile(g: GiocatoreDisponibile, coordY: number): boolean {
    const zonaCategoria = this.getCategoriaZona(coordY);
    const ruoloCategoria = (g as any).categoriaRuolo ?? this.inferisciCategoria(g.ruolo);
    return zonaCategoria === ruoloCategoria;
  }

  private inferisciCategoria(ruolo: string): string {
    const portieri = ['POR'];
    const difensori = ['DC', 'TSD', 'TSS', 'LB'];
    const centrocampisti = ['CDC', 'CC', 'MOC', 'ALD', 'ALS', 'W'];
    const attaccanti = ['PC', 'SP', 'FW'];

    if (portieri.includes(ruolo)) return 'PORTIERE';
    if (difensori.includes(ruolo)) return 'DIFENSORE';
    if (centrocampisti.includes(ruolo)) return 'CENTROCAMPISTA';
    if (attaccanti.includes(ruolo)) return 'ATTACCANTE';
    return '';
  }

  // Notifica errore ruolo
  erroreRuolo = signal<string | null>(null);

  private mostraErroreRuolo(g: GiocatoreDisponibile, zona: string): void {
    this.erroreRuolo.set(`${g.cognome} (${g.ruolo}) non può giocare in ${zona}`);
    setTimeout(() => this.erroreRuolo.set(null), 3000);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onDropFromSidebar(event: DragEvent): void {
    event.preventDefault();

    const posizioneRaw = event.dataTransfer?.getData('posizione');
    if (posizioneRaw) { this.onDropPosizione(event); return; }

    const raw = event.dataTransfer?.getData('giocatore');
    if (!raw) return;

    const g: GiocatoreDisponibile = JSON.parse(raw);
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    // Blocca se già in campo
    if (this.posizioni.some(p => p.giocatoreId === g.id)) return;

    // Blocca se fuori ruolo
    if (!this.isCompatibile(g, y)) {
      const zona = this.getCategoriaZona(y);
      this.mostraErroreRuolo(g, zona);
      return;
    }

    // Blocca se già 11 giocatori in campo
    const titolari = this.posizioni.filter(p => p.titolare).length;
    if (titolari >= 11) {
      this.erroreRuolo.set('Hai già 11 giocatori in campo');
      setTimeout(() => this.erroreRuolo.set(null), 3000);
      return;
    }

    const nuovaPosizione: PosizioneCampo = {
      giocatoreId: g.id,
      nomeGiocatore: g.nome,
      cognomeGiocatore: g.cognome,
      numeroMaglia: g.numeroMaglia,
      coordX: Math.min(Math.max(x, 3), 97),
      coordY: Math.min(Math.max(y, 3), 97),
      slotRuolo: null,
      titolare: true,
    };

    const updated = [...this.posizioni, nuovaPosizione];
    this.posizioniChange.emit(updated);

    const riconosciuto = this.riconosciModulo(updated);
    if (riconosciuto && riconosciuto !== this.modulo) {
      this.moduloChange.emit(riconosciuto);
    }
  }

  onDropPosizione(event: DragEvent): void {
    event.preventDefault();
    if (!this.draggingPosizione) return;

    const el = (event.currentTarget as HTMLElement);
    const rect = el.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    // Trova il giocatore corrispondente nella rosa
    const giocatore = this.rosa.find(g => g.id === this.draggingPosizione!.giocatoreId);

    // Blocca se fuori ruolo
    if (giocatore && !this.isCompatibile(giocatore, y)) {
      const zona = this.getCategoriaZona(y);
      this.mostraErroreRuolo(giocatore, zona);
      this.draggingPosizione = null;
      return;
    }

    const updated = this.posizioni.map(p =>
      p.giocatoreId === this.draggingPosizione!.giocatoreId
        ? {
          ...p,
          coordX: Math.min(Math.max(x, 3), 97),
          coordY: Math.min(Math.max(y, 3), 97),
        }
        : p
    );

    this.draggingPosizione = null;
    this.posizioniChange.emit(updated);

    const riconosciuto = this.riconosciModulo(updated);
    if (riconosciuto && riconosciuto !== this.modulo) {
      this.moduloChange.emit(riconosciuto);
    }
  }

  onDragStartPosizione(event: DragEvent, p: PosizioneCampo): void {
    this.draggingPosizione = p;
    event.dataTransfer?.setData('posizione', JSON.stringify(p));
  }

  rimuoviGiocatore(p: PosizioneCampo): void {
    this.posizioniChange.emit(
      this.posizioni.filter(pos => pos.giocatoreId !== p.giocatoreId)
    );
  }

  private riconosciModulo(posizioni: PosizioneCampo[]): string | null {
    const titolari = posizioni.filter(p => p.titolare);
    if (titolari.length !== 11) return null;

    // il più basso nel campo è il portiere; il resto va da difesa ad attacco
    const outfield = [...titolari].sort((a, b) => b.coordY - a.coordY).slice(1);
    const ys = outfield.map(p => p.coordY);
    const soglia = (Math.max(...ys) - Math.min(...ys)) * 0.25;

    const linee: number[] = [];
    let somma = outfield[0].coordY;
    let n = 1;
    for (let i = 1; i < outfield.length; i++) {
      if (Math.abs(somma / n - outfield[i].coordY) > soglia) {
        linee.push(n);
        somma = outfield[i].coordY;
        n = 1;
      } else {
        somma += outfield[i].coordY;
        n++;
      }
    }
    linee.push(n);

    return linee.length >= 3 && linee.length <= 4 ? linee.join('-') : null;
  }


  togglePin(p: PosizioneCampo, event: MouseEvent): void {
    event.stopPropagation();
    this.pinAperto = this.pinAperto?.giocatoreId === p.giocatoreId ? null : p;
  }

  chiudiPin(): void {
    this.pinAperto = null;
  }

  slotToRuolo(slotRuolo: string | null): string | null {
    if (!slotRuolo) return null;
    const s = slotRuolo.toUpperCase();
    if (s === 'GK') return 'PORTIERE';
    if (['CB', 'CB1', 'CB2', 'CB3', 'LB', 'RB', 'LWB', 'RWB'].some(r => s.startsWith(r))) return 'DIFENSORE';
    if (['CM', 'CM1', 'CM2', 'CM3', 'LM', 'RM', 'DM', 'AM'].some(r => s.startsWith(r))) return 'CENTROCAMPISTA';
    if (['ST', 'ST1', 'ST2', 'LW', 'RW', 'CF'].some(r => s.startsWith(r))) return 'ATTACCANTE';
    return null;
  }

  giocatoriPerPin(p: PosizioneCampo): GiocatoreDisponibile[] {
    const ruolo = this.slotToRuolo(p.slotRuolo);
    const giàInCampo = new Set(this.posizioni.map(pos => pos.giocatoreId));

    return this.rosa.filter(g =>
      (!ruolo || g.ruolo === ruolo) &&
      (g.id === p.giocatoreId || !giàInCampo.has(g.id))
    );
  }

  cambiaGiocatore(pin: PosizioneCampo, nuovoGiocatore: GiocatoreDisponibile): void {
    const updated = this.posizioni.map(p =>
      p.giocatoreId === pin.giocatoreId
        ? {
          ...p,
          giocatoreId: nuovoGiocatore.id,
          nomeGiocatore: nuovoGiocatore.nome,
          cognomeGiocatore: nuovoGiocatore.cognome,
          numeroMaglia: nuovoGiocatore.numeroMaglia,
        }
        : p
    );
    this.pinAperto = null;
    this.posizioniChange.emit(updated);
  }
}