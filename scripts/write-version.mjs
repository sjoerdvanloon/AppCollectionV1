// Writes dist/version.json in the HealthKit 0.3 version schema (HealthKit itself is private,
// so this public repository keeps its own few lines instead of vendoring the archive).
import { readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';

const env = process.env;
let commit = env.VERCEL_GIT_COMMIT_SHA || env.GITHUB_SHA || '';
if (!commit) { try { commit = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(); } catch {} }
commit = /^[0-9a-f]{7,40}$/i.test(commit) ? commit.toLowerCase() : null;
const { version } = JSON.parse(await readFile('package.json', 'utf8'));
const info = {
  schema: 1,
  app: 'AppCollection',
  version,
  commit,
  shortCommit: commit ? commit.slice(0, 7) : null,
  ref: env.VERCEL_GIT_COMMIT_REF || null,
  environment: env.VERCEL_ENV || null,
  builtAt: new Date().toISOString()
};
await writeFile('dist/version.json', JSON.stringify(info, null, 2) + '\n');
console.log(`dist/version.json: ${info.shortCommit ?? 'no commit'} (${info.environment ?? 'local'})`);
