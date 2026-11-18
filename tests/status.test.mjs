import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import vm from 'node:vm';
import { collectStatus, newestTag, readLiveVersion } from '../status/collect.mjs';
import { toMarkdown } from '../status/report.mjs';
import { apps, libraries } from '../status/apps.mjs';

const sha = c => c.repeat(40);
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

// A small fake GitHub + app hosting. Repo "Live" is current, "Old" is 3 behind, "Sites" has no version.json.
function fakeFetch(calls = []) {
  return async (url, init) => {
    calls.push({ url: String(url), auth: init?.headers?.Authorization });
    const u = new URL(url);
    if (u.hostname === 'live.example') return json({ schema: 1, app: 'Live', version: '1.0.0', commit: sha('a') });
    if (u.hostname === 'old.example') return new Response('nope', { status: 404 });
    if (u.hostname === 'sites.example') return new Response('<html>', { status: 200 });
    const path = u.pathname;
    if (/\/branches\/(main|master)$/.test(path)) return json({ commit: { sha: path.includes('/Old/') ? sha('c') : sha('a'), commit: { committer: { date: '2026-11-17T00:00:00Z' } } } });
    if (/\/Live\/branches\/staging$/.test(path)) return json({ commit: { sha: sha('d') } });
    if (/\/branches\/staging$/.test(path)) return json({ message: 'Not Found' }, 404);
    if (/\/pulls$/.test(path)) return json([{ draft: true, user: { login: 'sjoerdvanloon' }, created_at: '2026-11-01' }, { draft: false, user: { login: 'dependabot[bot]' }, created_at: '2026-10-01' }, { draft: false, user: { login: 'sjoerdvanloon' }, created_at: '2026-11-10' }]);
    if (/\/Old\/deployments$/.test(path)) return json([{ id: 7, environment: 'Preview', sha: sha('e') }, { id: 8, environment: 'Production – old', sha: sha('b'), created_at: '2026-11-10' }]);
    if (/\/deployments\/8\/statuses$/.test(path)) return json([{ state: 'success' }]);
    if (/\/compare\//.test(path)) {
      const [base, head] = decodeURIComponent(path.split('/compare/')[1]).split('...');
      if (base === head) return json({ ahead_by: 0, behind_by: 0, status: 'identical' });
      return json({ ahead_by: path.includes('/Old/') ? 3 : 2, behind_by: 0, status: 'ahead' });
    }
    if (/\/tags$/.test(path)) return json([{ name: 'v0.9.0' }, { name: 'v0.10.0' }, { name: 'v0.10.0-alpha.1' }, { name: 'nightly' }]);
    return json({ message: 'Not Found' }, 404);
  };
}

const testApps = [
  { name: 'Master', repo: 'Master', branch: 'master', url: 'https://old.example', hosting: 'sites' },
  { name: 'Live', repo: 'Live', url: 'https://live.example', hosting: 'vercel' },
  { name: 'Old', repo: 'Old', url: 'https://old.example', hosting: 'vercel' },
  { name: 'Sites', repo: 'Sites', url: 'https://sites.example', hosting: 'sites' }
];

test('compares live commits with main, staging and open PRs', async () => {
  const calls = [];
  const s = await collectStatus({ token: 't0ken', fetchImpl: fakeFetch(calls), apps: testApps, libraries: [{ name: 'Lib', repo: 'Lib' }], now: new Date('2026-11-18T00:00:00Z') });
  const [master, live, old, sites] = s.apps;
  assert.equal(master.branch, 'master');
  assert.ok(calls.some(c => c.url.endsWith('/Master/branches/master')));
  assert.equal(live.state, 'current');
  assert.equal(live.live.source, 'version.json');
  assert.equal(live.staging.ahead, 2);
  assert.deepEqual(live.pulls, { open: 3, draft: 1, dependabot: 1, ready: 1, oldest: '2026-10-01' });
  assert.equal(old.state, 'behind');
  assert.equal(old.live.source, 'github-deployment');
  assert.equal(old.live.commit, sha('b'));
  assert.equal(old.unreleased.ahead, 3);
  assert.equal(old.staging, null);
  assert.equal(sites.state, 'unknown-sites');
  assert.equal(s.libraries[0].tag, 'v0.10.0');
  assert.equal(s.libraries[0].unreleased, 2);
  assert.equal(s.github, 'token');
  assert.ok(calls.filter(c => c.url.startsWith('https://api.github.com')).every(c => c.auth === 'Bearer t0ken'));
  assert.ok(calls.filter(c => !c.url.startsWith('https://api.github.com')).every(c => !c.auth), 'the token never goes to app hosts');
  const md = toMarkdown(s);
  assert.match(md, /1 app behind main, 2 with unknown live version/);
  assert.match(md, /\*\*Old\*\*: behind main · live bbbbbbb · main ccccccc · 3 unreleased commits/);
});

test('output holds counts and commit ids, never PR titles or bodies', async () => {
  const s = await collectStatus({ fetchImpl: fakeFetch(), apps: testApps, libraries: [] });
  const text = JSON.stringify(s);
  assert.ok(!/title|body|login/.test(text));
  assert.equal(s.github, 'anonymous');
});

test('rejects malformed version documents', async () => {
  const f = async () => json({ schema: 1, app: 'x', commit: 'not-a-sha' });
  assert.equal(await readLiveVersion('https://x.example', { fetchImpl: f }), null);
  assert.equal(await readLiveVersion('https://x.example', { fetchImpl: async () => { throw Error('down'); } }), null);
  assert.equal(newestTag([{ name: 'v1.2.0' }, { name: 'v1.10.0' }, { name: 'v1.10.0-rc.1' }]), 'v1.10.0');
});

test('status config points at HTTPS apps with known hosting and unique repos', () => {
  const repos = [...apps, ...libraries].map(x => x.repo);
  assert.equal(new Set(repos).size, repos.length);
  for (const a of apps) {
    assert.equal(new URL(a.url).protocol, 'https:', a.name);
    assert.ok(['vercel', 'sites'].includes(a.hosting), a.name);
  }
});

test('status page references existing assets and valid JavaScript', async () => {
  const html = await readFile('dist/status.html', 'utf8');
  for (const [, file] of html.matchAll(/(?:src|href)="([^"#]+\.(?:js|css|svg))"/g)) await access(`dist/${file}`);
  new vm.Script(await readFile('dist/status.js', 'utf8'));
});
