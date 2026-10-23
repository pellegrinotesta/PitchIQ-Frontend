# PitchIQ Frontend

Frontend di PitchIQ, realizzato con Angular e Native Federation. L'applicazione è organizzata in una shell che compone microfrontend indipendenti.

## Moduli

| Modulo | Cartella | Porta Docker Compose |
| --- | --- | ---: |
| Shell | `shell-app/` | `4200` |
| Squadre | `mfe-squadre/` | `4201` |
| Allenamenti | `mfe-allenamenti/` | `4202` |
| Tattiche | `mfe-tattiche/` | `4203` |
| Statistiche | `mfe-statistiche/` | `4204` |
| Partite | `mfe-partite/` | `4205` |
| Tracking | `mfe-tracking/` | `4206` (profilo Compose `tracking`) |

La shell è il punto di ingresso dell'interfaccia. I remote sono configurati in `shell-app/public/federation.manifest.json`.

## Prerequisiti

- Node.js e npm; i package dichiarano npm `11.12.1`.
- Docker e Docker Compose per avviare l'intero stack.

## Avvio completo

Dalla radice del repository, configura il file `.env` richiesto da Docker Compose e avvia lo stack:

```bash
docker compose up --build
```

Apri `http://localhost:4200`. Per includere il microfrontend tracking:

```bash
docker compose --profile tracking up --build
```

Il BFF deve essere raggiungibile sulla porta `8080` e MySQL sull'host sulla porta `3307`. Per fermare lo stack, dalla radice esegui `docker compose down`.

## Sviluppo locale

Installa le dipendenze separatamente in ciascun modulo da questa cartella:

```bash
npm install --prefix shell-app
npm install --prefix mfe-squadre
npm install --prefix mfe-allenamenti
npm install --prefix mfe-tattiche
npm install --prefix mfe-statistiche
npm install --prefix mfe-partite
npm install --prefix mfe-tracking
```

Avvia shell e microfrontend in terminali distinti. Per esempio:

```bash
npm start --prefix shell-app
npm start --prefix mfe-squadre -- --port 4201
```

Ripeti il comando per gli altri moduli usando le porte della tabella. Per lavorare nell'applicazione completa, avvia anche BFF e database come descritto nel README del backend.

## Build e test

Ogni microfrontend espone gli script `start`, `build`, `watch` e `test`. Eseguili specificando il modulo, ad esempio:

```bash
npm run build --prefix shell-app
npm test --prefix shell-app
```

Sostituisci `shell-app` con la cartella del microfrontend da verificare.

## Federation

Il manifest della shell contiene gli URL `remoteEntry.json` usati per caricare i moduli. Al momento, la voce sulla porta `4206` nel manifest è denominata `mfe-giocatori`, mentre il progetto presente e il servizio Compose si chiamano `mfe-tracking`: allinea nome e configurazione prima di affidarti all'integrazione tracking nella shell.