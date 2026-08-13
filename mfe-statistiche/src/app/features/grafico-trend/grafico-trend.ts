import { Component, Input } from '@angular/core';
import { TrendDto } from '../../core/models/statistica.model';

interface PuntoGrafico {
  x: number;
  y: number;
  periodo: string;
  valore: number;
  isProiezione: boolean;
}

@Component({
  selector: 'stat-grafico-trend',
  imports: [],
  templateUrl: './grafico-trend.html',
  styleUrl: './grafico-trend.css',
})
export class GraficoTrend {
  @Input() set trend(value: TrendDto) {
    this._trend = value;
    this.calcolaGrafico();
  }
  @Input() mesiProiezione = 6;

  _trend: TrendDto | null = null;

  puntiStorico: PuntoGrafico[] = [];
  puntiProiezione: PuntoGrafico[] = [];
  tuttiPunti: PuntoGrafico[] = [];

  pathStorico = '';
  pathProiezione = '';
  pathArea = '';

  minY = 0;
  maxY = 0;
  ticksY: { valore: number; y: number }[] = [];
  ticksX: { label: string; x: number }[] = [];

  tooltip: { visible: boolean; x: number; y: number; periodo: string; valore: number; isProiezione: boolean } = {
    visible: false, x: 0, y: 0, periodo: '', valore: 0, isProiezione: false
  };

  readonly W = 800;
  readonly H = 240;
  readonly PAD = { top: 20, right: 30, bottom: 40, left: 50 };

  private calcolaGrafico(): void {
    if (!this._trend) return;

    const tutti = [
      ...this._trend.storico.map(p => ({ ...p, isProiezione: false })),
      ...this._trend.proiezione.map(p => ({ ...p, isProiezione: true })),
    ];

    // Servono almeno 2 punti per disegnare una linea
    if (tutti.length < 2) return;

    const valori = tutti.map(p => p.valore);
    this.minY = Math.floor(Math.min(...valori) * 0.9);
    this.maxY = Math.ceil(Math.max(...valori) * 1.1);
    const rangeY = this.maxY === this.minY ? 1 : this.maxY - this.minY;

    const innerW = this.W - this.PAD.left - this.PAD.right;
    const innerH = this.H - this.PAD.top - this.PAD.bottom;

    // Con un solo punto toX restituirebbe NaN — usa Math.max(1, ...)
    const nPunti = tutti.length;
    const toX = (i: number) =>
      this.PAD.left + (nPunti > 1 ? (i / (nPunti - 1)) * innerW : innerW / 2);
    const toY = (v: number) =>
      this.PAD.top + innerH - ((v - this.minY) / rangeY) * innerH;

    this.tuttiPunti = tutti.map((p, i) => ({
      x: toX(i), y: toY(p.valore),
      periodo: p.periodo, valore: p.valore, isProiezione: p.isProiezione,
    }));

    const nStorico = this._trend.storico.length;
    this.puntiStorico = this.tuttiPunti.slice(0, nStorico);
    this.puntiProiezione = this.tuttiPunti.slice(Math.max(0, nStorico - 1));

    this.pathStorico = this.puntiStorico.length > 0
      ? this.puntiStorico.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
      : '';

    this.pathProiezione = this.puntiProiezione.length > 1
      ? this.puntiProiezione.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
      : '';

    const baseY = this.PAD.top + innerH;
    this.pathArea = this.puntiStorico.length > 0
      ? `${this.pathStorico} L${this.puntiStorico.at(-1)!.x},${baseY} L${this.PAD.left},${baseY} Z`
      : '';

    // Tick Y
    this.ticksY = Array.from({ length: 5 }, (_, i) => {
      const valore = this.minY + (rangeY / 4) * i;
      return { valore: Math.round(valore * 10) / 10, y: toY(valore) };
    });

    // Tick X — al massimo 6 label
    const step = Math.max(1, Math.floor(nPunti / 6));
    this.ticksX = this.tuttiPunti
      .filter((_, i) => i % step === 0 || i === nPunti - 1)
      .map(p => ({ label: p.periodo, x: p.x }));
  }

  mostraTooltip(p: PuntoGrafico): void {
    this.tooltip = { visible: true, x: p.x, y: p.y, periodo: p.periodo, valore: p.valore, isProiezione: p.isProiezione };
  }

  nascondiTooltip(): void {
    this.tooltip = { ...this.tooltip, visible: false };
  }
}
