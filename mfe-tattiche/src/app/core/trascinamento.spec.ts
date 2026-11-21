import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { PRESSIONE_MS, Rilascio, Trascina, TrascinamentoService } from './trascinamento';

@Component({
  imports: [Trascina],
  providers: [TrascinamentoService],
  template: `
    <div class="sorgente" [appTrascina]="{ giocatoreId: 70, origine: 'rosa', etichetta: 'Russo', numero: 10 }" (click)="clic = clic + 1">Russo</div>
    <div class="campo" data-rilascio-campo><span class="pin" data-rilascio-pin="53">Izzo</span></div>
    <div class="panchina" data-rilascio-panchina></div>`,
})
class Banco {
  clic = 0;
}

/** jsdom non ha PointerEvent: MouseEvent con pointerType. */
function pointer(bersaglio: EventTarget, tipo: string, x: number, y: number, pointerType = 'mouse'): void {
  const e = new MouseEvent(tipo, { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0 });
  Object.defineProperty(e, 'pointerType', { value: pointerType });
  bersaglio.dispatchEvent(e);
}

describe('trascinamento con pointer events', () => {
  let fixture: ComponentFixture<Banco>;
  let servizio: TrascinamentoService;
  let rilasci: Rilascio[];
  let sorgente: HTMLElement;
  let sotto: HTMLElement | null;

  beforeEach(() => {
    fixture = TestBed.createComponent(Banco);
    fixture.detectChanges();
    servizio = fixture.debugElement.injector.get(TrascinamentoService);
    rilasci = [];
    servizio.rilascio$.subscribe(r => rilasci.push(r));
    sorgente = fixture.nativeElement.querySelector('.sorgente');
    const campo = fixture.nativeElement.querySelector('.campo') as HTMLElement;
    campo.getBoundingClientRect = () => ({ left: 100, top: 0, width: 200, height: 400, right: 300, bottom: 400, x: 100, y: 0, toJSON: () => ({}) });
    sotto = null;
    document.elementFromPoint = () => sotto;
  });

  afterEach(() => vi.useRealTimers());

  it('col mouse parte oltre la soglia e il rilascio sul campo dà le coordinate in %', () => {
    pointer(sorgente, 'pointerdown', 10, 10);
    pointer(document, 'pointermove', 12, 11); // sotto soglia: ancora un clic
    expect(servizio.attivo()).toBeNull();

    sotto = fixture.nativeElement.querySelector('.campo');
    pointer(document, 'pointermove', 200, 100);
    expect(servizio.attivo()).toMatchObject({ giocatoreId: 70, x: 200, y: 100 });
    expect(servizio.sopra()).toBe('campo');

    pointer(document, 'pointerup', 200, 100);
    expect(rilasci).toHaveLength(1);
    expect(rilasci[0].bersaglio).toMatchObject({ tipo: 'campo', x: 50, y: 25 });
    expect(servizio.attivo()).toBeNull();
  });

  it('rilasciare su un titolare indica il giocatore, sulla panchina la panchina', () => {
    sotto = fixture.nativeElement.querySelector('.pin');
    expect(servizio.bersaglio(0, 0)).toEqual({ tipo: 'pin', giocatoreId: 53 });
    sotto = fixture.nativeElement.querySelector('.panchina');
    expect(servizio.bersaglio(0, 0)).toEqual({ tipo: 'panchina' });
    sotto = document.body;
    expect(servizio.bersaglio(0, 0)).toBeNull();
  });

  it('col dito serve una pressione prolungata', () => {
    vi.useFakeTimers();
    pointer(sorgente, 'pointerdown', 10, 10, 'touch');
    expect(servizio.attivo()).toBeNull();

    vi.advanceTimersByTime(PRESSIONE_MS + 10);
    expect(servizio.attivo()).toMatchObject({ giocatoreId: 70 });
  });

  it('col dito, muoversi prima della pressione prolungata è uno scorrimento', () => {
    vi.useFakeTimers();
    pointer(sorgente, 'pointerdown', 10, 10, 'touch');
    pointer(document, 'pointermove', 10, 60, 'touch');
    vi.advanceTimersByTime(PRESSIONE_MS + 10);

    expect(servizio.attivo()).toBeNull();
  });

  it('dopo un trascinamento il clic sull\'elemento non arriva', () => {
    pointer(sorgente, 'pointerdown', 10, 10);
    pointer(document, 'pointermove', 80, 80);
    pointer(document, 'pointerup', 80, 80);
    sorgente.click();
    expect(fixture.componentInstance.clic).toBe(0);

    pointer(sorgente, 'pointerdown', 10, 10);
    pointer(document, 'pointerup', 10, 10); // semplice clic
    sorgente.click();
    expect(fixture.componentInstance.clic).toBe(1);
  });
});
