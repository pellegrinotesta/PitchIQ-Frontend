import { HttpClient, HttpEvent, HttpParams } from '@angular/common/http';
import { Injectable, InjectionToken, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  AggregatoEsitoDto, AnalisiVideoDto, AnimazioneDto, EsitoPressione, ImportDto,
  PartitaDettaglioDto, PartitaDto, SequenzaDto,
} from './tracking.models';
import { apiUrl } from './api-url';

/** Base URL del dominio tracking nel BFF. */
export const TRACKING_API_URL = new InjectionToken<string>('TRACKING_API_URL', {
  providedIn: 'root',
  factory: () => `${apiUrl()}/tracking`,
});

export interface FiltriSequenze {
  esito?: EsitoPressione | null;
  teamId?: number | null;
  soloAnimate?: boolean;
}

@Injectable({ providedIn: 'root' })
export class TrackingApi {
  private readonly http = inject(HttpClient);
  private readonly base = inject(TRACKING_API_URL);

  /** Upload con eventi di avanzamento (reportProgress). */
  caricaFile(partita: File, eventi: File, tracking: File | null): Observable<HttpEvent<ImportDto>> {
    const form = new FormData();
    form.append('partita', partita);
    form.append('eventi', eventi);
    if (tracking) form.append('tracking', tracking);
    return this.http.post<ImportDto>(`${this.base}/import`, form, { reportProgress: true, observe: 'events' });
  }

  caricaVideo(video: File): Observable<HttpEvent<AnalisiVideoDto>> {
    const form = new FormData();
    form.append('video', video);
    return this.http.post<AnalisiVideoDto>(`${this.base}/video-analyses`, form, {
      reportProgress: true,
      observe: 'events',
    });
  }

  caricaVideoDaUrl(url: string): Observable<AnalisiVideoDto> {
    return this.http.post<AnalisiVideoDto>(`${this.base}/video-analyses/da-url`, { url });
  }

  statoAnalisiVideo(id: string): Observable<AnalisiVideoDto> {
    return this.http.get<AnalisiVideoDto>(`${this.base}/video-analyses/${encodeURIComponent(id)}`);
  }

  clipVideo(id: string, clipId: string): Observable<Blob> {
    return this.http.get(`${this.base}/video-analyses/${encodeURIComponent(id)}/clips/${encodeURIComponent(clipId)}`, {
      responseType: 'blob',
    });
  }

  statoImport(id: number): Observable<ImportDto> {
    return this.http.get<ImportDto>(`${this.base}/import/${id}`);
  }

  importRecenti(query = ''): Observable<ImportDto[]> {
    const params = new HttpParams().set('q', query.trim());
    return this.http.get<ImportDto[]>(`${this.base}/import`, { params });
  }

  ritentaImport(id: number): Observable<ImportDto> {
    return this.http.post<ImportDto>(`${this.base}/import/${id}/retry`, {});
  }

  partite(): Observable<PartitaDto[]> {
    return this.http.get<PartitaDto[]>(`${this.base}/partite`);
  }

  dettaglio(matchId: number): Observable<PartitaDettaglioDto> {
    return this.http.get<PartitaDettaglioDto>(`${this.base}/partite/${matchId}`);
  }

  eliminaPartita(matchId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/partite/${matchId}`);
  }

  sequenze(matchId: number, f: FiltriSequenze): Observable<SequenzaDto[]> {
    let params = new HttpParams().set('soloAnimate', !!f.soloAnimate);
    if (f.esito) params = params.set('esito', f.esito);
    if (f.teamId != null) params = params.set('teamId', f.teamId);
    return this.http.get<SequenzaDto[]>(`${this.base}/partite/${matchId}/sequenze`, { params });
  }

  aggregati(): Observable<AggregatoEsitoDto[]> {
    return this.http.get<AggregatoEsitoDto[]>(`${this.base}/aggregati`);
  }

  animazione(sequenzaId: number): Observable<AnimazioneDto> {
    return this.http.get<AnimazioneDto>(`${this.base}/sequenze/${sequenzaId}/animazione`);
  }
}
