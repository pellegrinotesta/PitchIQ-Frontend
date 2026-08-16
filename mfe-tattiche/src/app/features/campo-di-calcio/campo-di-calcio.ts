import { Component, EventEmitter, Input, Output } from '@angular/core';
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

  giocatoreSelezionato: PosizioneCampo | null = null;
  draggingPosizione: PosizioneCampo | null = null;

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onDropFromSidebar(event: DragEvent): void {
    event.preventDefault();

    // Se è un riposizionamento di un pin esistente, gestiscilo separatamente
    const posizioneRaw = event.dataTransfer?.getData('posizione');
    if (posizioneRaw) {
      this.onDropPosizione(event);
      return;
    }

    const raw = event.dataTransfer?.getData('giocatore');
    if (!raw) return;

    const g: GiocatoreDisponibile = JSON.parse(raw);
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    const esisteGia = this.posizioni.some(p => p.giocatoreId === g.id);
    if (esisteGia) return;

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

    this.posizioniChange.emit([...this.posizioni, nuovaPosizione]);
  }

  onDropPosizione(event: DragEvent): void {
    event.preventDefault();
    if (!this.draggingPosizione) return;

    // Calcola le coordinate rispetto al campo
    const el = (event.currentTarget as HTMLElement);
    const rect = el.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

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
  }

  onDragStartPosizione(event: DragEvent, p: PosizioneCampo): void {
    this.draggingPosizione = p;
    event.dataTransfer?.setData('posizione', JSON.stringify(p));
  }


  rimuoviGiocatore(p: PosizioneCampo): void {
    this.posizioniChange.emit(this.posizioni.filter(pos => pos.giocatoreId !== p.giocatoreId));
  }
}
