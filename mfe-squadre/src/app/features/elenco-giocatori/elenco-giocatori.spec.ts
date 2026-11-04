import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Table } from 'primeng/table';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Giocatore } from '../../core/models/giocatore.model';
import {
  coperturaRuoli,
  esportaRosaCsv,
  filtraRosa,
  FiltriRosa,
  giorniContratto,
  riepilogoRosa,
  ruoliSecondari,
} from '../../core/models/rosa-insights';
import { GiocatoreService } from '../../core/services/giocatore.service';
import { ElencoGiocatori } from './elenco-giocatori';

const OGGI = new Date(2026, 10, 4, 18);
const FILTRI: FiltriRosa = { ricerca: '', ruolo: null, stato: null, piede: '', contratto: 'TUTTI' };
const giocatore = (patch: Partial<Giocatore> = {}): Giocatore => ({
  id: 1,
  nome: 'Nicolo',
  cognome: 'Rossi',
  dataNascita: null,
  eta: 24,
  ruolo: 'DC',
  ruoliSecondari: 'TSD, CDC',
  numeroMaglia: 5,
  piedePreferito: 'DESTRO',
  contrattoInizio: null,
  contrattoFine: '2027-01-01',
  stato: 'ATTIVO',
  nazionalita: 'Italia',
  luogoNascita: null,
  altezzaCm: 185,
  pesoKg: 80,
  stipendioAnnuo: null,
  valoreMercato: null,
  clausola: null,
  noteMediche: null,
  agente: null,
  ...patch,
});

