/**
 * Trascinamento di giocatori tra rosa, panchina e campo con pointer events (mouse, penna e dito).
 * Sostituisce il drag & drop HTML5, che sui tablet non funziona.
 *
 * Chi si trascina usa la direttiva [appTrascina]; chi riceve marca l'elemento con
 * data-rilascio-campo, data-rilascio-pin="<giocatoreId>" o data-rilascio-panchina
 * e ascolta rilascio$ dal servizio.
 */
import { DestroyRef, Directive, ElementRef, Injectable, NgZone, inject, input, signal } from '@angular/core';
import { Subject } from 'rxjs';

export type Origine = 'rosa' | 'panchina' | 'campo';

export interface ElementoTrascinato {
  giocatoreId: number;
  origine: Origine;
  etichetta: string;
  numero: number | null;
}

export type Bersaglio =
  | { tipo: 'pin'; giocatoreId: number }
  | { tipo: 'campo'; x: number; y: number; elemento: HTMLElement }
  | { tipo: 'panchina' };

export interface Rilascio {
  elemento: ElementoTrascinato;
  bersaglio: Bersaglio;
}

@Injectable()
export class TrascinamentoService {
  readonly attivo = signal<(ElementoTrascinato & { x: number; y: number }) | null>(null);
  readonly sopra = signal<Bersaglio['tipo'] | null>(null);
  private readonly rilasci = new Subject<Rilascio>();
  readonly rilascio$ = this.rilasci.asObservable();

  inizia(elemento: ElementoTrascinato, x: number, y: number): void {
    this.attivo.set({ ...elemento, x, y });
    this.sopra.set(this.bersaglio(x, y)?.tipo ?? null);
  }

  muovi(x: number, y: number): void {
    const a = this.attivo();
    if (!a) return;
    this.attivo.set({ ...a, x, y });
    this.sopra.set(this.bersaglio(x, y)?.tipo ?? null);
  }

  termina(x: number, y: number): void {
    const a = this.attivo();
    this.annulla();
    if (!a) return;
    const bersaglio = this.bersaglio(x, y);
    if (bersaglio) {
      const { x: _x, y: _y, ...elemento } = a;
      this.rilasci.next({ elemento, bersaglio });
    }
  }

  annulla(): void {
    this.attivo.set(null);
    this.sopra.set(null);
  }

  /** Cosa c'è sotto il punto: un titolare, il campo (con coordinate in %) o la panchina. */
  bersaglio(x: number, y: number): Bersaglio | null {
    const sotto = document.elementFromPoint(x, y) as HTMLElement | null;
    if (!sotto) return null;
    const pin = sotto.closest<HTMLElement>('[data-rilascio-pin]');
    if (pin) return { tipo: 'pin', giocatoreId: Number(pin.dataset['rilascioPin']) };
    const campo = sotto.closest<HTMLElement>('[data-rilascio-campo]');
    if (campo) {
      const r = campo.getBoundingClientRect();
      return {
        tipo: 'campo',
        x: Math.min(Math.max(((x - r.left) / r.width) * 100, 3), 97),
        y: Math.min(Math.max(((y - r.top) / r.height) * 100, 3), 97),
        elemento: campo,
      };
    }
    return sotto.closest('[data-rilascio-panchina]') ? { tipo: 'panchina' } : null;
  }
}

/** Soglia di movimento oltre la quale (mouse/penna) parte il trascinamento: sotto è un clic. */
export const SOGLIA_PX = 6;
/** Con il dito, in elenchi scorrevoli, il trascinamento parte dopo una pressione prolungata. */
export const PRESSIONE_MS = 280;

@Directive({
  selector: '[appTrascina]',
  host: {
    '(pointerdown)': 'giu($event)',
    '[class.trascinato]': 'inCorso()',
  },
})
export class Trascina {
  /** Cosa si trascina. */
  readonly appTrascina = input.required<ElementoTrascinato>();
  /** Con il dito: attesa prima di iniziare (0 = subito, per elementi dove non serve scorrere, es. il campo). */
  readonly ritardoTocco = input(PRESSIONE_MS);

