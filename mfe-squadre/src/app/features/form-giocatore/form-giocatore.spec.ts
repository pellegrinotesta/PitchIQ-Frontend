import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormGiocatore } from './form-giocatore';

describe('FormGiocatore', () => {
  let component: FormGiocatore;
  let fixture: ComponentFixture<FormGiocatore>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormGiocatore],
    }).compileComponents();

    fixture = TestBed.createComponent(FormGiocatore);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
