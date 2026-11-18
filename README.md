# Sjoerds projecten

## Staging and production on Vercel

Vercel project: `schuurvuur/appcollectionv1`, linked to `sjoerdvanloon/AppCollectionV1`. Production: https://www.sjoerdvanloon.nl (`sjoerdvanloon.nl` redirects there; DNS at OVH). https://appcollectionv1.vercel.app keeps working.

App links in `dist/projects.js` and `status/apps.mjs` use the apps' own subdomains (`<name>.sjoerdvanloon.nl`) where one exists; the other apps keep their Vercel or ChatGPT Sites address.

1. Push changes to `staging` (or open a feature PR into `staging`). Vercel creates Preview deployments. The `staging` branch has a stable branch preview URL listed in Vercel.
2. Open a release PR from `staging` into `main`. `Validate application` must pass; check the Vercel preview before merging.
3. Merge the PR to publish production. GitHub protects `main`, including administrators, against direct pushes, force pushes and deletion. No approving review is required so the repository owner can merge their own passing PR.

Production tracks `main`. The production build additionally checks public GitHub PR metadata and refuses any commit that is not a merged PR's merge commit into this repository's `main`. Verification failures block production. Preview builds do not require a merge. No CI deployment tokens are needed; Vercel uses its GitHub integration. Vercel account administrators can still change project settings; the release policy applies to this configured workflow.

Run `npm ci` and `npm run build` with Node.js 22 to run catalogue, asset and release-policy checks. The application remains static; Vercel serves `dist/`. Opening `dist/index.html` directly still works.

Een kleine statische projectindex met zoeken, categorieën en projectdetails.

De inhoud staat in `dist/projects.js`. Pas daar projecten, live links, broncode, documentatie, tech stack en gebruikstekst aan. Ontbrekende gegevens zijn bewust leeg; Flow Lab heeft nog geen gepubliceerde URL. Links kunnen een account vereisen.

Bronnen: beschikbare chatgeschiedenis, lokale project-README’s en package.json, Git-remotes, Sites-overzicht en Vercel-projectdomeinen. Geen inloggegevens of persoonlijke chatinhoud opgenomen.

Open `dist/index.html` direct in een browser of serveer de map `dist` via een statische HTTP-server. Geen installatie of build nodig. Lettertypen laden optioneel via Google Fonts, met lokale terugvallettertypen.

## Layouts and illustrations

The default Compact view has illustrated cards and no introductory banner. Switch to Posters in the header for the original large poster cards and introduction. The Tech stack switch hides technical tags on cards; full project details remain available. Pin projects to move them to the top or use the Favorites filter.

Layout, tech-stack visibility and favorites are saved in browser-local storage (`appcollection.preferences.v1`); nothing is sent to a server. If storage is unavailable, the controls still work for the current visit. Search and category selections remain in place when switching layouts.

The locally hosted illustration atlas in `dist/assets/project-illustrations.png` was generated for this project. Tile mappings in `dist/app.js` use project names and remain stable when the catalogue is reordered. New projects use a neutral fallback illustration until a tile is assigned. Posters retain the original geometric artwork.

Categories: Spellen, Creatief, Muziek, AI, Tools, Experimenten and **Bouwstenen** (building blocks): the shared modules and services the apps are built from. **Alles** shows every app and tool but leaves the building blocks out. They have their own filter at the end of the row, and `#bouwstenen` in the URL opens it.

In `dist/projects.js`, a building block has `category: 'Bouwstenen'` and a `kind`:
- `kind: 'library'` marks a module you build into an app. The card says Module and keeps `url` empty.
- `kind: 'service'` marks a shared hosted service, such as ErrorLog or FeedbackKit. It keeps its `url`.

A tool that only runs on your own computer has `local: true` and no `url`; its card says Alleen lokaal (HomeNetwork). `tests/site.test.mjs` checks these rules.

## Status page and weekly report

`/status` compares what each app runs live with GitHub: live commit, `main`, commits not yet live, `staging` and open PR counts, plus the newest tag of each building block. The list lives in `status/apps.mjs`; the collector in `status/collect.mjs` serves both `/api/status` (a Vercel Function, cached ten minutes) and `npm run status` (the weekly report in Markdown).

- Live version: each app's public `/version.json` (HealthKit 0.3 schema: `schema`, `app`, `version`, `commit`, …). This site writes its own at build time (`scripts/write-version.mjs`). Vercel apps without the file fall back to the latest successful GitHub Production deployment. ChatGPT Sites apps stay "unknown" until they publish `/version.json`.
- GitHub: set `STATUS_GITHUB_TOKEN` in Vercel, a fine-grained read-only token (Contents, Pull requests, Deployments) for the `sjoerdvanloon` repositories. Without it, private repositories cannot be read.
- The output is public, so it holds counts and commit ids only: no PR titles, bodies or authors.
