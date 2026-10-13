import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, from, map, of, switchMap } from 'rxjs';
import { TRACKING_API_URL } from './tracking.api';
import { ImportDto } from './tracking.models';

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
    private readonly base = inject(TRACKING_API_URL);

    listaPartite(): Observable<{ matchId: string }[]> {
        return this.http.get<{ matchId: string }[]>(`${this.base}/github/partite`);
    }

    importa(matchId: string): Observable<ImportDto> {
        return this.http.post<ImportDto>(`${this.base}/github/importa/${matchId}`, {});
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

    scaricaFile(url: string, nomeFile: string): Observable<File> {
        return this.http.get(url, { responseType: 'blob' }).pipe(
            switchMap(blob => {
                // Leggi il blob come testo per verificare se è un puntatore LFS
                return from(blob.text()).pipe(
                    switchMap(testo => {
                        if (testo.startsWith('version https://git-lfs.github.com')) {
                            // Estrai oid e size dal puntatore
                            const oid = testo.match(/oid sha256:([a-f0-9]+)/)?.[1];
                            const size = testo.match(/size (\d+)/)?.[1];
                            if (!oid) throw new Error('Puntatore LFS non valido');
                            return this.scaricaLfs(oid, Number(size), nomeFile);
                        }
                        return of(new File([blob], nomeFile, { type: blob.type }));
                    })
                );
            })
        );
    }

    private scaricaLfs(oid: string, size: number, nomeFile: string): Observable<File> {
        const body = {
            operation: 'download',
            transfers: ['basic'],
            objects: [{ oid, size }],
        };

        return this.http.post<any>(
            'https://github.com/SkillCorner/opendata.git/info/lfs/objects/batch',
            body,
            { headers: { Accept: 'application/vnd.git-lfs+json', 'Content-Type': 'application/vnd.git-lfs+json' } }
        ).pipe(
            switchMap(res => {
                const downloadUrl = res.objects?.[0]?.actions?.download?.href;
                if (!downloadUrl) throw new Error('URL LFS non disponibile');
                return this.http.get(downloadUrl, { responseType: 'blob' });
            }),
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