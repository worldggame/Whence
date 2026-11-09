import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// Persistent server-side data directory for curated schedules & figures
const DATA_DIR = path.join(__dirname, 'data');
const SCHEDULES_FILE = path.join(DATA_DIR, 'calendar_schedules.json');
const CUSTOM_FIGURES_FILE = path.join(DATA_DIR, 'custom_figures.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Helper to read JSON file safely
function readJsonSafe(filePath: string, fallback: any = {}) {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
  }
  return fallback;
}

// Helper to write JSON file safely
function writeJsonSafe(filePath: string, data: any) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
    return false;
  }
}

// -----------------------------------------------------------------------------
// API ROUTES: Shared Server-Side Curator Store
// -----------------------------------------------------------------------------

// GET today's date in Eastern Time (America/New_York)
app.get('/api/today', (_req, res) => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(new Date());
  const year = parts.find((p) => p.type === 'year')?.value || '2026';
  const month = parts.find((p) => p.type === 'month')?.value || '01';
  const day = parts.find((p) => p.type === 'day')?.value || '01';
  res.json({ dateKey: `${year}-${month}-${day}`, timezone: 'America/New_York' });
});

// GET all calendar schedules: { [dateKey: string]: HistoricalFigure[] }
app.get('/api/schedules', (_req, res) => {
  const schedules = readJsonSafe(SCHEDULES_FILE, {});
  res.json({ schedules });
});

// GET schedule for a specific date (YYYY-MM-DD)
app.get('/api/schedules/:dateKey', (req, res) => {
  const { dateKey } = req.params;
  const schedules = readJsonSafe(SCHEDULES_FILE, {});
  if (Array.isArray(schedules[dateKey]) && schedules[dateKey].length > 0) {
    return res.json({ dateKey, roster: schedules[dateKey], isProgrammed: true });
  }

  // If not programmed, default to previous day's programmed schedule
  try {
    const [y, m, d] = dateKey.split('-').map(Number);
    const prevDate = new Date(Date.UTC(y, m - 1, d));
    prevDate.setUTCDate(prevDate.getUTCDate() - 1);
    const prevKey = `${prevDate.getUTCFullYear()}-${String(prevDate.getUTCMonth() + 1).padStart(2, '0')}-${String(prevDate.getUTCDate()).padStart(2, '0')}`;
    if (Array.isArray(schedules[prevKey]) && schedules[prevKey].length > 0) {
      return res.json({ dateKey, roster: schedules[prevKey], isProgrammed: false, defaultedFrom: prevKey });
    }
  } catch {
    // fallback
  }

  return res.json({ dateKey, roster: null, isProgrammed: false });
});

// PUT/POST update schedule for a specific date (pre-make game or reset)
app.post('/api/schedules/:dateKey', (req, res) => {
  const { dateKey } = req.params;
  const { roster, passcode } = req.body;

  // Basic authentication check
  if (passcode !== 'curator2026') {
    return res.status(401).json({ error: 'Unauthorized passcode' });
  }

  if (!Array.isArray(roster)) {
    return res.status(400).json({ error: 'Roster must be an array' });
  }

  const schedules = readJsonSafe(SCHEDULES_FILE, {});
  schedules[dateKey] = roster;
  writeJsonSafe(SCHEDULES_FILE, schedules);

  res.json({ success: true, dateKey, roster });
});

// GET all custom figures created by curators
app.get('/api/custom-figures', (_req, res) => {
  const customFigures = readJsonSafe(CUSTOM_FIGURES_FILE, []);
  res.json({ customFigures });
});

// POST add new custom figure
app.post('/api/custom-figures', (req, res) => {
  const { figure, passcode } = req.body;

  if (passcode !== 'curator2026') {
    return res.status(401).json({ error: 'Unauthorized passcode' });
  }

  if (!figure || !figure.name) {
    return res.status(400).json({ error: 'Invalid figure data' });
  }

  const list = readJsonSafe(CUSTOM_FIGURES_FILE, []);
  const existingIdx = list.findIndex((f: any) => f.id === figure.id);
  if (existingIdx >= 0) {
    list[existingIdx] = figure;
  } else {
    list.unshift(figure);
  }
  writeJsonSafe(CUSTOM_FIGURES_FILE, list);

  res.json({ success: true, figure });
});

// -----------------------------------------------------------------------------
// Vite middleware in dev or static files in production
// -----------------------------------------------------------------------------
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

startServer();
