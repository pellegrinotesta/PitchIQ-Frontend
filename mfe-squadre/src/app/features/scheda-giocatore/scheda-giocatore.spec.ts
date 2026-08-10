import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SchedaGiocatore } from './scheda-giocatore';

describe('SchedaGiocatore', () => {
  let component: SchedaGiocatore;
  let fixture: ComponentFixture<SchedaGiocatore>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SchedaGiocatore],
    }).compileComponents();

    fixture = TestBed.createComponent(SchedaGiocatore);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
