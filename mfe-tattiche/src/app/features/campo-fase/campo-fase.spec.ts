import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CampoFase } from './campo-fase';
import { FasiFormazione, PosizioneCampo } from '../../core/model/formazione.model';

const titolare = (id: number, x: number, y: number): PosizioneCampo =>
  ({ giocatoreId: id, nomeGiocatore: '', cognomeGiocatore: `G${id}`, numeroMaglia: id, coordX: x, coordY: y, slotRuolo: null, titolare: true });

/** jsdom non ha PointerEvent né layout: evento minimo e campo di 200 x 300 px in (0, 0). */
function pointer(tipo: string, clientX: number, clientY: number): Event {
  const e = new MouseEvent(tipo, { bubbles: true, cancelable: true, clientX, clientY });
  Object.defineProperty(e, 'pointerId', { value: 1 });
  return e;
}

describe('CampoFase', () => {
  let fixture: ComponentFixture<CampoFase>;
  let emesse: FasiFormazione[];

  beforeEach(() => {
    fixture = TestBed.createComponent(CampoFase);
    fixture.componentRef.setInput('posizioni', [titolare(1, 18, 72), titolare(9, 50, 14)]);
    fixture.componentRef.setInput('fasi', null);
    fixture.componentRef.setInput('fase', 'POSSESSO');
    emesse = [];
    fixture.componentInstance.fasiChange.subscribe(f => emesse.push(f));
    fixture.detectChanges();
    const campo = fixture.nativeElement.querySelector('.campo') as HTMLElement;
    campo.getBoundingClientRect = () => ({ left: 0, top: 0, width: 200, height: 300, right: 200, bottom: 300, x: 0, y: 0, toJSON: () => ({}) });
    HTMLElement.prototype.setPointerCapture ??= () => undefined;
  });

  it('trascinare un giocatore lo sposta solo nella fase', () => {
    const pin = fixture.nativeElement.querySelector('.pin') as HTMLElement;

    pin.dispatchEvent(pointer('pointerdown', 36, 216));
    pin.dispatchEvent(pointer('pointermove', 40, 120));  // 20% x, 40% y
    pin.dispatchEvent(pointer('pointerup', 40, 120));

    expect(emesse).toHaveLength(1);
    expect(emesse[0].POSSESSO?.posizioni).toEqual([{ giocatoreId: 1, coordX: 20, coordY: 40 }]);
  });

  it('con lo strumento passaggio, trascinare sul campo disegna una freccia', () => {
    (fixture.nativeElement.querySelectorAll('.strumento')[2] as HTMLElement).click(); // Passaggio
    fixture.detectChanges();
    const campo = fixture.nativeElement.querySelector('.campo') as HTMLElement;

    campo.dispatchEvent(pointer('pointerdown', 100, 150));
    campo.dispatchEvent(pointer('pointermove', 100, 60));
    campo.dispatchEvent(pointer('pointerup', 100, 60));

    expect(emesse[0].POSSESSO?.frecce).toEqual([{ startX: 50, startY: 50, endX: 50, endY: 20, tipo: 'PASSAGGIO' }]);
  });

  it('un semplice tocco non crea frecce', () => {
    (fixture.nativeElement.querySelectorAll('.strumento')[1] as HTMLElement).click(); // Corsa
    fixture.detectChanges();
    const campo = fixture.nativeElement.querySelector('.campo') as HTMLElement;

    campo.dispatchEvent(pointer('pointerdown', 100, 150));
    campo.dispatchEvent(pointer('pointerup', 101, 151));

    expect(emesse).toHaveLength(0);
  });

  it('mostra la scia dallo schieramento per i giocatori spostati', () => {
    fixture.componentRef.setInput('fasi', { POSSESSO: { posizioni: [{ giocatoreId: 1, coordX: 15, coordY: 45 }], frecce: [] } });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.scia')).toHaveLength(1);
    expect(fixture.nativeElement.querySelectorAll('.fantasma')).toHaveLength(1);
  });
});
