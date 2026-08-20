const express = require('express');
const { createClient } = require('@libsql/client');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// --- Datenbank (Turso) ---
if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
  console.error('\n❌ Fehlende Umgebungsvariablen: TURSO_DATABASE_URL und TURSO_AUTH_TOKEN müssen gesetzt sein.\n');
  process.exit(1);
}

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function initDb() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS spots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      level TEXT,
      time TEXT,
      golden TEXT,
      map_image TEXT,
      created_at INTEGER
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS fish (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      spot_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      time TEXT
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS prices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price TEXT NOT NULL,
      created_at INTEGER
    )
  `);

  // Migration: percent-Spalte bei fish nachträglich ergänzen, falls die
  // Tabelle schon vorher existierte (ohne dieses Feld).
  try {
    await db.execute(`ALTER TABLE fish ADD COLUMN percent TEXT`);
  } catch (e) {
    // Spalte existiert bereits — kein Problem, einfach ignorieren.
  }
}

app.use(express.json({ limit: '15mb' })); // groß genug für Kartenbilder als Base64
app.use(express.static(path.join(__dirname, 'public')));

// --- API: Spots lesen (inkl. Fische, pro Spot nach Prozent sortiert) ---
app.get('/api/spots', async (req, res) => {
  try {
    const spotsResult = await db.execute('SELECT * FROM spots ORDER BY created_at DESC');
    const fishResult = await db.execute('SELECT * FROM fish');

    const parsePercent = (val) => {
      if (val === null || val === undefined || val === '') return -Infinity;
      const num = parseFloat(String(val).replace(',', '.').replace('%', ''));
      return isNaN(num) ? -Infinity : num;
    };

    const fishBySpot = {};
    for (const f of fishResult.rows) {
      if (!fishBySpot[f.spot_id]) fishBySpot[f.spot_id] = [];
      fishBySpot[f.spot_id].push({ id: f.id, name: f.name, time: f.time, percent: f.percent });
    }
    // Fische pro Spot nach Prozent sortieren (höchste Wahrscheinlichkeit zuerst)
    Object.keys(fishBySpot).forEach(spotId => {
      fishBySpot[spotId].sort((a, b) => parsePercent(b.percent) - parsePercent(a.percent));
    });

    const result = spotsResult.rows.map(s => ({
      id: s.id,
      name: s.name,
      level: s.level,
      time: s.time,
      golden: s.golden,
      mapImage: s.map_image,
      fish: fishBySpot[s.id] || []
    }));

    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Datenbankfehler' });
  }
});

// --- API: Spot anlegen ---
app.post('/api/spots', async (req, res) => {
  try {
    const { name, level, time, golden, mapImage } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Name erforderlich' });

    const result = await db.execute({
      sql: 'INSERT INTO spots (name, level, time, golden, map_image, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      args: [name.trim(), level || '', time || '', golden || '', mapImage || null, Date.now()]
    });
    res.json({ id: Number(result.lastInsertRowid) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Datenbankfehler' });
  }
});

// --- API: Spot löschen ---
app.delete('/api/spots/:id', async (req, res) => {
  try {
    await db.execute({ sql: 'DELETE FROM fish WHERE spot_id = ?', args: [req.params.id] });
    await db.execute({ sql: 'DELETE FROM spots WHERE id = ?', args: [req.params.id] });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Datenbankfehler' });
  }
});

// --- API: Kartenbild eines Spots setzen/entfernen ---
app.put('/api/spots/:id/map', async (req, res) => {
  try {
    const { mapImage } = req.body;
    await db.execute({
      sql: 'UPDATE spots SET map_image = ? WHERE id = ?',
      args: [mapImage || null, req.params.id]
    });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Datenbankfehler' });
  }
});

// --- API: Fisch hinzufügen ---
app.post('/api/spots/:id/fish', async (req, res) => {
  try {
    const { name, time, percent } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Name erforderlich' });

    const result = await db.execute({
      sql: 'INSERT INTO fish (spot_id, name, time, percent) VALUES (?, ?, ?, ?)',
      args: [req.params.id, name.trim(), time || '', percent || '']
    });
    res.json({ id: Number(result.lastInsertRowid) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Datenbankfehler' });
  }
});

// --- API: Fisch löschen ---
app.delete('/api/spots/:spotId/fish/:fishId', async (req, res) => {
  try {
    await db.execute({
      sql: 'DELETE FROM fish WHERE id = ? AND spot_id = ?',
      args: [req.params.fishId, req.params.spotId]
    });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Datenbankfehler' });
  }
});

// --- API: Preisliste lesen ---
app.get('/api/prices', async (req, res) => {
  try {
    const result = await db.execute('SELECT * FROM prices ORDER BY created_at DESC');
    res.json(result.rows.map(p => ({ id: p.id, name: p.name, price: p.price })));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Datenbankfehler' });
  }
});

// --- API: Preiseintrag hinzufügen ---
app.post('/api/prices', async (req, res) => {
  try {
    const { name, price } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Name erforderlich' });
    if (!price || !String(price).trim()) return res.status(400).json({ error: 'Preis erforderlich' });

    const result = await db.execute({
      sql: 'INSERT INTO prices (name, price, created_at) VALUES (?, ?, ?)',
      args: [name.trim(), String(price).trim(), Date.now()]
    });
    res.json({ id: Number(result.lastInsertRowid) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Datenbankfehler' });
  }
});

// --- API: Preiseintrag löschen ---
app.delete('/api/prices/:id', async (req, res) => {
  try {
    await db.execute({ sql: 'DELETE FROM prices WHERE id = ?', args: [req.params.id] });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Datenbankfehler' });
  }
});

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`\n✅ Server läuft: http://localhost:${PORT}\n`);
    });
  })
  .catch(err => {
    console.error('❌ Datenbank-Initialisierung fehlgeschlagen:', err);
    process.exit(1);
  });
