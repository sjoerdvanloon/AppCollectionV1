(() => {
  const $ = s => document.querySelector(s);
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const short = sha => sha ? sha.slice(0, 7) : '–';
  const commitLink = (repo, sha) => sha ? `<a href="https://github.com/${esc(repo)}/commit/${esc(sha)}"><code>${esc(short(sha))}</code></a>` : '<span class="muted">–</span>';
  const states = {
    current: ['ok', 'Up-to-date'],
    behind: ['warn', 'Loopt achter'],
    unknown: ['unknown', 'Onbekend'],
    'unknown-sites': ['unknown', 'Onbekend (Sites)'],
    'no-github': ['unknown', 'Geen GitHub-toegang']
  };
  const pulls = (repo, p) => !p ? '<span class="muted">–</span>' : p.open === 0 ? '<span class="muted">0</span>' :
    `<a href="https://github.com/${esc(repo)}/pulls">${p.open}</a> <span class="muted">(${[p.ready && `${p.ready} klaar`, p.draft && `${p.draft} concept`, p.dependabot && `${p.dependabot} Dependabot`].filter(Boolean).join(', ')})</span>`;
  const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

  function appRow(a) {
    const [cls, text] = states[a.state] || ['unknown', a.state];
    const live = a.live ? `${commitLink(a.repo, a.live.commit)}${a.live.version ? ` <span class="muted">${esc(a.live.version)}</span>` : ''}${a.live.source === 'github-deployment' ? ' <span class="muted" title="Uit de GitHub-deployment, geen /version.json">ⓓ</span>' : ''}` : '<span class="muted">?</span>';
    const behind = a.state === 'behind' ? `<a href="https://github.com/${esc(a.repo)}/compare/${esc(a.live.commit)}...${esc(a.branch || 'main')}">${plural(a.unreleased.ahead, 'commit', 'commits')}</a>` : a.state === 'current' ? '<span class="muted">0</span>' : '<span class="muted">?</span>';
    const staging = !a.staging ? '<span class="muted">geen</span>' : a.staging.ahead ? `<a href="https://github.com/${esc(a.repo)}/compare/${esc(a.branch || 'main')}...staging">+${a.staging.ahead}</a> op main` : '<span class="muted">gelijk</span>';
    return `<tr><th scope="row"><a href="${esc(a.url)}">${esc(a.name)}</a><span class="host">${a.hosting === 'sites' ? 'ChatGPT Sites' : 'Vercel'}</span></th><td><span class="pill ${cls}">${text}</span></td><td>${live}</td><td>${commitLink(a.repo, a.main?.commit)}</td><td>${behind}</td><td>${staging}</td><td>${pulls(a.repo, a.pulls)}</td></tr>`;
  }
  function libraryRow(l) {
    const since = l.unreleased == null ? '<span class="muted">?</span>' : l.unreleased === 0 ? '<span class="muted">0</span>' : `<a href="https://github.com/${esc(l.repo)}/compare/${esc(l.tag)}...main">${l.unreleased}</a>`;
    return `<tr><th scope="row"><a href="https://github.com/${esc(l.repo)}">${esc(l.name)}</a></th><td>${l.tag ? `<code>${esc(l.tag)}</code>` : '<span class="muted">geen tag</span>'}</td><td>${since}</td><td>${commitLink(l.repo, l.main?.commit)}</td><td>${pulls(l.repo, l.pulls)}</td></tr>`;
  }

  async function load() {
    $('#refresh').disabled = true;
    try {
      const response = await fetch('/api/status', { headers: { Accept: 'application/json' } });
      const s = await response.json();
      if (!response.ok || !s.apps) throw Error(s.error || `HTTP ${response.status}`);
      $('#apps').innerHTML = s.apps.map(appRow).join('');
      $('#libraries').innerHTML = s.libraries.map(libraryRow).join('');
      const behind = s.apps.filter(a => a.state === 'behind').length;
      const unknown = s.apps.filter(a => a.state !== 'behind' && a.state !== 'current').length;
      const open = [...s.apps, ...s.libraries].reduce((n, x) => n + (x.pulls?.open || 0), 0);
      $('#summary').textContent = `${plural(behind, 'app loopt', 'apps lopen')} achter op main, ${unknown} onbekend, ${plural(open, 'open PR', 'open PR’s')}. Bijgewerkt ${new Date(s.generatedAt).toLocaleString('nl-NL', { dateStyle: 'medium', timeStyle: 'short' })}.`;
      const notice = $('#notice');
      notice.hidden = s.github === 'token';
      notice.textContent = 'GitHub-token ontbreekt: privérepositories zijn niet te zien. Zet STATUS_GITHUB_TOKEN in Vercel.';
    } catch (error) {
      $('#summary').textContent = `Status kon niet worden opgehaald (${error.message}).`;
    } finally {
      $('#refresh').disabled = false;
    }
  }
  $('#refresh').addEventListener('click', load);
  load();
})();
