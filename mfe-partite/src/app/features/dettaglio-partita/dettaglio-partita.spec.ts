import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DettaglioPartita } from './dettaglio-partita';

describe('DettaglioPartita', () => {
  let component: DettaglioPartita;
  let fixture: ComponentFixture<DettaglioPartita>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DettaglioPartita],
    }).compileComponents();

    fixture = TestBed.createComponent(DettaglioPartita);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
