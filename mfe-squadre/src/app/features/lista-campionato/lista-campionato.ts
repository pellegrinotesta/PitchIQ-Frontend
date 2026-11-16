import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Giocatore } from '../../core/models/giocatore.model';
import {
  etichettaStagione,
  FORMAZIONE_LABEL,
  POSTI_TOTALI,
  sogliaUnder22,
  verificaLista,
} from '../../core/models/lista-campionato';

@Component({
  selector: 'app-lista-campionato',
  imports: [RouterLink],
  templateUrl: './lista-campionato.html',
  styleUrl: './lista-campionato.scss',
})
export class ListaCampionato {
  readonly rosa = input.required<Giocatore[]>();
  readonly oggi = input<Date>(new Date());

  readonly verifica = computed(() => verificaLista(this.rosa(), this.oggi()));
  readonly stagione = computed(() => etichettaStagione(this.verifica().anno));
  readonly annoUnder22 = computed(() => sogliaUnder22(this.verifica().anno).slice(0, 4));
  readonly postiTotali = POSTI_TOTALI;

  formazione(g: Giocatore): string {
    return g.formazione ? FORMAZIONE_LABEL[g.formazione] : 'Da classificare';
  }
}
