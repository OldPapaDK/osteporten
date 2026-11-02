# Osteporten administration

Admin: `/admin/`, brugernavn `admin`. Login beskyttes på serveren med scrypt, krypteret HttpOnly session, afsenderkontrol og vedvarende begrænsning på loginforsøg. Første adgangskode og sessionsnøgle sættes som ADMIN_PASSWORD_HASH og SESSION_SECRET i Vercel. Ingen adgangskoder i koden. Adgangskoden kan ændres fra admin og logger eksisterende sessioner ud.

Forsidetekster og separate lukkedatoer for tapas/sandwich gemmes i privat Vercel Blob. Alle gemninger bruger versionskontrol og betinget skrivning. Lukkede datoer kontrolleres på serveren ved afprøvning. Formularerne er fortsat test og sender ingen bestillinger. Datoer i dag henvises til telefon som angivet på originalen; åbningstider er ikke automatisk lukning af ugedage.

Bevar `dist/` og `api/` som de aktuelle kildefiler. Den oprindelige `build.py` er en historisk kopieringsfunktion og skal tilpasses før den bruges igen, da den overskriver de integrerede HTML sider.

Kør `npm test` for kontrol af adgangskoder, datoer og indstillinger. Statisk output i `dist/`, Vercel Functions i `api/`. Alle ændringer skal bevare eksisterende billeder og fjernelsen af langbordsspisning.