describe('Workspace rosa', () => {
  const service = {
    getAll: vi.fn(() => of([giocatore(), giocatore({ id: 2, cognome: 'Bianchi' })])),
  };

  beforeEach(() => {
    service.getAll.mockClear();
    TestBed.configureTestingModule({
      imports: [ElencoGiocatori],
      providers: [provideRouter([]), { provide: GiocatoreService, useValue: service }],
    });
  });

  it('filtra senza richieste aggiuntive o KPI variabili', async () => {
    const fixture = TestBed.createComponent(ElencoGiocatori);
    await fixture.whenStable();
    const component = fixture.componentInstance;
    component.filtra({ ricerca: 'Bianchi' });
    expect(component.filtrati()).toHaveLength(1);
    expect(component.riepilogo().totale).toBe(2);
    expect(service.getAll).toHaveBeenCalledExactlyOnceWith();
    component.resetFiltri();
    expect(component.filtrati()).toHaveLength(2);
  });

  it('disattiva la colorazione hover della tabella', async () => {
    const fixture = TestBed.createComponent(ElencoGiocatori);
    await fixture.whenStable();
    const tabella = fixture.debugElement.query(By.directive(Table)).componentInstance as Table;
    expect(tabella.rowHover()).toBe(false);
  });

  it('limita il confronto, preserva la selezione ai filtri e la riconcilia al reload', () => {
    const component = TestBed.createComponent(ElencoGiocatori).componentInstance;
    const rosa = [1, 2, 3, 4, 5].map((id) => giocatore({ id }));
    component.giocatori.set(rosa);
    rosa.forEach((elemento) => component.seleziona(elemento));
    expect(component.confronto()).toHaveLength(4);
    expect(component.avviso()).toContain('massimo 4');
    component.filtra({ ricerca: 'assente' });
    expect(component.confronto()).toHaveLength(4);
    component.carica();
    expect(component.selezionati()).toEqual([1, 2]);
    component.svuotaConfronto();
    expect(component.confronto()).toHaveLength(0);
  });

  it('mostra errore di rete e consente di riprovare', () => {
    const component = TestBed.createComponent(ElencoGiocatori).componentInstance;
    service.getAll.mockReturnValueOnce(throwError(() => new Error('offline')));
    component.carica();
    expect(component.loading()).toBe(false);
    expect(component.errore()).toContain('connessione');
    component.carica();
    expect(component.errore()).toBeNull();
    expect(component.giocatori()).toHaveLength(2);
  });

  it('renderizza copertura, contratti, confronto e stato senza risultati', async () => {
    const fixture = TestBed.createComponent(ElencoGiocatori);
    await fixture.whenStable();
    const component = fixture.componentInstance;
    component.cambiaVista('copertura');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.depth-item')).toHaveLength(14);
    component.cambiaVista('contratti');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Orizzonte contrattuale');
    component.giocatori().forEach((elemento) => component.seleziona(elemento));
    component.confrontoAperto.set(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.compare-table')).not.toBeNull();
    component.filtra({ ricerca: 'assente' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Nessun giocatore corrisponde');
  });
});

describe('Analisi rosa', () => {
  it('calcola scadenza oggi, giorni interi e dati mancanti o invalidi', () => {
    expect(giorniContratto('2026-11-04', OGGI)).toBe(0);
    expect(giorniContratto('2026-11-05', OGGI)).toBe(1);
    expect(giorniContratto('2026-11-03', OGGI)).toBe(-1);
    expect(giorniContratto(null, OGGI)).toBeNull();
    expect(giorniContratto('2026-02-30', OGGI)).toBeNull();
    expect(giorniContratto('non una data', OGGI)).toBeNull();
  });
  it('combina ricerca senza accenti e filtri anche sui ruoli secondari', () => {
    const rosa = [
      giocatore({ nome: 'Nicol\u00f2' }),
      giocatore({ id: 2, cognome: 'Bianchi', stato: 'INFORTUNATO' }),
    ];
    expect(
      filtraRosa(
        rosa,
        { ...FILTRI, ricerca: 'nicolo italia', ruolo: 'TSD', stato: 'ATTIVO', piede: 'DESTRO' },
        OGGI,
      ).map((elemento) => elemento.id),
    ).toEqual([1]);
    expect(filtraRosa(rosa, { ...FILTRI, ruolo: 'POR' }, OGGI)).toHaveLength(0);
  });
  it('distingue scaduti, scadenze entro 180 giorni e contratti ignoti', () => {
    const rosa = [
      giocatore({ id: 1, contrattoFine: '2026-11-04' }),
      giocatore({ id: 2, contrattoFine: '2026-11-03' }),
      giocatore({ id: 3, contrattoFine: null }),
      giocatore({ id: 4, contrattoFine: '2027-05-04' }),
      giocatore({ id: 5, contrattoFine: '2027-05-03' }),
    ];
    expect(
      filtraRosa(rosa, { ...FILTRI, contratto: '180' }, OGGI).map((elemento) => elemento.id),
    ).toEqual([1, 5]);
    expect(
      filtraRosa(rosa, { ...FILTRI, contratto: 'SCADUTI' }, OGGI).map((elemento) => elemento.id),
    ).toEqual([2]);
    expect(
      filtraRosa(rosa, { ...FILTRI, contratto: 'MANCANTI' }, OGGI).map((elemento) => elemento.id),
    ).toEqual([3]);
  });
  it('non tratta valori mancanti come zero ma conserva gli zeri dichiarati', () => {
    expect(riepilogoRosa([], OGGI).etaMedia).toBeNull();
    expect(riepilogoRosa([giocatore()], OGGI).valoreTotale).toBeNull();
    const riepilogo = riepilogoRosa(
      [giocatore({ eta: null }), giocatore({ id: 2, eta: 30, valoreMercato: 0 })],
      OGGI,
    );
    expect(riepilogo.etaMedia).toBe(30);
    expect(riepilogo.etaNote).toBe(1);
    expect(riepilogo.valoreTotale).toBe(0);
    expect(riepilogo.valoriNoti).toBe(1);
  });
  it('separa primari e alternative senza duplicati o codici ignoti', () => {
    const rosa = [
      giocatore({ ruoliSecondari: 'DC, TSD;TSD / CDC | INVALIDO' }),
      giocatore({ id: 2, ruolo: 'TSD', stato: 'INFORTUNATO', ruoliSecondari: null }),
    ];
    expect(ruoliSecondari(rosa[0])).toEqual(['TSD', 'CDC']);
    const terzini = coperturaRuoli(rosa).find((ruolo) => ruolo.ruolo === 'TSD')!;
    expect(terzini.primari).toHaveLength(1);
    expect(terzini.attivi).toBe(0);
    expect(terzini.alternativeAttive).toBe(1);
  });
  it('esporta CSV con quoting, UTF-8 e protezione formule, senza note mediche', () => {
    const csv = esportaRosaCsv([
      giocatore({ nome: '=HYPERLINK("test")', cognome: 'Rossi;Bianchi', noteMediche: 'RISERVATO' }),
    ]);
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('"\'=HYPERLINK(""test"")"');
    expect(csv).toContain('"Rossi;Bianchi"');
    expect(csv).not.toContain('RISERVATO');
  });
});
