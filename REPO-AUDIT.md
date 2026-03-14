# REPO-AUDIT.md — buggy-button

**Audit Date:** 2026-03-14

---

## Repo Overview

- **Remote URL:** `https://github.com/tweakyourgeek/buggy-button` (via local proxy: `http://local_proxy@127.0.0.1:34395/git/tweakyourgeek/buggy-button`)
- **GitHub Account:** tweakyourgeek
- **Repo Name:** buggy-button
- **Full URL:** https://github.com/tweakyourgeek/buggy-button
- **Distinct apps / deployable units:** 1 — a single-page React app at the repo root
  - The app has three routes: `/` (landing / demo page), `/widget` (embeddable bug widget for iframes), `/admin` (bug report admin dashboard)
  - These are routes within ONE app, not separate deployable units
- **Tech stack:**
  - **Framework:** React 18 + Vite 5 (SPA, client-side routing via react-router-dom)
  - **Language:** TypeScript
  - **UI library:** shadcn/ui (Radix primitives) + Tailwind CSS 3
  - **Other major deps:** html2canvas (screenshot capture), recharts, @tanstack/react-query, react-hook-form, zod, date-fns, lucide-react
  - **Dev tooling:** Vitest, @testing-library/react, ESLint, lovable-tagger (Lovable.dev scaffolding plugin)
- **Vercel connection:** No. No `vercel.json`, no `.vercel/` directory, no Vercel-specific config found.
- **Multiple Vercel projects:** N/A — not connected to Vercel.

---

## Repo Classification

- **🚀 APP REPO:** Contains one deployable web app — a bug report widget with annotation tools and an admin dashboard.
- **🧪 EXPERIMENT:** This was scaffolded by Lovable.dev (evident from `lovable-tagger` devDependency, boilerplate README, default `<title>Lovable App</title>` in index.html, and placeholder project URLs). It appears to be a prototype/experiment that was iterated on but never given a production identity (no custom branding, no real backend, all data is in-memory).

---

## Non-App Content Inventory

This repo contains **no non-app content** beyond the app itself. There are no data files, extracted conversations, standalone scripts, datasets, PDFs, or reference material. Every file serves the single React application.

- **Non-app files:** None
- **Apparent purpose:** N/A
- **Worth keeping:** N/A
- **Consolidation recommendation:** N/A

---

## Documentation Suite

- ✅ **README.md** — Exists but is a **Lovable.dev boilerplate placeholder**. Contains generic instructions for Lovable projects with `REPLACE_WITH_PROJECT_ID` placeholder URLs that were never filled in. Not substantive or project-specific.
- ❌ **CLAUDE.md** — missing
- ❌ **.claudeignore** — missing
- ✅ **.gitignore** — Exists. Generic Vite/Node template (logs, node_modules, dist, editor files). Appropriate for the stack but does not include `.env` explicitly (no env files exist anyway).
- ❌ **LICENSE** — missing
- ❌ **CHANGELOG.md** — missing
- ❌ **CONTRIBUTING.md** — missing
- ✅ **package.json** — Exists.
  - `"name"`: `"vite_react_shadcn_ts"` (generic scaffolding name, never renamed)
  - `"description"`: not set
  - `"scripts"`: `dev`, `build`, `build:dev`, `lint`, `preview`, `test`, `test:watch`
- ✅ **tsconfig.json** — Exists (with `tsconfig.app.json` and `tsconfig.node.json` project references)
- ❌ **.env.example** — missing (no environment variables are used in the codebase)
- ✅ **Tests** — Vitest is configured with jsdom environment and @testing-library/react. There is 1 test file (`src/test/example.test.ts`) containing a single trivial placeholder test (`expect(true).toBe(true)`). No real tests exist.
- ❌ **CI/CD** — No GitHub Actions workflows, no Vercel config, no Netlify config, no deployment automation of any kind.
- **Other docs:** None. No docs directory, no wiki, no additional documentation files.

**DOC SUITE SCORE: 4 out of 12** (README placeholder, .gitignore, package.json, tsconfig.json — tests barely count with only a placeholder test)

---

## Per-App Deep Dive

### App 1: buggy-button (Bug Report Widget)

**Path:** `/` (repo root)
**Stack:** React 18, TypeScript, Vite 5, Tailwind CSS 3, shadcn/ui

#### Description

A client-side bug reporting widget that can be embedded in any web page via an iframe. Features include:
- Floating action button (FAB) that triggers a bug report modal
- Automatic screenshot capture of the page using html2canvas
- Screenshot annotation tools (pen, arrow, rectangle, ellipse, text) with color picker and line thickness selector
- Bug report form with title, description, severity, and optional email
- Auto-capture of browser metadata (URL, user agent, viewport size, console errors)
- Admin dashboard at `/admin` to view, filter, search, and update bug report statuses
- All data is stored **in-memory only** (no persistence — data is lost on page refresh)

#### Authentication

- **No.** There is no authentication of any kind. No login, no auth provider, no auth-related environment variables. The admin dashboard at `/admin` is completely unprotected — anyone with the URL can access it.

#### Database

- **No.** There is no database connection. All bug report data is stored in an in-memory JavaScript array (`bugStore` in `src/lib/bugStore.ts`). Data does not persist across page refreshes. Mock data is hardcoded for demo purposes.

#### API Routes / Server-Side Logic

- **No.** There are no API routes. This is a purely client-side SPA with no server-side rendering (SSR). Vite serves it as static files after build. No serverless functions. No custom API calls — everything happens in the browser.

#### Payments

- **No.** No Stripe, PayPal, LemonSqueezy, or any payment processor is integrated. No webhook endpoints.

#### Email / Notifications

- **No.** No email sending capability. No notification systems. The bug report form collects an optional email address but only stores it in memory — it is never used to send anything.

#### Hosting Other People's Content

- **No.** Bug reports and screenshots exist only in browser memory for the current session. Nothing is persisted to any server or infrastructure. No file upload features that persist data.

#### Environment Variables

- **None.** Zero environment variables are referenced anywhere in the codebase. No `process.env`, no `import.meta.env` references (other than Vite's built-in `import.meta.env.MODE` used internally by Vite itself). No `.env` files exist.

#### Verdict

**🟢 STATIC:** No server needed. This is a purely client-side React SPA that builds to static HTML/CSS/JS. It could be deployed to GitHub Pages, Netlify, Vercel static, or any static file host. The only caveat is that client-side routing (react-router-dom with `BrowserRouter`) requires a fallback/redirect rule to serve `index.html` for all routes — but this is a standard static SPA deployment concern, not a server requirement.

---

## Additional Notes

1. **Lovable.dev origin:** This app was scaffolded using Lovable.dev (AI app builder). Evidence: `lovable-tagger` devDependency, boilerplate README with Lovable branding, default meta tags referencing Lovable, and the generic `vite_react_shadcn_ts` package name.
2. **No persistence:** The entire app operates on in-memory data. The admin dashboard comes pre-loaded with 6 mock bug reports for demo purposes, but any submitted bugs are lost on refresh.
3. **Heavy UI dependency set:** The app includes the full shadcn/ui component library (40+ UI components in `src/components/ui/`), most of which are unused by the actual application. This is typical of Lovable.dev scaffolding which installs all available components upfront.
4. **No production readiness indicators:** No custom favicon, no custom page title, no SEO metadata, no error boundaries, no real tests, no CI/CD, no deployment config.
