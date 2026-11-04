import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { GiocatoreService } from '../../core/services/giocatore.service';
import { Giocatore } from '../../core/models/giocatore.model';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { FormGiocatore } from './form-giocatore';

describe('FormGiocatore', () => {
  let component: FormGiocatore;
  let fixture: ComponentFixture<FormGiocatore>;
  let service: { create: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> };
  let ref: { close: ReturnType<typeof vi.fn> };
  let config: { data: { giocatore: Giocatore | null } };

  beforeEach(async () => {
    service = { create: vi.fn(() => of({})), update: vi.fn(() => of({})) };
    ref = { close: vi.fn() };
    config = { data: { giocatore: null } };
    await TestBed.configureTestingModule({
      imports: [FormGiocatore],
      providers: [
        { provide: GiocatoreService, useValue: service },
        { provide: DynamicDialogRef, useValue: ref },
        { provide: DynamicDialogConfig, useValue: config },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FormGiocatore);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('usa i codici di ruolo del backend e richiede il numero maglia', () => {
    expect(component.ruoliOptions.some((ruolo) => ruolo.value === 'DC')).toBe(true);
    expect(component.ruoliOptions.some((ruolo) => ruolo.value === 'DIFENSORE')).toBe(false);
    component.form.patchValue({ nome: ' Marco ', cognome: 'Rossi', ruolo: 'DC', valoreMercato: 0 });
    expect(component.form.invalid).toBe(true);
    component.form.controls.numeroMaglia.setValue(5);
    component.submit();
    expect(service.create).toHaveBeenCalledWith(
      expect.objectContaining({ nome: 'Marco', ruolo: 'DC', numeroMaglia: 5, valoreMercato: 0 }),
    );
    expect(ref.close).toHaveBeenCalledWith(true);
  });

  it('impedisce date incoerenti, nomi vuoti e numeri frazionari', () => {
    component.form.patchValue({ nome: '  ', cognome: 'Rossi', ruolo: 'DC', numeroMaglia: 1.5 });
    expect(component.form.invalid).toBe(true);
    component.form.patchValue({
      nome: 'Marco',
      numeroMaglia: 5,
      contrattoInizio: '2027-01-01',
      contrattoFine: '2026-01-01',
    });
    expect(component.form.hasError('ordineContratto')).toBe(true);
    component.submit();
    expect(service.create).not.toHaveBeenCalled();
    component.form.patchValue({ contrattoFine: '2028-01-01', dataNascita: '2999-01-01' });
    expect(component.form.hasError('nascitaFutura')).toBe(true);
  });

  it('invia solo le modifiche, senza note mediche o campi invariati', () => {
    config.data.giocatore = {
      id: 8,
      nome: 'Marco',
      cognome: 'Rossi',
      numeroMaglia: 5,
      ruolo: 'DC',
      stato: 'ATTIVO',
      ruoliSecondari: 'TSD,CDC',
      noteMediche: 'RISERVATO',
      nazionalita: 'Italia',
    } as Giocatore;
    component.ngOnInit();
    expect(component.form.controls.ruoliSecondari.value).toEqual(['TSD', 'CDC']);
    component.form.controls.ruoliSecondari.setValue(['DC', 'TSD']);
    component.submit();
    expect(service.update).toHaveBeenCalledWith(
      8,
      expect.objectContaining({ ruoliSecondari: 'TSD' }),
    );
    expect(service.update.mock.calls[0][1]).not.toHaveProperty('noteMediche');
    expect(service.update.mock.calls[0][1]).not.toHaveProperty('nazionalita');
  });

  it('blocca doppi invii e consente retry dopo errore', () => {
    component.form.patchValue({ nome: 'Marco', cognome: 'Rossi', ruolo: 'DC', numeroMaglia: 5 });
    const risposta = new Subject<Giocatore>();
    service.create.mockReturnValueOnce(risposta);
    component.submit();
    component.submit();
    expect(service.create).toHaveBeenCalledTimes(1);
    risposta.error(new Error('offline'));
    expect(component.saving()).toBe(false);
    expect(component.errore()).not.toBeNull();
    service.create.mockReturnValueOnce(throwError(() => new Error('offline')));
    component.submit();
    expect(service.create).toHaveBeenCalledTimes(2);
  });
});

describe('Contratto HTTP giocatori', () => {
  it('usa PATCH senza completare con null i campi omessi', () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const service = TestBed.inject(GiocatoreService);
    const http = TestBed.inject(HttpTestingController);
    service.update(1, { nome: 'Marco' }).subscribe();
    const richiesta = http.expectOne('http://localhost:8080/api/squadre/giocatori/1');
    expect(richiesta.request.method).toBe('PATCH');
    expect(richiesta.request.body).toEqual({ nome: 'Marco' });
    richiesta.flush({});
    http.verify();
  });

  it('legge lo storico osservato dal nuovo endpoint', () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const service = TestBed.inject(GiocatoreService);
    const http = TestBed.inject(HttpTestingController);
    service.getStorico(1).subscribe();
    const richiesta = http.expectOne('http://localhost:8080/api/statistiche/giocatori/1/storico');
    expect(richiesta.request.method).toBe('GET');
    richiesta.flush([]);
    http.verify();
  });
});
