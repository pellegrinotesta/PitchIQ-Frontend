import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CampoDiCalcio } from '../campo-di-calcio/campo-di-calcio';
import { Panchina } from './panchina';
import { TrascinamentoService } from '../../core/trascinamento';
import { GiocatoreDisponibile, PosizioneCampo } from '../../core/model/formazione.model';

const g = (id: number, cognome: string, ruolo: string): GiocatoreDisponibile =>
  ({ id, nome: '', cognome, numeroMaglia: id, ruolo, categoriaRuolo: '' });
const pos = (id: number, cognome: string, titolare: boolean, x = 0, y = 0): PosizioneCampo =>
  ({ giocatoreId: id, nomeGiocatore: '', cognomeGiocatore: cognome, numeroMaglia: id, coordX: x, coordY: y, slotRuolo: null, titolare });

@Component({
  imports: [CampoDiCalcio, Panchina],
  providers: [TrascinamentoService],
  template: `
    <app-campo-di-calcio [posizioni]="posizioni()" [rosa]="rosa" (posizioniChange)="posizioni.set($event)" />
    <app-panchina [posizioni]="posizioni()" [rosa]="rosa" (posizioniChange)="posizioni.set($event)" />`,
})
class Editor {
  rosa = [g(53, 'Valsecchi', 'DC'), g(56, 'Archetti', 'DC')];
  posizioni = signal<PosizioneCampo[]>([pos(53, 'Valsecchi', true, 38, 75), pos(56, 'Archetti', false)]);
}

function pointer(bersaglio: EventTarget, tipo: string, x: number, y: number, pointerType = 'mouse'): void {
  const e = new MouseEvent(tipo, { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0 });
  Object.defineProperty(e, 'pointerType', { value: pointerType });
  bersaglio.dispatchEvent(e);
}

describe('campo e panchina con il trascinamento a puntatore', () => {
  it('trascinare un panchinaro su un titolare fa il cambio', () => {
    const fixture = TestBed.createComponent(Editor);
    fixture.detectChanges();
    const riserva = fixture.nativeElement.querySelector('.riserva') as HTMLElement;
    const pinIzzo = fixture.nativeElement.querySelector('[data-rilascio-pin="53"]') as HTMLElement;
    document.elementFromPoint = () => pinIzzo;

    pointer(riserva, 'pointerdown', 10, 500);
    pointer(document, 'pointermove', 60, 300);
    pointer(document, 'pointerup', 60, 300);
    fixture.detectChanges();

    const posizioni = fixture.componentInstance.posizioni();
    expect(posizioni.find(p => p.giocatoreId === 56)).toMatchObject({ titolare: true, coordX: 38, coordY: 75 });
    expect(posizioni.find(p => p.giocatoreId === 53)).toMatchObject({ titolare: false });
  });

  it('trascinare un titolare sulla panchina lo manda in panchina', () => {
    const fixture = TestBed.createComponent(Editor);
    fixture.detectChanges();
    const pinIzzo = fixture.nativeElement.querySelector('[data-rilascio-pin="53"]') as HTMLElement;
    document.elementFromPoint = () => fixture.nativeElement.querySelector('[data-rilascio-panchina]');

    pointer(pinIzzo, 'pointerdown', 60, 300, 'touch'); // in campo il dito trascina subito
    pointer(document, 'pointermove', 60, 500, 'touch');
    pointer(document, 'pointerup', 60, 500, 'touch');

    expect(fixture.componentInstance.posizioni().find(p => p.giocatoreId === 53)?.titolare).toBe(false);
  });
});
