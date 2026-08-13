import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeatmapCampo } from './heatmap-campo';

describe('HeatmapCampo', () => {
  let component: HeatmapCampo;
  let fixture: ComponentFixture<HeatmapCampo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeatmapCampo],
    }).compileComponents();

    fixture = TestBed.createComponent(HeatmapCampo);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