  private readonly servizio = inject(TrascinamentoService);
  private readonly zona = inject(NgZone);
  private readonly host = inject(ElementRef<HTMLElement>);
  protected readonly inCorso = signal(false);

  private inizio = { x: 0, y: 0 };
  private timer?: ReturnType<typeof setTimeout>;
  private pulizia: (() => void)[] = [];

  constructor() {
    inject(DestroyRef).onDestroy(() => this.fine());
  }

  protected giu(event: PointerEvent): void {
    if (event.button !== 0 && event.pointerType === 'mouse') return;
    this.fine();
    this.inizio = { x: event.clientX, y: event.clientY };
    const tocco = event.pointerType === 'touch';

    const muovi = (e: PointerEvent) => {
      if (this.inCorso()) {
        this.servizio.muovi(e.clientX, e.clientY);
        return;
      }
      const spostato = Math.hypot(e.clientX - this.inizio.x, e.clientY - this.inizio.y) > SOGLIA_PX;
      if (!spostato) return;
      // dito che si muove prima della pressione prolungata: è uno scorrimento, non un trascinamento
      if (tocco && this.ritardoTocco() > 0) this.fine();
      else this.avvia(e.clientX, e.clientY);
    };
    const su = (e: PointerEvent) => {
      if (this.inCorso()) {
        this.servizio.termina(e.clientX, e.clientY);
        this.sopprimiClic();
      }
      this.fine();
    };
    const annulla = () => {
      if (this.inCorso()) this.servizio.annulla();
      this.fine();
    };

    document.addEventListener('pointermove', muovi);
    document.addEventListener('pointerup', su);
    document.addEventListener('pointercancel', annulla);
    this.pulizia.push(
      () => document.removeEventListener('pointermove', muovi),
      () => document.removeEventListener('pointerup', su),
      () => document.removeEventListener('pointercancel', annulla),
    );

    if (tocco) {
      // registrato subito e non passivo: così ogni touchmove è annullabile e, una volta partito il
      // trascinamento, la pagina non scorre (e il browser non lo interrompe con pointercancel)
      const blocca = (e: TouchEvent) => { if (this.inCorso()) e.preventDefault(); };
      // la pressione prolungata su Android apre il menu contestuale, che interromperebbe il gesto
      const noMenu = (e: Event) => e.preventDefault();
      document.addEventListener('touchmove', blocca, { passive: false });
      this.host.nativeElement.addEventListener('contextmenu', noMenu);
      this.pulizia.push(
        () => document.removeEventListener('touchmove', blocca),
        () => this.host.nativeElement.removeEventListener('contextmenu', noMenu),
      );
    }

    if (tocco && this.ritardoTocco() > 0) {
      this.timer = setTimeout(() => this.zona.run(() => this.avvia(this.inizio.x, this.inizio.y)), this.ritardoTocco());
    }
  }

  private avvia(x: number, y: number): void {
    if (this.inCorso()) return;
    clearTimeout(this.timer);
    this.inCorso.set(true);
    navigator.vibrate?.(8);
    this.servizio.inizia(this.appTrascina(), x, y);
  }

  /** Dopo un trascinamento il browser genera un clic sull'elemento: non deve aprire menu o selezioni. */
  private sopprimiClic(): void {
    const el = this.host.nativeElement as HTMLElement;
    const blocca = (e: Event) => { e.stopPropagation(); e.preventDefault(); };
    el.addEventListener('click', blocca, { capture: true, once: true });
    setTimeout(() => el.removeEventListener('click', blocca, { capture: true }), 0);
  }

  private fine(): void {
    clearTimeout(this.timer);
    this.inCorso.set(false);
    this.pulizia.forEach(f => f());
    this.pulizia = [];
  }
}
