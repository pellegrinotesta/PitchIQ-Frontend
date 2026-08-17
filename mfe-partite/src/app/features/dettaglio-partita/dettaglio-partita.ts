import { Component, inject, OnInit, signal } from '@angular/core';
import { HeatmapCampo } from '../heatmap-campo/heatmap-campo';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Partita, GiocatoreBase, TipoEvento, StatistichePartita, HeatmapZona, EventoPartita } from '../../core/models/partita.model';
import { PartitaService } from '../../core/services/partita.service';


type Tab = 'timeline' | 'statistiche' | 'heatmap';

@Component({
  selector: 'par-dettaglio',
  imports: [RouterLink, FormsModule, HeatmapCampo],
  templateUrl: './dettaglio-partita.html',
  styleUrl: './dettaglio-partita.scss',
})
export class DettaglioPartita implements OnInit {
  private route = inject(ActivatedRoute);
  private service = inject(PartitaService);

  partita = signal<Partita | null>(null);
  rosa = signal<GiocatoreBase[]>([]);
  loading = signal(true);
  salvando = signal(false);
  messaggio = signal<string | null>(null);

  tabAttivo: Tab = 'timeline';

  // Form evento
  nuovoMinuto = 0;
  nuovoTipo: TipoEvento = 'GOL';
  nuovoGiocatoreId: number | null = null;
  nuovaNota = '';
  posizioneX: number | null = null;
  posizioneY: number | null = null;
  xgPreview: number | null = null;

  // Statistiche form
  stats: StatistichePartita = this.emptyStats();

  // Heatmap
  giocatoreHeatmapId: number | null = null;
  zoneHeatmap: HeatmapZona[] = [];
  salvandoHeatmap = signal(false);

  readonly tipiEvento: { label: string; value: TipoEvento }[] = [
    { label: '⚽ Gol', value: 'GOL' },
    { label: '🅰️ Assist', value: 'ASSIST' },
    { label: '🟨 Ammonizione', value: 'AMMONIZIONE' },
    { label: '🟥 Espulsione', value: 'ESPULSIONE' },
    { label: '🔄 Sostituzione in', value: 'SOSTITUZIONE_IN' },
    { label: '🔄 Sostituzione out', value: 'SOSTITUZIONE_OUT' },
    { label: '🎯 Tiro', value: 'TIRO' },
    { label: '🧤 Parata', value: 'PARATA' },
    { label: '💪 Recupero', value: 'RECUPERO' },
    { label: '🦵 Fallo', value: 'FALLO' },
  ];

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.carica(id);
    this.service.getRosa().subscribe({ next: (r) => this.rosa.set(r) });
  }

  carica(id: number): void {
    this.loading.set(true);
    this.service.getById(id).subscribe({
      next: (p) => {
        this.partita.set(p);
        if (p.statistiche) this.stats = { ...p.statistiche };
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  // ===== EVENTI =====
  aggiungiEvento(): void {
    const p = this.partita();
    if (!p) return;

    this.service.addEvento(p.id, {
      minuto: this.nuovoMinuto,
      tipo: this.nuovoTipo,
      giocatoreId: this.nuovoGiocatoreId,
      nota: this.nuovaNota || null,
      coordX: this.posizioneX,
      coordY: this.posizioneY,
    }).subscribe({
      next: (updated) => {
        this.partita.set(updated);
        this.nuovoMinuto = 0;
        this.nuovaNota = '';
        this.nuovoGiocatoreId = null;
        this.posizioneX = null;
        this.posizioneY = null;
        this.xgPreview = null;
        this.mostraMsg('Evento aggiunto');
      },
    });
  }

  rimuoviEvento(evento: EventoPartita): void {
    const p = this.partita();
    if (!p) return;
    this.service.removeEvento(p.id, evento.id).subscribe({
      next: (updated) => this.partita.set(updated),
    });
  }

  // ===== STATISTICHE =====
  salvaStatistiche(): void {
    const p = this.partita();
    if (!p) return;
    this.salvando.set(true);
    this.service.upsertStatistiche(p.id, this.stats).subscribe({
      next: (updated) => {
        this.partita.set(updated);
        this.salvando.set(false);
        this.mostraMsg('Statistiche salvate');
      },
      error: () => this.salvando.set(false),
    });
  }

  // ===== HEATMAP =====
  cambiaGiocatoreHeatmap(id: number): void {
    const p = this.partita();
    if (!p) return;
    this.giocatoreHeatmapId = id;
    this.service.getHeatmap(p.id, id).subscribe({
      next: (zone) => this.zoneHeatmap = zone,
    });
  }

  onZoneChange(zone: HeatmapZona[]): void {
    this.zoneHeatmap = zone;
  }

  salvaHeatmap(): void {
    const p = this.partita();
    if (!p || !this.giocatoreHeatmapId) return;
    this.salvandoHeatmap.set(true);
    this.service.saveHeatmap(p.id, this.giocatoreHeatmapId, this.zoneHeatmap).subscribe({
      next: () => {
        this.salvandoHeatmap.set(false);
        this.mostraMsg('Heatmap salvata');
      },
    });
  }

  // ===== UTILS =====
  getRisultatoClass(r: string): string {
    if (r === 'V') return 'vittoria';
    if (r === 'P') return 'sconfitta';
    return 'pareggio';
  }

  getTipoLabel(tipo: TipoEvento): string {
    return this.tipiEvento.find(t => t.value === tipo)?.label ?? tipo;
  }

  getTipoClass(tipo: TipoEvento): string {
    if (tipo === 'GOL') return 'gol';
    if (tipo === 'AMMONIZIONE') return 'ammonizione';
    if (tipo === 'ESPULSIONE') return 'espulsione';
    if (tipo === 'ASSIST') return 'assist';
    return 'neutro';
  }

  get passaggiPct(): number {
    if (!this.stats.passaggi || !this.stats.passaggiRiusciti) return 0;
    return Math.round((this.stats.passaggiRiusciti / this.stats.passaggi) * 100);
  }

  get duelliPct(): number {
    if (!this.stats.duelliTotali || !this.stats.duelliVinti) return 0;
    return Math.round((this.stats.duelliVinti / this.stats.duelliTotali) * 100);
  }

  private emptyStats(): StatistichePartita {
    return {
      possessoPct: null, tiriTotali: null, tiriInPorta: null,
      passaggi: null, passaggiRiusciti: null,
      duelliVinti: null, duelliTotali: null,
      corner: null, falli: null, fuorigioco: null, xg: null,
    };
  }

  private mostraMsg(msg: string): void {
    this.messaggio.set(msg);
    setTimeout(() => this.messaggio.set(null), 2500);
  }

  selezionaPosizioneTiro(event: MouseEvent): void {
    const el = event.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    this.posizioneX = Math.round(((event.clientX - rect.left) / rect.width) * 100);
    // La metà campo è la zona offensiva (Y 0-50 del campo reale)
    this.posizioneY = Math.round(((event.clientY - rect.top) / rect.height) * 50);

    // Chiama il backend per preview xG
    this.service.getXgPreview(this.posizioneX, this.posizioneY).subscribe({
      next: (res) => this.xgPreview = res.xg,
    });
  }
}
