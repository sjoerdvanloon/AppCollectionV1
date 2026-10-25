import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import vm from 'node:vm';
import { isMergedRelease } from '../scripts/release-policy.mjs';

test('catalogue has unique projects, valid categories and HTTPS links', async () => {
  const context = { window: {} };
  vm.runInNewContext(await readFile('dist/projects.js', 'utf8'), context);
  const projects = context.window.projects;
  assert.ok(projects.length > 0);
  assert.equal(new Set(projects.map(p => p.name)).size, projects.length);
  for (const p of projects) {
    assert.ok(p.name && p.description && p.usage, p.name);
    assert.ok(['Creatief','Spellen','Tools','Experimenten'].includes(p.category), p.name);
    assert.ok(Array.isArray(p.stack), p.name);
    for (const url of [p.url, p.source, p.docs].filter(Boolean)) assert.equal(new URL(url).protocol, 'https:', p.name);
  }
});

test('HTML references existing local assets and valid JavaScript', async () => {
  const html = await readFile('dist/index.html', 'utf8');
  for (const [, file] of html.matchAll(/(?:src|href)="([^"#]+\.(?:js|css|svg))"/g)) await access(`dist/${file}`);
  for (const file of ['app.js','projects.js','preferences.js']) new vm.Script(await readFile(`dist/${file}`, 'utf8'));
  const css = await readFile('dist/style.css', 'utf8');
  for (const [, file] of css.matchAll(/url\('([^']+)'\)/g)) {
    if (!/^(https?:|data:)/.test(file)) await access(`dist/${file}`);
  }
});

test('preferences survive reloads and recover from invalid or unavailable storage', async () => {
  const script = await readFile('dist/preferences.js', 'utf8');
  let stored = null;
  function load(unavailable = false) {
    const context = { window:{}, document:{documentElement:{dataset:{}}}, localStorage:{getItem(){if(unavailable)throw Error('blocked');return stored;},setItem(key,value){if(unavailable)throw Error('blocked');stored=value;}} };
    vm.runInNewContext(script, context);
    return context;
  }
  let page = load();
  assert.equal(page.document.documentElement.dataset.layout, 'compact');
  page.window.AppPreferences.save({layout:'posters',showStack:false,favorites:['ArtAtlas','ArtAtlas']});
  page = load();
  assert.equal(page.document.documentElement.dataset.layout, 'posters');
  assert.equal(page.document.documentElement.dataset.stack, 'false');
  assert.equal(page.window.AppPreferences.current.favorites.length, 1);
  stored = '{bad json';
  assert.equal(load().window.AppPreferences.current.layout, 'compact');
  stored = JSON.stringify({layout:'invalid',favorites:[null,4,'MiniPaint']});
  page = load();
  assert.equal(page.window.AppPreferences.current.layout, 'compact');
  assert.equal(page.window.AppPreferences.current.favorites.length, 1);
  page = load(true);
  assert.equal(page.window.AppPreferences.current.layout, 'compact');
  assert.doesNotThrow(() => page.window.AppPreferences.save({layout:'posters'}));
});

test('release policy accepts only the merged commit of a PR into this repository main', () => {
  const sha = 'a'.repeat(40);
  const pr = { state:'closed', merged_at:'2026-10-25T00:00:00Z', merge_commit_sha:sha, base:{ref:'main',repo:{full_name:'sjoerdvanloon/AppCollectionV1'}} };
  assert.equal(isMergedRelease([pr],sha),true);
  assert.equal(isMergedRelease([],sha),false);
  assert.equal(isMergedRelease([{...pr,merged_at:null}],sha),false);
  assert.equal(isMergedRelease([{...pr,state:'open'}],sha),false);
  assert.equal(isMergedRelease([{...pr,merge_commit_sha:'b'.repeat(40)}],sha),false);
  assert.equal(isMergedRelease([{...pr,base:{...pr.base,ref:'staging'}}],sha),false);
  assert.equal(isMergedRelease([{...pr,base:{ref:'main',repo:{full_name:'other/repository'}}}],sha),false);
});
