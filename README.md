# GHCdb — Hockey Card Collection Tracker

A web app for tracking your hockey card collection. Import your cards from a spreadsheet, mark cards as owned as you pull or acquire them, and get an at-a-glance picture of what you have and what you're still missing across every set you collect.

## What it does

**Collection management** — Your cards are organized by year and product (e.g. *2023-24 Upper Deck Series 1*). Within each set you can see every card in the checklist, mark individual cards as owned or missing, track duplicates, and record serial numbers for numbered cards. A search bar and owned/missing filter let you quickly find specific cards within a large set.

**CSV import & export** — The main way to get your cards in is by importing a CSV file — typically an export from a spreadsheet you already track your collection in. The importer accepts flexible column names, handles boolean fields like Rookie and Auto, and can either add to or fully replace an existing set. You can also export any product view back to CSV at any time, respecting whatever filter is active.

**Catalog** — Admins can import a master checklist for a set into a shared catalog. Regular users can then add any catalog set to their own collection in one click, pre-populated with all the cards at zero owned — ready to start checking off.

**Overview & stats** — A dashboard page shows your overall collection progress: total cards owned vs. total in your collection, a breakdown by team (pie chart), recently added cards, and per-set completion stats. Useful for seeing which sets you're close to finishing.

**Search** — A global search across your entire collection. Search by player name, card number, team, set name, or product. Results show key card details at a glance and let you mark cards as owned directly from the results table.

**Multi-user with accounts** — Each user has their own collection. Accounts require a username, password (minimum 8 characters), and email. Password reset via email is supported. Designated admin usernames (set via environment variable) get access to catalog management and a user admin panel.

---

## Stack
- **Backend**: Node.js + Express + PostgreSQL (`postgres` npm package)
- **Frontend**: React + Vite + Chart.js
- **Auth**: JWT + bcrypt
- **Email**: Resend (signup notifications, welcome emails, password reset)

---

## Quick Start (Development)

### 1. Set up the database

You need a PostgreSQL database. Options:
- **Cloud (free):** [neon.tech](https://neon.tech) — sign up, create a project, copy the connection string
- **Local:** Install PostgreSQL, then run `psql -U postgres -c "CREATE DATABASE hockey_cards;"`

### 2. Configure environment variables

Copy the example file and fill it in:
```bash
cp server/.env.example server/.env
```

Edit `server/.env`:
```
DATABASE_URL=postgresql://user:password@host/dbname
JWT_SECRET=your-long-random-secret-here
```

See `server/.env.example` for all available options.

### 3. Start the servers

Open **two terminals**:

**Terminal 1 — Backend:**
```bash
cd server
npm install
npm run dev
# Runs on http://localhost:3001
```

**Terminal 2 — Frontend:**
```bash
cd client
npm install
npm run dev
# Open http://localhost:5173
```

The database schema (tables + indexes) is created automatically on first startup.

---

## Production Deployment

```bash
cd client && npm run build
cd ../server && node server.js
# Serves everything on http://localhost:3001
```

Make sure `DATABASE_URL`, `JWT_SECRET`, and `ALLOWED_ORIGIN` are set in your environment.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret for signing JWTs — use a long random string |
| `ADMIN_USERNAMES` | No | Comma-separated usernames that get admin on register/login |
| `ALLOWED_ORIGIN` | No | Restrict CORS to your frontend URL in production |
| `PORT` | No | Port to listen on (default: `3001`) |
| `RESEND_API_KEY` | No | API key from [resend.com](https://resend.com) — required for email features |
| `ADMIN_EMAIL` | No | Email address to notify when a new user registers |
| `APP_URL` | No | Base URL of your frontend — used in password reset links (e.g. `https://yourdomain.com`) |
| `EMAIL_FROM` | No | Sender address for outgoing emails (must be a verified domain in Resend) |

Email features (welcome email, admin signup notification, password reset) are silently disabled if `RESEND_API_KEY` is not set.

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
