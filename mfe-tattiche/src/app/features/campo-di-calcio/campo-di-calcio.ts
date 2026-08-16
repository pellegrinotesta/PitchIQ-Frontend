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
  @Output() moduloChange = new EventEmitter<string>();

  giocatoreSelezionato: PosizioneCampo | null = null;
  draggingPosizione: PosizioneCampo | null = null;

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onDropFromSidebar(event: DragEvent): void {
    event.preventDefault();

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

    const updated = [...this.posizioni, nuovaPosizione];
    this.posizioniChange.emit(updated);

    const moduloRiconosciuto = this.riconosciModulo(updated);
    if (moduloRiconosciuto !== this.modulo) {
      this.moduloChange.emit(moduloRiconosciuto);
    }
  }

  onDropPosizione(event: DragEvent): void {
    event.preventDefault();
    if (!this.draggingPosizione) return;

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

    const moduloRiconosciuto = this.riconosciModulo(updated);
    if (moduloRiconosciuto !== this.modulo) {
      this.moduloChange.emit(moduloRiconosciuto);
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

  private riconosciModulo(posizioni: PosizioneCampo[]): string {
    
    const titolari = posizioni.filter(p =>
      p.titolare &&
      p.giocatoreId != null &&
      p.cognomeGiocatore &&
      p.cognomeGiocatore.trim() !== ''
    );

    if (titolari.length < 10) return this.modulo;

    // Ordina per Y decrescente (portiere in fondo = Y maggiore)
    const ordinati = [...titolari].sort((a, b) => b.coordY - a.coordY);

    // Il portiere è sempre il più in basso
    const [, ...outfield] = ordinati;

    if (outfield.length < 9) return this.modulo;

    // Soglia adattiva: usa il 20% del range Y totale
    const yMin = Math.min(...outfield.map(p => p.coordY));
    const yMax = Math.max(...outfield.map(p => p.coordY));
    const soglia = (yMax - yMin) * 0.25;

    // Clustering gerarchico agglomerativo
    const linee: PosizioneCampo[][] = [];
    let lineaCorrente: PosizioneCampo[] = [outfield[0]];
    const mediaY = (l: PosizioneCampo[]) =>
      l.reduce((s, p) => s + p.coordY, 0) / l.length;

    for (let i = 1; i < outfield.length; i++) {
      const diffY = Math.abs(mediaY(lineaCorrente) - outfield[i].coordY);
      if (diffY > soglia) {
        linee.push([...lineaCorrente]);
        lineaCorrente = [outfield[i]];
      } else {
        lineaCorrente.push(outfield[i]);
      }
    }
    linee.push(lineaCorrente);

    // Se troppo frammentato (es 5+ linee per 10 giocatori), aumenta soglia
    if (linee.length > 4) {
      return this.riconosciConSogliaFissa(outfield, soglia * 1.5);
    }

    return linee.map(l => l.length).join('-');
  }

  private riconosciConSogliaFissa(
    outfield: PosizioneCampo[],
    soglia: number
  ): string {
    const linee: PosizioneCampo[][] = [];
    let lineaCorrente: PosizioneCampo[] = [outfield[0]];
    const mediaY = (l: PosizioneCampo[]) =>
      l.reduce((s, p) => s + p.coordY, 0) / l.length;

    for (let i = 1; i < outfield.length; i++) {
      if (Math.abs(mediaY(lineaCorrente) - outfield[i].coordY) > soglia) {
        linee.push([...lineaCorrente]);
        lineaCorrente = [outfield[i]];
      } else {
        lineaCorrente.push(outfield[i]);
      }
    }
    linee.push(lineaCorrente);
    return linee.map(l => l.length).join('-');
  }
}