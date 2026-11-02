# Osteporten arbejdskopi

Selvstændig statisk kopi af de fem offentlige sider på osteporten.dk, hentet 2. november 2026 med medejerens tilladelse.

Indeholder forside, butikken, sandwichbestilling, tapasbestilling og privatlivspolitik. Design, tekster, billeder og menuer er bevaret. Formularer er isolerede tests og sender eller gemmer ingen oplysninger. Originale WordPress scripts, analyseværktøjer og eksterne formularforbindelser er fjernet. Siden er markeret noindex.

Vercel: framework Other, ingen buildkommando, outputmappe `dist`.

`dist/` indeholder den komplette side med lokale billeder, CSS og skrifttyper. `source-pages/` er de offentlige HTML snapshots. `build.py` bygger kopien igen med Python 3 og beautifulsoup4. Kør `python -m pip install -r requirements.txt` og `python build.py`. Til lokal visning: `python -m http.server 8000 --directory dist`.

WordPress administration, ordrebehandling, mailudsendelse og kundedata indgår ikke. Den oprindelige hændelsesannonce om 24. oktober er bevaret som del af kopien, selvom datoen er passeret. Testmarkeringen bør bevares, indtil rigtig ordrebehandling er bygget.
