import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SchedaStatistiche } from './scheda-statistiche';

describe('SchedaStatistiche', () => {
  let component: SchedaStatistiche;
  let fixture: ComponentFixture<SchedaStatistiche>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SchedaStatistiche],
    }).compileComponents();

    fixture = TestBed.createComponent(SchedaStatistiche);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
