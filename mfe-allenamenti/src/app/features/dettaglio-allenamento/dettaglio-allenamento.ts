import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SedutaAllenamento, Presenza, TipoSeduta, durataMinuti } from '../../core/models/allenamento.model';
import { AllenamentoService } from '../../core/services/allenamento.service';

@Component({
  selector: 'all-dettaglio',
  imports: [RouterLink, FormsModule],
  templateUrl: './dettaglio-allenamento.html',
  styleUrl: './dettaglio-allenamento.css',
})
export class DettaglioAllenamento implements OnInit {
  private route = inject(ActivatedRoute);
  private service = inject(AllenamentoService);

  seduta = signal<SedutaAllenamento | null>(null);
  loading = signal(true);
  salvando = signal(false);
  messaggio = signal<string | null>(null);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.carica(id);
  }

  carica(id: number): void {
    this.loading.set(true);
    this.service.getById(id).subscribe({
      next: (s) => { this.seduta.set(s); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  generaPresenze(): void {
    const s = this.seduta();
    if (!s) return;
    this.service.generaPresenze(s.id).subscribe({
      next: (updated) => {
        this.seduta.set(updated);
        this.mostraMessaggio('Presenze generate per tutta la rosa attiva');
      },
    });
  }

  togglePresenza(p: Presenza): void {
    p.presente = !p.presente;
    if (p.presente) {
      p.motivoAssenza = null;
    }
  }

  salvaPresenze(): void {
    const s = this.seduta();
    if (!s) return;
    this.salvando.set(true);

    const req = {
      data: s.data, oraInizio: s.oraInizio, oraFine: s.oraFine,
      tipo: s.tipo, luogo: s.luogo, note: s.note,
      presenze: s.presenze.map(p => ({
        giocatoreId: p.giocatoreId,
        presente: p.presente,
        motivoAssenza: p.motivoAssenza,
        valutazione: p.valutazione,
        minuti: p.presente ? (p.minuti ?? null) : null,
        rpe: p.presente ? (p.rpe ?? null) : null,
      })),
    };

    this.service.update(s.id, req).subscribe({
      next: (updated) => {
        this.seduta.set(updated);
        this.salvando.set(false);
        this.mostraMessaggio('Presenze salvate');
      },
      error: () => this.salvando.set(false),
    });
  }

  readonly scalaRpe = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  durata(s: SedutaAllenamento): number {
    return durataMinuti(s.oraInizio, s.oraFine);
  }

  impostaRpe(p: Presenza, valore: string): void {
    p.rpe = valore ? Number(valore) : null;
  }

  impostaMinuti(p: Presenza, valore: string): void {
    const minuti = Math.round(Number(valore));
    p.minuti = valore !== '' && Number.isFinite(minuti) && minuti >= 0 ? Math.min(minuti, 600) : null;
  }

  /** RPE × minuti; senza minuti individuali vale la durata della seduta. */
  carico(p: Presenza, s: SedutaAllenamento): number | null {
    return p.rpe ? p.rpe * (p.minuti ?? this.durata(s)) : null;
  }

  caricoMedio(s: SedutaAllenamento): number | null {
    const carichi = s.presenze.flatMap((p) => (p.presente ? (this.carico(p, s) ?? []) : []));
    return carichi.length ? Math.round(carichi.reduce((a, b) => a + b, 0) / carichi.length) : null;
  }

  getTipoClass(tipo: TipoSeduta): string {
    const map: Record<TipoSeduta, string> = {
      TECNICO: 'tecnico', TATTICO: 'tattico',
      ATLETICO: 'atletico', PARTITELLA: 'partitella',
    };
    return map[tipo];
  }

  private mostraMessaggio(msg: string): void {
    this.messaggio.set(msg);
    setTimeout(() => this.messaggio.set(null), 2500);
  }
}
