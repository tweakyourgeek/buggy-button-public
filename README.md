# Buggy Button

A drop-in bug report widget for beta apps. Lets your testers report bugs with automatic screenshots, annotations, and browser metadata — all stored locally in the browser.

## Quick Start

```sh
# 1. Install dependencies
npm install

# 2. Start the dev server (runs on http://localhost:8080)
npm run dev
```

That's it. Open http://localhost:8080 to configure the widget and start collecting bug reports.

## Pages

| URL | What it does |
|---|---|
| `/` | Widget settings — configure project name, position, webhook, beta badge |
| `/widget` | Standalone widget page — embed this via iframe in your app |
| `/admin` | Admin dashboard — view, filter, manage, and export bug reports |

## Embedding in Your Beta App

Add this iframe to any page where you want the bug button to appear:

```html
<iframe
  src="http://localhost:8080/widget"
  style="position:fixed;bottom:0;right:0;width:100%;height:100%;border:none;pointer-events:none;z-index:9999;"
  allow="clipboard-write"
></iframe>
```

Replace `localhost:8080` with your deployed URL in production.

## Configuration

Visit the home page (`/`) to configure:

- **Project Name** — displayed in the bug report modal
- **Position** — bottom-right or bottom-left
- **BETA Badge** — toggle the yellow "BETA" label on the button
- **Webhook URL** — forward reports to Slack, Discord, or any HTTP endpoint (POST JSON)
- **Collect Email** — toggle whether reporters are asked for their email

Settings are saved to `localStorage` under the key `bugwidget_config`.

## Webhook Format

If a webhook URL is configured, each new bug report sends a POST request with this JSON body:

```json
{
  "id": "uuid",
  "title": "Bug title",
  "description": "Steps to reproduce...",
  "severity": "low | medium | high | critical",
  "status": "open",
  "email": "reporter@example.com",
  "url": "https://yourapp.com/page",
  "userAgent": "Mozilla/5.0 ...",
  "viewportSize": "1920x1080",
  "consoleErrors": ["error message 1", "..."],
  "projectName": "My App",
  "createdAt": "2026-03-18T12:00:00.000Z",
  "updatedAt": "2026-03-18T12:00:00.000Z"
}
```

Screenshots are excluded from webhook payloads to keep them small.

## Admin Dashboard

Visit `/admin` to:

- View all submitted bug reports in a searchable, filterable table
- Filter by severity (low/medium/high/critical) and status (open/in progress/resolved/closed)
- Click a report to see full details, metadata, and screenshot
- Update status or delete reports
- Export all reports as **JSON** or **CSV**

## Data Storage

All data lives in the browser's `localStorage`:

| Key | Contents |
|---|---|
| `bugwidget_reports` | Array of bug report objects |
| `bugwidget_config` | Widget configuration |

There is no backend. To move data between browsers, use the JSON/CSV export on the admin page.

## Available Scripts

```sh
npm run dev       # Start dev server on port 8080
npm run build     # Production build to dist/
npm run preview   # Preview production build locally
npm run lint      # Run ESLint
npm run test      # Run tests (vitest)
```

## Production Deployment

```sh
npm run build
```

This outputs a static site to `dist/`. Deploy it to any static host (Netlify, Vercel, GitHub Pages, S3, etc.). Since this is a single-page app with client-side routing, configure your host to serve `index.html` for all routes.

### Example: Netlify

Add a `netlify.toml`:

```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Example: Vercel

Add a `vercel.json`:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

## Tech Stack

- React 18 + TypeScript
- Vite (build + dev server)
- Tailwind CSS + shadcn/ui
- html2canvas (screenshot capture)
- date-fns (date formatting)
- localStorage (persistence)
