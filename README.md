# Hockey Cards Tracker

A full-stack web app to track your hockey card collection.

## Quick Start (Development)

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

## Production Deployment

```bash
cd client && npm run build
cd ../server && NODE_ENV=production node server.js
# Serves everything on http://localhost:3001
```

## CSV Import Format

Your CSV headers should match these column names (case-insensitive):

| Spreadsheet Column | Accepted header variations |
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

## Environment Variables

Create `server/.env` for production:
```
JWT_SECRET=your-long-random-secret-here
PORT=3001
```

## Stack
- **Backend**: Node.js + Express + SQLite (built-in `node:sqlite`, Node 22.5+)
- **Frontend**: React + Vite + Chart.js
- **Auth**: JWT + bcrypt
