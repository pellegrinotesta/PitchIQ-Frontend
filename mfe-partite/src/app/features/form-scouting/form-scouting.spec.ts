import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormScouting } from './form-scouting';

describe('FormScouting', () => {
  let component: FormScouting;
  let fixture: ComponentFixture<FormScouting>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormScouting],
    }).compileComponents();

    fixture = TestBed.createComponent(FormScouting);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
