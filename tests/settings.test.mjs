import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { checkSettings, exampleFile, readSettings } from '../scripts/settings.mjs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('.env.example matches settings.json and holds no value', () => {
  const example = read('.env.example').replace(/\r\n/g, '\n');
  assert.equal(example, exampleFile(readSettings()), 'run `npm run settings:example`');
  for (const line of example.split('\n')) {
    if (line && !line.startsWith('#')) assert.match(line, /^[A-Z0-9_]+=$/);
  }
});

test('every setting the code reads is in settings.json', () => {
  const listed = new Set(readSettings().map((setting) => setting.name));
  // Set by the platform or the shell, not by us.
  const platform = /^(VERCEL(_.*)?|GITHUB_TOKEN|NODE_ENV)$/;
  for (const file of ['api/status.js', 'scripts/status-report.mjs', 'scripts/verify-production.mjs', 'scripts/write-version.mjs']) {
    for (const [, name] of read(file).matchAll(/process\.env\.([A-Z0-9_]+)/g)) {
      assert.ok(listed.has(name) || platform.test(name), `${name} (${file}) is not in settings.json`);
    }
  }
});

test('the check names what is missing and never fails on an optional setting', () => {
  const settings = [
    { name: 'A', hosted: 'required' },
    { name: 'B', hosted: 'forbidden' },
    { name: 'C', hosted: 'optional', missing: 'no C' },
  ];
  assert.deepEqual(checkSettings({}, settings), { problems: [], warnings: ['C is not set: no C'] });
  assert.deepEqual(checkSettings({ B: 'x', C: 'y' }, settings, { online: true }), {
    problems: ['A is missing', 'B must not be set online'], warnings: [],
  });
  assert.deepEqual(checkSettings({ A: ' ' }, settings, { online: true }).problems, ['A is missing']);
});
