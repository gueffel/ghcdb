/**
 * Scrape a Upper Deck checklist page and import it to the Supabase catalog.
 *
 * Usage:
 *   node scrape.mjs <url> [--replace] [--dry-run]
 *
 *   --replace   Delete existing cards for this year+product before importing
 *   --dry-run   Scrape and preview without writing to Supabase
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import ws from 'ws';

const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env');
  process.exit(1);
}

const args = process.argv.slice(2);
const url = args.find(a => !a.startsWith('--'));
const replace = args.includes('--replace');
const dryRun = args.includes('--dry-run');

if (!url) {
  console.error('Usage: node scrape.mjs <url> [--replace] [--dry-run]');
  process.exit(1);
}

const COLUMN_MAP = {
  'set name':    'set_name',
  'card':        'card_number',
  'description': 'description',
  'team city':   'team_city',
  'team name':   'team_name',
  'rookie':      'rookie',
  'auto':        'auto',
  'mem/tech':    'mem',
  "serial #'d":  'serial_of',
  'point':       'thickness',
};

function normalizeCard(raw, year, product) {
  const toBool = (v) => {
    if (!v) return false;
    const s = String(v).trim().toLowerCase();
    return ['true', 'yes', 'y', '1', 'x'].includes(s);
  };
  const toInt = (v) => { const n = parseInt(v, 10); return isNaN(n) ? null : n; };

  return {
    card_number: raw.card_number || null,
    set_name:    raw.set_name    || null,
    description: raw.description || null,
    team_city:   raw.team_city   || null,
    team_name:   raw.team_name   || null,
    rookie:      toBool(raw.rookie),
    auto:        toBool(raw.auto),
    mem:         raw.mem         || null,
    serial:      null,
    serial_of:   toInt(raw.serial_of),
    thickness:   raw.thickness   || null,
    year,
    product,
    grade:       null,
  };
}

async function scrape(pageUrl) {
  const { default: puppeteer } = await import('puppeteer');
  console.log('Launching browser…');
  const browser = await puppeteer.launch({ headless: true });
  try {
    const page = await browser.newPage();
    console.log(`Loading ${pageUrl}`);
    await page.goto(pageUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForSelector('table', { timeout: 15000 });

    const result = await page.evaluate((colMap) => {
      const titleText = document.title || '';
      const yearMatch = titleText.match(/^(\d{4}-\d{2})\s/);
      const year = yearMatch ? yearMatch[1] : '';
      const product = titleText
        .replace(yearMatch ? yearMatch[0] : '', '')
        .replace(/\s*checklist.*$/i, '')
        .trim();

      const cards = [];
      const unknownHeaders = new Set();

      document.querySelectorAll('table').forEach(table => {
        const headerRow = table.querySelector('thead tr') || table.querySelector('tr');
        if (!headerRow) return;
        const headers = [...headerRow.children].map(th => th.textContent.trim().toLowerCase());

        const colIndexes = {};
        let recognizedCount = 0;
        headers.forEach((h, i) => {
          if (colMap[h]) { colIndexes[colMap[h]] = i; recognizedCount++; }
          else if (h) unknownHeaders.add(h);
        });
        if (recognizedCount === 0) return;

        const bodyRows = table.querySelectorAll('tbody tr');
        (bodyRows.length ? bodyRows : [...table.querySelectorAll('tr')].slice(1)).forEach(row => {
          const cells = [...row.children].map(td => td.textContent.trim());
          if (!cells.length) return;
          const card = {};
          for (const [field, idx] of Object.entries(colIndexes)) card[field] = cells[idx] ?? '';
          if (Object.values(card).some(v => v !== '')) cards.push(card);
        });
      });

      return { year, product, cards, unknownHeaders: [...unknownHeaders] };
    }, colMap);

    return result;
  } finally {
    await browser.close();
  }
}

async function run() {
  const { year, product, cards, unknownHeaders } = await scrape(url);

  if (!cards.length) {
    console.error('No checklist table found on that page.');
    if (unknownHeaders.length) console.error('Detected columns:', unknownHeaders.join(', '));
    process.exit(1);
  }

  console.log(`\nFound: ${cards.length} cards`);
  console.log(`Year:    ${year || '(not detected)'}`);
  console.log(`Product: ${product || '(not detected)'}`);
  if (unknownHeaders.length) console.log(`Ignored columns: ${unknownHeaders.join(', ')}`);

  console.log('\nPreview (first 3 cards):');
  cards.slice(0, 3).forEach(c => console.log(' ', JSON.stringify(c)));

  if (dryRun) {
    console.log('\n--dry-run: skipping import.');
    return;
  }

  if (!year || !product) {
    console.error('\nCould not detect year/product from page title. Use --dry-run to inspect, then set manually.');
    process.exit(1);
  }

  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
    realtime: { transport: ws },
  });

  const normalized = cards.map(c => normalizeCard(c, year, product));

  if (replace) {
    console.log(`\nDeleting existing ${product} (${year}) from catalog…`);
    const { error } = await sb.from('catalog_cards').delete().eq('year', year).eq('product', product);
    if (error) { console.error('Delete failed:', error.message); process.exit(1); }
  }

  console.log('\nImporting to Supabase…');
  const CHUNK = 500;
  for (let i = 0; i < normalized.length; i += CHUNK) {
    const batch = normalized.slice(i, i + CHUNK);
    const { error } = await sb.from('catalog_cards').insert(batch);
    if (error) { console.error(`Batch ${i}–${i + batch.length} failed:`, error.message); process.exit(1); }
    process.stdout.write(`  ${Math.min(i + CHUNK, normalized.length)}/${normalized.length}\r`);
  }

  console.log(`\n✅ Imported ${normalized.length} cards → ${product} (${year})`);
}

run().catch(err => { console.error(err); process.exit(1); });
