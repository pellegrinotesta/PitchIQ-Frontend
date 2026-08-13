import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DettaglioAllenamento } from './dettaglio-allenamento';

describe('DettaglioAllenamento', () => {
  let component: DettaglioAllenamento;
  let fixture: ComponentFixture<DettaglioAllenamento>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DettaglioAllenamento],
    }).compileComponents();

    fixture = TestBed.createComponent(DettaglioAllenamento);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
