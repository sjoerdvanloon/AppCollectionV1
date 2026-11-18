// Collects live versions and GitHub state. Shared by /api/status and the weekly report.
// Output is deliberately limited to counts and commit ids: the site is public and most repos are private.
import { OWNER, apps as defaultApps, libraries as defaultLibraries } from './apps.mjs';

const SHA = /^[0-9a-f]{7,40}$/i;
const API = 'https://api.github.com';

export function createGitHub({ token, fetchImpl = fetch, timeoutMs = 8000 } = {}) {
  let calls = 0;
  async function get(path) {
    calls++;
    const headers = { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'appcollection-status' };
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetchImpl(`${API}${path}`, { headers, signal: AbortSignal.timeout(timeoutMs) });
    if (response.status === 404) return null;
    if (!response.ok) throw Object.assign(Error(`GitHub HTTP ${response.status}`), { status: response.status });
    return response.json();
  }
  return { get, get calls() { return calls; } };
}

export async function readLiveVersion(url, { fetchImpl = fetch, timeoutMs = 5000 } = {}) {
  try {
    const response = await fetchImpl(new URL('/version.json', url).href, { headers: { Accept: 'application/json' }, redirect: 'follow', signal: AbortSignal.timeout(timeoutMs) });
    if (!response.ok) return null;
    const body = await response.json();
    if (!body || body.schema !== 1 || !SHA.test(body.commit || '')) return null;
    return { commit: body.commit.toLowerCase(), version: typeof body.version === 'string' ? body.version.slice(0, 64) : null, builtAt: typeof body.builtAt === 'string' ? body.builtAt.slice(0, 40) : null, source: 'version.json' };
  } catch {
    return null;
  }
}

async function productionDeployment(gh, repo) {
  const list = await gh.get(`/repos/${OWNER}/${repo}/deployments?per_page=20`);
  if (!Array.isArray(list)) return null;
  const production = list.filter(d => /^production/i.test(d.environment || '')).slice(0, 3);
  for (const d of production) {
    const statuses = await gh.get(`/repos/${OWNER}/${repo}/deployments/${d.id}/statuses?per_page=1`);
    if (Array.isArray(statuses) && statuses[0]?.state === 'success') {
      return { commit: d.sha.toLowerCase(), version: null, builtAt: d.created_at, source: 'github-deployment' };
    }
  }
  return null;
}

async function branch(gh, repo, name) {
  const b = await gh.get(`/repos/${OWNER}/${repo}/branches/${name}`);
  return b ? { commit: b.commit.sha, date: b.commit.commit?.committer?.date ?? null } : null;
}

async function compare(gh, repo, base, head) {
  const c = await gh.get(`/repos/${OWNER}/${repo}/compare/${base}...${head}?per_page=1`);
  return c ? { ahead: c.ahead_by, behind: c.behind_by, status: c.status } : null;
}

async function pullCounts(gh, repo) {
  const pulls = await gh.get(`/repos/${OWNER}/${repo}/pulls?state=open&per_page=100`);
  if (!Array.isArray(pulls)) return null;
  const dependabot = pulls.filter(p => /dependabot/i.test(p.user?.login || '')).length;
  const draft = pulls.filter(p => p.draft).length;
  const oldest = pulls.reduce((min, p) => (!min || p.created_at < min ? p.created_at : min), null);
  return { open: pulls.length, draft, dependabot, ready: pulls.length - draft - dependabot, oldest };
}

const semverKey = name => (name.split('-')[0].match(/\d+/g) || []).slice(0, 3).map(Number);
export function newestTag(tags) {
  const versions = tags.map(t => t.name).filter(n => /^v?\d+\.\d+/.test(n));
  versions.sort((a, b) => {
    const x = semverKey(a), y = semverKey(b);
    for (let i = 0; i < Math.max(x.length, y.length); i++) if ((x[i] ?? -1) !== (y[i] ?? -1)) return (y[i] ?? -1) - (x[i] ?? -1);
    return a.includes('-') - b.includes('-');
  });
  return versions[0] ?? null;
}

export function verdict(app) {
  if (!app.live) return app.hosting === 'sites' ? 'unknown-sites' : 'unknown';
  if (!app.main) return 'no-github';
  if (app.live.commit && app.main.commit.startsWith(app.live.commit)) return 'current';
  if (!app.unreleased) return 'unknown';
  if (app.unreleased.status === 'identical' || app.unreleased.ahead === 0) return 'current';
  return 'behind';
}

async function guard(errors, label, fn) {
  try { return await fn(); } catch (error) { errors.push(`${label}: ${error.message}`); return null; }
}

async function collectApp(gh, app, options) {
  const errors = [];
  const [main, staging, pulls, version] = await Promise.all([
    guard(errors, 'main', () => branch(gh, app.repo, 'main')),
    guard(errors, 'staging', () => branch(gh, app.repo, 'staging')),
    guard(errors, 'pulls', () => pullCounts(gh, app.repo)),
    readLiveVersion(app.url, options)
  ]);
  let live = version;
  if (!live && app.hosting === 'vercel') live = await guard(errors, 'deployments', () => productionDeployment(gh, app.repo));
  const unreleased = live && main ? await guard(errors, 'compare', () => compare(gh, app.repo, live.commit, main.commit)) : null;
  const stagingAhead = staging && main ? await guard(errors, 'staging', () => compare(gh, app.repo, main.commit, staging.commit)) : null;
  const result = { name: app.name, repo: `${OWNER}/${app.repo}`, url: app.url, hosting: app.hosting, live, main, staging: staging ? { ...staging, ahead: stagingAhead?.ahead ?? null, behind: stagingAhead?.behind ?? null } : null, unreleased, pulls, errors };
  result.state = verdict(result);
  return result;
}

async function collectLibrary(gh, lib) {
  const errors = [];
  const [main, tags, pulls] = await Promise.all([
    guard(errors, 'main', () => branch(gh, lib.repo, 'main')),
    guard(errors, 'tags', () => gh.get(`/repos/${OWNER}/${lib.repo}/tags?per_page=100`)),
    guard(errors, 'pulls', () => pullCounts(gh, lib.repo))
  ]);
  const tag = Array.isArray(tags) ? newestTag(tags) : null;
  const sinceTag = tag && main ? await guard(errors, 'compare', () => compare(gh, lib.repo, tag, main.commit)) : null;
  return { name: lib.name, repo: `${OWNER}/${lib.repo}`, main, tag, unreleased: sinceTag ? sinceTag.ahead : null, pulls, errors };
}

async function inBatches(items, size, fn) {
  const out = [];
  for (let i = 0; i < items.length; i += size) out.push(...await Promise.all(items.slice(i, i + size).map(fn)));
  return out;
}

export async function collectStatus({ token, fetchImpl = fetch, apps = defaultApps, libraries = defaultLibraries, now = new Date() } = {}) {
  const gh = createGitHub({ token, fetchImpl });
  const options = { fetchImpl };
  const appResults = await inBatches(apps, 4, app => collectApp(gh, app, options));
  const libraryResults = await inBatches(libraries, 4, lib => collectLibrary(gh, lib));
  return {
    schema: 1,
    generatedAt: now.toISOString(),
    github: token ? 'token' : 'anonymous',
    githubCalls: gh.calls,
    apps: appResults,
    libraries: libraryResults
  };
}
