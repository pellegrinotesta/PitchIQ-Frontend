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

Dalla radice del repository, configura il file `.env` del backend. Per la prima installazione o dopo modifiche alle immagini:

```bash
docker compose --env-file ./PitchIQ-Backend/.env --profile tracking up -d --build
```

Negli avvii successivi riusa immagini, dipendenze e cache:

```bash
docker compose --env-file ./PitchIQ-Backend/.env --profile tracking up -d
```

Apri `http://127.0.0.1:4200`. Il manifest usa IPv4 esplicito anche per i remoti, evitando problemi di risoluzione IPv6 di `localhost` su Docker Desktop.
Ometti `--profile tracking` se non ti serve il modulo tracking.

Il BFF deve essere raggiungibile sulla porta `8080` e MySQL sull'host sulla porta `3307`. Per fermare lo stack, dalla radice esegui `docker compose down`.

## Riavvii rapidi

Le modifiche TypeScript, HTML e CSS sono montate nei container e vengono ricompilate automaticamente: non ricostruire le immagini per queste modifiche.
Per riavviare tutto il frontend dopo una modifica alla configurazione Angular:

```bash
docker compose --env-file ./PitchIQ-Backend/.env --profile tracking restart shell-app mfe-squadre mfe-allenamenti mfe-tattiche mfe-statistiche mfe-partite mfe-tracking
```

Ogni frontend ha una cache `.angular` su un volume Docker nominato, separato dal filesystem Windows. La cache sopravvive alla ricreazione dei container e a `down`, ma viene eliminata da `down -v`. Il primo avvio deve comunque generarla.

Non usare abitualmente `--renew-anon-volumes`: ricrea i volumi `node_modules`. Usalo solo sui servizi con dipendenze cambiate, insieme a `--build`.
Con i container fermi ma ancora presenti, `docker compose --env-file ./PitchIQ-Backend/.env --profile tracking start` li riavvia senza ricrearli.

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