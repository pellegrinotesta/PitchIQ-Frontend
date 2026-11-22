import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';

import { ConfrontoGiocatori } from './confronto-giocatori';

describe('ConfrontoGiocatori', () => {
  let component: ConfrontoGiocatori;
  let fixture: ComponentFixture<ConfrontoGiocatori>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfrontoGiocatori],
      // dipendenze dell'app sostituite da versioni di test: nessuna chiamata al backend vero
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: DynamicDialogRef, useValue: { close: () => undefined } },
        { provide: DynamicDialogConfig, useValue: { data: {} } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfrontoGiocatori);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
