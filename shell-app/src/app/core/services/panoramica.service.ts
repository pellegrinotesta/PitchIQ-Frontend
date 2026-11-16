import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { apiUrl } from '../api-url';

const BFF_BASE_URL = apiUrl();

export interface PartitaSintesi {
  id: number;
  data: string;
  avversario: string;
  competizione: string | null;
  golFatti: number;
  golSubiti: number;
  /** null se la partita è in calendario */
  risultato: 'V' | 'N' | 'P' | null;
  /** false = in calendario, non ancora giocata */
  giocata?: boolean;
  oraInizio?: string | null;
  scoutingId?: number | null;
}

export interface GiocatoreSintesi {
  id: number;
  nome: string;
  cognome: string;
  stato: 'ATTIVO' | 'INFORTUNATO' | 'SQUALIFICATO';
  contrattoFine: string | null;
}

export interface SedutaSintesi {
  id: number;
  data: string;
  oraInizio: string;
  tipo: string;
  luogo: string | null;
}

/** Stagione sportiva (1 luglio – 30 giugno) di una data ISO, es. "2026/27". */
export function stagioneDi(data: string): string | null {
  const m = /^(\d{4})-(\d{2})-\d{2}/.exec(data ?? '');
  if (!m) return null;
  const anno = Number(m[1]) - (Number(m[2]) >= 7 ? 0 : 1);
  return `${anno}/${String((anno + 1) % 100).padStart(2, '0')}`;
}

export function dataIso(giorno: Date): string {
  const due = (n: number) => String(n).padStart(2, '0');
  return `${giorno.getFullYear()}-${due(giorno.getMonth() + 1)}-${due(giorno.getDate())}`;
}

/** Giorni da oggi a una data ISO (negativi se passata); null se la data manca o non è valida. */
export function giorniA(data: string | null, oggi: Date): number | null {
  if (!data || !/^\d{4}-\d{2}-\d{2}$/.test(data)) return null;
  const fine = Date.parse(`${data}T00:00:00Z`);
  if (!Number.isFinite(fine)) return null;
  const inizio = Date.UTC(oggi.getFullYear(), oggi.getMonth(), oggi.getDate());
  return Math.round((fine - inizio) / 86_400_000);
}

@Injectable({ providedIn: 'root' })
export class PanoramicaService {
  private http = inject(HttpClient);

  partite(): Observable<PartitaSintesi[]> {
    return this.http.get<PartitaSintesi[]>(`${BFF_BASE_URL}/partite`);
  }

  rosa(): Observable<GiocatoreSintesi[]> {
    return this.http.get<GiocatoreSintesi[]>(`${BFF_BASE_URL}/squadre/giocatori`);
  }

  seduteDa(giorno: string): Observable<SedutaSintesi[]> {
    return this.http.get<SedutaSintesi[]>(`${BFF_BASE_URL}/allenamenti`, {
      params: new HttpParams().set('from', giorno),
    });
  }
}
