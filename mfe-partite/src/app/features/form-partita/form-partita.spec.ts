import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormPartita } from './form-partita';

describe('FormPartita', () => {
  let component: FormPartita;
  let fixture: ComponentFixture<FormPartita>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormPartita],
    }).compileComponents();

    fixture = TestBed.createComponent(FormPartita);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
