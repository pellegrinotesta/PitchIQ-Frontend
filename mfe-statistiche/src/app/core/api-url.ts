/** Indirizzo usato se la shell non ha fornito una configurazione (sviluppo locale, modulo avviato da solo). */
const API_PREDEFINITA = 'http://localhost:8080/api';

/**
 * Base delle API del backend, senza barra finale.
 * La shell la legge all'avvio da `config.json` e la espone su `globalThis.__PITCHIQ__`,
 * così lo stesso build funziona in ogni ambiente.
 */
export function apiUrl(): string {
  const configurata = (globalThis as { __PITCHIQ__?: { apiUrl?: unknown } }).__PITCHIQ__?.apiUrl;
  const base = typeof configurata === 'string' && configurata.trim() ? configurata.trim() : API_PREDEFINITA;
  return base.replace(/\/+$/, '');
}
