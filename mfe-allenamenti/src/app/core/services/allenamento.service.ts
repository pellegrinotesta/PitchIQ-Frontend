import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CaricoGiocatore, SedutaAllenamento, SedutaRequest } from '../models/allenamento.model';
import { apiUrl } from '../api-url';

const BFF = apiUrl();

@Injectable({ providedIn: 'root' })
export class AllenamentoService {
    private http = inject(HttpClient);

    getAll(from?: string, to?: string): Observable<SedutaAllenamento[]> {
        let params = new HttpParams();
        if (from) params = params.set('from', from);
        if (to) params = params.set('to', to);
        return this.http.get<SedutaAllenamento[]>(`${BFF}/allenamenti`, { params });
    }

    getById(id: number): Observable<SedutaAllenamento> {
        return this.http.get<SedutaAllenamento>(`${BFF}/allenamenti/${id}`);
    }

    create(req: SedutaRequest): Observable<SedutaAllenamento> {
        return this.http.post<SedutaAllenamento>(`${BFF}/allenamenti`, req);
    }

    update(id: number, req: SedutaRequest): Observable<SedutaAllenamento> {
        return this.http.put<SedutaAllenamento>(`${BFF}/allenamenti/${id}`, req);
    }

    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${BFF}/allenamenti/${id}`);
    }

    getCarico(al?: string): Observable<CaricoGiocatore[]> {
        let params = new HttpParams();
        if (al) params = params.set('al', al);
        return this.http.get<CaricoGiocatore[]>(`${BFF}/allenamenti/carico`, { params });
    }

    generaPresenze(id: number): Observable<SedutaAllenamento> {
        return this.http.post<SedutaAllenamento>(`${BFF}/allenamenti/${id}/genera-presenze`, {});
    }
}