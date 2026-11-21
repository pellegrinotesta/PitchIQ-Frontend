import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { Partita, Scouting } from '../../core/model/partita.model';

/** Contesto della partita per cui si prepara la formazione: avversario, scouting, formazioni recenti. */
@Component({
  selector: 'app-preparazione-partita',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe],
  templateUrl: './preparazione-partita.html',
  styleUrl: './preparazione-partita.scss',
})
export class PreparazionePartita {
  readonly partita = input<Partita | null>(null);
  readonly scouting = input<Scouting | null>(null);
  /** Partite giocate più recenti, da usare come base. */
  readonly recenti = input<Partita[]>([]);
  readonly caricandoBase = input<number | null>(null);
  readonly usaComeBase = output<Partita>();

  protected readonly aperto = signal(true);

  protected readonly esito: Record<string, string> = { V: 'Vittoria', N: 'Pareggio', P: 'Sconfitta' };
}
