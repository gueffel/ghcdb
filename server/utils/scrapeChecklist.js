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
  // Dynamic imports so module load never fails on any platform.
  // Production (Railway/Linux): puppeteer-core + @sparticuz/chromium (no OS deps needed).
  // Development (Windows/Mac): puppeteer full package with bundled Chromium.
  let browser;
  if (process.env.NODE_ENV === 'production') {
    const { default: chromium } = await import('@sparticuz/chromium');
    const { default: puppeteer } = await import('puppeteer-core');
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
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
    await browser.close();
  }
}
