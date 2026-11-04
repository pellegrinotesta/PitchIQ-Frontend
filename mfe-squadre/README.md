# MfeSquadre

## Centro rosa e dossier giocatore

Aggiornamento: 4 novembre 2026. Modulo operativo basato sulle API PitchIQ esistenti, con estensioni backend per validazione, aggiornamento parziale e lettura dello storico osservato. Non rappresenta una certificazione per utilizzo in Serie A.

- Rosa: ricerca su nome, cognome, numero e nazionalita; filtri combinati per ruolo primario/secondario, stato, piede e scadenza; ordinamento e paginazione.
- Indicatori sull'intera rosa, indipendenti dai filtri; eta e valori economici mancanti non vengono trasformati in zero.
- Copertura dei 14 ruoli con distinzione fra primari e alternative, stato attivo e indisponibilita registrate. Nessuna formazione viene inferita automaticamente.
- Contratti: scaduti, scadenze entro 180 giorni e dati assenti; confronto tecnico/anagrafico fino a quattro giocatori.
- CSV della vista filtrata o dei giocatori selezionati: UTF-8, separatore punto e virgola, escaping e protezione dalle formule. Include dati economici; non include note mediche.
- Dossier: storico mensile osservato, selezione metrica e periodo, grafico e registro dei valori, differenza assoluta primo/ultimo e completezza del profilo.
- Export JSON del dossier con identita e serie selezionata: esclude note mediche e valori finanziari. La data di lettura non viene presentata come data di acquisizione.
- Form completo con vincoli allineati allo schema; in modifica invia solo i campi cambiati e non reinvia le note mediche.

### Benchmark di prodotto

Confronto qualitativo delle pagine ufficiali consultate il 4 novembre 2026, non una classifica indipendente o una prova comparativa dei prodotti.

| Riferimento | Capacita rilevanti | Applicazione in Squadre |
| --- | --- | --- |
| [Hudl Wyscout](https://www.hudl.com/products/wyscout) | Ricerca giocatori, confronto, liste e report con dati/video | Filtri combinati, confronto e export |
| [Hudl Sportscode](https://www.hudl.com/products/sportscode) | Coding personalizzato, report collegati al video, flussi live | Riferimento per futura integrazione delle evidenze video; non implementata qui |
| [Stats Perform / Opta](https://www.statsperform.com/team-performance/) | Benchmark, dati evento e tracking sincronizzati, analisi contestuale | Fonte e limiti espliciti, nessuna metrica avanzata simulata |
| [Catapult Pro Video](https://www.catapult.com/solutions/pro-video) | Integrazione dati/video, collaborazione e presentazioni | Separazione delle viste operative e dossier esportabile; sincronizzazione video non implementata |

### Contratti API

- `GET /api/squadre/giocatori` e `GET /api/squadre/giocatori/{id}`: invariati; eta sconosciuta ora restituita come `null`.
- `POST` e `PUT`: validazione server di date, dimensioni, importi, codici ruolo e lunghezze; il numero maglia resta obbligatorio per coerenza con il database.
- `PATCH /api/squadre/giocatori/{id}`: oggetto JSON parziale. Campo omesso = invariato; `null` esplicito = cancellazione del dato opzionale. Campi sconosciuti, tipi incompatibili e violazioni restituiscono `400` con Problem Detail. `PUT` mantiene la semantica sostitutiva per compatibilita.
- `GET /api/statistiche/giocatori/{id}/storico`: registrazioni osservate ordinate per periodo, senza proiezioni. Giocatore assente = `404`; nessuna osservazione = array vuoto.

### Limiti prima della produzione

**Autenticazione non significa autorizzazione granulare.** Il backend attuale richiede login, ma non separa l'accesso clinico, economico e tecnico per ruolo o club. La scheda medica preesistente resta presente. Non caricare dati sanitari reali in un ambiente condiviso prima di implementare RBAC, segregazione, audit e politiche di conservazione.

Restano da progettare: squadre e stagioni come contesto persistente, appartenenze storiche, competizioni e minuti di esposizione, gestione dei conflitti concorrenti, storico delle modifiche, integrazioni autorizzate con provider e video, valutazioni firmate dello staff. I dati mensili disponibili non giustificano xG, percentili, confronti per 90 minuti o benchmark Serie A. Velocita, forza e resistenza non espongono unita/metodologia nel contratto attuale.

Nessun dato dimostrativo o punteggio prestazionale inventato viene inserito nel database.

### Verifiche e avvio Docker

Eseguite: 24 test Angular focalizzati su rosa, form, dossier e contratti HTTP; 12 test Java su servizio, validazione, PATCH, storico e risposte HTTP. Build frontend di produzione riuscita, con avvisi CSS oltre la soglia raccomandata di 4 kB, ma sotto il limite di 8 kB. Test Java eseguiti con Maven 3.9.9 / Java 24 in Docker, senza database.

Non verificati: rendering reale del grafico, screenshot desktop/mobile, flusso autenticato end-to-end e persistenza delle modifiche sul database reale. L'apertura del browser e stata saltata durante la sessione. Nella baseline, il test generato `App > should render title` falliva gia; non e compreso nella suite focalizzata e non e stato modificato.

Dalla radice del workspace:

```powershell
docker exec pitchiq-mfe-squadre npm test -- --watch=false --include=src/app/features/**/*.spec.ts
docker exec pitchiq-mfe-squadre npx ng build
docker compose --env-file .\PitchIQ-Backend\.env up -d --no-deps --build bff
```

I container frontend non montano i sorgenti locali: sincronizzare i file modificati con `docker cp` oppure ricostruire il servizio. Dopo una build di produzione nel container, riavviare il dev server per rigenerare gli artefatti Native Federation di sviluppo.

URL shell: http://localhost:4200/squadre. URL standalone: http://localhost:4201 (richiede un contesto autenticato per le API).

## Angular CLI

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 22.1.3.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
