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
    service.getTitolari.mockReturnValue(of([{ id: 7, nome: 'Raffaele', cognome: 'Russo', posizione: 'CF-L', numeroMaglia: 10 }]));
    fixture.componentInstance.mostraTitolari();
    fixture.detectChanges();
    expect(service.getTitolari).toHaveBeenCalledWith(1);
    expect(fixture.nativeElement.querySelector('.campo-formazione').textContent).toContain('Russo');
    expect(fixture.nativeElement.querySelector('.campo-formazione').textContent).toContain('10');
  });

  it('mantiene nella lista i titolari senza posizione attendibile', () => {
    service.getTitolari.mockReturnValue(of([{ id: 7, nome: 'Raffaele', cognome: 'Russo', posizione: null, numeroMaglia: null }]));
    fixture.componentInstance.mostraTitolari();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Posizione non disponibile');
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

  it('mostra il possesso decimale e distingue gli zeri dai dati assenti', () => {
    const component = fixture.componentInstance;
    component.tabAttivo = 'statistiche';
    component.stats = {
      possessoPct: 37.3, tiriTotali: 12, tiriInPorta: 3,
      passaggi: 294, passaggiRiusciti: 0, duelliVinti: null, duelliTotali: null,
      corner: 1, falli: 13, fuorigioco: 0, xg: null, fonte: 'ESPN',
    };
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('37.3%');
    expect(text).toContain('62.7%');
    expect(text).toContain('0% riusciti');
    expect(text).toContain('Duelli — non disponibile');
    expect(text).toContain('ESPN');
  });

  it('non mostra zero quando i tiri non sono disponibili', () => {
    fixture.componentInstance.tabAttivo = 'statistiche';
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.tiri-num').textContent.trim()).toBe('–');
  });

  it('mostra il recupero e non ripete il giocatore presente nella nota', () => {
    const partita = fixture.componentInstance.partita()!;
    fixture.componentInstance.partita.set({
      ...partita,
      eventi: [{
        id: 1, minuto: 45, minutoAggiuntivo: 2, tipo: 'GOL', giocatoreId: 7,
        nomeGiocatore: 'Raffaele', cognomeGiocatore: 'Russo', nota: 'Raffaele Russo - Avellino',
      }],
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.timeline-minuto').textContent.trim()).toBe("45+2'");
    expect(fixture.nativeElement.querySelector('.timeline-content').textContent.match(/Raffaele Russo/g)).toHaveLength(1);
  });
});
