import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { PartitaService } from '../../core/services/partita.service';
import { DettaglioPartita } from './dettaglio-partita';

describe('DettaglioPartita - titolari', () => {
  let fixture: ComponentFixture<DettaglioPartita>;
  const service = {
    getById: vi.fn(),
    getRosa: vi.fn(),
    getTitolari: vi.fn(),
  };

  beforeEach(async () => {
    service.getById.mockReturnValue(of({
      id: 1, data: '2026-09-19', avversario: 'Ascoli', risultato: 'P',
      casaTrasferta: 'TRASFERTA', golFatti: 1, golSubiti: 3,
      competizione: 'Serie B', modulo: null, eventi: [], statistiche: null,
    }));
    service.getRosa.mockReturnValue(of([]));
    service.getTitolari.mockReset();
    await TestBed.configureTestingModule({
      imports: [DettaglioPartita],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '1' } } } },
        { provide: PartitaService, useValue: service },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(DettaglioPartita);
    fixture.detectChanges();
  });

  it('mostra i titolari della partita', () => {
    service.getTitolari.mockReturnValue(of([{ id: 7, nome: 'Raffaele', cognome: 'Russo' }]));
    fixture.componentInstance.mostraTitolari();
    fixture.detectChanges();
    expect(service.getTitolari).toHaveBeenCalledWith(1);
    expect(fixture.nativeElement.textContent).toContain('Raffaele Russo');
  });

  it('distingue dati assenti da errori e consente di riprovare', () => {
    service.getTitolari.mockReturnValueOnce(throwError(() => new Error('offline')))
      .mockReturnValueOnce(of([]));
    fixture.componentInstance.mostraTitolari();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Impossibile caricare i titolari');
    fixture.componentInstance.mostraTitolari();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Nessun titolare registrato');
  });
});
