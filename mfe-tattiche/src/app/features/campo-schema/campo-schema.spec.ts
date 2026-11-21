import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CampoSchema } from './campo-schema';
import { SlotSchema } from '../../core/model/schema.model';

function pointer(bersaglio: EventTarget, tipo: string, x: number, y: number): void {
  const e = new MouseEvent(tipo, { bubbles: true, cancelable: true, clientX: x, clientY: y });
  Object.defineProperty(e, 'pointerId', { value: 1 });
  bersaglio.dispatchEvent(e);
}

describe('CampoSchema', () => {
  let fixture: ComponentFixture<CampoSchema>;
  let emessi: SlotSchema[][];
  const cb1: SlotSchema = { slotRuolo: 'CB1', ruolo: 'DIFENSORE', coordX: 40, coordY: 75, note: null };

  function monta(slot: SlotSchema[]): void {
    fixture = TestBed.createComponent(CampoSchema);
    fixture.componentRef.setInput('slot', slot);
    emessi = [];
    fixture.componentInstance.slotChange.subscribe(s => { emessi.push(s); fixture.componentRef.setInput('slot', s); });
    fixture.detectChanges();
    // campo di 200 x 400 px
    (fixture.nativeElement.querySelector('.campo') as HTMLElement).getBoundingClientRect =
      () => ({ left: 0, top: 0, width: 200, height: 400, right: 200, bottom: 400, x: 0, y: 0, toJSON: () => ({}) });
  }

  it('toccare il campo aggiunge uno slot con nome e ruolo della zona', () => {
    monta([cb1]);

    pointer(fixture.nativeElement.querySelector('.campo'), 'pointerdown', 120, 300); // 60%, 75%: difesa
    fixture.detectChanges();

    expect(emessi[0][1]).toMatchObject({ slotRuolo: 'CB2', ruolo: 'DIFENSORE', coordX: 60, coordY: 75 });
    expect(fixture.nativeElement.querySelector('.dettaglio-titolo').textContent).toContain('CB2');
  });

  it('trascinando uno slot in attacco il ruolo diventa attaccante', () => {
    monta([cb1]);
    const slot = fixture.nativeElement.querySelector('.slot') as HTMLElement;

    pointer(slot, 'pointerdown', 80, 300);
    pointer(slot, 'pointermove', 100, 60);
    pointer(slot, 'pointerup', 100, 60);

    expect(emessi[0][0]).toMatchObject({ coordX: 50, coordY: 15, ruolo: 'ATTACCANTE' });
  });

  it('un tocco su uno slot lo seleziona senza spostarlo', () => {
    monta([cb1]);
    const slot = fixture.nativeElement.querySelector('.slot') as HTMLElement;

    pointer(slot, 'pointerdown', 80, 300);
    pointer(slot, 'pointerup', 80, 300);
    fixture.detectChanges();

    expect(emessi).toHaveLength(0);
    expect(fixture.nativeElement.querySelector('.dettaglio')).not.toBeNull();
  });

  it('al dodicesimo slot avvisa invece di aggiungere', () => {
    monta(Array.from({ length: 11 }, (_, i) => ({ ...cb1, slotRuolo: `S${i}` })));

    pointer(fixture.nativeElement.querySelector('.campo'), 'pointerdown', 100, 200);
    fixture.detectChanges();

    expect(emessi).toHaveLength(0);
    expect(fixture.nativeElement.querySelector('.avviso').textContent).toContain('11 slot');
  });
});
