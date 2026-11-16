import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { Partita } from '../../core/models/partita.model';
import { PartitaService } from '../../core/services/partita.service';
import { RegistroPartite } from './registro-partite';

const partita = (patch: Partial<Partita>): Partita => ({
  id: 1,
  data: '2026-09-01',
  avversario: 'Avversario',
  competizione: 'Serie A',
  casaTrasferta: 'CASA',
  golFatti: 1,
  golSubiti: 0,
  risultato: 'V',
  modulo: null,
  note: null,
  eventi: [],
  statistiche: null,
  ...patch,
});

describe('RegistroPartite', () => {
  const lista = [
    partita({ id: 1, data: '2026-09-01' }),
    partita({ id: 2, data: '2026-09-08', risultato: 'N', golFatti: 0, competizione: 'Coppa Italia' }),
    partita({ id: 3, data: '2026-03-01', risultato: 'P', golSubiti: 2 }),
  ];
  const service = {
    getAll: vi.fn(() => of(lista)),
    getById: vi.fn((id: number) =>
      of(
        partita({
          id,
          eventi: [
            {
              id: 1, minuto: 30, minutoAggiuntivo: null, tipo: 'ESPULSIONE', giocatoreId: 4,
              nomeGiocatore: 'Luca', cognomeGiocatore: 'Verdi', nota: null,
            },
          ],
        }),
      ),
    ),
  };

  beforeEach(() => {
    service.getAll.mockClear();
    service.getById.mockClear();
    TestBed.configureTestingModule({
      imports: [RegistroPartite],
      providers: [provideRouter([]), { provide: PartitaService, useValue: service }],
    });
  });

  it('apre sulla stagione più recente e ricalcola i KPI al cambio filtro', async () => {
    const fixture = TestBed.createComponent(RegistroPartite);
    await fixture.whenStable();
    const c = fixture.componentInstance;

    expect(c.stagione()).toBe('2026/27');
    expect(c.filtrate().map((p) => p.id)).toEqual([2, 1]);
    expect(c.totale().punti).toBe(4);

    c.cambiaCompetizione('Serie A');
    expect(c.totale()).toMatchObject({ giocate: 1, punti: 3 });

    c.cambiaStagione('');
    expect(c.filtrate().map((p) => p.id)).toEqual([1, 3]);
    expect(service.getAll).toHaveBeenCalledTimes(1);
  });

  it('separa il calendario dai risultati', async () => {
    service.getAll.mockReturnValueOnce(
      of([
        ...lista,
        partita({ id: 9, data: '2099-05-01', giocata: false, risultato: null, avversario: 'Futura', scoutingId: 2 }),
      ]),
    );
    const fixture = TestBed.createComponent(RegistroPartite);
    await fixture.whenStable();
    const c = fixture.componentInstance;
    c.cambiaStagione('');

    expect(c.inCalendario().map((p) => p.id)).toEqual([9]);
    expect(c.giocate().map((p) => p.id)).toEqual([2, 1, 3]);
    expect(c.totale().giocate).toBe(3);
    await fixture.whenStable();
    const testo = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(testo).toContain('Prossima gara');
    expect(testo).toContain('Scouting collegato');
  });

  it('calcola la disciplina solo con stagione e competizione selezionate', async () => {
    const fixture = TestBed.createComponent(RegistroPartite);
    await fixture.whenStable();
    const c = fixture.componentInstance;

    c.calcolaDisciplina();
    expect(service.getById).not.toHaveBeenCalled();

    c.cambiaCompetizione('Serie A');
    c.calcolaDisciplina();
    expect(service.getById).toHaveBeenCalledTimes(1);
    expect(c.disciplina()?.righe[0]).toMatchObject({ giocatoreId: 4, stato: 'SQUALIFICATO' });

    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Verdi Luca');

    c.cambiaCompetizione('');
    expect(c.disciplina()).toBeNull();
  });
});
