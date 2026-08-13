import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Scouting } from './scouting';

describe('Scouting', () => {
  let component: Scouting;
  let fixture: ComponentFixture<Scouting>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Scouting],
    }).compileComponents();

    fixture = TestBed.createComponent(Scouting);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
