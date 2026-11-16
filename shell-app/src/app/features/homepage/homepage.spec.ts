import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import {
  dataIso,
  giorniA,
  PanoramicaService,
  stagioneDi,
} from '../../core/services/panoramica.service';
import { Homepage } from './homepage';

const tra = (giorni: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + giorni);
  return dataIso(d);
};

describe('Homepage', () => {
  const service = {
    partite: vi.fn(() =>
      of([
        { id: 1, data: '2026-03-01', avversario: 'A', competizione: 'Serie A', golFatti: 0, golSubiti: 1, risultato: 'P' as const },
        { id: 2, data: '2026-09-01', avversario: 'B', competizione: 'Serie A', golFatti: 2, golSubiti: 0, risultato: 'V' as const },
        { id: 3, data: '2026-09-08', avversario: 'C', competizione: 'Serie A', golFatti: 1, golSubiti: 1, risultato: 'N' as const },
        { id: 4, data: '2099-05-09', avversario: 'Lontana', competizione: 'Serie A', golFatti: 0, golSubiti: 0, risultato: null, giocata: false },
        { id: 5, data: '2099-05-02', avversario: 'Vicina', competizione: 'Serie A', golFatti: 0, golSubiti: 0, risultato: null, giocata: false, oraInizio: '20:45:00', scoutingId: 1 },
        { id: 6, data: '2020-01-01', avversario: 'Vecchia', competizione: 'Serie A', golFatti: 0, golSubiti: 0, risultato: null, giocata: false },
      ]),
    ),
    rosa: vi.fn(() =>
      of([
        { id: 1, nome: 'Luca', cognome: 'Verdi', stato: 'ATTIVO' as const, contrattoFine: tra(30) },
        { id: 2, nome: 'Marco', cognome: 'Neri', stato: 'INFORTUNATO' as const, contrattoFine: tra(900) },
        { id: 3, nome: 'Ivo', cognome: 'Blu', stato: 'ATTIVO' as const, contrattoFine: tra(-5) },
        { id: 4, nome: 'Teo', cognome: 'Rosa', stato: 'ATTIVO' as const, contrattoFine: null },
      ]),
    ),
    seduteDa: vi.fn(() => throwError(() => new Error('offline'))),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [Homepage],
      providers: [provideRouter([]), { provide: PanoramicaService, useValue: service }],
    });
  });

  it('riassume stagione corrente, disponibilità e contratti', async () => {
    const fixture = TestBed.createComponent(Homepage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const c = fixture.componentInstance;

    expect(c.stagione()).toMatchObject({ nome: '2026/27', giocate: 2, vittorie: 1, pareggi: 1, mediaPunti: 2 });
    expect(c.stagione()?.ultime.map((p) => p.id)).toEqual([3, 2]);
    expect(c.disponibilita()).toMatchObject({ totale: 4, disponibili: 3 });
    expect(c.contratti()?.map((g) => g.id)).toEqual([3, 1]);
    // Le gare in calendario non entrano nel rendimento; la prossima è la prima da oggi
    expect(c.prossima()).toMatchObject({ id: 5, avversario: 'Vicina' });
    const testo = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(testo).toContain('vs Vicina');
    expect(testo).toContain('Scouting pronto');
  });

  it('un riquadro in errore non blocca gli altri', async () => {
    const fixture = TestBed.createComponent(Homepage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const testo = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(fixture.componentInstance.sedute()).toBe('errore');
    expect(testo).toContain('Dati non disponibili.');
    expect(testo).toContain('Neri Marco');
  });

  it('calcola stagione e giorni alla scadenza', () => {
    expect(stagioneDi('2026-06-30')).toBe('2025/26');
    expect(stagioneDi('2026-07-01')).toBe('2026/27');
    const oggi = new Date(2026, 10, 16, 23);
    expect(giorniA('2026-11-16', oggi)).toBe(0);
    expect(giorniA('2027-06-30', oggi)).toBe(226);
    expect(giorniA(null, oggi)).toBeNull();
  });
});
