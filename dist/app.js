(() => {
  const grid = document.querySelector('#grid');
  const search = document.querySelector('#search');
  const dialog = document.querySelector('#detail');
  const preferences = window.AppPreferences.current;
  let category = 'Alles';
  const favorites = new Set(preferences.favorites);
  const escapeHTML = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const icons = {
    external: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M7 7h10v10"/></svg>',
    code: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 7-5 5 5 5m8-10 5 5-5 5m-3-13-2 20"/></svg>',
    book: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v15M3 4c4-1 6 0 9 2 3-2 5-3 9-2v15c-4-1-6 0-9 2-3-2-5-3-9-2Z"/></svg>',
    pin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m16 3 5 5-4 2-2 6-3-1-7 7m7-7-4-4 6-2Z"/></svg>'
  };
  const artwork = {'Expeditions Automa':0,'Sjoerds Projecten':1,'MiniPaint':2,'ArtAtlas':3,'Lost Cities Roll & Write':4,'Eldritch Horror':5,'Spellenkast':6,'Voltage Lab':7,'Pick a Pen: Crypts':8,'Reading Room':9,'FeedbackKit':10,'AI Model Explorer':11,'Flow Lab':12};
  function art(p) {
    const tile = artwork[p.name] ?? 13;
    return `<span class="thumbnail" style="--art-x:${(tile % 4) * 100 / 3}%;--art-y:${Math.floor(tile / 4) * 100 / 3}%" aria-hidden="true"></span>`;
  }
  function link(url, label, cls = '', icon = 'external') {
    return url ? `<a class="${cls}" href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer">${icons[icon]}<span>${label}</span></a>` : '';
  }
  function persist() {
    preferences.favorites = [...favorites];
    window.AppPreferences.save(preferences);
  }
  function applyView() {
    document.documentElement.dataset.layout = preferences.layout;
    document.documentElement.dataset.stack = String(preferences.showStack);
    document.querySelectorAll('[data-layout-choice]').forEach(button => button.setAttribute('aria-pressed', button.dataset.layoutChoice === preferences.layout));
    document.querySelector('#show-stack').checked = preferences.showStack;
  }
  function render() {
    const query = search.value.trim().toLocaleLowerCase('nl');
    const filtered = projects.filter(p => (category === 'Alles' || (category === 'Favorieten' ? favorites.has(p.name) : p.category === category)) && [p.name,p.description,...p.stack].join(' ').toLocaleLowerCase('nl').includes(query));
    filtered.sort((a,b) => Number(favorites.has(b.name)) - Number(favorites.has(a.name)));
    grid.innerHTML = filtered.map(p => {
      const index = projects.indexOf(p);
      const pinned = favorites.has(p.name);
      const docs = p.docs || (p.source ? `${p.source}#readme` : null);
      return `<article class="card${pinned ? ' is-favorite' : ''}">
        <button class="poster ${p.theme}" data-project="${index}" aria-label="Bekijk ${escapeHTML(p.name)}"><span class="poster-meta">${escapeHTML(p.category)} / ${String(index+1).padStart(2,'0')}</span><span class="artwork" aria-hidden="true">${p.symbol}</span><span class="poster-title">${escapeHTML(p.name)}</span><span class="poster-arrow" aria-hidden="true">↗</span></button>
        <button class="pin-button" type="button" data-pin="${index}" aria-pressed="${pinned}" aria-label="${pinned ? 'Verwijder' : 'Bewaar'} ${escapeHTML(p.name)} ${pinned ? 'uit' : 'als'} favoriet">${icons.pin}</button>
        <div class="cardbody">
          <button class="thumbnail-button" data-project="${index}" aria-label="Details van ${escapeHTML(p.name)}">${art(p)}</button>
          <div class="cardinfo"><div class="cardhead"><h3><button class="title-button" data-project="${index}">${escapeHTML(p.name)}</button></h3></div>
          <span class="category-badge category-${p.category.toLowerCase()}">${escapeHTML(p.category)}</span>${p.kind === 'library' ? '<span class="status">Module</span>' : !p.url ? '<span class="status">Nog niet live</span>' : ''}
          <p class="card-description">${escapeHTML(p.description)}</p>
          <div class="tags card-tags">${p.stack.slice(0,3).map(t => `<span>${escapeHTML(t)}</span>`).join('')}</div></div>
          <div class="cardlinks">${link(p.url,'Open app','open-app')}${link(p.source,'Code','source-link','code')}${link(docs,'Handleiding','docs-link','book')}<button class="details-button" data-project="${index}">Details <span aria-hidden="true">+</span></button></div>
        </div></article>`;
    }).join('');
    document.querySelector('#empty').hidden = Boolean(filtered.length);
    document.querySelector('#results').textContent = `${filtered.length} ${filtered.length === 1 ? 'project' : 'projecten'} gevonden`;
    document.querySelector('#total').textContent = filtered.length === projects.length ? `${projects.length} projecten` : `${filtered.length} van ${projects.length}`;
  }
  function chooseCategory(value) {
    category = value;
    document.querySelectorAll('[data-filter]').forEach(button => button.setAttribute('aria-pressed', button.dataset.filter === category));
    render();
  }
  document.querySelector('.filters').innerHTML = ['Alles','Creatief','Spellen','Tools','Experimenten','Favorieten'].map(c => `<button type="button" aria-pressed="${c === 'Alles'}" data-filter="${c}">${c === 'Favorieten' ? '☆ ' : ''}${c}</button>`).join('');
  document.querySelector('.filters').addEventListener('click', e => { const button = e.target.closest('[data-filter]'); if (button) chooseCategory(button.dataset.filter); });
  document.querySelector('.layout-switch').addEventListener('click', e => {
    const button = e.target.closest('[data-layout-choice]');
    if (!button) return;
    preferences.layout = button.dataset.layoutChoice;
    applyView(); persist();
  });
  document.querySelector('#show-stack').addEventListener('change', e => { preferences.showStack = e.target.checked; applyView(); persist(); });
  document.querySelector('#reset-filters').addEventListener('click', () => { search.value = ''; chooseCategory('Alles'); search.focus(); });
  search.addEventListener('input', render);
  grid.addEventListener('click', e => {
    const pin = e.target.closest('[data-pin]');
    if (pin) {
      const p = projects[Number(pin.dataset.pin)];
      favorites.has(p.name) ? favorites.delete(p.name) : favorites.add(p.name);
      persist(); render();
      const replacement = grid.querySelector(`[data-pin="${pin.dataset.pin}"]`);
      (replacement || document.querySelector('[data-filter="Favorieten"]')).focus();
      return;
    }
    const button = e.target.closest('[data-project]');
    if (!button) return;
    const p = projects[Number(button.dataset.project)];
    document.querySelector('#detail-content').innerHTML = `${art(p)}<p class="eyebrow">${escapeHTML(p.category)}</p><h2 id="dialog-title">${escapeHTML(p.name)}</h2><p class="dialogdesc">${escapeHTML(p.description)}</p><h3>Zo gebruik je het</h3><p>${escapeHTML(p.usage)}</p><h3>Tech stack</h3><div class="tags">${p.stack.length ? p.stack.map(s => `<span>${escapeHTML(s)}</span>`).join('') : '<p>Nog niet vastgelegd.</p>'}</div><h3>Alle links</h3><div class="detaillinks">${link(p.url,'Open website')}${link(p.source,'Bekijk broncode','','code')}${link(p.docs || (p.source ? p.source+'#readme' : null),'Handleiding / README','','book')}</div>${(!p.url && p.kind !== 'library') || !p.source ? `<p class="missing">${[!p.url && p.kind !== 'library' ? 'Live link ontbreekt nog.' : '',!p.source ? 'Broncodelink ontbreekt nog.' : ''].filter(Boolean).join(' ')}</p>` : ''}`;
    dialog.setAttribute('aria-labelledby','dialog-title');
    dialog.showModal();
  });
  document.querySelector('.close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', e => {
    if (e.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) dialog.close();
  });
  applyView(); render();
})();
