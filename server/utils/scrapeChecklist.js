// Puppeteer launches a full Chromium instance (~150-300 MB RAM).
// Allowing concurrent scrapes on Railway would spike memory and risk OOM kills.
// This flag serializes requests — only one scrape can run at a time.
let scrapeInProgress = false;

const UD_COLUMN_MAP = {
  'set name': 'set_name',
  'card': 'card_number',
  'description': 'description',
  'team city': 'team_city',
  'team name': 'team_name',
  'rookie': 'rookie',
  'auto': 'auto',
  'mem/tech': 'mem',
  "serial #'d": 'serial_of',
  'point': 'thickness',
};

export async function scrapeUDChecklist(url) {
  if (scrapeInProgress) {
    throw new Error('A checklist scrape is already in progress. Please wait and try again.');
  }
  scrapeInProgress = true;

  // Dynamic imports so module load never fails on any platform.
  // Docker/Railway: system Chromium via apt, path set in CHROMIUM_EXECUTABLE_PATH env var.
  // Development (Windows/Mac): puppeteer full package with bundled Chromium.
  let browser;
  if (process.env.CHROMIUM_EXECUTABLE_PATH) {
    const { default: puppeteer } = await import('puppeteer-core');
    browser = await puppeteer.launch({
      executablePath: process.env.CHROMIUM_EXECUTABLE_PATH,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-zygote',
        '--single-process',
        '--disable-extensions',
        '--disable-background-networking',
        '--disable-default-apps',
        '--disable-sync',
        '--no-first-run',
        '--mute-audio',
      ],
      headless: true,
    });
  } else {
    const { default: puppeteer } = await import('puppeteer');
    browser = await puppeteer.launch({ headless: true });
  }

  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForSelector('table', { timeout: 15000 });

    const result = await page.evaluate((colMap) => {
      const titleText = document.title || '';
      // Match both 2025-26 and 2025-2026 formats
      const yearMatch = titleText.match(/^(\d{4}-(?:\d{4}|\d{2}))\s/);
      let year = yearMatch ? yearMatch[1] : '';
      // Normalize 2025-2026 → 2025-26
      year = year.replace(/^(\d{4})-\d{2}(\d{2})$/, '$1-$2');
      const product = titleText
        .replace(yearMatch ? yearMatch[0] : '', '')
        .replace(/\s*checklist.*$/i, '')
        .replace(/\bhockey\b/gi, '')
        .replace(/\s{2,}/g, ' ')
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

        // Skip tables with no recognized columns (e.g. navigation or footer tables)
        if (recognizedCount === 0) return;

        const bodyRows = table.querySelectorAll('tbody tr');
        (bodyRows.length ? bodyRows : [...table.querySelectorAll('tr')].slice(1)).forEach(row => {
          const cells = [...row.children].map(td => td.textContent.trim());
          if (!cells.length) return;
          const card = {};
          for (const [field, idx] of Object.entries(colIndexes)) card[field] = cells[idx] ?? '';
          // Only push rows that have at least one non-empty field
          if (Object.values(card).some(v => v !== '')) cards.push(card);
        });
      });

      return { year, product, cards, unknownHeaders: [...unknownHeaders] };
    }, UD_COLUMN_MAP);

    return result;
  } finally {
    scrapeInProgress = false;
    await browser.close();
  }
}
