// js/ux.js — Etapa 37: painel Hoje, busca global, atalhos, tutorial, filtros de notificação, tema escuro, celular e animações do mapa.
(function () {
  const K = window.KOT, API = (typeof Api !== 'undefined' ? Api : window.Api); if (!K || !API) return;
  const $ = (id) => document.getElementById(id); const esc = K.escapeHtml; const R = (p, o) => API.raw(p, o);
  const LS = { get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* noop */ } } };
  const active = (p) => !!document.querySelector(`.dash-panel[data-panel="${p}"].active`);
  const isMobile = () => window.matchMedia('(max-width: 760px)').matches;
  const panelsList = () => [...document.querySelectorAll('.nav-item')].map(b => ({ key: b.dataset.panel, icon: (b.querySelector('span') || {}).textContent || '•', label: b.textContent.replace(/\d+\s*$/, '').replace((b.querySelector('span') || {}).textContent || '', '').trim() }));
  const go = (p) => { K.goToPanel(p); if (isMobile()) document.body.classList.remove('m-drawer'); };

  // ============================================================ TEMA
  function applyTheme(t) { document.documentElement.setAttribute('data-theme', t); LS.set('kot_theme', t); const b = $('uxThemeBtn'); if (b) b.textContent = t === 'dark' ? '☀️' : '🌙'; }
  const toggleTheme = () => applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  applyTheme(LS.get('kot_theme', 'light'));

  // ============================================================ FERRAMENTAS NO TOPO
  const nw = document.querySelector('.notif-wrap');
  if (nw) { const t = document.createElement('div'); t.className = 'ux-tools'; t.innerHTML = `<button class="ux-btn" id="uxSearchBtn" title="Busca global (Ctrl+K ou /)">🔍<span class="ux-label"> Buscar</span></button><button class="ux-btn" id="uxHojeBtn" title="O que exige a sua atenção (H)">📋<span class="ux-badge" id="uxHojeBadge">0</span></button><button class="ux-btn" id="uxThemeBtn" title="Modo escuro (D)">🌙</button><button class="ux-btn" id="uxHelpBtn" title="Atalhos e tutorial (?)">❓</button>`; nw.parentNode.insertBefore(t, nw); }
  $('uxSearchBtn') && $('uxSearchBtn').addEventListener('click', () => openPalette()); $('uxHojeBtn') && $('uxHojeBtn').addEventListener('click', () => go('hoje')); $('uxThemeBtn') && $('uxThemeBtn').addEventListener('click', toggleTheme); $('uxHelpBtn') && $('uxHelpBtn').addEventListener('click', () => openHelp());
  applyTheme(LS.get('kot_theme', 'light'));

  // ============================================================ HOJE (atenção)
  let A = null; let aBusy = false;
  async function loadAttention() {
    if (aBusy) return; aBusy = true; try { A = await R('/world/attention'); } catch { aBusy = false; return; } aBusy = false;
    try { document.dispatchEvent(new CustomEvent('kot:attention', { detail: A.summary })); } catch { /* noop */ }
    const n = A.summary.urgente + A.summary.atencao; const b = $('uxHojeBadge'); if (b) b.textContent = n; const btn = $('uxHojeBtn'); if (btn) btn.classList.toggle('alert', A.summary.urgente > 0);
    const nc = $('navHojeCount'); if (nc) { nc.textContent = n; nc.classList.toggle('hidden', n === 0); } const md = document.querySelector('.m-bottombar [data-m="hoje"] .m-dot'); if (md) { md.textContent = n; md.style.display = n ? '' : 'none'; }
    if (active('hoje')) renderHoje();
  }
  async function renderHoje() {
    const box = $('hojeBody'); if (!box || !A) return; const g = (l) => A.items.filter(i => i.level === l);
    const sig = JSON.stringify([A.day, A.items.map(i => [i.title, i.detail, i.daysLeft, i.level])]); if (box.dataset.sig === sig && box.children.length) return; // nada mudou: nao mexe no DOM (preserva o foco do teclado)
    const focusedIdx = [...box.querySelectorAll('[data-hgo]')].findIndex(x => x === document.activeElement);
    const group = (title, cls, list) => list.length ? `<div class="hoje-group-title">${title}</div>${list.map(i => `<div class="hoje-item ${cls}" data-hgo="${i.panel}" tabindex="0" role="button"><span class="hi-icon">${i.icon}</span><div class="hi-body"><div class="hi-title">${esc(i.title)}</div><div class="hi-detail">${esc(i.detail || '')}</div></div>${i.daysLeft !== undefined && i.daysLeft !== null ? `<span class="hi-days">⏳ ${i.daysLeft}d</span>` : ''}<span>➜</span></div>`).join('')}` : '';
    let chains = ''; try { const c = await R('/world/chains'); chains = c.active.length ? `<div class="hoje-group-title">🔗 Cadeias de causa e efeito ativas</div>${c.active.slice(0, 4).map(x => `<div class="hoje-item oportunidade" data-hgo="mundo"><span class="hi-icon">${x.icon}</span><div class="hi-body"><div class="hi-title">${esc(x.name)}</div><div class="hi-detail">${x.causes.map(esc).join(' · ')}</div></div><span>➜</span></div>`).join('')}` : ''; } catch { /* noop */ }
    box.innerHTML = `<div class="hoje-summary"><span class="hoje-chip u">🔴 ${A.summary.urgente} urgente(s)</span><span class="hoje-chip a">🟡 ${A.summary.atencao} para ver</span><span class="hoje-chip o">🟢 ${A.summary.oportunidade} oportunidade(s)</span><span class="hoje-chip">📅 Dia ${A.day}</span></div>
      <div class="hoje-quick"><button class="btn btn-primary btn-sm" data-hadv="advanceBtn">▶️ Avançar 1 dia (A)</button><button class="btn btn-secondary btn-sm" data-hadv="advance7Btn">+7 dias (7)</button><button class="btn btn-secondary btn-sm" data-hadv="advance30Btn">+30 dias (3)</button><button class="btn btn-ghost btn-sm" id="hojeTut">🎓 Tutorial</button></div>
      ${A.summary.total === 0 ? '<p class="hint">✅ Nada exige a sua atenção agora. Avance o tempo ou aproveite para planejar.</p>' : ''}
      ${group('🔴 Urgente', 'urgente', g('urgente'))}${group('🟡 Exige atenção', 'atencao', g('atencao'))}${group('🟢 Oportunidades', 'oportunidade', g('oportunidade'))}${chains}`;
    box.dataset.sig = sig; if (focusedIdx >= 0) { const items = box.querySelectorAll('[data-hgo]'); if (items[focusedIdx]) items[focusedIdx].focus(); }
    box.querySelectorAll('[data-hgo]').forEach(e => { e.addEventListener('click', () => go(e.dataset.hgo)); e.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') go(e.dataset.hgo); }); });
    box.querySelectorAll('[data-hadv]').forEach(b => b.addEventListener('click', () => $(b.dataset.hadv).click())); const tb = $('hojeTut'); if (tb) tb.addEventListener('click', () => startTutorial());
  }

  // ============================================================ FILTROS DE NOTIFICAÇÃO
  const SYS = [['governo', '🏛️ Governo', /gabinete|minist|parlament|coaliz|eleiç|decreto|facç|orçament|legitim|constitui|crise política|oposição|partido|sucess/i], ['guerra', '⚔️ Guerra', /guerra|batalha|incurs|invad|exércit|tropa|defesa|saque/i], ['economia', '💰 Economia', /preço|mercado|ouro|renda|comérc|dívida|caravana|rota|econôm|inflaç|embargo|bolha|safra|cadeia/i], ['religiao', '⛪ Fé', /\bfé\b|religi|templo|sacerd|concíl|cisma|doutrina/i], ['construcoes', '🏗️ Obras', /construç|obra|moradia|edifíc|erguid|concluíd|marco/i], ['ciencia', '🔬 Ciência', /pesquisa|tecnolog|descobert|conhecimento/i], ['diplomacia', '🌍 Mundo', /reino de|aliança|diplom|tratado|embaixad|estrangeir|governante de/i]];
  const sysOf = (n) => { for (const [k, , re] of SYS) if (re.test(n.message || '')) return k; return 'outros'; };
  const NF = Object.assign({ filter: 'todas', q: '', muteInfo: false }, LS.get('kot_nf', {}));
  const isInfo = (n) => n.category === 'info';
  function renderNotifs() {
    const dd = $('notifDropdown'); const list = $('notifList'); if (!dd || !list) return; const all = (K.state.notifications || {}).notifications || [];
    let bar = $('nfBar'); if (!bar) { bar = document.createElement('div'); bar.id = 'nfBar'; bar.className = 'nf-bar'; list.parentNode.insertBefore(bar, list); }
    const chips = [['todas', 'Todas'], ['unread', 'Não lidas'], ['imp', '⚠️ Importantes'], ...SYS.map(([k, l]) => [k, l]), ['outros', 'Outras']];
    bar.innerHTML = `${chips.map(([k, l]) => `<button class="nf-chip ${NF.filter === k ? 'on' : ''}" data-nf="${k}">${l}</button>`).join('')}<button class="nf-chip ${NF.muteInfo ? 'on' : ''}" data-nfmute title="Esconde as notificações apenas informativas">🔕 silenciar informativas</button><input class="nf-search" placeholder="Buscar nas notificações…" value="${esc(NF.q)}">`;
    const visible = all.filter(n => { if (NF.muteInfo && isInfo(n)) return false; if (NF.filter === 'unread') return !n.is_read; if (NF.filter === 'imp') return ['alert', 'warning'].includes(n.category); if (NF.filter !== 'todas' && sysOf(n) !== NF.filter) return false; if (NF.q && !(n.message || '').toLowerCase().includes(NF.q.toLowerCase())) return false; return true; });
    list.innerHTML = visible.length ? visible.map(n => { const p = K.guessNotifPanel(n.message); return `<div class="notif-item ${n.is_read ? '' : 'unread'} ${p ? 'notif-clickable' : ''}" ${p ? `data-np="${p}"` : ''}><span class="n-icon">${n.icon}</span><div><span class="n-day">DIA ${n.day}</span>${esc(n.message)}</div></div>`; }).join('') : '<p class="hint" style="padding:14px;">Nenhuma notificação neste filtro.</p>';
    list.querySelectorAll('[data-np]').forEach(i => i.addEventListener('click', () => { go(i.dataset.np); dd.classList.add('hidden'); }));
    bar.querySelectorAll('[data-nf]').forEach(b => b.addEventListener('click', () => { NF.filter = b.dataset.nf; LS.set('kot_nf', NF); renderNotifs(); }));
    bar.querySelector('[data-nfmute]').addEventListener('click', () => { NF.muteInfo = !NF.muteInfo; LS.set('kot_nf', NF); renderNotifs(); });
    const s = bar.querySelector('.nf-search'); s.addEventListener('input', () => { NF.q = s.value; LS.set('kot_nf', NF); const pos = s.selectionStart; renderNotifs(); const s2 = document.querySelector('#nfBar .nf-search'); s2.focus(); s2.setSelectionRange(pos, pos); });
    const unread = all.filter(n => !n.is_read && !(NF.muteInfo && isInfo(n))).length; const badge = $('notifBadge'); if (badge) { badge.textContent = unread > 99 ? '99+' : unread; badge.classList.toggle('hidden', unread === 0); }
  }

  // ============================================================ BUSCA GLOBAL
  let pal = null, palSel = 0, palItems = [], palTimer = null, palQ = '';
  const actions = () => [
    { icon: '▶️', title: 'Avançar 1 dia', sub: 'tecla A', run: () => $('advanceBtn').click() }, { icon: '⏩', title: 'Avançar 7 dias', sub: 'tecla 7', run: () => $('advance7Btn').click() }, { icon: '⏭️', title: 'Avançar 30 dias', sub: 'tecla 3', run: () => $('advance30Btn').click() },
    { icon: '🌓', title: 'Alternar modo escuro', sub: 'tecla D', run: toggleTheme }, { icon: '⌨️', title: 'Ver atalhos de teclado', sub: 'tecla ?', run: () => openHelp() }, { icon: '🎓', title: 'Refazer o tutorial', sub: '', run: () => startTutorial() },
    { icon: '🔔', title: 'Abrir notificações', sub: 'tecla N', run: () => $('notifBell').click() }, { icon: '🔕', title: 'Silenciar/mostrar notificações informativas', sub: '', run: () => { NF.muteInfo = !NF.muteInfo; LS.set('kot_nf', NF); renderNotifs(); K.showToast(NF.muteInfo ? '🔕 Informativas silenciadas.' : '🔔 Informativas visíveis.'); } },
  ];
  const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  function ensurePalette() {
    if (pal) return; pal = document.createElement('div'); pal.className = 'ux-overlay hidden'; pal.id = 'uxPalette'; pal.innerHTML = '<div class="ux-modal"><input class="pal-input" id="palInput" placeholder="Buscar construções, tecnologias, leis, decretos, cidades, personagens, reinos… ou ir para uma aba" autocomplete="off"><div class="pal-list" id="palList"></div><div class="pal-foot">↑↓ navegar · Enter abrir · Esc fechar</div></div>'; document.body.appendChild(pal);
    pal.addEventListener('mousedown', (e) => { if (e.target === pal) closePalette(); }); const inp = $('palInput'); inp.addEventListener('input', () => { palQ = inp.value; palSel = 0; renderPal(); clearTimeout(palTimer); palTimer = setTimeout(remoteSearch, 160); });
    inp.addEventListener('keydown', (e) => { if (e.key === 'ArrowDown') { palSel = Math.min(palItems.length - 1, palSel + 1); renderPal(true); e.preventDefault(); } else if (e.key === 'ArrowUp') { palSel = Math.max(0, palSel - 1); renderPal(true); e.preventDefault(); } else if (e.key === 'Enter') { runPal(palSel); e.preventDefault(); } else if (e.key === 'Escape') closePalette(); });
  }
  let remote = [];
  async function remoteSearch() { const q = palQ.trim(); if (q.length < 2) { remote = []; renderPal(); return; } try { const r = await R('/world/search?q=' + encodeURIComponent(q)); if (q === palQ.trim()) { remote = r.results; renderPal(); } } catch { /* noop */ } }
  function renderPal(keepScroll) {
    const q = norm(palQ.trim()); const items = []; const goto = panelsList().filter(p => !q || norm(p.label).includes(q)).map(p => ({ group: 'Ir para', icon: p.icon, title: p.label, sub: 'aba', run: () => go(p.key) }));
    const acts = actions().filter(a => !q || norm(a.title).includes(q)).map(a => ({ group: 'Ações', ...a })); const rem = remote.map(r => ({ group: 'Resultados', icon: r.icon, title: r.title, sub: r.sub, type: r.type, run: () => go(r.panel) }));
    items.push(...(q ? [...goto.slice(0, 5), ...acts.slice(0, 4), ...rem] : [...goto.slice(0, 8), ...acts])); palItems = items; let last = ''; const list = $('palList');
    list.innerHTML = items.map((it, i) => { const h = it.group !== last ? `<div class="pal-group">${it.group}</div>` : ''; last = it.group; return `${h}<div class="pal-item ${i === palSel ? 'sel' : ''}" data-pi="${i}"><span style="font-size:20px">${it.icon}</span><div class="pi-t"><div>${esc(it.title)}</div><div class="pi-sub">${esc(it.sub || '')}</div></div>${it.type ? `<span class="pi-type">${esc(it.type)}</span>` : ''}</div>`; }).join('') || '<div class="pal-item"><div class="pi-t">Nada encontrado.</div></div>';
    list.querySelectorAll('[data-pi]').forEach(e => { e.addEventListener('mousedown', (ev) => { ev.preventDefault(); runPal(Number(e.dataset.pi)); }); });
    if (keepScroll) { const s = list.querySelector('.sel'); if (s) s.scrollIntoView({ block: 'nearest' }); }
  }
  function runPal(i) { const it = palItems[i]; if (!it) return; closePalette(); setTimeout(() => it.run(), 20); }
  function openPalette() { ensurePalette(); pal.classList.remove('hidden'); palQ = ''; palSel = 0; remote = []; $('palInput').value = ''; renderPal(); setTimeout(() => $('palInput').focus(), 10); }
  function closePalette() { if (pal) { pal.classList.add('hidden'); const i = $('palInput'); if (i) i.blur(); } }

  // ============================================================ ATALHOS E AJUDA
  const GOTO = { p: 'painel', h: 'hoje', c: 'construcoes', o: 'governo', u: 'populacao', e: 'exercito', t: 'tecnologia', d: 'diplomacia', w: 'guerra', m: 'mapa', r: 'religiao', k: 'campanha', i: 'cidades', l: 'politica', x: 'exploracao', b: 'economia', q: 'mundo', v: 'eventos', s: 'seguranca', a: 'magia', y: 'dinastia', f: 'infra', n: 'personagens', j: 'objetivos', z: 'historico' };
  function openHelp() {
    let h = $('uxHelp'); if (!h) { h = document.createElement('div'); h.id = 'uxHelp'; h.className = 'ux-overlay hidden'; document.body.appendChild(h); h.addEventListener('mousedown', (e) => { if (e.target === h) h.classList.add('hidden'); }); }
    const names = Object.fromEntries(panelsList().map(p => [p.key, p.label]));
    h.innerHTML = `<div class="ux-modal"><div class="pal-group">Atalhos de teclado</div><div class="help-grid"><kbd>Ctrl</kbd><span>+ <kbd>K</kbd> ou <kbd>/</kbd> — busca global</span><kbd>A</kbd><span>avançar 1 dia · <kbd>7</kbd> 7 dias · <kbd>3</kbd> 30 dias</span><kbd>H</kbd><span>painel Hoje (o que exige atenção)</span><kbd>N</kbd><span>notificações</span><kbd>D</kbd><span>modo escuro</span><kbd>?</kbd><span>esta ajuda</span><kbd>G</kbd><span>depois uma letra, para ir a uma aba:</span>${Object.entries(GOTO).map(([k, p]) => `<kbd>G ${k.toUpperCase()}</kbd><span>${esc(names[p] || p)}</span>`).join('')}</div><div class="pal-foot"><button class="btn btn-secondary btn-sm" id="helpTut">🎓 Refazer o tutorial</button> <button class="btn btn-ghost btn-sm" id="helpClose">Fechar</button></div></div>`;
    h.classList.remove('hidden'); $('helpClose').addEventListener('click', () => h.classList.add('hidden')); $('helpTut').addEventListener('click', () => { h.classList.add('hidden'); startTutorial(); });
  }
  let gPending = 0;
  document.addEventListener('keydown', (e) => {
    const t = e.target; const typing = t && (['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName) || t.isContentEditable);
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openPalette(); return; }
    if (e.key === 'Escape') { closePalette(); const h = $('uxHelp'); if (h) h.classList.add('hidden'); const tm = $('tacModal'); void tm; endTutorial(); return; }
    if (typing || e.ctrlKey || e.metaKey || e.altKey) return; const k = e.key.toLowerCase();
    if (gPending && Date.now() < gPending) { gPending = 0; if (GOTO[k]) { e.preventDefault(); go(GOTO[k]); } return; }
    if (k === '/') { e.preventDefault(); openPalette(); } else if (k === '?') { e.preventDefault(); openHelp(); } else if (k === 'g') { gPending = Date.now() + 1400; }
    else if (k === 'd') toggleTheme(); else if (k === 'h') go('hoje'); else if (k === 'n') $('notifBell').click(); else if (k === 'a') $('advanceBtn').click(); else if (k === '7') $('advance7Btn').click(); else if (k === '3') $('advance30Btn').click();
  });

  // ============================================================ TUTORIAL
  const STEPS = [
    { title: 'Bem-vindo a Kings or Thrones 👑', text: 'Você governa um reino por décadas, séculos, gerações. Este tour de 1 minuto mostra onde está cada coisa. Você pode refazê-lo quando quiser (tecla ? ou o botão ❓).' },
    { title: 'Seus recursos', target: '#resourceStrip', text: 'Ouro, comida, madeira, pedra e mais. O que falta aqui trava tudo: sem comida há fome, sem ouro não há obras nem pesquisa.' },
    { title: 'O tempo é seu', target: '.time-control', text: 'O jogo só anda quando VOCÊ manda. Avance 1, 7 ou 30 dias — atalhos: A, 7 e 3. Cada dia, a economia, a política e o mundo se movem.' },
    { title: 'Hoje: o que exige atenção', target: '.nav-item[data-panel="hoje"]', panel: 'hoje', text: 'Este painel junta as decisões do dia: eventos, crises, demandas, dívidas, oportunidades ociosas. Comece sempre por aqui (tecla H).' },
    { title: 'Construa a base', target: '.nav-item[data-panel="construcoes"]', panel: 'construcoes', text: 'Fazendas dão comida, casas dão moradia, oficinas dão emprego. Comece pelo básico: comida, moradia e trabalho.' },
    { title: 'Gente precisa de emprego', target: '.nav-item[data-panel="populacao"]', panel: 'populacao', text: 'População sem emprego não produz. Se o desemprego passar de 50%, o painel Hoje avisa.' },
    { title: 'Governo é estratégia', target: '.nav-item[data-panel="governo"]', panel: 'governo', text: 'Cada tipo de governo joga diferente: decretos, aprovações, ministros, facções, eleições, Constituição. Mexa nos pilares que importam no SEU regime.' },
    { title: 'O mundo reage', target: '.nav-item[data-panel="mundo"]', panel: 'mundo', text: 'Cadeias de causa e efeito entre religião, ciência, magia e economia; mercado com oferta e demanda; reinos com objetivos e personagens; marcos e decisões da capital.' },
    { title: 'Notificações com filtro', target: '#notifBell', text: 'Filtre por sistema, só as importantes, não lidas, ou silencie as informativas. Clique numa notificação para ir direto ao assunto.' },
    { title: 'Busca e atalhos', target: '#uxSearchBtn', text: 'Ctrl+K busca qualquer coisa: construções, tecnologias, leis, decretos, cidades, personagens e reinos. G + letra navega entre abas. D alterna o modo escuro.' },
    { title: 'Pronto! 🎉', text: 'Dica de ouro: abra o painel Hoje, resolva o que estiver em vermelho e avance o tempo. Boa sorte, soberano!' },
  ];
  let tut = null;
  function endTutorial() { if (!tut) return; tut.mask.remove(); tut.hole.remove(); tut.card.remove(); tut = null; LS.set('kot_tut_done', true); }
  function startTutorial() { endTutorial(); if (isMobile()) document.body.classList.remove('m-drawer'); tut = { i: 0, mask: document.createElement('div'), hole: document.createElement('div'), card: document.createElement('div') }; tut.mask.className = 'tut-mask'; tut.hole.className = 'tut-hole'; tut.card.className = 'tut-card'; [tut.mask, tut.hole, tut.card].forEach(x => document.body.appendChild(x)); tutStep(); }
  function tutStep() {
    const s = STEPS[tut.i]; if (s.panel && !isMobile()) K.goToPanel(s.panel); const el = s.target ? document.querySelector(s.target) : null; const r = el && el.offsetParent !== null ? el.getBoundingClientRect() : null;
    if (r) { Object.assign(tut.hole.style, { display: 'block', left: r.left - 6 + 'px', top: r.top - 6 + 'px', width: r.width + 12 + 'px', height: r.height + 12 + 'px' }); } else tut.hole.style.display = 'none';
    tut.card.innerHTML = `<h4>${esc(s.title)}</h4><p>${esc(s.text)}</p><div class="tut-actions"><span class="tut-dots">${tut.i + 1} / ${STEPS.length}</span><button class="btn btn-ghost btn-sm" id="tutSkip">Pular</button>${tut.i > 0 ? '<button class="btn btn-secondary btn-sm" id="tutPrev">◀</button>' : ''}<button class="btn btn-primary btn-sm" id="tutNext">${tut.i === STEPS.length - 1 ? 'Concluir' : 'Próximo ▶'}</button></div>`;
    const cw = Math.min(380, window.innerWidth * 0.92); let left = r ? Math.min(window.innerWidth - cw - 8, Math.max(8, r.left)) : (window.innerWidth - cw) / 2; let top = r ? (r.bottom + 16 + 190 < window.innerHeight ? r.bottom + 16 : Math.max(8, r.top - 200)) : window.innerHeight * 0.3; tut.card.style.left = left + 'px'; tut.card.style.top = top + 'px';
    $('tutSkip').addEventListener('click', endTutorial); const p = $('tutPrev'); if (p) p.addEventListener('click', () => { tut.i--; tutStep(); }); $('tutNext').addEventListener('click', () => { if (tut.i >= STEPS.length - 1) { endTutorial(); K.goToPanel('hoje'); } else { tut.i++; tutStep(); } });
  }
  window.addEventListener('resize', () => { if (tut) tutStep(); });

  // ============================================================ CELULAR
  function buildMobile() {
    if ($('mBottom')) return; const bar = document.createElement('nav'); bar.className = 'm-bottombar'; bar.id = 'mBottom';
    bar.innerHTML = [['hoje', '📋', 'Hoje'], ['painel', '🏰', 'Reino'], ['construcoes', '🏗️', 'Obras'], ['governo', '🏛️', 'Governo'], ['more', '☰', 'Mais']].map(([k, i, l]) => `<button data-m="${k}"><span>${i}</span>${l}${k === 'hoje' ? '<b class="m-dot" style="display:none">0</b>' : ''}</button>`).join(''); document.body.appendChild(bar);
    const bd = document.createElement('div'); bd.className = 'm-backdrop'; document.body.appendChild(bd);
    document.addEventListener('click', (e) => { if (document.body.classList.contains('m-drawer') && !e.target.closest('.dash-nav') && !e.target.closest('#mBottom')) document.body.classList.remove('m-drawer'); });
    bar.querySelectorAll('[data-m]').forEach(b => b.addEventListener('click', () => { if (b.dataset.m === 'more') document.body.classList.toggle('m-drawer'); else go(b.dataset.m); }));
    document.querySelectorAll('.nav-item').forEach(b => b.addEventListener('click', () => document.body.classList.remove('m-drawer')));
    const sync = () => { const cur = (document.querySelector('.dash-panel.active') || {}).dataset; bar.querySelectorAll('[data-m]').forEach(b => b.classList.toggle('on', cur && b.dataset.m === cur.panel)); };
    new MutationObserver(sync).observe(document.querySelector('.dash-main') || document.body, { subtree: true, attributes: true, attributeFilter: ['class'] }); sync();
  }
  buildMobile();

  // ============================================================ ANIMAÇÕES DO MAPA (cargas, exércitos, navios)
  const MA = { on: LS.get('kot_mapanim', !window.matchMedia('(prefers-reduced-motion: reduce)').matches), data: null, mk: [], raf: 0, last: 0, fetched: 0, sig: '' };
  const glyph = (via) => { const v = String(via || '').toLowerCase(); if (/mar|naval|porto/.test(v)) return '⛵'; if (/rio|canal|fluv/.test(v)) return '🛶'; if (/\bar\b|aer|aeroporto|céu|ceu/.test(v)) return '🦅'; if (/tele|magic|portal/.test(v)) return '✨'; return '🐫'; };
  function mapGrid() { const cells = K.state.mapCells; if (!cells || !cells.length) return null; const idx = new Map(cells.map(c => [c.t.id, c.cell])); const parent = cells[0].cell.parentElement; if (parent && getComputedStyle(parent).position === 'static') parent.style.position = 'relative'; return { idx, parent }; }
  function clearMk() { MA.mk.forEach(m => m.el.remove()); MA.mk = []; }
  function buildMk() {
    clearMk(); const g = mapGrid(); if (!g || !MA.data) return; const d = MA.data;
    const pts = (tiles) => tiles.map(id => g.idx.get(id)).filter(Boolean).map(c => [c.offsetLeft + c.offsetWidth / 2, c.offsetTop + c.offsetHeight / 2]);
    const add = (kind, g2, tiles, o) => { const p = pts(tiles); if (p.length < 2) return; const el = document.createElement('div'); el.className = `map-anim-mk ${kind}`; el.textContent = g2; el.title = o.label || ''; g.parent.appendChild(el); MA.mk.push({ el, p, kind, u: o.u || 0, speed: o.speed || 0.12, pp: o.pp || false }); };
    for (const r of d.routes) { add('cargo', glyph(r.via), r.tiles, { u: 0, speed: 0.1, label: r.label }); add('cargo', glyph(r.via), r.tiles, { u: 0.5, speed: 0.1, label: r.label, pp: false }); }
    for (const c of d.caravans) add('cargo', /navio|mar/.test(String(c.transport)) ? '⛵' : '🐫', c.tiles, { u: c.progress, speed: 0.04, label: c.label, pp: true });
    for (const a of d.armies) add('army', '⚔️', a.tiles, { u: a.progress, speed: 0.05, label: a.label, pp: true });
    for (const s of d.ships) add('ship', '⛵', s.tiles, { u: s.progress, speed: 0.07, label: s.label, pp: true });
  }
  function frame(ts) {
    MA.raf = requestAnimationFrame(frame); if (ts - MA.last < 33) return; const dt = (ts - MA.last) / 1000; MA.last = ts; if (dt > 0.5) return;
    for (const m of MA.mk) { m.u += m.speed * dt; let u = m.u; if (m.pp) { const t = u % 2; u = t > 1 ? 2 - t : t; } else u = u % 1; const n = m.p.length - 1; const f = u * n; const i = Math.min(n - 1, Math.floor(f)); const k = f - i; const a = m.p[i], b = m.p[i + 1]; m.el.style.left = a[0] + (b[0] - a[0]) * k + 'px'; m.el.style.top = a[1] + (b[1] - a[1]) * k + 'px'; }
  }
  async function mapAnimTick() {
    const on = MA.on && active('mapa') && K.state.mapCells && K.state.mapCells.length;
    if (!on) { if (MA.raf) { cancelAnimationFrame(MA.raf); MA.raf = 0; } if (MA.mk.length) clearMk(); return; }
    if (Date.now() - MA.fetched > 20000 || !MA.data) { MA.fetched = Date.now(); try { MA.data = await R('/world/animations'); const sig = JSON.stringify([MA.data.routes.length, MA.data.caravans.length, MA.data.armies.length, MA.data.ships.length, K.state.mapCells.length]); if (sig !== MA.sig || !MA.mk.length) { MA.sig = sig; buildMk(); } } catch { /* noop */ } }
    if (MA.data && !MA.mk.length && mapGrid()) buildMk(); // religar as animacoes recria os marcadores na hora
    { const gg = mapGrid(); if (MA.data && gg && MA.mk.length && (!MA.mk[0].el.isConnected || MA.mk[0].el.parentElement !== gg.parent)) buildMk(); } // o mapa redesenha as celulas e apaga os marcadores
    if (!MA.raf && MA.mk.length) { MA.last = performance.now(); MA.raf = requestAnimationFrame(frame); }
  }
  function mapToggleBtn() { const h = document.querySelector('.dash-panel[data-panel="mapa"] h3'); if (!h || $('mapAnimBtn')) return; const b = document.createElement('button'); b.id = 'mapAnimBtn'; b.className = 'btn btn-ghost btn-sm map-anim-toggle'; b.addEventListener('click', () => { MA.on = !MA.on; LS.set('kot_mapanim', MA.on); b.textContent = MA.on ? '🎞️ Animações: ligadas' : '🎞️ Animações: desligadas'; mapAnimTick(); }); b.textContent = MA.on ? '🎞️ Animações: ligadas' : '🎞️ Animações: desligadas'; h.appendChild(b); }
  setInterval(() => { mapToggleBtn(); mapAnimTick(); }, 1000);
  window.KOT.mapAnim = MA;

  // ============================================================ ligação com o ciclo do jogo
  document.addEventListener('kot:refreshed', () => { renderNotifs(); loadAttention(); });
  document.addEventListener('kot:panel', (e) => { if (e.detail === 'hoje') { if (A) renderHoje(); loadAttention(); } });
  setTimeout(() => { loadAttention(); renderNotifs(); }, 1200);
  { let tries = 0; const iv = setInterval(() => { tries++; if (K.state.kingdom) { clearInterval(iv); if (!LS.get('kot_tut_done', false) && !isMobile()) setTimeout(startTutorial, 700); } else if (tries > 60) clearInterval(iv); }, 500); } // tutorial automatico so depois que o reino carregou
  window.KOT.ux = { openPalette, openHelp, startTutorial, toggleTheme, loadAttention, applyTheme };
})();
