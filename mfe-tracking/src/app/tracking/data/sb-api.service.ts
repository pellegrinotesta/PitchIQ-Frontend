import { HttpClient } from '@angular/common/http';
import { Injectable, InjectionToken, inject } from '@angular/core';
import { Observable } from 'rxjs';

export const SB_API_URL = new InjectionToken<string>('SB_API_URL', {
    providedIn: 'root',
    factory: () => 'http://localhost:8080/api/tracking/statsbomb',
});

export interface Competizione {
    competition_id: number;
    competition_name: string;
    season_id: number;
    season_name: string;
    country_name: string;
}

export interface PartitaSb {
    match_id: number;
    match_date: string;
    home_team: { home_team_name: string };
    away_team: { away_team_name: string };
    home_score: number;
    away_score: number;
}

export interface TiroSb {
    id: string;
    squadra: string;
    giocatore: string;
    minuto: number;
    secondo: number;
    x: number;
    y: number;
    xg: number;
    esito: string;
    tecnica: string;
    parteCorpo: string;
    gol: boolean;
}

@Injectable({ providedIn: 'root' })
export class SbApiService {
    private readonly http = inject(HttpClient);
    private readonly base = inject(SB_API_URL);

    competizioni(): Observable<Competizione[]> {
        return this.http.get<Competizione[]>(`${this.base}/competizioni`);
    }

    partite(competitionId: number, seasonId: number): Observable<PartitaSb[]> {
        return this.http.get<PartitaSb[]>(`${this.base}/partite/${competitionId}/${seasonId}`);
    }

    tiri(matchId: number): Observable<TiroSb[]> {
        return this.http.get<TiroSb[]>(`${this.base}/tiri/${matchId}`);
    }
}