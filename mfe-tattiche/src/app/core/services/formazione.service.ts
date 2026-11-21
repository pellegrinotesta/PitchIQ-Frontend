import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CaricoGiocatore, Formazione, FormazioneRequest, GiocatoreDisponibile } from '../model/formazione.model';
import { SchemaFormazione, SchemaFormazioneRequest } from '../model/schema.model';
import { Partita, Scouting, TitolarePartita } from '../model/partita.model';
import { apiUrl } from '../api-url';


const BFF = apiUrl();

@Injectable({ providedIn: 'root' })
export class FormazioneService {
    private http = inject(HttpClient);

    // --- Formazioni ---
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

    /** Tutta la rosa, compresi infortunati e squalificati: vengono mostrati come non disponibili. */
    getRosaDisponibile(): Observable<GiocatoreDisponibile[]> {
        return this.http.get<GiocatoreDisponibile[]>(`${BFF}/squadre/giocatori`);
    }

    /** Carico di allenamento di oggi (rapporto acuto/cronico) per segnalare i giocatori affaticati. */
    getCarichi(): Observable<CaricoGiocatore[]> {
        return this.http.get<CaricoGiocatore[]>(`${BFF}/allenamenti/carico`);
    }

    // --- Partite (calendario, scouting, formazioni reali) ---
    getPartite(): Observable<Partita[]> {
        return this.http.get<Partita[]>(`${BFF}/partite`);
    }

    getScouting(id: number): Observable<Scouting> {
        return this.http.get<Scouting>(`${BFF}/scouting/${id}`);
    }

    getTitolariPartita(partitaId: number): Observable<TitolarePartita[]> {
        return this.http.get<TitolarePartita[]>(`${BFF}/partite/${partitaId}/titolari`);
    }

    // --- Schemi ---
    getAllSchemi(): Observable<SchemaFormazione[]> {
        return this.http.get<SchemaFormazione[]>(`${BFF}/tattiche/schemi`);
    }

    getSchemaById(id: number): Observable<SchemaFormazione> {
        return this.http.get<SchemaFormazione>(`${BFF}/tattiche/schemi/${id}`);
    }

    createSchema(req: SchemaFormazioneRequest): Observable<SchemaFormazione> {
        return this.http.post<SchemaFormazione>(`${BFF}/tattiche/schemi`, req);
    }

    updateSchema(id: number, req: SchemaFormazioneRequest): Observable<SchemaFormazione> {
        return this.http.put<SchemaFormazione>(`${BFF}/tattiche/schemi/${id}`, req);
    }

    deleteSchema(id: number): Observable<void> {
        return this.http.delete<void>(`${BFF}/tattiche/schemi/${id}`);
    }

    applicaSchema(schemaId: number, formazioneId: number): Observable<Formazione> {
        return this.http.post<Formazione>(
            `${BFF}/tattiche/schemi/${schemaId}/applica/${formazioneId}`, {}
        );
    }
}