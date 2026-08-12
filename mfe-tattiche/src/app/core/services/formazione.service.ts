import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Formazione, FormazioneRequest, GiocatoreDisponibile } from '../model/formazione.model';


const BFF = 'http://localhost:8080/api';

@Injectable({ providedIn: 'root' })
export class FormazioneService {
    private http = inject(HttpClient);

    getAll(): Observable<Formazione[]> {
        return this.http.get<Formazione[]>(`${BFF}/tattiche/formazioni`);
    }

    getById(id: number): Observable<Formazione> {
        return this.http.get<Formazione>(`${BFF}/tattiche/formazioni/${id}`);
    }

    create(req: FormazioneRequest): Observable<Formazione> {
        return this.http.post<Formazione>(`${BFF}/tattiche/formazioni`, req);
    }

    update(id: number, req: FormazioneRequest): Observable<Formazione> {
        return this.http.put<Formazione>(`${BFF}/tattiche/formazioni/${id}`, req);
    }

    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${BFF}/tattiche/formazioni/${id}`);
    }

    // Riusa l'endpoint squadre per caricare la rosa disponibile
    getRosaDisponibile(): Observable<GiocatoreDisponibile[]> {
        return this.http.get<GiocatoreDisponibile[]>(`${BFF}/squadre/giocatori?stato=ATTIVO`);
    }
}