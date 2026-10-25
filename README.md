# Sjoerds projecten

## Staging and production on Vercel

Vercel project: `schuurvuur/appcollectionv1`, linked to `sjoerdvanloon/AppCollectionV1`.

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
