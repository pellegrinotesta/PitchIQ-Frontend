import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';

import { FormScouting } from './form-scouting';

describe('FormScouting', () => {
  let component: FormScouting;
  let fixture: ComponentFixture<FormScouting>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormScouting],
      // dipendenze dell'app sostituite da versioni di test: nessuna chiamata al backend vero
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: DynamicDialogRef, useValue: { close: () => undefined } },
        { provide: DynamicDialogConfig, useValue: { data: {} } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FormScouting);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
