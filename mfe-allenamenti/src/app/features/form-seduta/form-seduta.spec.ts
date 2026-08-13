import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormSeduta } from './form-seduta';

describe('FormSeduta', () => {
  let component: FormSeduta;
  let fixture: ComponentFixture<FormSeduta>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormSeduta],
    }).compileComponents();

    fixture = TestBed.createComponent(FormSeduta);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
