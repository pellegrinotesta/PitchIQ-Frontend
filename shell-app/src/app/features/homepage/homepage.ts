import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  dataIso,
  GiocatoreSintesi,
  giorniA,
  PanoramicaService,
  PartitaSintesi,
  SedutaSintesi,
  stagioneDi,
} from '../../core/services/panoramica.service';

/** Finestra di attenzione sui contratti: negli ultimi sei mesi il giocatore può accordarsi con un altro club. */
const GIORNI_ALLERTA_CONTRATTO = 180;

@Component({
  selector: 'app-homepage',
  imports: [RouterLink, DatePipe, DecimalPipe],
  templateUrl: './homepage.html',
  styleUrl: './homepage.scss',
})
export class Homepage implements OnInit {
  private panoramica = inject(PanoramicaService);
  private readonly oggi = new Date();

  // null = non ancora caricato; 'errore' = dato non disponibile
  readonly partite = signal<PartitaSintesi[] | 'errore' | null>(null);
  readonly rosa = signal<GiocatoreSintesi[] | 'errore' | null>(null);
  readonly sedute = signal<SedutaSintesi[] | 'errore' | null>(null);

  readonly stagione = computed(() => {
    const tutte = this.partite();
    if (!Array.isArray(tutte)) return null;
    const partite = tutte.filter((p) => p.giocata !== false);
    const corrente = partite.flatMap((p) => stagioneDi(p.data) ?? []).sort().at(-1) ?? null;
    if (!corrente) return null;
    const giocate = partite
      .filter((p) => stagioneDi(p.data) === corrente)
      .sort((a, b) => b.data.localeCompare(a.data) || b.id - a.id);
    const conta = (r: string) => giocate.filter((p) => p.risultato === r).length;
    return {
      nome: corrente,
      giocate: giocate.length,
      vittorie: conta('V'),
      pareggi: conta('N'),
      sconfitte: conta('P'),
      mediaPunti: (conta('V') * 3 + conta('N')) / giocate.length,
      ultime: giocate.slice(0, 5),
    };
  });

  /** Prima partita in calendario da oggi in poi */
  readonly prossima = computed(() => {
    const partite = this.partite();
    if (!Array.isArray(partite)) return null;
    const oggi = dataIso(this.oggi);
    return (
      partite
        .filter((p) => p.giocata === false && p.data >= oggi)
        .sort((a, b) => a.data.localeCompare(b.data) || a.id - b.id)[0] ?? null
    );
  });

  readonly disponibilita = computed(() => {
    const rosa = this.rosa();
    if (!Array.isArray(rosa)) return null;
    return {
      totale: rosa.length,
      disponibili: rosa.filter((g) => g.stato === 'ATTIVO').length,
      infortunati: rosa.filter((g) => g.stato === 'INFORTUNATO'),
      squalificati: rosa.filter((g) => g.stato === 'SQUALIFICATO'),
    };
  });

  readonly contratti = computed(() => {
    const rosa = this.rosa();
    if (!Array.isArray(rosa)) return null;
    return rosa
      .flatMap((g) => {
        const giorni = giorniA(g.contrattoFine, this.oggi);
        return giorni !== null && giorni <= GIORNI_ALLERTA_CONTRATTO ? [{ ...g, giorni }] : [];
      })
      .sort((a, b) => a.giorni - b.giorni);
  });

  readonly prossimeSedute = computed(() => {
    const sedute = this.sedute();
    if (!Array.isArray(sedute)) return null;
    const oggi = dataIso(this.oggi);
    return sedute
      .filter((s) => s.data >= oggi)
      .sort((a, b) => a.data.localeCompare(b.data) || a.oraInizio.localeCompare(b.oraInizio))
      .slice(0, 4);
  });

  readonly sezioni = [
    { label: 'Squadre & Rosa', icon: 'pi pi-users', route: '/squadre', descrizione: 'Gestisci la rosa, aggiungi e modifica giocatori' },
    { label: 'Allenamenti', icon: 'pi pi-calendar', route: '/allenamenti', descrizione: 'Pianifica le sedute e registra le presenze' },
    { label: 'Tattiche', icon: 'pi pi-map', route: '/tattiche', descrizione: 'Crea formazioni e schemi di gioco' },
    { label: 'Statistiche', icon: 'pi pi-chart-line', route: '/statistiche', descrizione: 'Analizza la crescita e il rendimento dei giocatori' },
    { label: 'Partite', icon: 'pi pi-circle-fill', route: '/partite', descrizione: 'Registra le partite, gli eventi e le statistiche' },
    { label: 'Tracking', icon: 'pi pi-map-marker', route: '/tracking', descrizione: 'Analisi pressioni con dati SkillCorner' },
    { label: 'StatsBomb', icon: 'pi pi-chart-bar', route: '/tracking/statsbomb', descrizione: 'Shot map, xG e analisi eventi su dati aperti StatsBomb' },
  ];

  ngOnInit(): void {
    // Ogni riquadro si carica e fallisce in modo indipendente
    this.panoramica.partite().subscribe({
      next: (v) => this.partite.set(v),
      error: () => this.partite.set('errore'),
    });
    this.panoramica.rosa().subscribe({
      next: (v) => this.rosa.set(v),
      error: () => this.rosa.set('errore'),
    });
    this.panoramica.seduteDa(dataIso(this.oggi)).subscribe({
      next: (v) => this.sedute.set(v),
      error: () => this.sedute.set('errore'),
    });
  }

  classeRisultato(r: string | null): string {
    return r === 'V' ? 'vittoria' : r === 'P' ? 'sconfitta' : 'pareggio';
  }
}
