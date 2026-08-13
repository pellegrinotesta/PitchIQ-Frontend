import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
    Partita, HeatmapZona, ScoutingAvversario, GiocatoreBase,
    StatistichePartita
} from '../models/partita.model';

const BFF = 'http://localhost:8080/api';

@Injectable({ providedIn: 'root' })
export class PartitaService {
    private http = inject(HttpClient);

    // Partite
    getAll(): Observable<Partita[]> {
        return this.http.get<Partita[]>(`${BFF}/partite`);
    }

    getById(id: number): Observable<Partita> {
        return this.http.get<Partita>(`${BFF}/partite/${id}`);
    }

    create(req: any): Observable<Partita> {
        return this.http.post<Partita>(`${BFF}/partite`, req);
    }

    update(id: number, req: any): Observable<Partita> {
        return this.http.put<Partita>(`${BFF}/partite/${id}`, req);
    }

    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${BFF}/partite/${id}`);
    }

    // Eventi
    addEvento(partitaId: number, req: any): Observable<Partita> {
        return this.http.post<Partita>(`${BFF}/partite/${partitaId}/eventi`, req);
    }

    removeEvento(partitaId: number, eventoId: number): Observable<Partita> {
        return this.http.delete<Partita>(`${BFF}/partite/${partitaId}/eventi/${eventoId}`);
    }

    // Statistiche
    upsertStatistiche(partitaId: number, req: StatistichePartita): Observable<Partita> {
        return this.http.post<Partita>(`${BFF}/partite/${partitaId}/statistiche`, req);
    }

    // Heatmap
    getHeatmap(partitaId: number, giocatoreId: number): Observable<HeatmapZona[]> {
        return this.http.get<HeatmapZona[]>(`${BFF}/partite/${partitaId}/heatmap/${giocatoreId}`);
    }

    saveHeatmap(partitaId: number, giocatoreId: number, zone: HeatmapZona[]): Observable<void> {
        return this.http.post<void>(`${BFF}/partite/${partitaId}/heatmap/${giocatoreId}`, zone);
    }

    // Scouting
    getAllScouting(): Observable<ScoutingAvversario[]> {
        return this.http.get<ScoutingAvversario[]>(`${BFF}/scouting`);
    }

    createScouting(req: any): Observable<ScoutingAvversario> {
        return this.http.post<ScoutingAvversario>(`${BFF}/scouting`, req);
    }

    updateScouting(id: number, req: any): Observable<ScoutingAvversario> {
        return this.http.put<ScoutingAvversario>(`${BFF}/scouting/${id}`, req);
    }

    deleteScouting(id: number): Observable<void> {
        return this.http.delete<void>(`${BFF}/scouting/${id}`);
    }

    // Rosa
    getRosa(): Observable<GiocatoreBase[]> {
        return this.http.get<GiocatoreBase[]>(`${BFF}/squadre/giocatori`);
    }
}
