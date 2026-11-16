import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { Presenza, SedutaAllenamento } from '../../core/models/allenamento.model';
import { AllenamentoService } from '../../core/services/allenamento.service';
import { DettaglioAllenamento } from './dettaglio-allenamento';

const presenza = (patch: Partial<Presenza>): Presenza => ({
  giocatoreId: 1, nomeGiocatore: 'Marco', cognomeGiocatore: 'Rossi', numeroMaglia: 5, ruolo: 'DC',
  presente: true, motivoAssenza: null, valutazione: null, minuti: null, rpe: null,
  ...patch,
});
const seduta = (): SedutaAllenamento => ({
  id: 3, data: '2026-11-10', oraInizio: '10:00:00', oraFine: '11:30:00', tipo: 'ATLETICO',
  luogo: null, note: null, totalePresenti: 2, totaleAssenti: 1,
  presenze: [
    presenza({ giocatoreId: 1, rpe: 6 }),
    presenza({ giocatoreId: 2, rpe: 8, minuti: 45 }),
    presenza({ giocatoreId: 3, presente: false, rpe: 7, minuti: 30 }),
  ],
});

describe('DettaglioAllenamento', () => {
  const service = {
    getById: vi.fn(() => of(seduta())),
    update: vi.fn((_id: number, _req: unknown) => of(seduta())),
  };

  beforeEach(() => {
    service.update.mockClear();
    TestBed.configureTestingModule({
      imports: [DettaglioAllenamento],
      providers: [
        provideRouter([]),
        { provide: AllenamentoService, useValue: service },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: '3' }) } } },
      ],
    });
  });

  it('calcola il carico usando la durata della seduta quando mancano i minuti', async () => {
    const fixture = TestBed.createComponent(DettaglioAllenamento);
    await fixture.whenStable();
    const c = fixture.componentInstance;
    const s = c.seduta()!;

    expect(c.durata(s)).toBe(90);
    expect(c.carico(s.presenze[0], s)).toBe(540);
    expect(c.carico(s.presenze[1], s)).toBe(360);
    expect(c.caricoMedio(s)).toBe(450);
    expect(c.carico(presenza({}), s)).toBeNull();
  });

  it('salva RPE e minuti dei presenti e azzera quelli degli assenti', async () => {
    const fixture = TestBed.createComponent(DettaglioAllenamento);
    await fixture.whenStable();
    const c = fixture.componentInstance;
    const s = c.seduta()!;

    c.impostaRpe(s.presenze[0], '9');
    c.impostaMinuti(s.presenze[0], '70');
    c.impostaMinuti(s.presenze[1], '');
    c.salvaPresenze();

    const req = service.update.mock.calls[0][1] as { presenze: Partial<Presenza>[] };
    expect(req.presenze[0]).toMatchObject({ rpe: 9, minuti: 70 });
    expect(req.presenze[1]).toMatchObject({ rpe: 8, minuti: null });
    expect(req.presenze[2]).toMatchObject({ presente: false, rpe: null, minuti: null });
  });
});
