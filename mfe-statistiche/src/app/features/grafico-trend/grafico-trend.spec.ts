import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GraficoTrend } from './grafico-trend';

describe('GraficoTrend', () => {
  let component: GraficoTrend;
  let fixture: ComponentFixture<GraficoTrend>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GraficoTrend],
    }).compileComponents();

    fixture = TestBed.createComponent(GraficoTrend);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
