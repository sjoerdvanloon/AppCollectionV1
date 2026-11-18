// Markdown summary of a status document, used by the weekly report.
const short = sha => (sha ? sha.slice(0, 7) : '–');
const label = {
  current: 'live = main',
  behind: 'behind main',
  unknown: 'live version unknown',
  'unknown-sites': 'live version unknown (Sites, no /version.json yet)',
  'no-github': 'no GitHub access'
};

export function appLine(a) {
  const live = a.live ? `${short(a.live.commit)}${a.live.version ? ` (${a.live.version})` : ''}` : '?';
  const parts = [`**${a.name}**: ${label[a.state] ?? a.state}`, `live ${live}`, `main ${short(a.main?.commit)}`];
  if (a.state === 'behind') parts.push(`${a.unreleased.ahead} unreleased commit${a.unreleased.ahead === 1 ? '' : 's'}`);
  if (a.staging) parts.push(a.staging.ahead ? `staging +${a.staging.ahead} ahead of main` : 'staging in step with main');
  if (a.pulls) parts.push(`${a.pulls.open} open PRs (${a.pulls.ready} ready, ${a.pulls.draft} draft, ${a.pulls.dependabot} Dependabot)`);
  return `- ${parts.join(' · ')}`;
}

export function libraryLine(l) {
  const parts = [`**${l.name}**: ${l.tag ?? 'no tag'}`];
  if (l.unreleased != null) parts.push(l.unreleased ? `${l.unreleased} commit${l.unreleased === 1 ? '' : 's'} on main since the tag` : 'main = tag');
  if (l.pulls) parts.push(`${l.pulls.open} open PRs (${l.pulls.ready} ready, ${l.pulls.draft} draft, ${l.pulls.dependabot} Dependabot)`);
  return `- ${parts.join(' · ')}`;
}

export function toMarkdown(status) {
  const behind = status.apps.filter(a => a.state === 'behind');
  const unknown = status.apps.filter(a => a.state.startsWith('unknown') || a.state === 'no-github');
  const pulls = [...status.apps, ...status.libraries].reduce((n, x) => n + (x.pulls?.open ?? 0), 0);
  const lines = [
    `# Weekly app status, ${status.generatedAt.slice(0, 10)}`,
    '',
    `${behind.length} app${behind.length === 1 ? '' : 's'} behind main, ${unknown.length} with unknown live version, ${pulls} open PRs in total.`,
    '',
    '## Apps',
    ...status.apps.map(appLine),
    '',
    '## Libraries',
    ...status.libraries.map(libraryLine)
  ];
  const errors = [...status.apps, ...status.libraries].filter(x => x.errors?.length);
  if (errors.length) lines.push('', '## Could not read', ...errors.map(x => `- ${x.name}: ${x.errors.join('; ')}`));
  return lines.join('\n') + '\n';
}
