import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Giocatore, GiocatoreRequest, RuoloGiocatore, StatoGiocatore } from '../models/giocatore.model';

// TODO: leggere da environment.ts per supportare staging/prod senza rebuild
const BASE = 'http://localhost:8080/api/squadre/giocatori';

@Injectable({ providedIn: 'root' })
export class GiocatoreService {
    private http = inject(HttpClient);

    getAll(filtri?: { ruolo?: RuoloGiocatore; stato?: StatoGiocatore; cognome?: string }): Observable<Giocatore[]> {
        let params = new HttpParams();
        if (filtri?.ruolo) params = params.set('ruolo', filtri.ruolo);
        if (filtri?.stato) params = params.set('stato', filtri.stato);
        if (filtri?.cognome) params = params.set('cognome', filtri.cognome);
        return this.http.get<Giocatore[]>(BASE, { params });
    }

    getById(id: number): Observable<Giocatore> {
        return this.http.get<Giocatore>(`${BASE}/${id}`);
    }

    create(req: GiocatoreRequest): Observable<Giocatore> {
        return this.http.post<Giocatore>(BASE, req);
    }

    update(id: number, req: GiocatoreRequest): Observable<Giocatore> {
        return this.http.put<Giocatore>(`${BASE}/${id}`, req);
    }

    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${BASE}/${id}`);
    }
}
