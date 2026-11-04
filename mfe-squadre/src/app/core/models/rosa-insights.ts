import { Giocatore, RUOLO_LABEL, RuoloGiocatore, StatoGiocatore } from './giocatore.model';

export type FiltroContratto = 'TUTTI' | '180' | 'SCADUTI' | 'MANCANTI';

export interface FiltriRosa {
  ricerca: string;
  ruolo: RuoloGiocatore | null;
  stato: StatoGiocatore | null;
  piede: string;
  contratto: FiltroContratto;
}

export function giorniContratto(data: string | null, oggi = new Date()): number | null {
  if (!data || !/^\d{4}-\d{2}-\d{2}$/.test(data)) return null;
  const scadenza = Date.parse(`${data}T00:00:00Z`);
  if (!Number.isFinite(scadenza) || new Date(scadenza).toISOString().slice(0, 10) !== data)
    return null;
  const inizioOggi = Date.UTC(oggi.getFullYear(), oggi.getMonth(), oggi.getDate());
  return Math.round((scadenza - inizioOggi) / 86_400_000);
}

export function ruoliSecondari(giocatore: Giocatore): RuoloGiocatore[] {
  return [...new Set((giocatore.ruoliSecondari ?? '').toUpperCase().split(/[,;\s/|]+/))].filter(
    (ruolo): ruolo is RuoloGiocatore =>
      Object.hasOwn(RUOLO_LABEL, ruolo) && ruolo !== giocatore.ruolo,
  );
}

function normalizza(testo: string): string {
  return testo
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('it');
}

export function filtraRosa(rosa: Giocatore[], filtri: FiltriRosa, oggi = new Date()): Giocatore[] {
  const parole = normalizza(filtri.ricerca.trim()).split(/\s+/).filter(Boolean);
  return rosa.filter((giocatore) => {
    const testo = normalizza(
      `${giocatore.nome} ${giocatore.cognome} ${giocatore.numeroMaglia ?? ''} ${giocatore.nazionalita ?? ''}`,
    );
    const giorni = giorniContratto(giocatore.contrattoFine, oggi);
    return (
      parole.every((parola) => testo.includes(parola)) &&
      (!filtri.ruolo ||
        giocatore.ruolo === filtri.ruolo ||
        ruoliSecondari(giocatore).includes(filtri.ruolo)) &&
      (!filtri.stato || giocatore.stato === filtri.stato) &&
      (!filtri.piede || giocatore.piedePreferito === filtri.piede) &&
      (filtri.contratto === 'TUTTI' ||
        (filtri.contratto === '180' && giorni !== null && giorni >= 0 && giorni <= 180) ||
        (filtri.contratto === 'SCADUTI' && giorni !== null && giorni < 0) ||
        (filtri.contratto === 'MANCANTI' && giorni === null))
    );
  });
}

export function riepilogoRosa(rosa: Giocatore[], oggi = new Date()) {
  const etaNote = rosa.flatMap((giocatore) =>
    giocatore.eta !== null && Number.isFinite(giocatore.eta) ? [giocatore.eta] : [],
  );
  const valoriNoti = rosa.flatMap((giocatore) =>
    giocatore.valoreMercato !== null && Number.isFinite(giocatore.valoreMercato)
      ? [giocatore.valoreMercato]
      : [],
  );
  const giorni = rosa.map((giocatore) => giorniContratto(giocatore.contrattoFine, oggi));
  return {
    totale: rosa.length,
    attivi: rosa.filter((giocatore) => giocatore.stato === 'ATTIVO').length,
    infortunati: rosa.filter((giocatore) => giocatore.stato === 'INFORTUNATO').length,
    squalificati: rosa.filter((giocatore) => giocatore.stato === 'SQUALIFICATO').length,
    etaMedia: etaNote.length
      ? etaNote.reduce((somma, eta) => somma + eta, 0) / etaNote.length
      : null,
    etaNote: etaNote.length,
    valoreTotale: valoriNoti.length
      ? valoriNoti.reduce((somma, valore) => somma + valore, 0)
      : null,
    valoriNoti: valoriNoti.length,
    inScadenza: giorni.filter((giorno) => giorno !== null && giorno >= 0 && giorno <= 180).length,
    scaduti: giorni.filter((giorno) => giorno !== null && giorno < 0).length,
    contrattiMancanti: giorni.filter((giorno) => giorno === null).length,
  };
}

export function coperturaRuoli(rosa: Giocatore[]) {
  return (Object.keys(RUOLO_LABEL) as RuoloGiocatore[]).map((ruolo) => {
    const primari = rosa.filter((giocatore) => giocatore.ruolo === ruolo);
    const secondari = rosa.filter((giocatore) => ruoliSecondari(giocatore).includes(ruolo));
    return {
      ruolo,
      label: RUOLO_LABEL[ruolo],
      primari,
      secondari,
      attivi: primari.filter((giocatore) => giocatore.stato === 'ATTIVO').length,
      alternativeAttive: secondari.filter((giocatore) => giocatore.stato === 'ATTIVO').length,
    };
  });
}

export function esportaRosaCsv(rosa: Giocatore[]): string {
  const cella = (valore: unknown): string => {
    const testo = valore === null || valore === undefined ? '' : String(valore);
    const sicuro = /^\s*[=+\-@\t\r\n]/.test(testo) ? `'${testo}` : testo;
    return `"${sicuro.replace(/"/g, '""')}"`;
  };
  const righe: unknown[][] = [
    [
      'ID',
      'Numero',
      'Cognome',
      'Nome',
      'Ruolo',
      'Ruoli secondari',
      'Stato',
      'Eta',
      'Nazionalita',
      'Piede',
      'Altezza cm',
      'Peso kg',
      'Fine contratto',
      'Valore mercato EUR',
      'Stipendio annuo EUR',
      'Agente',
    ],
    ...rosa.map((giocatore) => [
      giocatore.id,
      giocatore.numeroMaglia,
      giocatore.cognome,
      giocatore.nome,
      giocatore.ruolo,
      giocatore.ruoliSecondari,
      giocatore.stato,
      giocatore.eta,
      giocatore.nazionalita,
      giocatore.piedePreferito,
      giocatore.altezzaCm,
      giocatore.pesoKg,
      giocatore.contrattoFine,
      giocatore.valoreMercato,
      giocatore.stipendioAnnuo,
      giocatore.agente,
    ]),
  ];
  return '\uFEFF' + righe.map((riga) => riga.map(cella).join(';')).join('\r\n');
}
