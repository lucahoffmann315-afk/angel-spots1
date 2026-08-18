ILLEGALE ANGEL-SPOTS – Online-Version mit Turso + Render (kostenlos)
=======================================================================

Damit du UND dein Kollege von überall auf die Seite zugreifen könnt,
läuft die App jetzt dauerhaft online. Dafür brauchst du zwei kostenlose
Konten:

  1. Turso (die Datenbank – speichert eure Spots dauerhaft)
  2. Render (der Webserver – zeigt die Seite im Browser an)

Beides ist kostenlos, ohne Kreditkarte nutzbar.


TEIL 1: TURSO-DATENBANK EINRICHTEN
-------------------------------------
1. Gehe auf https://turso.tech und klicke auf "Sign Up" /
   "Get Started" (Login z. B. mit GitHub-Konto möglich).
2. Nach dem Einloggen im Dashboard auf "Create Database" klicken.
3. Einen Namen vergeben, z. B. "angel-spots", Region auswählen
   (am besten eine, die nahe an Europa liegt, z. B. Frankfurt/
   Amsterdam falls verfügbar), dann "Create" klicken.
4. Ist die Datenbank erstellt, brauchst du zwei Werte:
   a) Die "Database URL" (sieht aus wie:
      libsql://angel-spots-deinname.turso.io)
      → Im Datenbank-Dashboard meist direkt sichtbar, oder unter
      "Connect" / "Details".
   b) Einen "Auth Token" (Zugangs-Token)
      → Im Dashboard meist unter "Tokens" oder "Create Token" zu
      finden. Token erstellen und den langen Code kopieren.

   Beide Werte brauchst du gleich für Render. Am besten kurz in
   eine Textdatei kopieren.


TEIL 2: AUF RENDER HOCHLADEN
--------------------------------
Render lädt Code am einfachsten von GitHub. Falls du noch kein
GitHub-Konto hast: kostenlos auf https://github.com erstellen.

1. Gehe auf https://github.com und klicke oben rechts auf "+" >
   "New repository". Namen vergeben, z. B. "angel-spots-app",
   auf "Create repository" klicken.
2. Lade den kompletten Ordnerinhalt dieses Pakets in das neue
   Repository hoch:
   - Einfachster Weg: Im leeren Repository auf "uploading an
     existing file" klicken, alle Dateien aus diesem Ordner
     (außer node_modules, falls vorhanden) per Drag & Drop
     reinziehen, dann "Commit changes" klicken.
3. Gehe auf https://render.com und erstelle ein kostenloses Konto
   (Login mit GitHub geht am schnellsten und verknüpft direkt).
4. Im Render-Dashboard auf "New +" > "Web Service" klicken.
5. Dein gerade erstelltes GitHub-Repository auswählen und
   verbinden.
6. Bei den Einstellungen:
   - Name: beliebig, z. B. "angel-spots"
   - Region: egal, z. B. Frankfurt
   - Branch: main
   - Build Command: npm install
   - Start Command: npm start
   - Instance Type: "Free" auswählen
7. Weiter unten bei "Environment Variables" (Umgebungsvariablen)
   auf "Add Environment Variable" klicken und BEIDE Werte aus
   Turso eintragen:
   - Key: TURSO_DATABASE_URL   → Value: (deine Turso Database URL)
   - Key: TURSO_AUTH_TOKEN     → Value: (dein Turso Auth Token)
8. Auf "Create Web Service" klicken. Render baut jetzt die App,
   das dauert 1-3 Minuten.
9. Ist der Build fertig, bekommst du oben eine feste Adresse wie:
   https://angel-spots.onrender.com
   Diesen Link kannst du an deinen Kollegen schicken!


WICHTIG ZU WISSEN (kostenloser Render-Tarif)
-----------------------------------------------
- Die Seite "schläft" nach 15 Minuten ohne Besuch ein. Der erste
  Aufruf danach dauert dann ca. 30-60 Sekunden zum "Aufwachen" -
  das ist normal, kein Fehler. Danach läuft alles wieder normal
  schnell.
- Eure Daten (Spots, Fische, Kartenbilder) sind davon NICHT
  betroffen, da sie in Turso liegen, nicht auf Render selbst -
  die bleiben dauerhaft erhalten.

PASSWORT
---------
Wie gehabt: AngelSpotRetroRP

Änderungen am Code später
----------------------------
Willst du später etwas ändern, einfach die Datei in GitHub
bearbeiten (Stift-Symbol bei der Datei) - Render baut die Seite
dann automatisch neu.
