import { Component, inject, OnInit, signal } from '@angular/core';
import { HeatmapCampo } from '../heatmap-campo/heatmap-campo';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Partita, GiocatoreBase, TipoEvento, StatistichePartita, HeatmapZona, EventoPartita, Titolare } from '../../core/models/partita.model';
import { PartitaService } from '../../core/services/partita.service';


type Tab = 'timeline' | 'titolari' | 'statistiche' | 'heatmap';

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
  titolari = signal<Titolare[]>([]);
  caricamentoTitolari = signal(false);
  erroreTitolari = signal(false);

  tabAttivo: Tab = 'timeline';

  private readonly posizioniCampo: Record<string, { x: number; y: number }> = {
    'G': { x: 50, y: 90 },
    'LB': { x: 12, y: 70 }, 'RB': { x: 88, y: 70 },
    'CD-L': { x: 30, y: 70 }, 'CD': { x: 50, y: 70 }, 'CD-R': { x: 70, y: 70 },
    'LM': { x: 12, y: 48 }, 'RM': { x: 88, y: 48 },
    'CM-L': { x: 32, y: 49 }, 'CM': { x: 50, y: 49 }, 'CM-R': { x: 68, y: 49 },
    'M': { x: 50, y: 60 }, 'AM': { x: 50, y: 31 },
    'AM-L': { x: 23, y: 30 }, 'AM-R': { x: 77, y: 30 },
    'F': { x: 50, y: 12 }, 'CF-L': { x: 32, y: 12 }, 'CF-R': { x: 68, y: 12 },
  };

  posizioneCampo(posizione: string | null): { x: number; y: number } | null {
    return posizione ? this.posizioniCampo[posizione] ?? null : null;
  }

  get titolariSenzaPosizione(): Titolare[] {
    return this.titolari().filter(g => !this.posizioneCampo(g.posizione));
  }

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

  mostraTitolari(): void {
    this.tabAttivo = 'titolari';
    const partita = this.partita();
    if (!partita || this.caricamentoTitolari()) return;

    this.caricamentoTitolari.set(true);
    this.erroreTitolari.set(false);
    this.service.getTitolari(partita.id).subscribe({
      next: (titolari) => {
        this.titolari.set(titolari);
        this.caricamentoTitolari.set(false);
      },
      error: () => {
        this.erroreTitolari.set(true);
        this.caricamentoTitolari.set(false);
      },
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

  notaContieneGiocatore(evento: EventoPartita): boolean {
    return !!evento.nota && !!evento.nomeGiocatore && !!evento.cognomeGiocatore
      && evento.nota.includes(`${evento.nomeGiocatore} ${evento.cognomeGiocatore}`);
  }

  getTipoClass(tipo: TipoEvento): string {
    if (tipo === 'GOL') return 'gol';
    if (tipo === 'AMMONIZIONE') return 'ammonizione';
    if (tipo === 'ESPULSIONE') return 'espulsione';
    if (tipo === 'ASSIST') return 'assist';
    return 'neutro';
  }

  get passaggiPct(): number | null {
    if (this.stats.passaggi === null || this.stats.passaggi <= 0 || this.stats.passaggiRiusciti === null) return null;
    return Math.round((this.stats.passaggiRiusciti / this.stats.passaggi) * 100);
  }

  get duelliPct(): number | null {
    if (this.stats.duelliTotali === null || this.stats.duelliTotali <= 0 || this.stats.duelliVinti === null) return null;
    return Math.round((this.stats.duelliVinti / this.stats.duelliTotali) * 100);
  }

  private emptyStats(): StatistichePartita {
    return {
      possessoPct: null, tiriTotali: null, tiriInPorta: null,
      passaggi: null, passaggiRiusciti: null,
      duelliVinti: null, duelliTotali: null,
      corner: null, falli: null, fuorigioco: null, xg: null, fonte: null,
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
