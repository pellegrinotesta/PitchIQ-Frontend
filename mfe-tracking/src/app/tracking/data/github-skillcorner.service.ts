import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, switchMap } from 'rxjs';

const BASE = 'https://api.github.com/repos/SkillCorner/opendata/contents/data/matches';
const RAW = 'https://raw.githubusercontent.com/SkillCorner/opendata/master/data/matches';

export interface PartitaGitHub {
    id: string;           // nome cartella es. "1874553"
    matchJson: string;    // download_url del match.json
    eventiCsv: string;    // download_url del dynamic_events.csv
    trackingJsonl: string | null;
    // metadati estratti dal match.json dopo il fetch
    squadraCasa?: string;
    squadraTrasferta?: string;
    data?: string;
    competizione?: string;
}

interface GhEntry {
    name: string;
    path: string;
    type: 'file' | 'dir';
    download_url: string | null;
}

@Injectable({ providedIn: 'root' })
export class GithubSkillcornerService {
    private readonly http = inject(HttpClient);

    /** Lista tutte le cartelle partita disponibili nel repo. */
    listaPartite(): Observable<PartitaGitHub[]> {
        return this.http.get<GhEntry[]>(BASE).pipe(
            switchMap(cartelle => {
                const dirs = cartelle.filter(e => e.type === 'dir');
                // Per ogni cartella leggi i file dentro
                return forkJoin(
                    dirs.map(dir =>
                        this.http.get<GhEntry[]>(`${BASE}/${dir.name}`).pipe(
                            map(files => this.toPartita(dir.name, files))
                        )
                    )
                );
            }),
            // Filtra solo quelle con almeno partita + eventi
            map(list => list.filter(p => p.matchJson && p.eventiCsv))
        );
    }

    /** Scarica i metadati (squadre, data) dal match.json. */
    metadati(matchUrl: string): Observable<{ squadraCasa: string; squadraTrasferta: string; data: string; competizione: string }> {
        return this.http.get<any>(matchUrl).pipe(
            map(j => ({
                squadraCasa: j.home_team?.name ?? j.team_home ?? '?',
                squadraTrasferta: j.away_team?.name ?? j.team_away ?? '?',
                data: j.match_date ?? j.date ?? '',
                competizione: j.competition?.competition_name ?? j.competition ?? '',
            }))
        );
    }

    /** Scarica un file remoto come Blob e lo converte in File. */
    scaricaFile(url: string, nomeFile: string): Observable<File> {
        return this.http.get(url, { responseType: 'blob' }).pipe(
            map(blob => new File([blob], nomeFile, { type: blob.type }))
        );
    }

    /** Scarica in parallelo i tre file di una partita. */
    scaricaTutto(p: PartitaGitHub): Observable<{ partita: File; eventi: File; tracking: File | null }> {
        const partita$ = this.scaricaFile(p.matchJson, `${p.id}_match.json`);
        const eventi$ = this.scaricaFile(p.eventiCsv, `${p.id}_dynamic_events.csv`);
        const tracking$ = p.trackingJsonl
            ? this.scaricaFile(p.trackingJsonl, `${p.id}_tracking_extrapolated.jsonl`)
            : new Observable<null>(o => { o.next(null); o.complete(); });

        return forkJoin({ partita: partita$, eventi: eventi$, tracking: tracking$ }) as Observable<any>;
    }

    private toPartita(id: string, files: GhEntry[]): PartitaGitHub {
        const find = (pattern: RegExp) =>
            files.find(f => pattern.test(f.name))?.download_url ?? '';

        return {
            id,
            matchJson: find(/match\.json$/i),
            eventiCsv: find(/dynamic_events\.csv$/i),
            trackingJsonl: find(/tracking.*\.jsonl$/i) || null,
        };
    }
}