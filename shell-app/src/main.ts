import { initFederation } from '@angular-architects/native-federation';
import manifestPredefinito from '../public/federation.manifest.json';

type Manifest = Record<string, string>;

/** Legge un file JSON servito accanto all'app; null se manca o non è valido. */
async function leggi<T>(percorso: string): Promise<T | null> {
  try {
    const risposta = await fetch(percorso, { cache: 'no-store' });
    return risposta.ok ? ((await risposta.json()) as T) : null;
  } catch {
    return null;
  }
}

/**
 * Indirizzo del backend e dei microfrontend arrivano da `config.json` e
 * `federation.manifest.json`, letti all'avvio: per cambiare ambiente basta
 * sostituire quei due file, senza ricompilare.
 */
async function avvia(): Promise<void> {
  const [config, manifest] = await Promise.all([
    leggi<{ apiUrl?: string }>('config.json'),
    leggi<Manifest>('federation.manifest.json'),
  ]);
  if (!manifest) console.error('federation.manifest.json non leggibile: uso gli indirizzi di sviluppo');
  const remotes: Manifest = manifest ?? manifestPredefinito;
  (globalThis as { __PITCHIQ__?: unknown }).__PITCHIQ__ = { apiUrl: config?.apiUrl, remotes };

  await initFederation(remotes).catch((err) => console.error(err));
  await import('./bootstrap');
}

avvia().catch((err) => console.error(err));
