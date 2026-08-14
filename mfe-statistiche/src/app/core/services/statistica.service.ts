import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TrendDto, StatisticaRequest, CategoriaMetrica, GiocatoreStatistica, ConfrontoDto } from '../models/statistica.model';

const BFF = 'http://localhost:8080/api';

@Injectable({ providedIn: 'root' })
export class StatisticaService {
  private http = inject(HttpClient);

  upsert(req: StatisticaRequest): Observable<any> {
    return this.http.post(`${BFF}/statistiche`, req);
  }

  getTrend(giocatoreId: number, categoria: CategoriaMetrica, mesi = 6): Observable<TrendDto> {
    const params = new HttpParams()
      .set('categoria', categoria)
      .set('mesi', mesi);
    return this.http.get<TrendDto>(`${BFF}/statistiche/giocatori/${giocatoreId}/trend`, { params });
  }

  getAllTrend(giocatoreId: number, mesi = 6): Observable<TrendDto[]> {
    return this.http.get<TrendDto[]>(
      `${BFF}/statistiche/giocatori/${giocatoreId}/trend/tutti`,
      { params: new HttpParams().set('mesi', mesi) }
    );
  }

  getPanoramicaRosa(): Observable<TrendDto[]> {
    return this.http.get<TrendDto[]>(`${BFF}/statistiche/rosa/panoramica`);
  }

  getRosa(): Observable<GiocatoreStatistica[]> {
    return this.http.get<GiocatoreStatistica[]>(`${BFF}/squadre/giocatori`);
  }

  confronta(id1: number, id2: number): Observable<ConfrontoDto> {
    return this.http.get<ConfrontoDto>(
      `${BFF}/statistiche/confronto`,
      { params: new HttpParams().set('id1', id1).set('id2', id2) }
    );
  }
}