# AutoPulse Dealership Operations & Forecast

Full-stack car dealership operations dashboard with Google Sheets sync, real-time pipeline-weighted revenue forecasting, stale inventory risk markdown analysis, standing analytics, sensitivity modeling, and Gemini AI query engine.

## What it does

- **Google Sheets sync.** Pulls inventory, leads, and assumptions from a Google Sheet through a service account. Connect any sheet by ID from the UI, or fall back to the built-in dataset when no sheet is configured.
- **Pipeline-weighted forecast.** Weights open leads by stage (New, Contacted, Test Drive, Negotiation, Won, Lost) to project revenue instead of counting raw pipeline totals.
- **Stale inventory markdown risk.** Flags aging units and models markdown tiers so you can see which stock is bleeding margin.
- **Standing analytics.** Sales, inventory, and lead trends rendered as charts.
- **Sensitivity modeling.** Adjust assumptions (close rates, markdown steps, stage weights) and recompute the forecast live.
- **Gemini AI query engine.** Ask questions in plain English ("what's my markdown exposure this month"). The server routes the question to Gemini and returns a chart plus a written insight.
- **Export.** Generate PDF reports of the dashboard through jsPDF.

## Tech stack

**Frontend:** React 19, Vite 6, TypeScript, Tailwind 4, Recharts, Motion, lucide-react, jsPDF.

**Backend:** Express, tsx (dev), esbuild (production bundle).

**Integrations:** @google/genai (Gemini), googleapis (Google Sheets), firebase.

## Architecture

The Express server owns every external call. The React client never touches the Gemini key or the Google service account. It only talks to the local API.

Endpoints:

- `GET  /api/dealership/data` returns the full computed dashboard
- `POST /api/dealership/refresh` re-pulls the connected sheet
- `POST /api/dealership/assumptions` updates and recomputes assumptions
- `POST /api/dealership/ask` runs a plain-English AI query
- `POST /api/dealership/sync` connects a custom spreadsheet ID
- `POST /api/dealership/reset` restores the baseline dataset

## Getting started

**Prerequisites:** Node.js 18 or newer.

1. Install dependencies:
   ```
   npm install
   ```

2. Create a `.env.local` from the template and fill in your values:
   ```
   cp .env.example .env.local
   ```
   | Variable | Required | Purpose |
   |----------|----------|---------|
   | `GEMINI_API_KEY` | Yes | Server-side Gemini calls |
   | `APP_URL` | Yes | Host URL for self-referential links |
   | `GOOGLE_SHEETS_SPREADSHEET_ID` | No | Default sheet to read |
   | `GOOGLE_SERVICE_ACCOUNT_EMAIL` | No | Service account for Sheets API |
   | `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` | No | Service account private key (PEM) |

   Without the Google Sheets variables the app runs on its built-in dataset.

3. Run in development:
   ```
   npm run dev
   ```
   The app serves at `http://localhost:3000`.

### Scripts

| Command | Action |
|---------|--------|
| `npm run dev` | Start the dev server with Vite middleware |
| `npm run build` | Build the client and bundle the server |
| `npm run start` | Run the production build |
| `npm run lint` | Type-check with `tsc --noEmit` |
| `npm run clean` | Remove build output |

## Security

- **Server-side keys.** The Gemini key and Google credentials stay on the server and never reach the browser.
- **Rate limiting.** Separate in-memory limiters cover general API traffic, AI queries, and refresh calls.
- **Input sanitization.** Every request strips HTML, null bytes, and control characters, then clamps numeric values to safe ranges.
- **Spreadsheet ID validation.** Custom sheet IDs must pass a strict format check before any API call.
- **Security headers.** The server sets `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, and `Referrer-Policy`, removes `X-Powered-By`, and caps JSON bodies at 200 KB.
- **Error sanitization.** Server errors are scrubbed before they reach the client so internal details never leak.

## Configuration files

`firebase-applet-config.json` holds project keys and is gitignored. Copy `firebase-applet-config.example.json` to that name and fill in your own Firebase values if you deploy the applet build.