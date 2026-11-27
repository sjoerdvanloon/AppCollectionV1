// Copies the settings from the environment this script runs in to the Vercel project (Production).
// Run it through Infisical, so the values go straight from there to Vercel and are never shown or stored here:
//     npm run online:settings:push      (infisical run --env=prod -- node scripts/push-settings-to-vercel.mjs)
// It is the hand-run stand-in for a secret sync. A running deployment keeps its old values: redeploy afterwards.
// The checkout must be linked once: vercel link --project appcollectionv1 --scope schuurvuur
import { spawnSync } from 'node:child_process';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkSettings, readSettings } from './settings.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const settings = readSettings();

const { problems, warnings } = checkSettings(process.env, settings, { online: true });
for (const line of warnings) console.warn(`warning  ${line}`);
if (problems.length) {
  console.error('Not copied: the settings in this environment are not complete.');
  for (const line of problems) console.error(`  ${line}`);
  console.error('Run this through Infisical: npm run online:settings:push');
  process.exit(1);
}

let copied = 0;
let failed = 0;
for (const { name, hosted } of settings) {
  const value = (process.env[name] ?? '').trim();
  if (hosted === 'forbidden' || !value) continue;
  // The value goes in on standard input, so it is not in the process list or the shell history.
  const result = spawnSync('vercel', ['env', 'add', name, 'production', '--force'], {
    cwd: root, input: value, shell: true, stdio: ['pipe', 'ignore', 'ignore'],
  });
  if (result.status === 0) { console.log(`copied  ${name}`); copied += 1; }
  else { console.error(`FAILED  ${name}`); failed += 1; }
}
if (failed) process.exit(1);
if (!copied) {
  console.error('Nothing copied: no setting has a value in this environment. Fill it in Infisical (project appcollection, prod) first.');
  process.exit(1);
}
console.log('Done. A running deployment keeps its old values: redeploy production in Vercel to use them.');
