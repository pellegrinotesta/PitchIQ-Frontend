import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { CaricoGiocatore, durataMinuti, zonaCarico } from '../../core/models/allenamento.model';
import { AllenamentoService } from '../../core/services/allenamento.service';
import { CaricoLavoro } from './carico-lavoro';

let seq = 0;
const carico = (patch: Partial<CaricoGiocatore> = {}): CaricoGiocatore => ({
  giocatoreId: ++seq,
  nomeGiocatore: 'Nome',
  cognomeGiocatore: `G${seq}`,
  numeroMaglia: seq,
  ruolo: 'CC',
  caricoAcuto: 400,
  caricoCronico: 400,
  acwr: 1,
  seduteConRpe: 4,
  seduteSenzaRpe: 0,
  storicoInsufficiente: false,
  ...patch,
});

describe('Carico di lavoro', () => {
  const service = { getCarico: vi.fn() };

  beforeEach(() => {
    service.getCarico.mockReset();
    TestBed.configureTestingModule({
      imports: [CaricoLavoro],
      providers: [provideRouter([]), { provide: AllenamentoService, useValue: service }],
    });
  });

  it('classifica il rapporto acuto/cronico sulle soglie', () => {
    const zona = (acwr: number | null, storicoInsufficiente = false) =>
      zonaCarico(carico({ acwr, storicoInsufficiente }));
    expect(zona(0.79)).toBe('BASSO');
    expect(zona(0.8)).toBe('OTTIMALE');
    expect(zona(1.3)).toBe('OTTIMALE');
    expect(zona(1.31)).toBe('ATTENZIONE');
    expect(zona(1.5)).toBe('ATTENZIONE');
    expect(zona(1.51)).toBe('ALTO');
    expect(zona(null)).toBe('NON_VALUTABILE');
    expect(zona(2, true)).toBe('NON_VALUTABILE');
  });

  it('calcola la durata della seduta', () => {
    expect(durataMinuti('10:00:00', '11:30:00')).toBe(90);
    expect(durataMinuti('10:00', '09:00')).toBe(0);
    expect(durataMinuti('', '11:00')).toBe(0);
  });

  it('mostra prima chi richiede attenzione e segnala le presenze senza RPE', async () => {
    service.getCarico.mockReturnValue(
      of([
        carico({ cognomeGiocatore: 'Ottimo', acwr: 1 }),
        carico({ cognomeGiocatore: 'Alto', acwr: 1.8 }),
        carico({ cognomeGiocatore: 'Nuovo', acwr: 2.5, storicoInsufficiente: true, seduteSenzaRpe: 3 }),
        carico({ cognomeGiocatore: 'Attento', acwr: 1.4 }),
      ]),
    );
    const fixture = TestBed.createComponent(CaricoLavoro);
    await fixture.whenStable();
    const c = fixture.componentInstance;

    expect(c.righe().map((r) => r.cognomeGiocatore)).toEqual(['Alto', 'Attento', 'Ottimo', 'Nuovo']);
    expect(c.daMonitorare()).toBe(2);
    const testo = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(testo).toContain('3 presenze senza RPE');
    expect(testo).toContain('meno di tre settimane di dati');
  });

  it('ricarica al cambio data e consente di riprovare dopo un errore', async () => {
    service.getCarico.mockReturnValue(throwError(() => new Error('offline')));
    const fixture = TestBed.createComponent(CaricoLavoro);
    await fixture.whenStable();
    const c = fixture.componentInstance;
    expect(c.errore()).toBe(true);

    service.getCarico.mockReturnValue(of([carico()]));
    c.cambiaData('2026-10-01');
    expect(service.getCarico).toHaveBeenLastCalledWith('2026-10-01');
    expect(c.errore()).toBe(false);
    expect(c.righe()).toHaveLength(1);
  });
});
