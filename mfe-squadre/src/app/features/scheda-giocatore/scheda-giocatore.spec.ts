import { Component, Input } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of, Subject, throwError } from 'rxjs';
import { ChartModule } from 'primeng/chart';
import { Giocatore } from '../../core/models/giocatore.model';
import { GiocatoreService, StatisticaOsservata } from '../../core/services/giocatore.service';
import { SchedaGiocatore } from './scheda-giocatore';

@Component({ selector: 'p-chart', template: '' })
class ChartStub {
  @Input() type: unknown;
  @Input() data: unknown;
  @Input() options: unknown;
  @Input() height: unknown;
}

const PROFILO: Giocatore = {
  id: 1,
  nome: 'Marco',
  cognome: 'Rossi',
  dataNascita: null,
  eta: null,
  ruolo: 'DC',
  ruoliSecondari: 'TSD,CDC',
  numeroMaglia: 5,
  piedePreferito: 'DESTRO',
  contrattoInizio: '2025-11-04',
  contrattoFine: '2026-11-04',
  stato: 'ATTIVO',
  nazionalita: 'Italia',
  luogoNascita: null,
  altezzaCm: null,
  pesoKg: null,
  stipendioAnnuo: 100000,
  valoreMercato: 0,
  clausola: null,
  noteMediche: 'RISERVATO',
  agente: null,
};
const OSSERVAZIONI: StatisticaOsservata[] = [
  { id: 1, giocatoreId: 1, periodo: '2026-09', categoria: 'GOL', valore: 0 },
  { id: 2, giocatoreId: 1, periodo: '2026-10', categoria: 'GOL', valore: 2 },
];

describe('SchedaGiocatore', () => {
  let service: { getById: ReturnType<typeof vi.fn>; getStorico: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    service = {
      getById: vi.fn(() => of({ ...PROFILO })),
      getStorico: vi.fn(() => of([...OSSERVAZIONI])),
    };
    await TestBed.configureTestingModule({
      imports: [SchedaGiocatore],
      providers: [
        provideRouter([{ path: 'giocatori/:id', component: SchedaGiocatore }]),
        { provide: GiocatoreService, useValue: service },
      ],
    })
      .overrideComponent(SchedaGiocatore, {
        remove: { imports: [ChartModule] },
        add: { imports: [ChartStub] },
      })
      .compileComponents();
  });

  it('carica profilo e storico, mantenendo gli zeri e i ruoli reali', async () => {
    const harness = await RouterTestingHarness.create();
    const component = await harness.navigateByUrl('/giocatori/1', SchedaGiocatore);
    expect(service.getStorico).toHaveBeenCalledWith(1);
    expect(component.serie()).toHaveLength(2);
    expect(component.serie()[0].valore).toBe(0);
    expect(component.variazione()).toBe(2);
    expect(component.formatValuta(0)).not.toBe('N/D');
    expect(component.getRuoloColore('DC')).not.toBe('#888');
    expect(component.secondari()).toEqual(['TSD', 'CDC']);
    expect(harness.routeNativeElement?.textContent).toContain('Storico osservato');
  });

  it('filtra il periodo e distingue intervallo errato da assenza dati', async () => {
    const harness = await RouterTestingHarness.create();
    const component = await harness.navigateByUrl('/giocatori/1', SchedaGiocatore);
    component.dal.set('2026-10');
    expect(component.serie()).toHaveLength(1);
    expect(component.variazione()).toBeNull();
    component.al.set('2026-09');
    expect(component.intervalloInvalido()).toBe(true);
    expect(component.serie()).toHaveLength(0);
    component.azzeraPeriodo();
    expect(component.serie()).toHaveLength(2);
  });

  it('non perde il profilo se lo storico fallisce e consente retry', async () => {
    service.getStorico.mockReturnValueOnce(throwError(() => new Error('offline')));
    const harness = await RouterTestingHarness.create();
    const component = await harness.navigateByUrl('/giocatori/1', SchedaGiocatore);
    expect(component.giocatore()?.id).toBe(1);
    expect(component.errore()).toBeNull();
    expect(component.erroreStatistiche()).not.toBeNull();
    component.ricarica();
    expect(component.erroreStatistiche()).toBeNull();
    expect(component.serie()).toHaveLength(2);
  });

  it('mostra scadenza odierna e usa la durata effettiva del contratto', async () => {
    const harness = await RouterTestingHarness.create();
    const component = await harness.navigateByUrl('/giocatori/1', SchedaGiocatore);
    component.aggiornato.set(new Date(2026, 10, 4, 12));
    component.tabAttivo.set('contratto');
    harness.detectChanges();
    expect(component.giorniAllaScadenza('2026-11-04')).toBe(0);
    expect(component.getScadenzaClass(0)).toBe('scadenza-critica');
    expect(harness.routeNativeElement?.textContent).toContain('Scadenza oggi');
    expect(component.calcolaLarghezzaScadenza(182.5)).toBe(50);
  });

  it('esclude valori non validi e non esporta dati sanitari o finanziari', async () => {
    service.getStorico.mockReturnValueOnce(
      of([
        ...OSSERVAZIONI,
        { ...OSSERVAZIONI[0], periodo: 'ignoto' },
        { ...OSSERVAZIONI[0], valore: null },
      ]),
    );
    const harness = await RouterTestingHarness.create();
    const component = await harness.navigateByUrl('/giocatori/1', SchedaGiocatore);
    expect(component.datiValidi()).toHaveLength(2);
    const esportato = JSON.stringify(component.contenutoDossier());
    expect(esportato).not.toContain('RISERVATO');
    expect(esportato).not.toContain('stipendioAnnuo');
    expect(esportato).not.toContain('valoreMercato');
    expect(
      component.campiQualita().find((campo) => campo.label === 'Valore di mercato')?.presente,
    ).toBe(true);
  });

  it('annulla le risposte vecchie quando cambia il giocatore', async () => {
    const precedente = new Subject<Giocatore>();
    service.getById.mockReturnValueOnce(precedente).mockReturnValueOnce(of({ ...PROFILO, id: 2 }));
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/giocatori/1', SchedaGiocatore);
    const component = await harness.navigateByUrl('/giocatori/2', SchedaGiocatore);
    precedente.next(PROFILO);
    precedente.complete();
    expect(component.giocatore()?.id).toBe(2);
  });

  it('distingue profilo assente da errore connessione', async () => {
    service.getById.mockReturnValueOnce(throwError(() => ({ status: 404 })));
    const harness = await RouterTestingHarness.create();
    const component = await harness.navigateByUrl('/giocatori/1', SchedaGiocatore);
    expect(component.errore()).toBe('Giocatore non trovato.');
    expect(component.loading()).toBe(false);
    component.ricarica();
    expect(component.giocatore()?.id).toBe(1);
  });
});
