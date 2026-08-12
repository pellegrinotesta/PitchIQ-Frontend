import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CampoDiCalcio } from './campo-di-calcio';

describe('CampoDiCalcio', () => {
  let component: CampoDiCalcio;
  let fixture: ComponentFixture<CampoDiCalcio>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CampoDiCalcio],
    }).compileComponents();

    fixture = TestBed.createComponent(CampoDiCalcio);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
