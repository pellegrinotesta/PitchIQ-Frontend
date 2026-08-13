import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardStatistiche } from './dashboard-statistiche';

describe('DashboardStatistiche', () => {
  let component: DashboardStatistiche;
  let fixture: ComponentFixture<DashboardStatistiche>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardStatistiche],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardStatistiche);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
