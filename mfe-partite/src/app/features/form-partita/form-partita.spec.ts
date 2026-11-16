import { TestBed } from '@angular/core/testing';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { of } from 'rxjs';
import { PartitaService } from '../../core/services/partita.service';
import { FormPartita } from './form-partita';

describe('FormPartita', () => {
  const service = {
    getAllScouting: vi.fn(() =>
      of([
        { id: 2, nome: 'Milan', modulo: null, puntiForza: null, debolezze: null, giocatoriChiave: null, note: null },
      ]),
    ),
    create: vi.fn((_req: unknown) => of({})),
    update: vi.fn((_id: number, _req: unknown) => of({})),
  };
  const ref = { close: vi.fn() };
  let config: { data: Record<string, unknown> };

  const crea = async () => {
    await TestBed.configureTestingModule({
      imports: [FormPartita],
      providers: [
        { provide: PartitaService, useValue: service },
        { provide: DynamicDialogRef, useValue: ref },
        { provide: DynamicDialogConfig, useValue: config },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(FormPartita);
    await fixture.whenStable();
    return fixture.componentInstance;
  };

  beforeEach(() => {
    service.create.mockClear();
    service.update.mockClear();
    config = { data: { partita: null } };
  });

  it('una data futura propone la partita da giocare e salva senza punteggio', async () => {
    const c = await crea();
    expect(c.giocata).toBe(true);
    c.data = '2099-05-01';
    c.cambiaData();
    expect(c.giocata).toBe(false);

    c.avversario = ' milan ';
    c.suggerisciScouting();
    c.golFatti = 3;
    c.oraInizio = '20:45';
    c.submit();
    expect(service.create).toHaveBeenCalledWith(
      expect.objectContaining({ giocata: false, golFatti: 0, golSubiti: 0, oraInizio: '20:45', scoutingId: 2 }),
    );
  });

  it('inserire il risultato di una gara in calendario la rende giocata', async () => {
    config.data = {
      giocata: true,
      partita: {
        id: 7, data: '2026-11-08', avversario: 'Milan', competizione: 'Serie A', casaTrasferta: 'CASA',
        golFatti: 0, golSubiti: 0, risultato: null, giocata: false, oraInizio: '18:00:00', scoutingId: 2,
        modulo: null, note: null, eventi: [], statistiche: null,
      },
    };
    const c = await crea();
    expect(c.giocata).toBe(true);
    expect(c.oraInizio).toBe('18:00');
    c.golFatti = 2;
    c.submit();
    expect(service.update).toHaveBeenCalledWith(
      7,
      expect.objectContaining({ giocata: true, golFatti: 2, scoutingId: 2 }),
    );
  });
});
