# Hockey Cards Tracker

A full-stack web app to track your hockey card collection.

## Stack
- **Backend**: Node.js + Express + PostgreSQL (`postgres` npm package)
- **Frontend**: React + Vite + Chart.js
- **Auth**: JWT + bcrypt

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
