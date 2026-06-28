# GHCdb — Hockey Card Collection Tracker

A web app for tracking your hockey card collection. Import your cards from a spreadsheet, mark cards as owned as you pull or acquire them, and get an at-a-glance picture of what you have and what you're still missing across every set you collect.

## What it does

**Collection management** — Your cards are organized by year and product (e.g. *2023-24 Upper Deck Series 1*). Within each set you can see every card in the checklist, mark individual cards as owned or missing, track duplicates, and record serial numbers for numbered cards. A search bar and owned/missing filter let you quickly find specific cards within a large set.

**CSV import & export** — The main way to get your cards in is by importing a CSV file — typically an export from a spreadsheet you already track your collection in. The importer accepts flexible column names, handles boolean fields like Rookie and Auto, and can either add to or fully replace an existing set. You can also export any product view back to CSV at any time, respecting whatever filter is active.

**Catalog** — Admins can import a master checklist for a set into a shared catalog via CSV or by running the local scraper tool against an Upper Deck checklist URL. Regular users can then add any catalog set to their own collection in one click, pre-populated with all the cards at zero owned — ready to start checking off.

**Overview & stats** — A dashboard page shows your overall collection progress: total cards owned vs. total in your collection, a breakdown by team (pie chart), recently added cards, and per-set completion stats. Useful for seeing which sets you're close to finishing.

**Search** — A global search across your entire collection. Search by player name, card number, team, set name, or product. Results show key card details at a glance and let you mark cards as owned directly from the results table.

**Multi-user with accounts** — Each user has their own collection. Accounts require a username, email, and password. Password reset via email is supported. Admin users get access to catalog management and a user admin panel.

---

## Stack

- **Frontend**: React 18 + Vite + Chart.js
- **Backend & Database**: [Supabase](https://supabase.com) (PostgreSQL + Row Level Security + Auth)
- **Styling**: Custom CSS + Tailwind CSS 3
- **Deployment**: Static SPA (build `client/`, deploy `dist/` anywhere)
- **Web scraping**: Puppeteer (local CLI tool — see below)

---

## Quick Start (Development)

### 1. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to the SQL Editor and run the full schema from `schema.sql`
3. Go to **Settings → API** and copy your **Project URL** and **anon (public)** key

### 2. Configure environment variables

Create `client/.env`:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Start the dev server

```bash
cd client
npm install
npm run dev
# Open http://localhost:5173
```

---

## Production Deployment

Build the frontend and deploy the `dist/` folder to any static host (Netlify, Vercel, Cloudflare Pages, S3, etc.):

```bash
cd client
npm install
npm run build
# Deploy dist/ to your host
```

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as environment variables on your host.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | Yes | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Your Supabase anon (public) key |
| `VITE_SCRAPER_URL` | No | URL of a deployed scraper function (optional — local CLI is the default) |

---

## Upper Deck Checklist Scraper

Since Upper Deck renders its checklist tables via JavaScript, scraping requires a headless browser. The scraper runs locally as a CLI tool — it's an occasional admin utility, not part of the deployed app.

### Setup

Create a `.env` file in the project root (not `client/`):

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
```

Install dependencies from the project root (one time):

```bash
npm install
```

### Usage

```bash
# Scrape a checklist and import it to the catalog
node scrape.mjs https://upperdeck.com/checklists/your-set-checklist/

# Preview what would be imported without writing anything
node scrape.mjs https://upperdeck.com/checklists/your-set-checklist/ --dry-run

# Replace an existing set in the catalog
node scrape.mjs https://upperdeck.com/checklists/your-set-checklist/ --replace
```

Year and product are detected automatically from the page `<title>`. The script prints a preview of the first few cards before importing.

### Column mapping (UD → app schema)

| UD Column | App Field |
|---|---|
| Set Name | `set_name` |
| Card | `card_number` |
| Description | `description` |
| Team City | `team_city` |
| Team Name | `team_name` |
| Rookie | `rookie` |
| Auto | `auto` |
| Mem/Tech | `mem` |
| Serial #'d | `serial_of` |
| Point | `thickness` |

---

## CSV Import Format

Your CSV headers should match these column names (case-insensitive):

| Field | Accepted header variations |
|---|---|
| Owned | `Owned` |
| Card # | `Card #`, `Card Number` |
| Set Name | `Set Name` |
| Description | `Description`, `Player`, `Player Name` |
| Team City | `Team City` |
| Team Name | `Team Name`, `Team` |
| Rookie | `Rookie`, `RC` |
| Auto | `Auto`, `Autograph` |
| Mem | `Mem`, `Memorabilia` |
| Serial | `Serial`, `Serial Number` |
| Of | `Of`, `Serial Of`, `Numbered To` |
| Thickness | `Thickness` |
| Year | `Year`, `Season` |
| Product | `Product`, `Set` |
| Grade | `Grade` |
| Duplicates | `Duplicates` |

**Boolean columns** (`Owned`, `Rookie`, `Auto`) accept: `TRUE`, `YES`, `Y`, `1`, `X` (case-insensitive).
