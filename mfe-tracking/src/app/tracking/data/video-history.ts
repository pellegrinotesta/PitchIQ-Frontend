/** Storico locale delle analisi video: il backend non espone ancora un elenco, solo lo stato per ID. */
export interface VoceStoricoVideo {
  id: string;
  nomeFile: string;
  creataIl: string;
  stato?: string;
  clip?: number;
}

const CHIAVE = 'pitchiq.tracking.video-analyses';
const MASSIMO = 20;

export function leggiStoricoVideo(): VoceStoricoVideo[] {
  try {
    const raw = localStorage.getItem(CHIAVE);
    const lista = raw ? JSON.parse(raw) : [];
    return Array.isArray(lista) ? lista.filter(v => typeof v?.id === 'string') : [];
  } catch {
    return [];
  }
}

export function salvaStoricoVideo(lista: VoceStoricoVideo[]): void {
  try {
    localStorage.setItem(CHIAVE, JSON.stringify(lista.slice(0, MASSIMO)));
  } catch {
    // storage non disponibile (navigazione privata, quota): lo storico resta solo in memoria
  }
}
