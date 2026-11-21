import { Component, ElementRef, EventEmitter, inject, Input, Output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ElementoTrascinato, Rilascio, Trascina, TrascinamentoService } from '../../core/trascinamento';
import { PosizioneCampo, GiocatoreDisponibile } from '../../core/model/formazione.model';
import { NOME_REPARTO, distanzaRuolo, fuoriReparto, repartoSlot, repartoZona } from '../../core/ruoli';
import { inCampo, rimuovi, scambia } from '../../core/movimenti-rosa';

@Component({
  selector: 'app-campo-di-calcio',
  imports: [Trascina],
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
  pinAperto: PosizioneCampo | null = null;

  /** In campo si disegnano solo i titolari: la panchina ha il suo riquadro sotto il campo. */
  get titolari(): PosizioneCampo[] {
    return this.posizioni.filter(p => p.titolare);
  }

  private emetti(posizioni: PosizioneCampo[]): void {
    this.posizioniChange.emit(posizioni);
    const riconosciuto = this.riconosciModulo(posizioni);
    if (riconosciuto && riconosciuto !== this.modulo) this.moduloChange.emit(riconosciuto);
  }

  /** Trascinamento con pointer events (mouse, penna, dito): opzionale per usare il campo anche da solo. */
  private readonly trascinamento = inject(TrascinamentoService, { optional: true });

  constructor() {
    this.trascinamento?.rilascio$.pipe(takeUntilDestroyed()).subscribe(r => this.onRilascio(r));
  }

  /** Durante un trascinamento si mostrano le zone dei reparti. */
  get trascinamentoAttivo(): boolean {
    return !!this.trascinamento?.attivo();
  }

  elementoPin(p: PosizioneCampo): ElementoTrascinato {
    return { giocatoreId: p.giocatoreId, origine: 'campo', etichetta: p.cognomeGiocatore, numero: p.numeroMaglia };
  }

  /**
   * Rilascio sul campo: dalla rosa o dalla panchina entra in campo, un titolare si sposta.
   * Rilascio su un titolare: cambio (dalla panchina o dalla rosa) o scambio di posizione tra titolari.
   */
  private onRilascio({ elemento, bersaglio }: Rilascio): void {
    const g = this.rosa.find(r => r.id === elemento.giocatoreId);
    if (!g) return;
    if (bersaglio.tipo === 'pin') {
      const titolare = this.titolari.find(p => p.giocatoreId === bersaglio.giocatoreId);
      if (!titolare || titolare.giocatoreId === g.id) return;
      this.avvisaSeFuoriReparto(g, titolare.coordY);
      this.emetti(scambia(this.posizioni, titolare.giocatoreId, g));
      return;
    }
    if (bersaglio.tipo !== 'campo' || !this.el.nativeElement.contains(bersaglio.elemento)) return;
    const esito = inCampo(this.posizioni, g, bersaglio.x, bersaglio.y);
    if ('errore' in esito) {
      this.mostraAvviso(esito.errore, 'errore');
      return;
    }
    this.avvisaSeFuoriReparto(g, bersaglio.y);
    this.emetti(esito.posizioni);
  }

  private el = inject(ElementRef);

  /** Avviso temporaneo: "info" per i suggerimenti (fuori reparto), "errore" per i limiti veri (11 in campo). */
  avviso = signal<{ testo: string; tipo: 'info' | 'errore' } | null>(null);
  private timerAvviso?: ReturnType<typeof setTimeout>;

  private mostraAvviso(testo: string, tipo: 'info' | 'errore'): void {
    clearTimeout(this.timerAvviso);
    this.avviso.set({ testo, tipo });
    this.timerAvviso = setTimeout(() => this.avviso.set(null), 3500);
  }

  private ruoloDi(giocatoreId: number): string | null {
    return this.rosa.find(g => g.id === giocatoreId)?.ruolo ?? null;
  }

  /** Il giocatore è in una zona del campo lontana dai suoi reparti naturali (solo avviso, non vietato). */
  fuoriRuolo(p: PosizioneCampo): boolean {
    return fuoriReparto(this.ruoloDi(p.giocatoreId), repartoZona(p.coordY));
  }

  private avvisaSeFuoriReparto(g: { cognome: string; ruolo: string | null }, coordY: number): void {
    const zona = repartoZona(coordY);
    if (fuoriReparto(g.ruolo, zona)) {
      this.mostraAvviso(`${g.cognome} (${g.ruolo}) gioca fuori reparto, in ${NOME_REPARTO[zona]}`, 'info');
    }
  }

  rimuoviGiocatore(p: PosizioneCampo): void {
    this.posizioniChange.emit(rimuovi(this.posizioni, p.giocatoreId));
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

  /** Reparto del pin: quello dello slot del modulo, altrimenti quello della zona in cui si trova. */
  repartoPin(p: PosizioneCampo) {
    return repartoSlot(p.slotRuolo) ?? repartoZona(p.coordY);
  }

  titoloPin(p: PosizioneCampo): string {
    return `Ruolo: ${NOME_REPARTO[this.repartoPin(p)]}`;
  }

  /** Rosa e panchina, esclusi gli altri titolari: prima i ruoli adatti al reparto, poi gli altri. */
  giocatoriPerPin(p: PosizioneCampo): GiocatoreDisponibile[] {
    const reparto = this.repartoPin(p);
    const giaInCampo = new Set(this.titolari.map(pos => pos.giocatoreId));
    return this.rosa
      .filter(g => g.id === p.giocatoreId || !giaInCampo.has(g.id))
      .sort((a, b) => distanzaRuolo(a.ruolo, reparto) - distanzaRuolo(b.ruolo, reparto)
        || a.cognome.localeCompare(b.cognome));
  }

  altroRuolo(p: PosizioneCampo, g: GiocatoreDisponibile): boolean {
    return fuoriReparto(g.ruolo, this.repartoPin(p));
  }

  inPanchinaIds(): Set<number> {
    return new Set(this.posizioni.filter(p => !p.titolare).map(p => p.giocatoreId));
  }

  /** Scelta dal menu del pin: se il nuovo giocatore è in panchina è un cambio, l'uscente va in panchina. */
  cambiaGiocatore(pin: PosizioneCampo, nuovoGiocatore: GiocatoreDisponibile): void {
    this.pinAperto = null;
    this.posizioniChange.emit(scambia(this.posizioni, pin.giocatoreId, nuovoGiocatore));
  }
}
