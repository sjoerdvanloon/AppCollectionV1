// The settings check. The list is settings.json; values come from the environment only (process.env),
// which Infisical fills locally (infisical run) and Vercel fills online.
//     node scripts/settings.mjs             check this environment (online rules when it runs on Vercel)
//     node scripts/settings.mjs --online    check with the online rules
//     node scripts/settings.mjs --example   write .env.example from the list
// A missing required setting, or a forbidden one online, is named and stops the build.
// A missing optional setting is named as a warning. Values are never printed.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));

export function readSettings() {
  return JSON.parse(readFileSync(join(root, 'settings.json'), 'utf8')).settings;
}

const isSet = (env, name) => (env[name] ?? '').trim() !== '';

export function checkSettings(env, settings, { online = false } = {}) {
  const problems = [];
  const warnings = [];
  for (const { name, hosted, missing } of settings) {
    const set = isSet(env, name);
    if (online && hosted === 'required' && !set) problems.push(`${name} is missing`);
    else if (online && hosted === 'forbidden' && set) problems.push(`${name} must not be set online`);
    else if (hosted === 'optional' && !set && missing) warnings.push(`${name} is not set: ${missing}`);
  }
  return { problems, warnings };
}

export function exampleFile(settings) {
  const lines = [
    '# AppCollection settings. The list is settings.json; this file is written by `npm run settings:example`.',
    '# Values live in Infisical (project appcollection), never in this file. Locally none is needed:',
    '# copy to .env only to try one. Checked at build and with `npm run settings:check`.',
  ];
  for (const { name, secret, hosted, description } of settings) {
    const notes = [secret ? ' Secret.' : '', hosted === 'forbidden' ? ' Never online.' : ''].join('');
    lines.push('', `# ${description}.${notes}`, `${name}=`);
  }
  return `${lines.join('\n')}\n`;
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  const settings = readSettings();
  if (process.argv.includes('--example')) {
    writeFileSync(join(root, '.env.example'), exampleFile(settings));
    console.log('Wrote .env.example');
  } else {
    const online = process.argv.includes('--online') || Boolean(process.env.VERCEL);
    const { problems, warnings } = checkSettings(process.env, settings, { online });
    for (const line of warnings) console.warn(`warning  ${line}`);
    for (const line of problems) console.error(`error    ${line}`);
    if (problems.length) {
      console.error('Settings are not complete. Values live in Infisical (project appcollection); see README.md.');
      process.exit(1);
    }
    console.log(`Settings checked (${online ? 'online' : 'local'} rules): ${settings.length} listed, ${warnings.length} warning(s).`);
  }
}
