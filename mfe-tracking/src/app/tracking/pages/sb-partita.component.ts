import { ChangeDetectionStrategy, Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { SbApiService, TiroSb } from '../data/sb-api.service';

@Component({
    selector: 'sb-partita',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [RouterLink],
    host: {
        style: 'display: block; padding: 2rem 2.5rem; min-height: 100vh; background: #0a0a0a;'
    },
    templateUrl: './sb-partita.component.html',
    styleUrl: './sb-partita.component.scss',
})
export class SbPartitaComponent implements OnInit {
    private readonly api = inject(SbApiService);
    private readonly route = inject(ActivatedRoute);

    protected readonly tiri = signal<TiroSb[]>([]);
    protected readonly caricamento = signal(true);
    protected readonly squadraFiltro = signal<string | null>(null);
    protected readonly tooltipTiro = signal<TiroSb | null>(null);

    private readonly colori = new Map<string, string>();
    private readonly palette = ['#00ff87', '#60a5fa', '#f59e0b', '#ef4444'];
    private coloreIdx = 0;

    protected readonly squadre = computed(() => {
        const map = new Map<string, { nome: string; xgTotale: number; gol: number; tiri: number }>();
        for (const t of this.tiri()) {
            const s = map.get(t.squadra) ?? { nome: t.squadra, xgTotale: 0, gol: 0, tiri: 0 };
            s.xgTotale += t.xg;
            s.tiri++;
            if (t.gol) s.gol++;
            map.set(t.squadra, s);
        }
        return [...map.values()];
    });

    protected readonly tiriFiltrati = computed(() => {
        const f = this.squadraFiltro();
        return f ? this.tiri().filter(t => t.squadra === f) : this.tiri();
    });

    ngOnInit(): void {
        const matchId = Number(this.route.snapshot.paramMap.get('matchId'));
        this.api.tiri(matchId).subscribe({
            next: tiri => {
                this.tiri.set(tiri);
                this.caricamento.set(false);
            },
            error: () => this.caricamento.set(false),
        });
    }

    protected coloreSquadra(nome: string): string {
        if (!this.colori.has(nome)) {
            this.colori.set(nome, this.palette[this.coloreIdx++ % this.palette.length]);
        }
        return this.colori.get(nome)!;
    }

    protected pad(s: number): string {
        return String(s).padStart(2, '0');
    }
}