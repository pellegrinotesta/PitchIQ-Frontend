import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';

import { Scouting } from './scouting';

describe('Scouting', () => {
  let component: Scouting;
  let fixture: ComponentFixture<Scouting>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Scouting],
      // dipendenze dell'app sostituite da versioni di test: nessuna chiamata al backend vero
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: DynamicDialogRef, useValue: { close: () => undefined } },
        { provide: DynamicDialogConfig, useValue: { data: {} } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Scouting);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
