import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';

import { ListaAllenamenti } from './lista-allenamenti';

describe('ListaAllenamenti', () => {
  let component: ListaAllenamenti;
  let fixture: ComponentFixture<ListaAllenamenti>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListaAllenamenti],
      // dipendenze dell'app sostituite da versioni di test: nessuna chiamata al backend vero
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: DynamicDialogRef, useValue: { close: () => undefined } },
        { provide: DynamicDialogConfig, useValue: { data: {} } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ListaAllenamenti);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
