// js/kingdom.js
// Logica do painel principal do reino (Etapa 1 + Etapa 2).

(function () {
  if (!Api.isLoggedIn()) { window.location.href = 'login.html'; return; }

  const el = (id) => document.getElementById(id);
  const TERRAIN_ICON = {
    floresta: '🌲', montanha: '⛰️', planicie: '🌾', deserto: '🏜️', oceano: '🌊',
    pantano: '🐊', tundra: '🌬️', selva: '🌴', costa: '🏖️', vale: '🏞️', colina: '⛅',
    vulcanica: '🌋', congelada: '🧊', magico: '🔮', ruinas: '🏛️', antigas: '🗿', savana: '🦒', recife: '🐠', desconhecido: '❓',
  };
  const TERRAIN_LABEL = {
    floresta: 'Floresta', montanha: 'Montanha', planicie: 'Planície', deserto: 'Deserto', oceano: 'Oceano',
    pantano: 'Pântano', tundra: 'Tundra', selva: 'Selva', costa: 'Costa', vale: 'Vale', colina: 'Colina',
    vulcanica: 'Vulcânica', congelada: 'Congelada', magico: 'Mágica', ruinas: 'Ruínas', antigas: 'Terras Antigas', savana: 'Savana', recife: 'Recife', desconhecido: 'Região desconhecida',
  };
  const KNOWLEDGE_ICON = { 1: '❓', 2: '👁️', 3: '🧭', 4: '🗺️', 5: '📖' };
  const SEASON_ICON = { primavera: '🌱', verao: '☀️', outono: '🍂', inverno: '❄️' };
  const RESOURCE_META = [
    { key: 'gold', icon: '💰', label: 'Ouro', core: true },
    { key: 'food', icon: '🌾', label: 'Comida', core: true },
    { key: 'wood', icon: '🌳', label: 'Madeira', core: true },
    { key: 'stone', icon: '🧱', label: 'Pedra', core: true },
    { key: 'iron', icon: '⛏️', label: 'Ferro', core: true },
    { key: 'crystals', icon: '💎', label: 'Cristais', core: true },
    { key: 'coal', icon: '⚫', label: 'Carvão', core: false },
    { key: 'copper', icon: '🟤', label: 'Cobre', core: false },
    { key: 'silver', icon: '🥈', label: 'Prata', core: false },
    { key: 'marble', icon: '⬜', label: 'Mármore', core: false },
    { key: 'mana', icon: '🔮', label: 'Mana', core: false },
  ];

  const state = {
    kingdom: null,
    buildings: [],
    catalog: [],
    categories: {},
    population: null,
    economy: null,
    objectives: [],
    characters: [],
    events: { pending: [], resolved: [] },
    notifications: { notifications: [], unreadCount: 0 },
    myBuildingsCategory: 'all',
    catalogCategory: 'all',
    objectivesCategory: 'all',
    militaryCategory: 'all',
    myBuildingsSearch: '',
    catalogSearch: '',
    catalogTier: 'all', catalogOnlyAvail: false, catalogLimit: 60,
    fullMapLoaded: false,
    governmentsCatalog: [],
    military: null,
    settlements: [],
    settlementTypes: [],
    buildersInfo: { capacity: 0, occupied: 0, available: 0 },
    buildQueueMax: 4,
    charStatusFilter: 'ativo',
    charSearch: '',
    market: null,
    politics: null,
    polTab: 'visao',
    tech: null, techTab: 'arvore', techCat: 'all', techStatus: 'all', techSearch: '', techResearcher: '',
    exploration: null, expTab: 'visao', expLogOpen: null,
    tradeIntl: null, tiTab: 'visao', tiLogOpen: null, tiPriceRes: null,
    diplomacy: null, dpTab: 'visao',
    war: null, wrTab: 'visao',
    culture: null, cuTab: 'visao',
    security: null, scTab: 'visao',
    magic: null, mgTab: 'visao',
    dynasty: null, dyTab: 'visao', dyFamily: null, dySearch: '', dyKind: '',
    religion: null, rlTab: 'visao', rlSearch: '', rlStatus: '', rlCreateOpen: false,
    infra: null, ifTab: 'visao', ifForm: { from: '', to: '', type: 'terra', bridges: false, tunnels: false }, ifQuote: null,
  };

  function fmt(n) { return Math.round(n).toLocaleString('pt-BR'); }
  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str ?? '';
    return d.innerHTML;
  }


  // ==============================================================
  // SISTEMA DE INFORMACOES "ⓘ" — explica cada mecanica do jogo
  // ==============================================================
  const INFO = window.KOT_DATA.INFO; // textos de ajuda: js/dados-ajuda.js (Etapa 74)
  function infoBtn(key) {
    return `<button type="button" class="info-btn" data-info="${key}" title="O que é isso?">ⓘ</button>`;
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-info]');
    if (!b) return;
    e.stopPropagation();
    const d = INFO[b.dataset.info] || INFO.resource;
    el('infoModalBody').innerHTML = `
      <div class="ficha-name" style="margin-bottom:10px;">${d.title}</div>
      <div class="ficha-section-title">O que é</div><p>${d.what}</p>
      <div class="ficha-section-title">Para que serve</div><p>${d.purpose}</p>
      <div class="ficha-section-title">Como funciona</div><p>${d.how}</p>
      <div class="ficha-section-title">Como aumentar</div><p>${d.up}</p>
      <div class="ficha-section-title">Como diminuir</div><p>${d.down}</p>
      <div class="ficha-section-title">O que influencia</div><p>${d.affects}</p>`;
    el('infoModalOverlay').classList.remove('hidden');
  }, true);
  el('infoModalClose').addEventListener('click', () => el('infoModalOverlay').classList.add('hidden'));
  el('infoModalOverlay').addEventListener('click', (e) => { if (e.target === el('infoModalOverlay')) el('infoModalOverlay').classList.add('hidden'); });

  let toastTimer = null;
  function showToast(message) {
    const toast = el('tickToast');
    toast.textContent = message;
    toast.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.add('hidden'), 3200);
  }

  // ==============================================================
  // TOPBAR: recursos, tempo, notificacoes
  // ==============================================================
  function renderResourceStrip() {
    const res = state.kingdom.resources;
    const strip = el('resourceStrip');
    strip.innerHTML = RESOURCE_META
      .filter(r => r.core || res[r.key] > 0)
      .map(r => `<div class="resource-chip" data-resource="${r.key}" title="${r.label}: ${fmt(res[r.key])} — clique para detalhes">${r.icon} <span class="amt">${fmt(res[r.key])}</span></div>`)
      .join('');
    strip.querySelectorAll('[data-resource]').forEach((chip) => {
      chip.addEventListener('click', () => {
        if (!dragged) openResourceModal(chip.dataset.resource);
      });
    });
  }

  // arrastar a barra de recursos com mouse (alem do scroll nativo/touch)
  let dragged = false;
  (function enableDragScroll() {
    const strip = el('resourceStrip');
    let isDown = false, startX = 0, scrollLeft = 0;
    strip.addEventListener('mousedown', (e) => {
      isDown = true; dragged = false;
      startX = e.pageX - strip.offsetLeft;
      scrollLeft = strip.scrollLeft;
    });
    window.addEventListener('mouseup', () => { isDown = false; });
    strip.addEventListener('mouseleave', () => { isDown = false; });
    strip.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - strip.offsetLeft;
      const walk = x - startX;
      if (Math.abs(walk) > 4) dragged = true;
      strip.scrollLeft = scrollLeft - walk;
    });
  })();

  el('resScrollLeft').addEventListener('click', () => { el('resourceStrip').scrollBy({ left: -200, behavior: 'smooth' }); });
  el('resScrollRight').addEventListener('click', () => { el('resourceStrip').scrollBy({ left: 200, behavior: 'smooth' }); });

  function renderBuildersChip() {
    const b = state.buildersInfo;
    const chip = el('buildersChip');
    chip.textContent = `🔨 ${fmt(b.available)}/${fmt(b.capacity)}`;
    chip.title = `Construtores: mão de obra usada para ERGUER construções (diferente dos trabalhadores que operam construções já prontas). ${fmt(b.available)} disponíveis de ${fmt(b.capacity)} no total — ${fmt(b.occupied)} estão ocupados em obras neste momento. Construa uma Oficina de Construção, Guilda dos Construtores ou Academia de Arquitetura para aumentar esse número e também o limite de obras simultâneas.`;
    chip.style.cursor = 'help';
  }
  el('buildersChip').addEventListener('click', () => {
    const b = state.buildersInfo;
    showToast(`🔨 Construtores erguem NOVAS construções (trabalhadores operam as prontas). Você tem ${fmt(b.available)}/${fmt(b.capacity)} livres — construa Oficina de Construção, Guilda dos Construtores ou Academia de Arquitetura para ter mais.`);
  });

  const REWARD_ICON = { gold: ['💰', 'ouro'], food: ['🌾', 'comida'], wood: ['🌳', 'madeira'], stone: ['🧱', 'pedra'], iron: ['⛏️', 'ferro'], coal: ['⚫', 'carvão'], copper: ['🟠', 'cobre'], silver: ['⚪', 'prata'], marble: ['🏛️', 'mármore'], crystals: ['💎', 'cristais'], mana: ['🔮', 'mana'] };
  function rewardText(r) { const parts = Object.entries(r || {}).filter(([key, v]) => REWARD_ICON[key] && v).map(([key, v]) => `${REWARD_ICON[key][0]} ${v} de ${REWARD_ICON[key][1]}`); return parts.length ? parts.join(' + ') : '💰 0 ouro'; }
  const PV_ICON = { gold: '💰', food: '🌾', wood: '🌳', stone: '🧱', iron: '⛏️', coal: '⚫', crystals: '💎', mana: '🔮', happiness: '😊', stability: '🛡️', population: '👥' };
  const pvChips = (e) => Object.entries(e || {}).filter(([, v]) => v).map(([key, v]) => `<span class="pv ${v > 0 ? 'up' : 'down'}">${v > 0 ? '+' : '−'}${Math.abs(Math.round(v * 10) / 10)} ${PV_ICON[key] || key}</span>`).join('') || '<span class="pv">sem custo nem ganho</span>';
  function previewHtml(o) { const p = o.preview; if (!p) return ''; if (o.minigame && p.tiers) return `<div class="opt-prev">🎮 Depende do seu desempenho — fraco: ${pvChips(p.tiers.fraco)} · bom: ${pvChips(p.effect)} · mestre: ${pvChips(p.tiers.mestre)}</div>`; if (p.chance != null) return `<div class="opt-prev">🎲 <b>${p.chance}%</b> de dar certo${p.luck ? ` <i title="A sorte do reino compensa sequências de azar ou de sorte">(base ${p.baseChance}% ${p.luck > 0 ? '+' : '−'} sorte do reino ${Math.abs(p.luck)}%)</i>` : ''}: ${pvChips(p.effect)} · se falhar: ${pvChips(p.failure)}</div>`; return `<div class="opt-prev">${pvChips(p.effect)}</div>`; }
  function renderTimeDisplay() {
    const k = state.kingdom;
    el('timeSeasonIcon').textContent = SEASON_ICON[k.season] || '🌱';
    el('timeText').textContent = k.monthName ? `${k.dayOfMonth} de ${k.monthName} · ${k.seasonLabel} · Ano ${k.year}` : `Dia ${k.day} · ${k.seasonLabel} · Ano ${k.year}`;
    const td = el('timeDisplay'); if (td && k.monthName) { td.title = `Dia ${k.day} do reino · dia ${k.seasonDay} de 100 da estação (faltam ${k.daysLeftInSeason})\n${(k.seasonNotes || []).join('\n')}\n(clique para ver o calendário)`; td.style.cursor = 'pointer'; }
  }

  function renderNotifDropdown() {
    const { notifications, unreadCount } = state.notifications;
    el('notifBadge').textContent = unreadCount > 99 ? '99+' : unreadCount;
    el('notifBadge').classList.toggle('hidden', unreadCount === 0);
    el('notifList').innerHTML = notifications.length
      ? notifications.map(n => { const panel = guessNotifPanel(n.message); return `
          <div class="notif-item ${n.is_read ? '' : 'unread'} ${panel ? 'notif-clickable' : ''}" ${panel ? `data-notifpanel="${panel}"` : ''}>
            <span class="n-icon">${n.icon}</span>
            <div><span class="n-day">DIA ${n.day}</span>${escapeHtml(n.message)}</div>
          </div>
        `; }).join('')
      : '<p class="hint" style="padding:14px;">Nenhuma notificação ainda.</p>';
    el('notifList').querySelectorAll('[data-notifpanel]').forEach(item => {
      item.addEventListener('click', () => { goToPanel(item.dataset.notifpanel); notifOpen = false; el('notifDropdown').classList.add('hidden'); });
    });
  }

  let notifOpen = false;
  el('notifBell').addEventListener('click', () => {
    notifOpen = !notifOpen;
    el('notifDropdown').classList.toggle('hidden', !notifOpen);
  });
  document.addEventListener('click', (e) => {
    if (notifOpen && !e.target.closest('.notif-wrap')) {
      notifOpen = false;
      el('notifDropdown').classList.add('hidden');
    }
  });
  el('markReadBtn').addEventListener('click', async () => {
    await Api.markNotificationsRead();
    state.notifications = await Api.getNotifications();
    renderNotifDropdown();
  });

  // ==============================================================
  // TEMPO: avancar dias (stepper -1 a 30 + botao rapido +7)
  // ==============================================================
  const daysInput = el('daysInput');
  function clampDays(v) { return Math.max(1, Math.min(30, Math.round(v) || 1)); }
  el('dayMinusBtn').addEventListener('click', () => { daysInput.value = clampDays(Number(daysInput.value) - 1); });
  el('dayPlusBtn').addEventListener('click', () => { daysInput.value = clampDays(Number(daysInput.value) + 1); });
  daysInput.addEventListener('change', () => { daysInput.value = clampDays(Number(daysInput.value)); });

  async function advance(days) {
    el('advanceBtn').disabled = true;
    el('advance7Btn').disabled = true;
    el('advance30Btn').disabled = true;
    try {
      const result = await Api.advanceTime(days);
      showToast(`⏳ Dia ${result.day} — ${result.dayOfMonth ? result.dayOfMonth + ' de ' + result.monthName + ', ' : ''}${result.seasonLabel}, Ano ${result.year} (${result.notifications.length} novidade${result.notifications.length === 1 ? '' : 's'})`);
      await refreshAll();
    } catch (err) {
      showToast(`⚠️ ${err.message}`);
    } finally {
      el('advanceBtn').disabled = false;
      el('advance7Btn').disabled = false;
      el('advance30Btn').disabled = false;
    }
  }
  el('advanceBtn').addEventListener('click', () => advance(clampDays(Number(daysInput.value))));
  el('advance7Btn').addEventListener('click', () => advance(7));
  el('advance30Btn').addEventListener('click', () => advance(30));

  // ==============================================================
  // CABECALHO DO REINO + BEM-ESTAR + CAPITAL VISUAL (Painel)
  // ==============================================================
  function darken(hex, amount = 0.45) {
    const num = parseInt(hex.replace('#', ''), 16);
    let r = (num >> 16) & 255, g = (num >> 8) & 255, b = num & 255;
    r = Math.round(r * (1 - amount)); g = Math.round(g * (1 - amount)); b = Math.round(b * (1 - amount));
    return `#${[r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')}`;
  }
  function patternStyle(pattern, color) {
    const dark = darken(color, 0.5);
    switch (pattern) {
      case 'stripes': return `background-image: repeating-linear-gradient(90deg, ${dark} 0 10px, transparent 10px 20px);`;
      case 'diagonal': return `background-image: linear-gradient(135deg, transparent 42%, ${dark} 42% 58%, transparent 58%);`;
      case 'chevron': return `background-image: linear-gradient(45deg, ${dark} 25%, transparent 25% 50%, ${dark} 50% 75%, transparent 75%); background-size: 24px 24px;`;
      default: return '';
    }
  }

  function renderHeader() {
    const k = state.kingdom;
    const cloth = el('khCloth');
    cloth.setAttribute('style', `background:${k.banner.background || k.color};` + patternStyle(k.banner.pattern, k.banner.background || k.color));
    { const dv = k.banner.division, c1 = k.banner.background || k.color, c2 = k.banner.background2; if (dv && dv !== 'inteira' && c2) { /* Etapa 92: bandeira de duas cores */ cloth.style.backgroundImage = dv === 'metade' ? `linear-gradient(90deg, ${c1} 50%, ${c2} 50%)` : dv === 'faixa' ? `linear-gradient(180deg, ${c1} 0 33%, ${c2} 33% 67%, ${c1} 67%)` : dv === 'diagonal' ? `linear-gradient(135deg, ${c1} 50%, ${c2} 50%)` : `conic-gradient(${c1} 0 25%, ${c2} 0 50%, ${c1} 0 75%, ${c2} 0)`; cloth.style.backgroundSize = ''; } }
    el('khSymbol').textContent = k.banner.symbol;
    el('khName').textContent = `Reino de ${k.name}`;
    el('khSub').textContent = `Governado por ${k.rulerName} · Capital: ${k.capital?.name || '—'}${k.identity && k.identity.dynasty ? ' · Dinastia ' + k.identity.dynasty : ''}`; if (k.identity && k.identity.motto) el('khSub').title = '“' + k.identity.motto + '”';
    el('khTags').innerHTML = `
      <span class="kh-tag">${k.governmentIcon || '🏛️'} ${k.governmentLabel}</span>
      <span class="kh-tag">🛡️ Estabilidade ${k.stability}%</span>
      <span class="kh-tag">😊 Felicidade ${k.happiness}%</span>
      <span class="kh-tag">${TERRAIN_ICON[k.territory?.terrain] || ''} ${TERRAIN_LABEL[k.territory?.terrain] || ''}</span>
    `;
    const govDef = state.governmentsCatalog.find(g => g.key === k.government);
    el('khTraits').innerHTML = govDef
      ? govDef.traits.map(t => `<span class="kh-trait">${escapeHtml(t)}</span>`).join('')
      : '';
  }

  function renderOverview() {
    const k = state.kingdom;
    const rows = [
      ['Nome do Reino', k.name],
      ['Governante', k.rulerName],
      ['Capital', `${k.capital?.name} (nível ${k.capital?.level})`],
      ['Governo', k.governmentLabel],
      ['População total', fmt(state.population?.total ?? k.population?.total ?? 0)],
      ['Construções ativas', state.buildings.filter(b => b.status === 'active').length],
      ['Dia atual', `${k.day} (${k.dayOfMonth ? k.dayOfMonth + ' de ' + k.monthName + ', ' : ''}${k.seasonLabel}, Ano ${k.year})`],
      ['Fundado em', new Date(k.createdAt.replace(' ', 'T') + 'Z').toLocaleDateString('pt-BR')],
    ];
    el('overviewList').innerHTML = rows.map(([label, v]) => `
      <div class="kv-row"><dt class="k">${label}</dt><dd class="v">${typeof v === 'string' ? escapeHtml(v) : v}</dd></div>
    `).join('');
  }

  function renderWellbeing() {
    const k = state.kingdom;
    const pop = state.population;
    const unemployedPct = pop && pop.total ? Math.round((pop.unemployed / pop.total) * 100) : 0;
    el('wellbeingMini').innerHTML = `
      <div class="wellbeing-row">
        <div class="wellbeing-row-head" data-explain="happiness" tabindex="0" title="Passe o mouse para ver de onde vem este número"><span>😊 Felicidade ${infoBtn('happiness')}</span><span>${k.happiness}%</span></div>
        <div class="wellbeing-track"><div class="wellbeing-fill happy" style="width:${k.happiness}%"></div></div>
      </div>
      <div class="wellbeing-row">
        <div class="wellbeing-row-head" data-explain="stability" tabindex="0" title="Passe o mouse para ver de onde vem este número"><span>🛡️ Estabilidade ${infoBtn('stability')}</span><span>${k.stability}%</span></div>
        <div class="wellbeing-track"><div class="wellbeing-fill stable" style="width:${k.stability}%"></div></div>
      </div>
      <p class="wellbeing-note">
        ${pop ? `👥 ${fmt(pop.total)} habitantes · ${fmt(pop.unemployed)} de mão de obra ociosa (${unemployedPct}%) · 🏠 capacidade ${fmt(pop.housingCapacity)}` : ''}
      </p>
    `;
  }

  function renderCapitalGrid() {
    const grid = el('capitalGrid');
    if (!state.buildings.length) {
      grid.innerHTML = '';
      el('capitalCaption').textContent = 'Construa para ver sua capital crescer.';
      return;
    }
    const sorted = [...state.buildings].sort((a, b) => a.positionIndex - b.positionIndex);
    grid.innerHTML = sorted.map(b => `
      <div class="capital-tile ${b.status !== 'active' ? 'pending' : ''}" title="${escapeHtml(b.name)} (nível ${b.level || '—'})">
        ${b.icon}
        ${b.level > 0 ? `<span class="lvl">Lv${b.level}</span>` : ''}
      </div>
    `).join('');
    el('capitalCaption').textContent = `${state.buildings.filter(b => b.status === 'active').length} construções ativas, ${state.buildings.filter(b => b.daysRemaining > 0).length} em andamento.`;
  }

  // ==============================================================
  // MAPA (territorio + mapa completo)
  // ==============================================================
  function renderMiniMap(territories, mapCols) {
    const grid = el('miniMapGrid');
    const capital = state.kingdom.territory;
    const WINDOW = 10; const size = WINDOW * 2 + 1;
    const cols = mapCols || (territories.length ? Math.max(...territories.slice(0, 400).map(t => t.col)) + 1 : size);
    const at = (r, c) => (r < 0 || c < 0 || c >= cols ? null : territories[r * cols + c] || null);
    const r0 = capital ? capital.row - WINDOW : 0, c0 = capital ? capital.col - WINDOW : 0;
    grid.style.gridTemplateColumns = `repeat(${size}, 16px)`;
    grid.style.gridAutoRows = '16px';
    const parts = [];
    for (let dr = 0; dr < size; dr++) for (let dc = 0; dc < size; dc++) {
      const t = at(r0 + dr, c0 + dc);
      if (!t) { parts.push('<div class="territory-cell" style="visibility:hidden"></div>'); continue; } // fora do mundo: espaco vazio, sem deslocar a grade
      const fogged = t.terrain === 'desconhecido';
      const cls = ['territory-cell', `terrain-${t.terrain}`, fogged ? 'fog' : '', t.isMine ? 'owned-mine' : (t.owned ? (t.isAi ? 'owned-ai' : 'owned-other') : ''), t.river ? 'river' : ''].filter(Boolean).join(' ');
      const color = t.kingdomColor || (t.isMine ? '#ecc85f' : null);
      const own = t.owned && color ? ` data-own="1" style="--ai-color:${color};--own-tint:${hexTint(color, t.isMine ? 0.3 : 0.22)};"` : '';
      const icon = t.city ? (t.city.capital ? '🏰' : CITY_ICONS[Math.min(4, Math.max(0, (t.city.level || 1) - 1))]) : (t.site ? t.site.icon : (TERRAIN_ICON[t.terrain] || ''));
      const title = fogged ? 'Desconhecida' : t.city ? `${t.city.name} (${t.city.capital ? 'capital' : 'cidade'})` : (t.isAi ? t.kingdomName + ' — ' + TERRAIN_LABEL[t.terrain] : TERRAIN_LABEL[t.terrain]);
      parts.push(`<div class="${cls}" title="${escapeHtml(title)}"${own}>${icon}</div>`);
    }
    grid.innerHTML = parts.join('');
    el('miniMapCaption').textContent = capital
      ? `Mostrando a região ao redor da sua capital (${TERRAIN_LABEL[capital.terrain].toLowerCase()}, marcada com 🏰); cidades aparecem como 🏡🏘️🏙️🌆🌇 conforme o nível. Veja o mapa completo na aba Mapa.`
      : '';
  }

  // ---- Etapa 24: camadas visuais do mapa (diplomacia, sancoes/fronteiras, magia) ----
  const LAYER_LEGENDS = {
    diplomacia: [['#2e9e4f', 'Aliado'], ['#8fcf6f', 'Amigável'], ['#9a9a9a', 'Neutro'], ['#e0a030', 'Desconfiado'], ['#c0392b', 'Em guerra / hostil'], ['🏛️', 'Embaixada']],
    sancoes: [['#7a1f2b', 'Reino sancionado por você'], ['#e0a030', 'Disputa de fronteira pendente'], ['#9a9a9a', 'Sem sanção']],
    magia: [['🔮', 'Local mágico conhecido'], ['🐗', 'Clareira das Bestas'], ['🐙', 'Clareira dos Monstros Marinhos']],
    religiao: [['⛪', 'Templo / local sagrado conhecido'], ['#777777', 'Reino de fé desconhecida']],
    rotas: [['#d9a441', 'Rota por terra (estrada ou caminho)'], ['#3f8fd9', 'Rota por mar'], ['#4ec9d6', 'Rota por rio ou canal'], ['#c79be0', 'Rota aérea (tracejada)'], ['#8a4fd8', 'Teletransporte (tracejada)'], ['#999999', 'Rota pausada'], ['🕸️', 'Conspiração conhecida (onde moram os conspiradores)']],
    infra: [['#8b6b3f', 'Estrada de terra'], ['#b0b0b0', 'Pavimentada'], ['#d9a441', 'Comercial'], ['#6b4fa3', 'Real'], ['#2f2f2f', 'Ferrovia'], ['🌉', 'Ponte'], ['🕳️', 'Túnel'], ['⚓', 'Porto'], ['📦', 'Instalação'], ['#3f8fd9', 'Canal'], ['#c0392b', 'Estrada em mau estado']],
  };
  LAYER_LEGENDS.normal = [['🏰', 'Capital'], ['🏡', 'Suas cidades (🏡🏘️🏙️🌆🌇 conforme o nível)'], ['#ecc85f', 'Fronteira do seu reino'], ['🌊', 'Rio (faixa azul)'], ['❓', 'Região desconhecida']];
  async function loadOverlays() {
    try { state.mapOverlays = await Api.getMapOverlays(); } catch { state.mapOverlays = { routes: [], conspiracies: [] }; }
    state.mapOverlaysAt = Date.now();
  }
  const ROUTE_COLORS = { direto: '#d9a441', capital: '#d9a441', mar: '#3f8fd9', rio: '#4ec9d6', canal: '#4ec9d6', ar: '#c79be0', magia: '#8a4fd8' };
  function applyMapLayer() {
    if (!state.mapCells) return;
    const layer = (el('mapLayerSelect') && el('mapLayerSelect').value) || 'normal';
    const legend = el('mapLayerLegend');
    if (legend) {
      legend.style.display = '';
      let legendItems = LAYER_LEGENDS[layer] || [];
      if (layer === 'religiao' && state.religion) legendItems = [...state.religion.religions.filter(r => r.share > 0.5 && r.status !== 'extinta').map(r => [r.color, `${r.name} (${r.share}%)`]), ...legendItems];
      legend.innerHTML = legendItems.map(([c, label]) => `<span>${c.startsWith('#') ? `<i class="sw" style="background:${c}"></i>` : c} ${label}</span>`).join('');
    }
    const dp = state.diplomacy;
    const relByAi = {}; (dp ? dp.relations : []).forEach(r => { relByAi[r.id] = r; });
    const sancAi = new Set((dp ? dp.sanctions : []).filter(s => s.imposedBy === 'jogador').map(s => s.aiName));
    const disputeAi = new Set((dp ? dp.borderDisputes : []).map(b => b.aiId));
    const embassyDone = new Set();
    const overlayIndex = { paths: new Map(), cons: new Map() };
    if (layer === 'rotas') {
      if (!state.mapOverlays || Date.now() - (state.mapOverlaysAt || 0) > 4000) { loadOverlays().then(() => applyMapLayer()); }
      const ov = state.mapOverlays || { routes: [], conspiracies: [] };
      for (const r of ov.routes) {
        const color = r.status === 'pausada' ? '#999999' : (ROUTE_COLORS[r.via] || '#d9a441'); const nm = `${r.from} → ${r.to} (${r.resource}, ${r.via || '?'})`;
        for (const id of r.tiles) { const cur = overlayIndex.paths.get(id) || { color, dashed: r.dashed, names: [] }; cur.names.push(nm); overlayIndex.paths.set(id, cur); }
        for (const id of [r.fromTile, r.toTile]) { const cur = overlayIndex.paths.get(id) || { color, dashed: false, names: [nm] }; cur.end = true; if (!cur.names.includes(nm)) cur.names.push(nm); overlayIndex.paths.set(id, cur); }
      }
      for (const m of ov.conspiracies) overlayIndex.cons.set(m.tileId, m);
    }
    for (const c of state.mapCells) {
      const { cell, t } = c;
      cell.style.background = ''; cell.style.outline = '';
      cell.textContent = c.base;
      if (cell.dataset.t0 !== undefined) { cell.title = cell.dataset.t0; delete cell.dataset.t0; }
      if (layer === 'normal' || t.terrain === 'desconhecido') continue;
      if (layer === 'diplomacia' && t.isAi && t.aiId && relByAi[t.aiId]) {
        const r = relByAi[t.aiId];
        const color = r.atWar ? '#c0392b' : r.hasAlliance ? '#2e9e4f' : r.trust >= 65 ? '#8fcf6f' : r.trust < 35 ? '#e0a030' : '#9a9a9a';
        cell.style.background = color;
        if (r.embassyLevel > 0 && !embassyDone.has(t.aiId)) { embassyDone.add(t.aiId); cell.textContent = '🏛️'; }
      } else if (layer === 'sancoes' && t.isAi) {
        if (sancAi.has(t.kingdomName)) cell.style.background = '#7a1f2b';
        if (t.aiId && disputeAi.has(t.aiId)) cell.style.outline = '2px solid #e0a030';
      } else if (layer === 'religiao' && state.religion) {
        const rl = state.religion;
        if (t.isMine || (t.owned && !t.isAi)) {
          const act = rl.religions.filter(r => r.share > 0 && ['ativa', 'proibida', 'oculta'].includes(r.status));
          const total = act.reduce((s, r) => s + r.share, 0) + rl.atheistShare;
          const hsh = (((t.row >> 2) * 73856093) ^ ((t.col >> 2) * 19349663)) >>> 0;
          let x = (hsh % 10000) / 10000 * total, chosen = null;
          for (const r of act) { x -= r.share; if (x <= 0) { chosen = r; break; } }
          cell.style.background = chosen ? chosen.color : '#777';
          if (rl.tolerance === 'perseguicao' || rl.tolerance === 'restricao') cell.style.outline = '1px dashed #c0392b';
        } else if (t.isAi && t.aiId) {
          const af = rl.aiFaith.find(a => a.aiId === t.aiId);
          cell.style.background = af && af.known ? af.color : '#777';
        }
        if (t.site && ['templo', 'ruina', 'fonte', 'inscricao'].includes(t.site.type)) { cell.style.outline = '2px solid #d9a441'; cell.textContent = '⛪'; }
      } else if (layer === 'infra' && state.infra) {
        if (!state.infraIndex || state.infraIndexRev !== state.infra) {
          const idx = new Map(); const colors = Object.fromEntries(state.infra.catalog.roads.map(r => [r.key, r.color]));
          state.infra.mapTiles.forEach(m => idx.set(m.id, { color: colors[m.type] || '#8b6b3f', cond: m.condition, structure: m.structure }));
          state.infra.mapExtras.ports.forEach(p => { const x = idx.get(p.tid) || {}; idx.set(p.tid, { ...x, port: true }); });
          state.infra.mapExtras.facilities.forEach(f => { const x = idx.get(f.tid) || {}; idx.set(f.tid, { ...x, fac: f.icon }); });
          state.infraIndex = idx; state.infraIndexRev = state.infra;
        }
        const m = state.infraIndex.get(t.id);
        if (m) {
          if (m.color) cell.style.background = m.cond < 35 ? '#c0392b' : m.color;
          if (m.structure) cell.textContent = m.structure === 'tunel' ? '🕳️' : '🌉';
          if (m.port) cell.textContent = '⚓'; else if (m.fac && !m.structure) cell.textContent = m.fac;
          if (m.cond !== undefined && m.cond < 35) cell.style.outline = '1px solid #7a1f2b';
        }
      } else if (layer === 'rotas') {
        const ov = state.mapOverlays; if (!ov) continue;
        const info = overlayIndex.paths.get(t.id); const cons = overlayIndex.cons.get(t.id);
        if (info) { cell.style.background = info.color; cell.textContent = info.dashed ? '┄' : '•'; cell.dataset.t0 = cell.title; cell.title = `${cell.title}\nRota: ${info.names.join(' · ')}`; }
        if (info && info.end) { cell.textContent = c.base; cell.style.outline = `3px solid ${info.color}`; }
        if (cons) { cell.textContent = '🕸️'; cell.style.outline = `3px solid ${cons.threat === 'iminente' || cons.threat === 'alta' ? '#c0392b' : '#e0a030'}`; if (cell.dataset.t0 === undefined) cell.dataset.t0 = cell.title; cell.title = `🕸️ ${cons.conspiracies.join(', ')} — conspiradores conhecidos aqui: ${cons.members.join(', ')} (ameaça ${cons.threat})`; }
      } else if (layer === 'magia') {
        if (t.site && ['portal', 'fenomeno_magico', 'clareira_bestas', 'clareira_monstros_marinhos'].includes(t.site.type)) { cell.style.outline = '2px solid #8a4fd8'; }
        else if (t.terrain === 'magico') { cell.style.outline = '1px solid #8a4fd8'; }
      }
    }
  }
  document.addEventListener('change', (e) => { if (e.target && e.target.id === 'mapLayerSelect') applyMapLayer(); });

  const CITY_ICONS = ['🏡', '🏘️', '🏙️', '🌆', '🌇'];
  const ownerKey = (t) => (t.terrain === 'desconhecido' ? '' : t.isMine ? 'm' : t.isAi ? 'a' + (t.aiId || t.kingdomName) : t.owned ? 'o' : '');
  const hexTint = (hex, a) => { const m = /^#?([0-9a-f]{6})$/i.exec(hex || ''); if (!m) return `rgba(236,200,95,${a})`; const n = parseInt(m[1], 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
  function renderCellInto(c) {
    const t = c.t; const cell = c.cell; const fogged = t.terrain === 'desconhecido';
    const ownedClass = t.isMine ? 'owned-mine' : (t.owned ? (t.isAi ? 'owned-ai' : 'owned-other') : '');
    cell.className = ['territory-cell', `terrain-${t.terrain}`, fogged ? 'fog' : '', ownedClass, t.river ? 'river' : ''].filter(Boolean).join(' ');
    const color = t.kingdomColor || (t.isMine ? '#ecc85f' : null);
    if (t.owned && color) { cell.style.setProperty('--ai-color', color); cell.style.setProperty('--own-tint', hexTint(color, t.isMine ? 0.3 : 0.22)); cell.dataset.own = '1'; } else { delete cell.dataset.own; cell.style.removeProperty('--own-tint'); }
    const icon = t.city ? (t.city.capital ? '🏰' : CITY_ICONS[Math.min(4, Math.max(0, (t.city.level || 1) - 1))]) : (t.site ? t.site.icon : (TERRAIN_ICON[t.terrain] || ''));
    cell.textContent = icon; c.base = icon;
    cell.title = fogged ? 'Região desconhecida' : t.city ? `${t.city.capital ? '👑 Capital' : '🏘️ Cidade'}: ${t.city.name} (${fmt(t.city.pop || 0)} hab.)${t.city.port ? ' ⚓' : ''} — ${TERRAIN_LABEL[t.terrain]}` : (t.isAi ? `${t.kingdomName} — ${TERRAIN_LABEL[t.terrain]}` : t.isMine ? `Seu reino — ${TERRAIN_LABEL[t.terrain]}` : TERRAIN_LABEL[t.terrain]) + (t.river ? ' 🌊 rio' : '');
    c.sig = JSON.stringify([t.terrain, t.owned, t.isMine, t.isAi, t.aiId, t.river, t.site && t.site.icon, t.city && t.city.name, t.city && t.city.level, t.city && t.city.port, t.kingdomColor]);
  }
  // fronteiras NATURAIS: so as bordas entre donos diferentes recebem linha (nada de grade em cada regiao)
  function paintBorders(rowsHint) {
    const cells = state.mapCells; const cols = state.mapCols; if (!cells || !cols) return;
    const at = (r, c) => (r < 0 || c < 0 || c >= cols ? null : cells[r * cols + c]);
    for (let i = 0; i < cells.length; i++) {
      const me = cells[i]; const k = ownerKey(me.t);
      if (!k) { if (me.cell.style.boxShadow) me.cell.style.boxShadow = ''; continue; }
      const r = Math.floor(i / cols), c = i % cols; const col = me.t.kingdomColor || (me.t.isMine ? '#ecc85f' : '#7a2020'); const sh = [];
      const edge = (n, css) => { if (!n || ownerKey(n.t) !== k) sh.push(css.replace('COLOR', col)); };
      edge(at(r - 1, c), 'inset 0 3px 0 0 COLOR'); edge(at(r + 1, c), 'inset 0 -3px 0 0 COLOR'); edge(at(r, c - 1), 'inset 3px 0 0 0 COLOR'); edge(at(r, c + 1), 'inset -3px 0 0 0 COLOR');
      me.cell.style.boxShadow = sh.join(',');
    }
  }
  async function getWorldMap(force) {
    if (!force && state.latestMap && Date.now() - state.latestMapAt < 3000) return { territories: state.latestMap, cols: state.mapCols };
    const m = await Api.getMap(); state.latestMap = m.territories; state.latestMapAt = Date.now(); state.mapCols = m.cols; return m;
  }
  let miniRefreshing = false;
  async function refreshMiniMap() {
    if (miniRefreshing || !state.kingdom) return; miniRefreshing = true;
    try { const m = await getWorldMap(true); renderMiniMap(m.territories, m.cols); } catch { /* mantem */ } finally { miniRefreshing = false; }
  }
  let mapRefreshing = false, lastMapRefresh = 0;
  async function refreshMapData(force) {
    if (!state.fullMapLoaded || mapRefreshing) return;
    if (!force && Date.now() - lastMapRefresh < 2500) return;
    mapRefreshing = true;
    try {
      const { territories } = await getWorldMap(force);
      let changed = 0;
      territories.forEach((t, i) => {
        const c = state.mapCells[i]; if (!c) return;
        const sig = JSON.stringify([t.terrain, t.owned, t.isMine, t.isAi, t.aiId, t.river, t.site && t.site.icon, t.city && t.city.name, t.city && t.city.level, t.city && t.city.port, t.kingdomColor]);
        if (c.sig !== sig) { c.t = t; renderCellInto(c); changed++; }
      });
      state.allTerritories = territories;
      if (changed) { paintBorders(); applyMapLayer(); }
    } catch { /* mantem o mapa atual */ }
    finally { mapRefreshing = false; lastMapRefresh = Date.now(); state.mapDirty = false; }
  }
  async function loadFullMap() {
    if (state.fullMapLoaded) return;
    const grid = el('fullMapGrid');
    grid.innerHTML = '<p style="padding:16px;">Desenhando o mapa do mundo…</p>';
    try {
      const { territories, cols } = await Api.getMap();
      state.allTerritories = territories; state.mapCols = cols;
      if (localStorage.getItem('kot_map_fast') === '1') { grid.innerHTML = ''; state.mapCells = []; state.fullMapLoaded = true; document.dispatchEvent(new CustomEvent('kot:mapfast')); return; } // Etapa 49: modo rápido (canvas) não cria as ~14 mil divs
      grid.style.display = 'grid';
      if (!state.mapView) state.mapView = MapView.attach(grid.parentElement, grid, { cell: 34 });
      state.mapView.setCols(cols);
      grid.innerHTML = '';
      const cells = [];
      const frag = document.createDocumentFragment();
      territories.forEach((t) => {
        const cell = document.createElement('div'); const c = { cell, t, base: '' };
        renderCellInto(c);
        cell.addEventListener('click', () => showTerritoryInfo(c.t.id));
        frag.appendChild(cell); cells.push(c);
      });
      state.mapCells = cells;
      grid.appendChild(frag);
      state.fullMapLoaded = true;
      paintBorders();
      applyMapLayer();
      const cap = state.kingdom.territory;
      if (cap) state.mapView.centerOn(cap.row, cap.col);
    } catch (err) {
      grid.innerHTML = `<p style="padding:16px;color:#7a1f2b;">${err.message}</p>`;
    }
  }

  el('mapFullscreenBtn').addEventListener('click', () => {
    const panel = el('mapPanelContainer');
    panel.classList.toggle('map-fullscreen');
    el('mapFullscreenBtn').textContent = panel.classList.contains('map-fullscreen') ? '✕ Fechar Tela Cheia' : '⛶ Tela Cheia';
  });

  async function appendInfraTile(id, box) {
    try {
      const t = await Api.getInfraTile(id);
      const lines = [];
      if (t.river) lines.push('🌊 <strong>Região de rio</strong> (estradas cruzam a vau ou por ponte)');
      if (t.road) lines.push(`${t.road.icon} <strong>${escapeHtml(t.road.name)}</strong> · condição ${t.road.condition}% · velocidade ×${t.road.speed} · segurança +${t.road.security} · capacidade ${t.road.capacity}${t.road.structure ? ' · ' + escapeHtml(t.road.structure) : ''}<br><span class="hint">Rota: ${escapeHtml(t.road.routeName || '—')} · manutenção ${t.road.maintPerCycle} ouro/ciclo</span>${t.road.canRepair ? ` <button class="btn btn-secondary btn-sm" data-tilerepair="${t.road.routeId}">🔧 Reparar rota</button>` : ''}`);
      if (t.canal) lines.push(`🌊 <strong>Canal artificial</strong> · condição ${t.canal.condition}%${t.canal.canRepair ? ` <button class="btn btn-secondary btn-sm" data-tilerepair="${t.canal.routeId}">🔧 Limpar canal</button>` : ''}`);
      if (t.city) {
        const c = t.city;
        lines.push(`🏘️ <strong>${escapeHtml(c.name)}</strong>${c.isCapital ? ' (capital)' : ''} · 👥 ${fmt(c.population)}${c.port ? ` · ${c.port.kind === 'rio' ? '🛶' : '⚓'} ${escapeHtml(c.port.name)} (${c.port.status}, casco ${c.port.condition}%)` : ''}${c.connection ? `<br><span class="hint">Até a capital: ${c.connection.reachable ? c.connection.days + ' dias via ' + c.connection.via + ' (cobertura ' + c.connection.coverage + '%)' : '🚫 isolada'}</span>` : ''}${c.facilities.length ? `<br><span class="hint">${c.facilities.map(f => `${f.icon} ${escapeHtml(f.name)} nv.${f.level}${f.status !== 'ativo' ? ' (' + f.status + ')' : ''}`).join(' · ')}</span>` : ''}${c.urban && c.urban.congestion ? `<br><span class="hint">🚦 congestionamento ${c.urban.congestion}%</span>` : ''}`);
      }
      if (t.foreign) lines.push(`🌍 <strong>${escapeHtml(t.foreign.name)}</strong>${t.foreign.infraLevel !== null ? ` · desenvolvimento ${t.foreign.infraLevel} (${escapeHtml(t.foreign.strategy || '')})` : ' · infraestrutura desconhecida'}${t.foreign.toll ? ` · ⚠️ pedágio ${t.foreign.toll}%` : ''}${t.foreign.blocked ? ' · 🚧 bloqueio' : ''}`);
      if (t.disaster) lines.push(`⚠️ <span class="hint">Risco de: ${escapeHtml(t.disaster)}</span>`);
      if (t.value !== null) lines.push(`💎 <span class="hint">Valor do território: ${t.value}</span>`);
      (t.notes || []).forEach(n => lines.push(`<span class="hint">${escapeHtml(n)}</span>`));
      if (!lines.length) return;
      const div = document.createElement('div'); div.className = 'infra-tile-panel'; div.style.cssText = 'margin-top:8px;padding:8px;border-top:1px dashed var(--wood-light);';
      div.innerHTML = `<div class="ficha-section-title">🛣️ Infraestrutura da região</div>${lines.map(l => `<div style="margin:3px 0;">${l}</div>`).join('')}`;
      box.appendChild(div);
      div.querySelectorAll('[data-tilerepair]').forEach(b => b.addEventListener('click', async () => {
        try { const r = await Api.repairRoute(Number(b.dataset.tilerepair)); showToast(`🔧 ${r.message}`); await refreshAll(true); showTerritoryInfo(id); } catch (err) { showToast(`⚠️ ${err.message}`); }
      }));
    } catch { /* regiao sem dados de infraestrutura */ }
  }
  async function showTerritoryInfo(id) {
    const box = el('territoryInfoBox');
    box.textContent = 'Consultando exploradores…';
    try {
      const t = await Api.getTerritoryDetail(id);
      if (t.terrain === 'desconhecido') {
        box.innerHTML = `<strong>❓ Região desconhecida</strong> — linha ${t.row + 1}, coluna ${t.col + 1}<br>
          Nenhuma expedição chegou perto o suficiente para saber o que existe aqui.
          <div class="territory-actions"><button class="btn btn-primary" id="quickExpedBtn" data-territory="${t.id}">🧭 Organizar Expedição até aqui</button></div>`;
        document.getElementById('quickExpedBtn').addEventListener('click', () => openQuickExpedition(t.id));
        return;
      }
      const resourcesHtml = t.resources.length
        ? t.resources.map(r => r.icon).join(' ')
        : 'nenhum recurso notável';
      const knowledgeHtml = `<div class="hint">${KNOWLEDGE_ICON[t.knowledge]} Conhecimento: ${escapeHtml(t.knowledgeInfo.name)}${t.explorationSite ? ` · ${t.explorationSite.icon} ${escapeHtml(t.explorationSite.typeName || 'Estrutura misteriosa')}${t.explorationSite.status === 'investigado' ? ' (investigado)' : ' (não investigado — envie uma expedição)'}` : ''}</div>`;

      let ownerHtml;
      if (t.isMine) {
        ownerHtml = `Este território pertence ao seu reino, governado por ${escapeHtml(state.kingdom.rulerName)}.`;
      } else if (t.isAi) {
        ownerHtml = `Ocupado pelo <strong>${escapeHtml(t.kingdomName)}</strong> ${t.personality ? `(${escapeHtml(t.personality)})` : ''}. Ações diplomáticas e militares completas chegarão em uma etapa futura.
          <div class="territory-actions">
            <button class="btn btn-secondary" id="negotiateBtn" data-territory="${t.id}">🤝 Negociar Compra por 💰 ${fmt(t.negotiateCost)}</button>
            <button class="btn btn-ghost" disabled title="Disponível em uma etapa futura">⚔️ Declarar Guerra</button>
          </div>`;
      } else if (t.terrain === 'oceano') {
        ownerHtml = `🌊 Águas abertas: não podem ser reivindicadas. Use portos e navios (aba Infraestrutura) para explorar e comerciar pelo mar.`;
      } else if (t.owned) {
        ownerHtml = `Ocupado pelo reino de <strong>${escapeHtml(t.kingdomName)}</strong>.`;
      } else if (t.knowledge < 3) {
        ownerHtml = `Território livre, mas ainda pouco conhecido — mapeie melhor (nível 3+) antes de reivindicar.
          <div class="territory-actions"><button class="btn btn-secondary" id="quickExpedBtn" data-territory="${t.id}">🧭 Organizar Expedição</button></div>`;
      } else {
        ownerHtml = `Nenhum reino reivindicou esta região ainda.
          <div class="territory-actions">
            <button class="btn btn-primary" id="claimBtn" data-territory="${t.id}">🗺️ Reivindicar por 💰 ${fmt(t.claimCost || 0)}</button>
            <button class="btn btn-ghost" id="quickExpedBtn" data-territory="${t.id}">🧭 Expedição</button>
          </div>`;
      }

      box.innerHTML = `
        <strong>${TERRAIN_ICON[t.terrain]} ${TERRAIN_LABEL[t.terrain]}</strong> — linha ${t.row + 1}, coluna ${t.col + 1}<br>
        Recursos da região: ${resourcesHtml} · Fertilidade ${t.fertility}% · Valor estratégico ${t.strategicValue}%<br>
        ${ownerHtml}
        ${knowledgeHtml}
      `;

      appendInfraTile(t.id, box);
      const quickBtn = document.getElementById('quickExpedBtn');
      if (quickBtn) quickBtn.addEventListener('click', () => openQuickExpedition(t.id));
      const claimBtn = document.getElementById('claimBtn');
      if (claimBtn) {
        claimBtn.addEventListener('click', async () => {
          claimBtn.disabled = true;
          claimBtn.textContent = 'Reivindicando…';
          try {
            await Api.claimTerritory(t.id);
            showToast('🗺️ Território reivindicado com sucesso!');
            await refreshAll(true);
            await refreshMapData(true);
            showTerritoryInfo(t.id);
          } catch (err) {
            showToast(`⚠️ ${err.message}`);
            claimBtn.disabled = false;
            claimBtn.textContent = `🗺️ Reivindicar por 💰 ${fmt(t.claimCost)}`;
          }
        });
      }

      const negotiateBtn = document.getElementById('negotiateBtn');
      if (negotiateBtn) {
        negotiateBtn.addEventListener('click', async () => {
          negotiateBtn.disabled = true;
          negotiateBtn.textContent = 'Negociando…';
          try {
            const result = await Api.negotiateTerritory(t.id);
            showToast(result.accepted ? `🤝 ${result.message}` : `🤝 ${result.message}`);
            if (result.accepted) {
              state.fullMapLoaded = false;
              await loadFullMap();
              await refreshAll(true);
              showTerritoryInfo(t.id);
            } else {
              negotiateBtn.disabled = false;
              negotiateBtn.textContent = `🤝 Negociar Compra por 💰 ${fmt(t.negotiateCost)}`;
            }
          } catch (err) {
            showToast(`⚠️ ${err.message}`);
            negotiateBtn.disabled = false;
            negotiateBtn.textContent = `🤝 Negociar Compra por 💰 ${fmt(t.negotiateCost)}`;
          }
        });
      }
    } catch (err) {
      box.textContent = err.message;
    }
  }

  // ==============================================================
  // CONSTRUÇÕES
  // ==============================================================
  function resChipsHtml(obj, cls) {
    return Object.entries(obj || {}).filter(([, v]) => v).map(([res, v]) => {
      const meta = RESOURCE_META.find(r => r.key === res);
      return `<span class="bc-stat ${cls}">${meta?.icon || ''} ${cls === 'cons' ? '−' : '+'}${Math.round(Math.abs(v) * 10) / 10}/dia</span>`;
    }).join('');
  }
  function costChipsHtml(cost) {
    return Object.entries(cost || {}).map(([res, v]) => {
      const meta = RESOURCE_META.find(r => r.key === res);
      return `<span class="bc-cost">${meta?.icon || ''} ${fmt(v)}</span>`;
    }).join('');
  }

  function renderQueue() {
    const inProgress = state.buildings.filter(b => b.daysRemaining > 0);
    const waiting = state.buildings.filter(b => b.isQueued);
    const list = el('queueList');
    const countEl = el('queueCount');
    if (countEl) countEl.textContent = state.buildQueueMax ? `(${inProgress.length}/${state.buildQueueMax} vagas${waiting.length ? `, ${waiting.length} na fila` : ''})` : '';
    if (!inProgress.length && !waiting.length) {
      list.innerHTML = '<p class="hint">Nenhuma construção em andamento.</p>';
      return;
    }
    const waitingHtml = waiting.map(b => `
      <div class="queue-item queue-waiting">
        <span class="q-icon">${b.icon}</span>
        <div class="q-info"><div class="q-name">${escapeHtml(b.name)} (na fila — aguardando vaga de construtores)</div></div>
        <button class="q-cancel" data-cancel="${b.id}">cancelar</button>
      </div>
    `).join('');
    list.innerHTML = waitingHtml + inProgress.map(b => {
      const pct = b.constructionTotalDays ? Math.round(((b.constructionTotalDays - b.daysRemaining) / b.constructionTotalDays) * 100) : 0;
      return `
        <div class="queue-item">
          <span class="q-icon">${b.icon}</span>
          <div class="q-info">
            <div class="q-name">${escapeHtml(b.name)} ${b.level > 0 ? `→ nível ${b.targetLevel}` : '(nova construção)'}</div>
            <div class="q-track"><div class="q-fill" style="width:${pct}%"></div></div>
          </div>
          <span class="q-days">${b.daysRemaining} dia${b.daysRemaining === 1 ? '' : 's'} restante${b.daysRemaining === 1 ? '' : 's'}</span>
          <button class="q-cancel" data-cancel="${b.id}">cancelar</button>
        </div>
      `;
    }).join('');
    list.querySelectorAll('[data-cancel]').forEach(btn => {
      btn.addEventListener('click', async () => {
        btn.disabled = true;
        try {
          await Api.cancelBuilding(btn.dataset.cancel);
          showToast('🚫 Construção cancelada e recursos reembolsados.');
          await refreshAll();
        } catch (err) { showToast(`⚠️ ${err.message}`); btn.disabled = false; }
      });
    });
  }

  function categoryChipsHtml(categories, active, targetId) {
    const all = Object.entries(categories);
    return `
      <button class="category-chip ${active === 'all' ? 'active' : ''}" data-cat="all" data-target="${targetId}">Todas</button>
      ${all.map(([key, label]) => `
        <button class="category-chip ${active === key ? 'active' : ''}" data-cat="${key}" data-target="${targetId}">${label}</button>
      `).join('')}
    `;
  }

  function renderMyBuildings() {
    el('myBuildingsFilter').innerHTML = categoryChipsHtml(state.categories, state.myBuildingsCategory, 'my');
    const built = state.buildings.filter(b => b.level >= 1);
    let filtered = state.myBuildingsCategory === 'all' ? built : built.filter(b => b.category === state.myBuildingsCategory);
    if (state.myBuildingsSearch) {
      const q = state.myBuildingsSearch.toLowerCase();
      filtered = filtered.filter(b => b.name.toLowerCase().includes(q));
    }
    const list = el('myBuildingsList');

    if (!built.length) {
      list.innerHTML = '<p class="hint">Você ainda não concluiu nenhuma construção.</p>';
      return;
    }
    if (!filtered.length) {
      list.innerHTML = '<p class="hint">Nenhuma construção encontrada.</p>';
      return;
    }

    if (!state.bulkUpgradeSelection) state.bulkUpgradeSelection = new Set();
    list.innerHTML = filtered.map(b => `
      <div class="building-card">
        <div class="building-card-head">
          ${b.canUpgrade ? `<input type="checkbox" data-bulkcheck="${b.id}" ${state.bulkUpgradeSelection.has(b.id) ? 'checked' : ''} style="width:18px;height:18px;margin-right:4px;">` : ''}
          <span class="bc-icon">${b.icon}</span>
          <span class="bc-name">${escapeHtml(b.name)}</span>
          <span class="bc-level">Nv. ${b.level}/${b.maxLevel}</span>
        </div>
        <div class="bc-desc">${escapeHtml(b.description)}</div>
        <div class="bc-stats">
          ${resChipsHtml(b.stats.production, 'prod')}
          ${resChipsHtml(b.stats.consumption, 'cons')}
          ${b.stats.maintenance ? `<span class="bc-stat cons">💸 −${b.stats.maintenance}/dia manutenção</span>` : ''}
          ${b.stats.housing ? `<span class="bc-stat prod">🏠 +${b.stats.housing} moradia</span>` : ''}
          ${b.stats.happinessBonus ? `<span class="bc-stat prod">😊 +${b.stats.happinessBonus.toFixed(1)} felicidade</span>` : ''}
          ${b.stats.stabilityBonus ? `<span class="bc-stat prod">🛡️ +${b.stats.stabilityBonus.toFixed(1)} estabilidade</span>` : ''}
        </div>
        ${b.workersRequired > 0 ? `
          <div class="bc-workers">
            👷 <input type="range" min="0" max="${b.workersRequired}" value="${b.workersAssigned}" data-workers="${b.id}">
            <span data-workers-label="${b.id}">${b.workersAssigned}/${b.workersRequired}</span>
          </div>
        ` : ''}
        ${b.isUpgrading
          ? `<div class="bc-upgrading">⏳ Evoluindo para o nível ${b.targetLevel} (${b.daysRemaining} dia${b.daysRemaining === 1 ? '' : 's'})</div>`
          : (b.canUpgrade ? `
            <div class="bc-actions">
              <button class="btn btn-secondary" data-upgrade="${b.id}">Evoluir ${costChipsHtml(b.upgradeCost)} · ${b.upgradeDays}d</button>
            </div>
          ` : (b.level >= b.maxLevel ? '<div class="bc-upgrading">⭐ Nível máximo atingido</div>' : ''))
        }
      </div>
    `).join('');

    list.querySelectorAll('[data-workers]').forEach((input) => {
      input.addEventListener('change', async () => {
        const id = input.dataset.workers;
        const label = list.querySelector(`[data-workers-label="${id}"]`);
        try {
          await Api.assignWorkers(id, Number(input.value));
          if (label) label.textContent = `${input.value}/${input.max}`;
          showToast('👷 Trabalhadores realocados.');
          await refreshAll(true);
        } catch (err) {
          showToast(`⚠️ ${err.message}`);
        }
      });
    });
    list.querySelectorAll('[data-upgrade]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        btn.disabled = true;
        try {
          await Api.upgradeBuilding(btn.dataset.upgrade);
          showToast('🏗️ Evolução iniciada.');
          await refreshAll();
        } catch (err) {
          showToast(`⚠️ ${err.message}`);
          btn.disabled = false;
        }
      });
    });
    list.querySelectorAll('[data-bulkcheck]').forEach((cb) => {
      cb.addEventListener('change', () => {
        const id = Number(cb.dataset.bulkcheck);
        if (cb.checked) state.bulkUpgradeSelection.add(id); else state.bulkUpgradeSelection.delete(id);
        updateBulkUpgradeBar();
      });
    });
    updateBulkUpgradeBar();
  }

  async function updateBulkUpgradeBar() {
    if (!state.bulkUpgradeSelection) state.bulkUpgradeSelection = new Set();
    const ids = [...state.bulkUpgradeSelection];
    el('bulkUpgradeCount').textContent = ids.length;
    const quoteEl = el('bulkUpgradeQuote');
    if (!ids.length) { quoteEl.textContent = ''; return; }
    try {
      const q = await Api.getUpgradeBatchQuote(ids);
      const costHtml = Object.entries(q.totalCost).map(([k, v]) => { const meta = RESOURCE_META.find(r => r.key === k); return `${meta?.icon || ''} ${fmt(Math.round(v))}`; }).join(' · ');
      quoteEl.innerHTML = `Custo total para ${q.count} construção(ões): ${costHtml || '—'}${!q.sufficient ? ` <span class="pop-alert">⚠️ Faltam: ${q.missing.map(m => `${m.need - m.have} ${m.resource}`).join(', ')}</span>` : ' ✅'}`;
    } catch { quoteEl.textContent = ''; }
  }

  el('bulkUpgradeBar').addEventListener('click', (e) => {
    const b = e.target.closest('[data-bulksel]'); if (!b) return;
    const built = state.buildings.filter(x => x.level >= 1 && x.canUpgrade);
    const mode = b.dataset.bulksel;
    if (mode === 'all' || mode === 'available') { state.bulkUpgradeSelection.clear(); built.forEach(x => state.bulkUpgradeSelection.add(x.id)); }
    else if (mode === 'none') state.bulkUpgradeSelection.clear();
    else if (mode === 'category') {
      state.bulkUpgradeSelection.clear();
      built.filter(x => state.myBuildingsCategory === 'all' || x.category === state.myBuildingsCategory).forEach(x => state.bulkUpgradeSelection.add(x.id));
    }
    else if (mode === 'affordable') {
      // selecao gananciosa real: ordena por custo em ouro (menor primeiro) e vai somando
      // enquanto os recursos disponiveis (do reino) ainda cobrirem o total acumulado
      state.bulkUpgradeSelection.clear();
      const available = { ...(state.kingdom && state.kingdom.resources ? state.kingdom.resources : {}) };
      const sorted = [...built].sort((x, y) => (x.upgradeCost?.gold || 0) - (y.upgradeCost?.gold || 0));
      const running = {};
      for (const x of sorted) {
        const cost = x.upgradeCost || {};
        const fits = Object.entries(cost).every(([k, v]) => (running[k] || 0) + v <= (available[k] || 0));
        if (!fits) continue;
        for (const [k, v] of Object.entries(cost)) running[k] = (running[k] || 0) + v;
        state.bulkUpgradeSelection.add(x.id);
      }
      if (!state.bulkUpgradeSelection.size) showToast('⚠️ Nenhuma construção cabe no orçamento atual, nem a mais barata.');
    }
    renderMyBuildings();
  });
  el('bulkUpgradeBtn').addEventListener('click', async () => {
    const ids = [...state.bulkUpgradeSelection];
    if (!ids.length) { showToast('⚠️ Selecione ao menos uma construção.'); return; }
    try {
      const r = await Api.upgradeBatch(ids);
      showToast(`🏗️ ${r.message}`);
      state.bulkUpgradeSelection.clear();
      await refreshAll();
    } catch (err) { showToast(`⚠️ ${err.message}`); }
  });

  const SP_LABEL = { foodPct: (v) => `+${v}% comida`, woodPct: (v) => `+${v}% madeira`, stonePct: (v) => `+${v}% pedra`, ironPct: (v) => `+${v}% ferro`, coalPct: (v) => `+${v}% carvão`, copperPct: (v) => `+${v}% cobre`, silverPct: (v) => `+${v}% prata`, crystalsPct: (v) => `+${v}% cristais`, manaPct: (v) => `+${v}% mana`, goldPct: (v) => `+${v}% ouro`, buildSpeed: (v) => `obras ${v}% mais rápidas`, maintenancePct: (v) => `manutenção ${v}%`, happiness: (v) => `+${v} felicidade`, stability: (v) => `+${v} estabilidade`, growth: (v) => `+${v} crescimento`, knowledgePct: (v) => `+${v}% conhecimento`, health: (v) => `+${v} saúde`, corruption: (v) => `corrupção ${v}` };
  const specialChips = (s) => Object.entries(s.effects).map(([k, v]) => `<span class="bc-stat prod">${escapeHtml((SP_LABEL[k] || ((x) => `${k} ${x}`))(v))}</span>`).join('');
  function renderCatalog() {
    const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V'];
    const tierBtn = (v, label) => `<button type="button" class="cat-chip ${String(state.catalogTier) === String(v) ? 'active' : ''}" data-ctier="${v}">${label}</button>`;
    el('catalogFilter').innerHTML = categoryChipsHtml(state.categories, state.catalogCategory, 'catalog') + `<div class="cat-extra" role="group" aria-label="Filtrar por nível"><span>Nível:</span>${tierBtn('all', 'Todos')}${tierBtn(0, 'Clássicas')}${[1, 2, 3, 4, 5].map((t) => tierBtn(t, 'Tier ' + ROMAN[t])).join('')}<label class="cat-avail"><input type="checkbox" id="catAvail" ${state.catalogOnlyAvail ? 'checked' : ''}> Só liberadas</label></div>`;
    let filtered = state.catalogCategory === 'all' ? state.catalog : state.catalog.filter(b => b.category === state.catalogCategory);
    if (state.catalogTier !== 'all') filtered = filtered.filter(b => (b.tier || 0) === Number(state.catalogTier));
    if (state.catalogOnlyAvail) filtered = filtered.filter(b => !b.locked);
    filtered = filtered.map((b, i) => [b, i]).sort((a, b) => (a[0].tier || 0) - (b[0].tier || 0) || a[1] - b[1]).map(x => x[0]); // clássicas primeiro, depois tier I..V (ordem estável)
    if (state.catalogSearch) {
      const q = state.catalogSearch.toLowerCase();
      filtered = filtered.filter(b => b.name.toLowerCase().includes(q));
    }
    const list = el('catalogList');
    if (!filtered.length) {
      list.innerHTML = '<p class="hint">Nenhuma construção encontrada.</p>';
      return;
    }
    const totalFound = filtered.length; filtered = filtered.slice(0, state.catalogLimit); // renderização sob demanda: com 1.600+ construções, o catálogo aparece em páginas
    list.innerHTML = filtered.map(b => `
      <div class="building-card">
        <div class="building-card-head">
          <span class="bc-icon">${b.icon}</span>
          <span class="bc-name">${escapeHtml(b.name)}${b.tier ? ` <span class="bc-tier t${b.tier}" title="Nível de progressão da construção">Tier ${ROMAN[b.tier]}</span>` : ''}</span>
          <span class="bc-level">Máx. Nv.${b.maxLevel}</span>
        </div>
        <div class="bc-desc">${escapeHtml(b.description)}</div>
        ${b.special ? `<div class="bc-special" title="Bônus único; cresce com o nível e conta uma vez">✨ <strong>Efeito único:</strong> ${escapeHtml(b.special.perk)}<div class="bc-stats">${specialChips(b.special)}</div></div>` : ''}
        ${b.maxLevel > 5 ? `<div class="bc-levels">📈 Evolui até o nível ${b.maxLevel}: a cada nível algo acontece; marcos nos níveis 5, 10…</div>` : ''}
        <div class="bc-stats">
          ${resChipsHtml(b.statsAtLevel1.production, 'prod')}
          ${resChipsHtml(b.statsAtLevel1.consumption, 'cons')}
          ${b.statsAtLevel1.housing ? `<span class="bc-stat prod">🏠 +${b.statsAtLevel1.housing} moradia</span>` : ''}
          ${b.statsAtLevel1.happinessBonus ? `<span class="bc-stat prod">😊 +${b.statsAtLevel1.happinessBonus.toFixed(1)} felicidade</span>` : ''}
          ${b.statsAtLevel1.stabilityBonus ? `<span class="bc-stat prod">🛡️ +${b.statsAtLevel1.stabilityBonus.toFixed(1)} estabilidade</span>` : ''}
          ${b.statsAtLevel1.workersRequired ? `<span class="bc-stat">👷 ${b.statsAtLevel1.workersRequired} trabalhadores</span>` : ''}
        </div>
        <div class="bc-cost" data-costline="${b.key}">${costChipsHtml(b.cost)} <span class="bc-stat">⏳ ${b.buildDays}d</span></div>
        ${b.knowledge ? `<div class="bc-stats"><span class="bc-stat prod">📚 +${b.knowledge} conhecimento/dia</span></div>` : ''}
        ${b.locked
          ? `<div class="bc-upgrading">🔒 Requer a tecnologia: ${escapeHtml(b.requiresTech.name)}</div>`
          : `<div class="qty-stepper">
              <button class="qty-btn" data-qty-dec="${b.key}" type="button">−</button>
              <input class="qty-input" type="number" min="1" max="999" value="1" data-qty-input="${b.key}">
              <button class="qty-btn" data-qty-inc="${b.key}" type="button">+</button>
              <button class="btn btn-ghost qty-max" data-qty-max="${b.key}" type="button">MÁXIMO</button>
            </div>
            <div class="bc-actions"><button class="btn btn-primary" data-build="${b.key}">Construir</button></div>`}
      </div>
    `).join('') + (totalFound > filtered.length ? `<div class="cat-more"><button type="button" class="btn btn-secondary" data-cmore>Mostrar mais (${totalFound - filtered.length} restantes de ${totalFound})</button></div>` : `<p class="hint cat-count">${totalFound} construção(ões)</p>`);

    const qtyOf = (key) => Math.max(1, Math.min(999, Math.round(Number((list.querySelector(`[data-qty-input="${key}"]`) || {}).value) || 1)));
    const setQty = (key, v) => { const inp = list.querySelector(`[data-qty-input="${key}"]`); if (inp) inp.value = Math.max(1, Math.min(999, Math.round(v))); };

    list.querySelectorAll('[data-qty-dec]').forEach(b => b.addEventListener('click', () => setQty(b.dataset.qtyDec, qtyOf(b.dataset.qtyDec) - 1)));
    list.querySelectorAll('[data-qty-inc]').forEach(b => b.addEventListener('click', () => setQty(b.dataset.qtyInc, qtyOf(b.dataset.qtyInc) + 1)));
    list.querySelectorAll('[data-qty-max]').forEach(b => b.addEventListener('click', async () => {
      try {
        const q = await Api.getBatchQuote(b.dataset.qtyMax, 999);
        setQty(b.dataset.qtyMax, Math.max(1, q.maxAffordable));
        showToast(q.maxAffordable > 0 ? `📐 Máximo possível: ${q.maxAffordable} (recursos e ${fmt(q.unemployedAvailable)} desempregados disponíveis).` : '⚠️ Recursos insuficientes até para 1 unidade.');
      } catch (err) { showToast(`⚠️ ${err.message}`); }
    }));

    list.querySelectorAll('[data-build]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const key = btn.dataset.build;
        const qty = qtyOf(key);
        btn.disabled = true;
        try {
          if (qty <= 1) {
            await Api.startConstruction(key);
            showToast('🏗️ Construção iniciada!');
          } else {
            const r = await Api.startConstructionBatch(key, qty);
            showToast(`🏗️ ${r.message}`);
          }
          await refreshAll();
        } catch (err) {
          showToast(`⚠️ ${err.message}`);
        }
        btn.disabled = false;
      });
    });
  }

  document.addEventListener('click', (e) => {
    const chip = e.target.closest('.category-chip');
    if (!chip) return;
    if (chip.dataset.target === 'my') { state.myBuildingsCategory = chip.dataset.cat; renderMyBuildings(); }
    if (chip.dataset.target === 'catalog') { state.catalogCategory = chip.dataset.cat; state.catalogLimit = 60; renderCatalog(); }
    if (chip.dataset.target === 'military') { state.militaryCategory = chip.dataset.cat; renderMilitary(); }
  });

  el('myBuildingsSearch').addEventListener('input', (e) => { state.myBuildingsSearch = e.target.value; renderMyBuildings(); });
  el('catalogSearch').addEventListener('input', (e) => { state.catalogSearch = e.target.value; state.catalogLimit = 60; renderCatalog(); });
  document.addEventListener('click', (e) => { const t = e.target.closest && e.target.closest('[data-ctier], [data-cmore]'); if (!t) return; if (t.dataset.cmore !== undefined) state.catalogLimit += 90; else { state.catalogTier = t.dataset.ctier; state.catalogLimit = 60; } renderCatalog(); });
  document.addEventListener('change', (e) => { if (e.target && e.target.id === 'catAvail') { state.catalogOnlyAvail = e.target.checked; state.catalogLimit = 60; renderCatalog(); } });

  // ==============================================================
  // POPULAÇÃO
  // ==============================================================
  function renderPopulation() {
    const p = state.population;
    if (!p) return;
    const occupancy = p.housing ? p.housing.occupancyPct : (p.housingCapacity ? Math.round((p.total / p.housingCapacity) * 100) : 0);
    el('popSummary').innerHTML = `
      <div class="pop-stat"><div class="ps-label">TOTAL ${infoBtn('population')}</div><div class="ps-value">${fmt(p.total)}</div></div>
      <div class="pop-stat"><div class="ps-label">EMPREGADOS ${infoBtn('employed')}</div><div class="ps-value">${fmt(p.employed)}</div><div class="ps-sub">${p.employmentRate}%</div></div>
      <div class="pop-stat"><div class="ps-label">DESEMPREGADOS ${infoBtn('workers')}</div><div class="ps-value">${fmt(p.unemployed)}</div><div class="ps-sub">${p.unemploymentRate}%</div></div>
      <div class="pop-stat"><div class="ps-label">MORADIA ${infoBtn('housing')}</div><div class="ps-value">${occupancy}%</div></div>
    `;
    if (p.housing) {
      el('housingDetail').innerHTML = `
        ${polBar(Math.min(100, p.housing.occupancyPct))}
        <div class="hint">${fmt(p.housing.occupied)} / ${fmt(p.housing.capacity)} habitantes acomodados · ${fmt(p.housing.vacant)} vagas disponíveis${p.housing.homeless > 0 ? ` · <span class="pop-alert">⚠️ ${fmt(p.housing.homeless)} sem moradia!</span>` : ''}</div>`;
    }
    el('vacanciesHint').textContent = p.vacanciesTotal > 0 ? `⚠️ ${p.vacanciesTotal} vaga(s) de trabalho em aberto em ${p.understaffedCount} construção(ões).` : '✅ Todas as construções com trabalhadores completos.';
    if (p.byCategory) {
      el('byCategoryList').innerHTML = p.byCategory.filter(c => c.required > 0).map(c => `<span class="bc-stat ${c.assigned < c.required ? 'cons' : 'prod'}">${escapeHtml(c.label)}: ${c.assigned}/${c.required}</span>`).join('') || '<span class="hint">Nenhum emprego ainda.</span>';
    }

    if (p.economicClasses) {
      el('economicClasses').innerHTML = p.economicClasses.map(c => `
        <div class="eco-class-row">
          <span class="ec-icon">${c.icon}</span>
          <span class="ec-label">${escapeHtml(c.label)}</span>
          <div class="ec-track"><div class="ec-fill" style="width:${c.percent}%"></div></div>
          <span class="ec-value">${fmt(c.count)} (${c.percent}%)</span>
        </div>
      `).join('');
    }

    const list = el('jobsList');
    if (!p.jobs.length) {
      list.innerHTML = '<p class="hint">Construa algo para começar a empregar seu povo.</p>';
      return;
    }
    const filt = state.jobsFilter || 'all';
    const filtered = p.jobs.filter(j => filt === 'all' ? true : filt === 'full' ? j.workersAssigned >= j.workersRequired : filt === 'empty' ? j.workersAssigned === 0 : j.workersAssigned < j.workersRequired);
    if (!filtered.length) { list.innerHTML = '<p class="hint">Nenhuma construção nesse filtro.</p>'; return; }
    list.innerHTML = filtered.map(j => `
      <div class="job-row">
        <span class="j-icon">${j.icon}</span>
        <div class="j-info">
          <div class="j-name">${escapeHtml(j.buildingName)} <span style="opacity:.6">Nv.${j.level}</span></div>
          <div class="j-profession">${escapeHtml(j.profession)}</div>
        </div>
        <div class="j-controls">
          <input type="range" min="0" max="${j.workersRequired}" value="${j.workersAssigned}" data-jobinput="${j.buildingId}">
          <span class="j-count ${j.workersAssigned < j.workersRequired ? 'j-short' : ''}">${j.workersAssigned}/${j.workersRequired}${j.workersAssigned < j.workersRequired ? ' ⚠️' : ''}</span>
          <span class="j-eff ${j.efficiency < 100 ? 'low' : ''}">${j.efficiency}%</span>
        </div>
      </div>
    `).join('');

    list.querySelectorAll('[data-jobinput]').forEach((input) => {
      input.addEventListener('change', async () => {
        try {
          await Api.assignWorkers(input.dataset.jobinput, Number(input.value));
          showToast('👷 Trabalhadores realocados.');
          await refreshAll(true);
        } catch (err) {
          showToast(`⚠️ ${err.message}`);
        }
      });
    });
  }
  el('jobsFilter').addEventListener('click', (e) => {
    const b = e.target.closest('[data-jobfilter]'); if (!b) return;
    state.jobsFilter = b.dataset.jobfilter;
    el('jobsFilter').querySelectorAll('.category-chip').forEach(c => c.classList.toggle('active', c === b));
    renderPopulation();
  });
  el('reallocateBtn').addEventListener('click', async () => {
    try {
      const r = await Api.reallocateWorkers();
      showToast(`👷 ${r.message}`);
      await refreshAll(true);
    } catch (err) { showToast(`⚠️ ${err.message}`); }
  });

  // ==============================================================
  // EXÉRCITO
  // ==============================================================
  function renderMilitary() {
    const m = state.military;
    if (!m) return;

    el('armySummary').innerHTML = `
      <div class="economy-stat"><div class="es-label">TOTAL DE UNIDADES</div><div class="es-value">⚔️ ${fmt(m.totals.totalUnits)}</div></div>
      <div class="economy-stat expense"><div class="es-label">MANUTENÇÃO/DIA</div><div class="es-value">−💰${fmt(m.totals.upkeepGold)}</div></div>
      <div class="economy-stat"><div class="es-label">ATAQUE TOTAL</div><div class="es-value">🗡️ ${fmt(m.totals.totalAttack)}</div></div>
      <div class="economy-stat"><div class="es-label">DEFESA TOTAL</div><div class="es-value">🛡️ ${fmt(m.totals.totalDefense)}</div></div>
    `;
    if (state.war) {
      const mobLevels = [['normal', 'Normal'], ['alerta', 'Alerta'], ['parcial', 'Mob. Parcial'], ['total', 'Mob. Total']];
      let mobRow = el('mobilizationRow');
      if (!mobRow) { mobRow = document.createElement('div'); mobRow.id = 'mobilizationRow'; mobRow.className = 'tech-controls'; mobRow.style.marginTop = '8px'; el('armySummary').after(mobRow); }
      mobRow.innerHTML = `<span class="hint">📯 Mobilização (reduz custo de recrutamento, mas custa felicidade e produção): </span>${mobLevels.map(([k, l]) => `<button class="category-chip ${state.mobilization === k ? 'active' : ''}" data-mobilize="${k}">${l}</button>`).join('')}`;
      mobRow.querySelectorAll('[data-mobilize]').forEach(b => b.addEventListener('click', async () => {
        try { const r = await Api.setMobilization(b.dataset.mobilize); state.mobilization = b.dataset.mobilize; showToast(`📯 ${r.message}`); await refreshAll(true); }
        catch (err) { showToast(`⚠️ ${err.message}`); }
      }));
    }

    el('armyRoster').innerHTML = m.army.length
      ? m.army.map(u => `
        <div class="job-row">
          <span class="j-icon">${u.icon}</span>
          <div class="j-info">
            <div class="j-name">${escapeHtml(u.name)}</div>
            <div class="j-profession">Experiência: ${u.experience}</div>
          </div>
          <div class="j-controls"><span class="j-count">${fmt(u.quantity)} unidades</span></div>
        </div>
      `).join('')
      : '<p class="hint">Nenhuma unidade recrutada ainda.</p>';

    el('militaryFilter').innerHTML = categoryChipsHtml(m.categories, state.militaryCategory, 'military');
    const filtered = state.militaryCategory === 'all' ? m.catalog : m.catalog.filter(u => u.category === state.militaryCategory);

    el('militaryCatalog').innerHTML = filtered.map(u => `
      <div class="building-card">
        <div class="building-card-head">
          <span class="bc-icon">${u.icon}</span>
          <span class="bc-name">${escapeHtml(u.name)}</span>
          <span class="bc-level">${fmt(u.owned)} recrutado(s)</span>
        </div>
        <div class="bc-desc">${escapeHtml(u.description)}</div>
        <div class="bc-stats">
          <span class="bc-stat">🗡️ Ataque ${u.attack}</span>
          <span class="bc-stat">🛡️ Defesa ${u.defense}</span>
          <span class="bc-stat">🏃 Velocidade ${u.speed}</span>
        </div>
        <div class="bc-cost">${costChipsHtml(u.cost)} <span class="bc-stat">⏳ ${u.recruitDays}d</span></div>
        ${u.unlocked
          ? `<div class="bc-workers"><input type="number" min="1" max="500" value="1" data-recruit-qty="${u.key}" style="width:60px;padding:4px 6px;border-radius:4px;border:1px solid var(--wood-light);">
             <button class="btn btn-primary" data-recruit="${u.key}" style="flex:1;padding:9px 10px;font-size:12px;">Recrutar</button></div>`
          : `<div class="bc-upgrading">🔒 ${u.techLock ? `Requer a tecnologia: ${escapeHtml(u.techLock)}` : `Requer construção ativa: ${escapeHtml(u.requiresBuilding)}`}</div>`}
        <div class="bc-workers" style="margin-top:4px;"><input type="number" min="1" max="200" value="1" data-merc-qty="${u.key}" style="width:60px;padding:4px 6px;border-radius:4px;border:1px solid var(--wood-light);">
          <button class="btn btn-secondary" data-mercenary="${u.key}" style="flex:1;padding:9px 10px;font-size:11.5px;" title="Contratação instantânea, sem exigir construção nem população — só ouro, com sobretaxa">🎖️ Mercenário (instantâneo)</button></div>
      </div>
    `).join('');

    el('militaryCatalog').querySelectorAll('[data-mercenary]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const key = btn.dataset.mercenary;
        const qtyInput = el('militaryCatalog').querySelector(`[data-merc-qty="${key}"]`);
        const qty = Math.max(1, Number(qtyInput.value) || 1);
        btn.disabled = true;
        try {
          const r = await Api.hireMercenary(key, qty);
          showToast(`🎖️ ${r.message}`);
          await refreshAll();
        } catch (err) { showToast(`⚠️ ${err.message}`); }
        btn.disabled = false;
      });
    });
    el('militaryCatalog').querySelectorAll('[data-recruit]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const key = btn.dataset.recruit;
        const qtyInput = el('militaryCatalog').querySelector(`[data-recruit-qty="${key}"]`);
        const qty = Math.max(1, Number(qtyInput.value) || 1);
        btn.disabled = true;
        try {
          await Api.recruitUnit(key, qty);
          showToast('⚔️ Recrutamento concluído.');
          await refreshAll();
        } catch (err) {
          showToast(`⚠️ ${err.message}`);
          btn.disabled = false;
        }
      });
    });
  }

  // ==============================================================
  // CIDADES / ASSENTAMENTOS
  // ==============================================================
  function cityBar(label, v, bad) { return `<div style="margin:2px 0;"><div class="hint" style="display:flex;justify-content:space-between;"><span>${label}</span><span>${Math.round(v)}</span></div><div class="pm-bar" style="height:5px;"><div class="pm-fill" style="width:${Math.max(0, Math.min(100, v))}%;${bad ? 'background:#c0392b;' : ''}"></div></div></div>`; }
  function renderSettlements() {
    const relations = (state.diplomacy && state.diplomacy.relations) || [];
    el('settlementsList').innerHTML = state.settlements.map(s => {
      const sm = s.summary; const tp = state.settlementTypes.find(t => t.key === s.type) || {};
      return `
      <div class="character-card settlement-card settlement-clickable" style="text-align:left;">
        <div data-manage-settlement="${s.id}" data-capital="${s.isCapital ? 1 : 0}" style="cursor:pointer;">
        ${s.isCapital ? '<span class="ch-capital-badge">CAPITAL</span>' : ''}
        ${sm && sm.pendingDecisions ? `<span class="ch-status-badge" style="background:#7a1f2b;color:#fff;">⚠️ ${sm.pendingDecisions} decisão(ões)</span>` : ''}
        <div style="text-align:center;"><span class="ch-icon">${sm ? sm.levelIcon : (tp.icon || '🏘️')}</span><span class="ch-name">${escapeHtml(s.name)}</span><span class="ch-role">${sm ? escapeHtml(sm.levelName) : ''} · ${escapeHtml(tp.name || s.type)}</span></div>
        ${sm && window.KOT.cityDepthUI ? window.KOT.cityDepthUI.cardBadges(sm) : ''}
        <div class="ch-stats" style="justify-content:center;"><span>👥 ${fmt(s.population)}${sm ? '/' + fmt(sm.capacity) : ''}</span><span>${TERRAIN_ICON[s.territory.terrain] || ''} ${TERRAIN_LABEL[s.territory.terrain] || ''}</span>${sm && sm.growth !== null && sm.growth !== undefined ? `<span title="variação diária">${sm.growth > 0 ? '▲' : sm.growth < 0 ? '▼' : '■'} ${sm.growth}</span>` : ''}</div>
        ${sm ? `${cityBar('😊 Felicidade', sm.happiness, sm.happiness < 40)}${cityBar('📈 Prosperidade', sm.prosperity)}${cityBar('🛡️ Segurança', sm.security, sm.security < 30)}` : ''}
        ${s.isCapital ? '<div class="settlement-wealth">💰 Usa o tesouro principal do reino</div>'
          : `<div class="settlement-wealth">💰 ${fmt(s.wealth)} · 🌾 ${sm && sm.foodNet !== null ? (sm.foodNet >= 0 ? '+' : '') + sm.foodNet + '/dia' : '—'}${sm && sm.governor ? ' · 🏛️ ' + escapeHtml(sm.governor) : ' · sem governador'}</div>
             ${s.suitability ? `<div class="settlement-suitability ${s.suitability.multiplier > 1 ? 'good' : (s.suitability.multiplier < 1 ? 'bad' : '')}">${s.suitability.label} ${infoBtn('suitability')}</div>` : ''}`}
        ${sm && sm.alerts ? `<div class="pop-alert" style="margin-top:4px;">⚠️ ${escapeHtml(sm.topAlert || '')}${sm.alerts > 1 ? ` (+${sm.alerts - 1})` : ''}</div>` : ''}
        <span class="hint" style="margin-top:4px;display:block;text-align:center;">Clique para ${s.isCapital ? 'ver' : 'gerenciar'} →</span>
        </div>
        <div class="ficha-section-title" style="margin-top:8px;">🏘️ Diplomacia Municipal ${infoBtn('citypact')}</div>
        ${s.cityPact
          ? `<div class="bc-stats"><span class="bc-stat prod">Pacto com ${escapeHtml(s.cityPact.aiName)}</span></div><button class="btn btn-ghost" data-breakpact="${s.id}" style="margin-top:4px;">Encerrar Pacto</button>`
          : `<div class="tech-controls"><select data-pactai="${s.id}">${relations.map(r => `<option value="${r.id}">${r.symbol} ${escapeHtml(r.name)}</option>`).join('')}</select>
             <button class="btn btn-secondary" data-signpact="${s.id}">Firmar Pacto (💰${(state.diplomacy && state.diplomacy.cityPactCost) || 120})</button></div>`}
      </div>`;
    }).join('');
    document.querySelectorAll('[data-manage-settlement]').forEach((card) => { card.addEventListener('click', () => openManageSettlement(card.dataset.manageSettlement, card.dataset.capital === '1')); });
    document.querySelectorAll('[data-signpact]').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const settlementId = btn.dataset.signpact; const sel = document.querySelector(`[data-pactai="${settlementId}"]`);
        try { const r = await Api.signCityPact(settlementId, sel.value); showToast(`🏘️ ${r.message}`); await refreshAll(true); } catch (err) { showToast(`⚠️ ${err.message}`); }
      });
    });
    document.querySelectorAll('[data-breakpact]').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        try { const r = await Api.breakCityPact(btn.dataset.breakpact); showToast(`🏘️ ${r.message}`); await refreshAll(true); } catch (err) { showToast(`⚠️ ${err.message}`); }
      });
    });
    if (typeof manageOverlay !== 'undefined' && !manageOverlay.classList.contains('hidden') && currentManagedSettlementId) refreshManagedCity();
  }

  // ==============================================================
  // MODAL: GERENCIAR CIDADE (construções, trabalhadores, evolução)
  // ==============================================================
  const manageOverlay = el('manageSettlementOverlay');
  const manageBody = el('manageSettlementBody');
  let currentManagedSettlementId = null;

  let cityTab = 'visao'; let cityCapital = false; let cityRefreshing = false; const cityUi = { selected: null };
  async function openManageSettlement(id, isCapital) {
    currentManagedSettlementId = id; cityCapital = !!isCapital;
    manageOverlay.classList.remove('hidden');
    manageBody.innerHTML = '<p class="hint">Carregando cidade...</p>';
    await refreshManagedCity(true);
  }
  async function refreshManagedCity(first) {
    if (cityRefreshing || !currentManagedSettlementId) return; cityRefreshing = true;
    try {
      const o = await Api.getSettlementOverview(currentManagedSettlementId);
      const d = cityCapital ? null : await Api.getSettlementDetail(currentManagedSettlementId);
      renderManageSettlement(d, o);
    } catch (err) { if (first) manageBody.innerHTML = `<p class="hint" style="color:#7a1f2b;">${err.message}</p>`; }
    finally { cityRefreshing = false; }
  }
  el('manageSettlementClose').addEventListener('click', () => manageOverlay.classList.add('hidden'));
  manageOverlay.addEventListener('click', (e) => { if (e.target === manageOverlay) manageOverlay.classList.add('hidden'); });

  const C_TABS = [['visao', '🏛️ Visão'], ['mapa', '🗺️ Mapa Interno'], ['servicos', '🧰 Serviços'], ['construcoes', '🏗️ Construções'], ['politicas', '⚖️ Políticas'], ['comercio', '🛒 Comércio'], ['pessoas', '👥 Pessoas'], ['estoque', '📦 Estoque'], ['governo', '🏛️ Governo'], ['defesa', '🛡️ Defesa'], ['eventos', '📜 Eventos']];
  function renderManageSettlement(d, o) {
    if (!o) { refreshManagedCity(); return; }
    const tabs = cityCapital ? C_TABS.filter(([k]) => ['visao', 'mapa', 'servicos', 'politicas', 'comercio', 'pessoas', 'eventos'].includes(k)) : C_TABS;
    if (!tabs.some(([k]) => k === cityTab)) cityTab = 'visao';
    const res = d ? d.resources : o.resources;
    const resourceChips = RESOURCE_META.filter(r => r.core || res[r.key] > 0)
      .map(r => `<span class="resource-chip" style="cursor:default;">${r.icon} <span class="amt">${fmt(res[r.key])}</span></span>`).join('');

    const dBuildings = d ? d.buildings : [];
    const builtHtml = dBuildings.length ? dBuildings.map(b => `
      <div class="building-card">
        <div class="building-card-head">
          <span class="bc-icon">${b.icon}</span>
          <span class="bc-name">${escapeHtml(b.name)}</span>
          <span class="bc-level">Nv. ${b.level}/${b.maxLevel}</span>
        </div>
        <div class="bc-desc">${escapeHtml(b.description)}</div>
        <div class="bc-stats">
          ${resChipsHtml(b.stats.production, 'prod')}
          ${resChipsHtml(b.stats.consumption, 'cons')}
        </div>
        ${b.workersRequired > 0 ? `
          <div class="bc-workers">
            👷 <input type="range" min="0" max="${b.workersRequired}" value="${b.workersAssigned}" data-settle-workers="${b.id}">
            <span data-settle-workers-label="${b.id}">${b.workersAssigned}/${b.workersRequired}</span>
          </div>` : ''}
        ${b.isUpgrading
          ? `<div class="bc-upgrading">⏳ Evoluindo (${b.daysRemaining}d restantes)</div>`
          : (b.canUpgrade ? `<div class="bc-actions"><button class="btn btn-secondary" data-settle-upgrade="${b.id}">Evoluir ${costChipsHtml(b.upgradeCost)}</button></div>`
            : (b.level >= b.maxLevel ? '<div class="bc-upgrading">⭐ Nível máximo</div>' : ''))}
        ${b.daysRemaining > 0 ? `<button class="q-cancel" data-settle-cancel="${b.id}">cancelar obra</button>` : ''}
      </div>
    `).join('') : '<p class="hint">Nenhuma construção ainda nesta cidade.</p>';

    const catalog = state.catalog || [];
    const catalogHtml = catalog.map(b => `
      <div class="building-card">
        <div class="building-card-head">
          <span class="bc-icon">${b.icon}</span>
          <span class="bc-name">${escapeHtml(b.name)}</span>
          <span class="bc-level">${b.categoryLabel}</span>
        </div>
        <div class="bc-cost">${costChipsHtml(b.cost)} <span class="bc-stat">⏳ ${b.buildDays}d</span></div>
        ${b.locked ? `<div class="bc-upgrading">🔒 Requer: ${escapeHtml(b.requiresTech.name)}</div>` : `<div class="bc-actions"><button class="btn btn-primary" data-settle-build="${b.key}">Construir</button></div>`}
      </div>
    `).join('');


    const bar = (label, v, bad) => `<div class="ficha-attr-row"><div class="ficha-attr-head"><span>${label}</span><span>${Math.round(v)}</span></div><div class="ficha-attr-track"><div class="ficha-attr-fill" style="width:${Math.max(0, Math.min(100, v))}%;${bad ? 'background:#c0392b;' : ''}"></div></div></div>`;
    const netChips = Object.entries(o.net || {}).filter(([, v]) => Math.abs(v) >= 0.05).map(([k, v]) => { const m = RESOURCE_META.find(r => r.key === k); return `<span class="bc-stat ${v >= 0 ? 'prod' : 'cons'}">${m ? m.icon : k} ${v > 0 ? '+' : ''}${Math.round(v * 10) / 10}/dia</span>`; }).join('') || '<span class="hint">Sem variação relevante.</span>';
    let body = '';
    if (cityTab === 'visao') {
      body = `${o.depth ? window.KOT.cityDepthUI.panorama(o) : ''}${o.alerts.map(a => `<div class="${a.level === 'alta' ? 'pop-alert' : 'hint'}" style="margin:3px 0;">${a.level === 'alta' ? '🔴' : a.level === 'media' ? '🟠' : '🟡'} ${escapeHtml(a.text)}</div>`).join('') || '<div class="hint">✅ Nenhum problema no momento.</div>'}
        <div class="ficha-section-title">Indicadores ${infoBtn('city_stats')}</div><div class="ficha-attrs">${bar('😊 Felicidade', o.stats.happiness, o.stats.happiness < 40)}${bar('⚖️ Estabilidade', o.stats.stability, o.stats.stability < 35)}${bar('🛡️ Segurança', o.stats.security, o.stats.security < 30)}${bar('🩺 Saúde', o.stats.health, o.stats.health < 35)}${bar('📈 Prosperidade', o.stats.prosperity)}</div>
        ${o.nextLevel ? `<div class="ficha-section-title">Crescimento urbano ${infoBtn('city_level')}</div><div class="hint">${o.levelIcon} ${escapeHtml(o.levelName)} → ${escapeHtml(o.nextLevel.name)}: pontuação ${o.nextLevel.score} / ${o.nextLevel.need} (população, construções e serviços)</div>${bar('Progresso', o.nextLevel.pct)}` : `<div class="hint">${o.levelIcon} ${escapeHtml(o.levelName)} — nível máximo.</div>`}
        <div class="ficha-section-title">População</div><div class="bc-stats"><span class="bc-stat">👥 ${fmt(o.population.total)} / ${fmt(o.population.capacity)} vagas</span><span class="bc-stat">💼 ${fmt(o.population.unemployed)} desempregados</span>${o.population.growthPerDay !== null ? `<span class="bc-stat ${o.population.growthPerDay >= 0 ? 'prod' : 'cons'}">${o.population.growthPerDay >= 0 ? '▲' : '▼'} ${o.population.growthPerDay}/dia</span><span class="bc-stat">🚶 ${fmt(o.population.immigrants)} chegaram · ${fmt(o.population.emigrants)} partiram</span>` : ''}${o.queue.max ? `<span class="bc-stat">🏗️ Fila ${o.queue.used}/${o.queue.max}</span>` : ''}</div>
        ${cityCapital ? '' : `<div class="ficha-section-title">Saldo diário</div><div class="bc-stats">${netChips}</div>`}
        ${o.happinessFactors.length ? `<div class="ficha-section-title">Por que a felicidade está assim? ${infoBtn('city_happiness')}</div><div class="bc-stats">${o.happinessFactors.map(f => `<span class="bc-stat ${f.value >= 0 ? 'prod' : 'cons'}">${escapeHtml(f.label)} ${f.value > 0 ? '+' : ''}${f.value}</span>`).join('')}</div>` : ''}
        ${o.governor ? `<div class="hint">🏛️ Governador: <strong>${escapeHtml(o.governor.name)}</strong> (habilidade ${o.governor.skill}%)</div>` : (cityCapital ? '' : '<div class="hint">🏛️ Sem governador — nomeie um na aba Pessoas.</div>')}`;
    } else if (cityTab === 'servicos') {
      body = `<p class="hint">A cobertura mede quanto da necessidade da população cada serviço atende (construções ativas × nível). ${infoBtn('city_services')}</p>
        <div class="pol-laws">${o.services.map(sv => `<div class="pol-law"><div class="pl-head"><span>${sv.icon} <strong>${escapeHtml(sv.name)}</strong></span><span class="bc-level ${sv.coverage < 35 ? 'pop-alert' : ''}">${sv.coverage}%</span></div>${bar('Cobertura', sv.coverage, sv.coverage < 35)}<div class="hint">${escapeHtml(sv.why)} · nível ${sv.have} de ${sv.need} necessários</div>${!cityCapital && sv.coverage < 100 ? `<div class="hint">Sugestão: ${sv.tip.map(t => { const b = (state.catalog || []).find(x => x.key === t); return b ? `${b.icon} ${escapeHtml(b.name)}` : t; }).join(', ')} <button class="btn btn-ghost btn-sm" data-ctab-go="construcoes">Construir →</button></div>` : ''}</div>`).join('')}</div>
        <div class="ficha-section-title">Moradia e alimento</div><div class="bc-stats"><span class="bc-stat ${o.population.total > o.population.capacity ? 'cons' : 'prod'}">🏠 ${fmt(o.population.total)}/${fmt(o.population.capacity)}</span>${cityCapital ? '' : `<span class="bc-stat ${(o.net.food || 0) < 0 ? 'cons' : 'prod'}">🌾 ${(o.net.food || 0) > 0 ? '+' : ''}${Math.round((o.net.food || 0) * 10) / 10}/dia</span>`}</div>`;
    } else if (cityTab === 'construcoes' && d) {
      body = `<div class="hint">🏗️ Fila de obras: ${d.queue.inProgress}/${d.queue.max} (cresce com o nível da cidade).</div>
        <div class="ficha-section-title">Construções da Cidade</div><div class="buildings-grid">${builtHtml}</div>
        <div class="ficha-section-title">Construir Nova Estrutura</div><input type="text" class="search-input" id="settleCatalogSearch" placeholder="🔎 Pesquisar construção..."><div class="buildings-grid" id="settleCatalogList">${catalogHtml}</div>`;
    } else if (cityTab === 'mapa') {
      const mp = o.map; const sel = cityUi.selected;
      body = `<p class="hint">Cada construção ocupa um lote. Agrupe fazendas e oficinas para ganhar bônus; coloque parques, templos e hospitais ao lado das casas e afaste oficinas delas. Clique numa construção para <strong>mover</strong> (clique depois noutro lote; se estiver ocupado, elas trocam de lugar) ou num lote livre para <strong>construir</strong>. ${infoBtn('city_map')}</p>
        <div class="bc-stats"><span class="bc-stat">🧱 Lotes ${mp.used}/${mp.total}</span>${mp.zones.map(z => `<span class="bc-stat"><i class="sw" style="background:${z.color}"></i> ${z.icon} ${escapeHtml(z.name)}</span>`).join('')}</div>
        <div class="bc-stats">${mp.bonuses.map(b => `<span class="bc-stat prod">${escapeHtml(b)}</span>`).join('') || '<span class="hint">Sem bônus de vizinhança ainda.</span>'}</div>
        ${sel ? `<div class="pop-alert">🧭 Mover: clique no lote de destino (ou <a href="#" id="cmCancel">cancelar</a>).</div>` : ''}
        <div id="cityLots" style="display:grid;grid-template-columns:repeat(${mp.cols}, minmax(52px,1fr));gap:3px;margin:8px 0;">${mp.cells.map(c => c.free
          ? `<div class="lot lot-free" data-lot="${c.lot}" title="Lote livre #${c.lot}" style="min-height:54px;border:1px dashed #b9a47a;border-radius:6px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#b9a47a;">＋</div>`
          : `<div class="lot ${sel === c.id ? 'lot-sel' : ''}" data-lot="${c.lot}" data-bid="${c.id}" title="${escapeHtml(c.name)} nv.${c.level}${c.status !== 'active' ? ' (' + c.daysLeft + 'd)' : ''}${c.bonus ? ' · +' + c.bonus + '% produção' : ''}" style="min-height:54px;background:${c.color};border:2px solid ${sel === c.id ? '#c0392b' : '#6d5a3a'};border-radius:6px;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;font-size:11px;${c.status !== 'active' ? 'opacity:.6;' : ''}"><span style="font-size:20px;">${c.icon}</span><span>${c.status === 'queued' ? '⏸ fila' : c.status !== 'active' ? '⏳' + c.daysLeft : 'nv.' + c.level}${c.bonus ? ' ⬆' + c.bonus + '%' : ''}</span></div>`).join('')}</div>
        <div id="lotBuildBox"></div>`;
    } else if (cityTab === 'comercio') {
      const tr = o.trade;
      body = `<p class="hint">Rotas levam recursos de uma cidade a outra: a compradora paga com o ouro dela, parte se perde na estrada (bandidos, distância, segurança), e o reino fica com 5% de imposto. Rotas exigem caminho entre as cidades. ${infoBtn('city_trade')}</p>
        <div class="bc-stats"><span class="bc-stat">🛒 Rotas ${tr.used}/${tr.limit}</span>${tr.prices.map(p => `<span class="bc-stat">${escapeHtml(p.name)} ${p.price}💰</span>`).join('')}</div>
        ${tr.suggestions.length ? `<div class="ficha-section-title">Sugestões</div><div class="pol-laws">${tr.suggestions.map(sg => `<div class="pol-law"><div class="pl-head"><span>💡 ${escapeHtml(sg.from)} → ${escapeHtml(sg.to)}: ${escapeHtml(sg.resourceName)}</span><button class="btn btn-secondary btn-sm" data-ctsug="${sg.fromId}:${sg.toId}:${sg.resource}:${sg.qty}">Criar rota</button></div><div class="hint">${escapeHtml(sg.why)}</div></div>`).join('')}</div>` : ''}
        <div class="ficha-section-title">Nova rota</div>
        <div class="tech-controls"><select id="ctDir"><option value="out">Exportar para…</option><option value="in">Importar de…</option></select><select id="ctPartner">${tr.nodes.map(n => `<option value="${n.id}">${escapeHtml(n.name)}</option>`).join('')}</select>
          <select id="ctRes">${tr.prices.map(p => `<option value="${p.key}">${escapeHtml(p.name)}</option>`).join('')}</select><input type="number" id="ctQty" min="10" max="500" value="60" style="width:80px;"><label class="hint">por ciclo (5 dias)</label><button class="btn btn-primary" id="ctCreate">Criar</button></div>
        <div class="ficha-section-title">Rotas desta cidade</div>
        <div class="pol-laws">${tr.routes.map(r => `<div class="pol-law"><div class="pl-head"><span>${r.outgoing ? '📤' : '📥'} <strong>${escapeHtml(r.from)} → ${escapeHtml(r.to)}</strong> · ${escapeHtml(r.resourceName)} ${r.qty}/ciclo</span><span class="bc-level">${r.status === 'ativa' ? '✅' : '⏸️ pausada'} ${r.days !== null ? '· ' + r.days + 'd' : ''}</span></div><div class="hint">Caminho: ${({ direto: 'direto entre as cidades', capital: 'via capital', mar: 'por mar ⚓', rio: 'por rio 🛶', canal: 'por canal 🌊', ar: 'pelo ar 🎈', magia: 'por teletransporte 🌀' })[r.via] || r.via}. Total: ${fmt(r.totalQty)} entregues, 💰 ${fmt(r.totalGold)} líquidos. ${escapeHtml(r.last || 'Ainda não rodou.')}</div>
          <div class="tech-controls"><button class="btn btn-ghost btn-sm" data-ctact="${r.id}:pausar">${r.status === 'ativa' ? 'Pausar' : 'Reativar'}</button><button class="btn btn-ghost btn-sm" data-ctact="${r.id}:encerrar">Encerrar</button></div></div>`).join('') || '<p class="hint">Nenhuma rota.</p>'}</div>`;
    } else if (cityTab === 'politicas' && o.policy) {
      const p = o.policy;
      body = cityCapital ? `<p class="hint">A capital tem política própria, e ela vale para o <strong>reino inteiro</strong> (felicidade, estabilidade, crime e consumo de comida). O imposto fica na aba Economia (hoje ${p.capitalTax}%). ${infoBtn('city_policy')}</p>
        <div class="tech-controls"><label class="hint">Ração</label><select id="cpRation">${o.policyOptions.rations.map(r => `<option value="${r.key}" ${p.ration === r.key ? 'selected' : ''}>${escapeHtml(r.name)}</option>`).join('')}</select><label class="hint">Postura</label><select id="cpStance">${o.policyOptions.stances.map(r => `<option value="${r.key}" ${p.stance === r.key ? 'selected' : ''}>${escapeHtml(r.name)} (${escapeHtml(r.desc)})</option>`).join('')}</select><button class="btn btn-primary" id="cpSave">Aplicar</button></div>
        <div class="tech-controls"><button class="btn btn-secondary" id="cpFestival" ${p.festivalLeft ? 'disabled' : ''}>${p.festivalLeft ? `🎪 Festival (${p.festivalLeft}d)` : '🎪 Festival da capital (💰200 do reino)'}</button><span class="hint">O prefeito (aba Pessoas) dá bônus de felicidade, estabilidade e ouro ao reino.</span></div>` : `<p class="hint">Decisões locais com efeito real na felicidade, no ouro e na segurança. ${infoBtn('city_policy')}</p>
        <div class="tech-controls"><label class="hint">Imposto local (%)</label><input type="number" id="cpTax" min="0" max="30" value="${p.taxRate}" style="width:70px;"><label class="hint">Tributo à capital (%)</label><input type="number" id="cpTribute" min="0" max="60" value="${p.tributePct}" style="width:70px;"></div>
        <div class="tech-controls"><label class="hint">Ração</label><select id="cpRation">${o.policyOptions.rations.map(r => `<option value="${r.key}" ${p.ration === r.key ? 'selected' : ''}>${escapeHtml(r.name)}</option>`).join('')}</select>
          <label class="hint">Postura</label><select id="cpStance">${o.policyOptions.stances.map(r => `<option value="${r.key}" ${p.stance === r.key ? 'selected' : ''}>${escapeHtml(r.name)} (${escapeHtml(r.desc)})</option>`).join('')}</select>
          <label class="hint"><input type="checkbox" id="cpAuto" ${p.autoWorkers ? 'checked' : ''}> alocar trabalhadores automaticamente</label><button class="btn btn-primary" id="cpSave">Aplicar</button></div>
        <div class="bc-stats"><span class="bc-stat prod">💰 Impostos arrecadados: ${fmt(p.taxCollected)}</span><span class="bc-stat">📤 Tributo enviado: ${fmt(p.tributePaid)}</span></div>
        <div class="tech-controls"><button class="btn btn-secondary" id="cpFestival" ${p.festivalLeft ? 'disabled' : ''}>${p.festivalLeft ? `🎪 Festival (${p.festivalLeft}d)` : '🎪 Realizar festival (💰80 da cidade)'}</button><button class="btn btn-ghost" id="cpRealloc">👷 Realocar todos os trabalhadores</button></div>`;
    } else if (cityTab === 'pessoas') {
      body = `<div class="ficha-section-title">${cityCapital ? 'Prefeito da capital' : 'Governador'} ${infoBtn('city_governor')}</div>
        ${o.governor ? `<div class="pol-law"><div class="pl-head"><span>${o.governor.icon} <strong>${escapeHtml(o.governor.name)}</strong> · ${escapeHtml(o.governor.role)}</span><span class="bc-level">habilidade ${o.governor.skill}%</span></div><button class="btn btn-ghost btn-sm" id="cgDismiss">Dispensar</button></div>` : '<p class="hint">Sem governador.</p>'}
        ${`<div class="tech-controls"><select id="cgSelect">${o.candidates.map(c => `<option value="${c.id}">${c.icon} ${escapeHtml(c.name)} — ${escapeHtml(c.role)} (${c.skill}%)</option>`).join('')}</select><button class="btn btn-primary" id="cgAppoint">Nomear</button></div>`}
        <div class="ficha-section-title">Moradores ilustres</div><div class="pol-laws">${o.residents.map(r => `<div class="pol-law"><div class="pl-head"><span>${r.icon} <strong>${escapeHtml(r.name)}</strong> · ${escapeHtml(r.role)}</span></div></div>`).join('') || '<p class="hint">Nenhum personagem mora aqui (mude a residência na ficha do personagem).</p>'}</div>
        ${o.colonists ? `<div class="ficha-section-title">Colonos ${infoBtn('city_colonists')}</div><div class="hint">Desempregados na capital: ${fmt(o.colonists.capitalUnemployed)} (pode enviar até ${fmt(o.colonists.maxSend)}) · desempregados aqui: ${fmt(o.colonists.maxRecall)}</div><div class="tech-controls"><input type="number" id="ccAmount" min="1" value="${Math.max(1, Math.min(20, o.colonists.maxSend))}" style="width:80px;"><button class="btn btn-secondary" id="ccSend">🧳 Capital → Cidade</button><button class="btn btn-ghost" id="ccRecall">Cidade → Capital</button></div>` : ''}`;
    } else if (cityTab === 'estoque' && d) {
      body = `<div class="ficha-section-title">Tesouro e Estoque da Cidade</div><div class="resource-strip" style="overflow-x:auto; padding:4px 0;">${resourceChips}</div><div class="bc-stats">${netChips}</div>
        <div class="ficha-section-title">🚚 Transferir entre Capital e Cidade ${infoBtn('transfer')}</div>
        <div class="transfer-form"><select id="transferDirection"><option value="toCity">Capital → Cidade</option><option value="toCapital">Cidade → Capital</option></select><select id="transferResource">${RESOURCE_META.map(r => `<option value="${r.key}">${r.icon} ${r.label}</option>`).join('')}</select><input type="number" id="transferAmount" min="1" value="100"><button class="btn btn-secondary" id="transferBtn" type="button">Enviar</button></div>`;
    } else if (cityTab === 'governo' && o.depth) {
      body = window.KOT.cityDepthUI.governo(o);
    } else if (cityTab === 'defesa' && o.depth) {
      body = window.KOT.cityDepthUI.defesa(o);
    } else if (cityTab === 'eventos') {
      body = `<div class="ficha-section-title">Decisões ${infoBtn('city_decisions')}</div><div class="pol-laws">${o.decisions.map(dc => `<div class="pol-law"><div class="pl-head"><span>${dc.icon} <strong>${escapeHtml(dc.title)}</strong></span><span class="bc-level">${dc.status === 'pendente' ? `⏳ ${dc.daysLeft}d` : dc.status === 'resolvida' ? '✅' : '⌛'}</span></div><div class="hint">${escapeHtml(dc.status === 'pendente' ? dc.text : (dc.outcome || ''))}</div>${dc.options.length ? `<div class="tech-controls">${dc.options.map(op => `<button class="btn btn-secondary btn-sm" data-cdec="${dc.id}:${op.key}">${escapeHtml(op.label)}</button>`).join('')}</div>` : ''}</div>`).join('') || '<p class="hint">Nenhuma decisão até agora.</p>'}</div>
        <div class="ficha-section-title">Crônica da cidade</div><ul class="ficha-history-list">${o.log.map(l => `<li><span>${l.icon}</span><div><span class="fh-day">DIA ${l.day}</span>${escapeHtml(l.title)}</div></li>`).join('') || '<li>Nada registrado ainda.</li>'}</ul>`;
    }
    manageBody.innerHTML = `
      <div class="ficha-head"><span class="ficha-icon">${o.levelIcon}</span><div><div class="ficha-name">${escapeHtml(o.name)}${o.isCapital ? ' 👑' : ''}</div><div class="ficha-role">${escapeHtml(o.levelName)} · ${(state.settlementTypes.find(t => t.key === o.type) || {}).name || o.type} · ${TERRAIN_LABEL[o.terrain] || ''}${d ? ' · ' + d.suitability.label : ''}</div></div></div>
      ${o.depth ? window.KOT.cityDepthUI.banner(o) : ''}
      <div class="category-filter" id="cityTabs">${tabs.map(([k, l]) => `<button class="category-chip ${cityTab === k ? 'active' : ''}" data-ctab="${k}">${l}${k === 'eventos' && o.decisions.some(x => x.status === 'pendente') ? ' ⚠️' : ''}</button>`).join('')}</div>
      <div id="cityBody">${body}</div>`;
    wireCityTabs(o, d);
    if (d && (cityTab === 'construcoes' || cityTab === 'estoque')) wireManageSettlementEvents(d.id);
  }
  function wireCityTabs(o, d) {
    const id = o.id;
    manageBody.querySelectorAll('[data-ctab]').forEach(b => b.addEventListener('click', () => { cityTab = b.dataset.ctab; refreshManagedCity(); }));
    manageBody.querySelectorAll('[data-ctab-go]').forEach(b => b.addEventListener('click', () => { cityTab = b.dataset.ctabGo; refreshManagedCity(); }));
    const act = async (fn, msg) => { try { const r = await fn(); showToast(`${msg || ''} ${r.message || ''}`.trim()); await refreshAll(true); await refreshManagedCity(); } catch (err) { showToast(`⚠️ ${err.message}`); } };
    if (o.depth && window.KOT.cityDepthUI) window.KOT.cityDepthUI.wire(manageBody, o, act);
    const on = (sel, fn) => { const e = manageBody.querySelector(sel); if (e) e.addEventListener('click', fn); };
    on('#cpSave', () => act(() => Api.setCityPolicy(id, { taxRate: el('cpTax') ? Number(el('cpTax').value) : undefined, tributePct: el('cpTribute') ? Number(el('cpTribute').value) : undefined, ration: Number(el('cpRation').value), stance: el('cpStance').value, autoWorkers: el('cpAuto') ? el('cpAuto').checked : undefined }), '⚖️'));
    on('#cpFestival', () => act(() => Api.cityFestival(id)));
    on('#cpRealloc', () => act(() => Api.cityRealloc(id)));
    on('#cgAppoint', () => { const v = el('cgSelect').value; if (!v) { showToast('⚠️ Nenhum candidato disponível.'); return; } act(() => Api.appointGovernor(id, Number(v))); });
    on('#cgDismiss', () => act(() => Api.appointGovernor(id, null)));
    on('#ccSend', () => act(() => Api.cityColonists(id, Number(el('ccAmount').value), 'toCity')));
    on('#ccRecall', () => act(() => Api.cityColonists(id, Number(el('ccAmount').value), 'toCapital')));
    manageBody.querySelectorAll('[data-ctsug]').forEach(b => b.addEventListener('click', () => { const [f, t, r, q] = b.dataset.ctsug.split(':'); act(() => Api.createTradeRoute({ fromId: Number(f), toId: Number(t), resource: r, qty: Number(q) })); }));
    on('#ctCreate', () => { const partner = Number(el('ctPartner').value); const out = el('ctDir').value === 'out'; if (!partner) { showToast('⚠️ Você precisa de outra cidade para comerciar.'); return; } act(() => Api.createTradeRoute({ fromId: out ? id : partner, toId: out ? partner : id, resource: el('ctRes').value, qty: Number(el('ctQty').value) })); });
    manageBody.querySelectorAll('[data-ctact]').forEach(b => b.addEventListener('click', () => { const [rid, a2] = b.dataset.ctact.split(':'); act(() => Api.tradeRouteAction(Number(rid), a2)); }));
    on('#cmCancel', (e) => { e.preventDefault(); cityUi.selected = null; refreshManagedCity(); });
    manageBody.querySelectorAll('#cityLots .lot').forEach(cell => cell.addEventListener('click', async () => {
      const lot = Number(cell.dataset.lot); const bid = cell.dataset.bid ? Number(cell.dataset.bid) : null;
      if (cityUi.selected) { const sel = cityUi.selected; if (bid === sel) { cityUi.selected = null; return refreshManagedCity(); } cityUi.selected = null; return act(() => Api.moveCityBuilding(id, sel, lot)); }
      if (bid) { cityUi.selected = bid; return refreshManagedCity(); }
      const cat = (state.catalog || []).filter(b => !b.locked).slice(0, 400);
      const box = el('lotBuildBox'); box.innerHTML = `<div class="pol-law"><div class="pl-head"><span>🧱 Construir no lote #${lot}</span></div><div class="tech-controls"><input type="text" id="lotSearch" class="search-input" placeholder="🔎 buscar construção..." style="flex:1;"><select id="lotPick" size="8" style="min-width:260px;">${cat.map(b => `<option value="${b.key}">${b.icon} ${escapeHtml(b.name)} (${escapeHtml(b.categoryLabel)})</option>`).join('')}</select><button class="btn btn-primary" id="lotGo">Construir</button></div></div>`;
      el('lotSearch').addEventListener('input', (ev) => { const q = ev.target.value.toLowerCase(); [...el('lotPick').options].forEach(op => { op.hidden = !op.textContent.toLowerCase().includes(q); }); });
      el('lotGo').addEventListener('click', () => { const k = el('lotPick').value; if (!k) { showToast('⚠️ Escolha uma construção.'); return; } act(() => (cityCapital ? Api.startConstruction(k, lot) : Api.startSettlementConstruction(id, k, lot)), '🏗️'); });
    }));
    manageBody.querySelectorAll('[data-cdec]').forEach(b => b.addEventListener('click', () => { const [did, choice] = b.dataset.cdec.split(':'); act(() => Api.resolveCityDecision(id, Number(did), choice)); }));
  }

  function wireManageSettlementEvents(settlementId) {
    manageBody.querySelectorAll('[data-settle-workers]').forEach((input) => {
      input.addEventListener('change', async () => {
        try {
          await Api.assignSettlementWorkers(settlementId, input.dataset.settleWorkers, Number(input.value));
          showToast('👷 Trabalhadores realocados na cidade.');
          await refreshManagedCity();
          await refreshAll(true);
        } catch (err) { showToast(`⚠️ ${err.message}`); }
      });
    });
    manageBody.querySelectorAll('[data-settle-upgrade]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        btn.disabled = true;
        try {
          await Api.upgradeSettlementBuilding(settlementId, btn.dataset.settleUpgrade);
          showToast('🏗️ Evolução iniciada na cidade.');
          await refreshManagedCity();
        } catch (err) { showToast(`⚠️ ${err.message}`); btn.disabled = false; }
      });
    });
    manageBody.querySelectorAll('[data-settle-cancel]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        btn.disabled = true;
        try {
          await Api.cancelSettlementConstruction(settlementId, btn.dataset.settleCancel);
          showToast('🚫 Obra cancelada, recursos devolvidos à cidade.');
          await refreshManagedCity();
        } catch (err) { showToast(`⚠️ ${err.message}`); btn.disabled = false; }
      });
    });
    manageBody.querySelectorAll('[data-settle-build]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        btn.disabled = true;
        try {
          await Api.startSettlementConstruction(settlementId, btn.dataset.settleBuild);
          showToast('🏗️ Construção iniciada na cidade.');
          await refreshManagedCity();
          await refreshAll(true);
        } catch (err) { showToast(`⚠️ ${err.message}`); btn.disabled = false; }
      });
    });
    const transferBtn = el('transferBtn');
    if (transferBtn) {
      transferBtn.addEventListener('click', async () => {
        transferBtn.disabled = true;
        try {
          const r = await Api.transferToSettlement(settlementId, el('transferDirection').value, el('transferResource').value, Number(el('transferAmount').value));
          showToast(`🚚 ${r.message}`);
          await refreshManagedCity();
          await refreshAll(true);
        } catch (err) { showToast(`⚠️ ${err.message}`); transferBtn.disabled = false; }
      });
    }
    const searchInput = el('settleCatalogSearch');
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        const q = searchInput.value.toLowerCase();
        manageBody.querySelectorAll('#settleCatalogList .building-card').forEach((card) => {
          const name = card.querySelector('.bc-name').textContent.toLowerCase();
          card.style.display = name.includes(q) ? '' : 'none';
        });
      });
    }
  }

  const settlementModal = el('settlementModalOverlay');
  el('foundSettlementBtn').addEventListener('click', async () => {
    el('settlementModalAlert').className = 'alert';
    settlementModal.classList.remove('hidden');
    const territorySelect = el('settlementTerritory');
    const typeSelect = el('settlementType');
    typeSelect.innerHTML = state.settlementTypes.map(t => `<option value="${t.key}">${t.icon} ${t.name}</option>`).join('');
    territorySelect.innerHTML = '<option>Carregando territórios...</option>';
    try {
      const { territories } = await Api.getMap();
      const settledIds = new Set(state.settlements.map(s => s.territory.id));
      const available = territories.filter(t => t.isMine && !settledIds.has(t.id));
      const mineTs = territories.filter(t => t.isMine); const vizinhosLivres = territories.filter(t => !t.isMine && !t.isAi && !t.owned && t.terrain !== 'oceano' && !settledIds.has(t.id) && mineTs.some(m => Math.max(Math.abs(m.row - t.row), Math.abs(m.col - t.col)) <= 1)).slice(0, 40);
      const optL = (t, pre) => `<option value="${pre}${t.id}">${TERRAIN_ICON[t.terrain] || ''} Linha ${t.row + 1}, Coluna ${t.col + 1} (${TERRAIN_LABEL[t.terrain] || t.terrain})${pre ? ' · vizinho livre (será reivindicado)' : ''}</option>`;
      territorySelect.innerHTML = (available.length || vizinhosLivres.length)
        ? (available.length ? `<optgroup label="Seus territórios">${available.map(t => optL(t, '')).join('')}</optgroup>` : '') + (vizinhosLivres.length ? `<optgroup label="Vizinhos livres (reivindicar e fundar)">${vizinhosLivres.map(t => optL(t, 'claim:')).join('')}</optgroup>` : '')
        : '<option value="">Nenhum local disponível</option>';
      if (window.KOT.cityDepthUI) { territorySelect.onchange = () => window.KOT.cityDepthUI.renderFoundPreview(window.KOT.cityDepthUI.parseSite(territorySelect.value).id); window.KOT.cityDepthUI.renderFoundPreview(window.KOT.cityDepthUI.parseSite(territorySelect.value).id); }
      { const ab = el('settlementModalAlert'), cb = el('settlementConfirmBtn'); /* Etapa 73: sem território o formulário era um beco sem saída (nada dizia como conseguir um) */ cb.disabled = (available.length + vizinhosLivres.length) === 0; if (available.length + vizinhosLivres.length === 0) { ab.className = 'alert alert-error show'; ab.innerHTML = 'Você ainda não tem um território livre para uma nova cidade. <b>Reivindique um território ao lado da sua capital</b>: no Mapa, clique num território vizinho e escolha “Reivindicar” (o custo aparece no botão; costuma começar em cerca de 450 de ouro); depois volte aqui. Se os vizinhos forem desconhecidos, envie expedições na aba Exploração antes. <button type="button" class="btn btn-ghost btn-sm" id="settlementGoMap">🗺️ Abrir o Mapa</button>'; const gm = el('settlementGoMap'); if (gm) gm.addEventListener('click', () => { settlementModal.classList.add('hidden'); window.KOT.goToPanel('mapa'); }); } else { ab.className = 'alert'; ab.textContent = ''; } }
    } catch (err) {
      territorySelect.innerHTML = `<option value="">${err.message}</option>`;
    }
  });
  el('settlementModalClose').addEventListener('click', () => settlementModal.classList.add('hidden'));
  settlementModal.addEventListener('click', (e) => { if (e.target === settlementModal) settlementModal.classList.add('hidden'); });

  el('settlementConfirmBtn').addEventListener('click', async () => {
    const alertBox = el('settlementModalAlert');
    const name = el('settlementName').value.trim();
    const site = window.KOT.cityDepthUI ? window.KOT.cityDepthUI.parseSite(el('settlementTerritory').value) : { claim: false, id: Number(el('settlementTerritory').value) }; const territoryId = site.id ? String(site.id) : '';
    const type = el('settlementType').value;
    if (!name) { alertBox.className = 'alert alert-error show'; alertBox.textContent = 'Informe um nome.'; return; }
    if (!territoryId) { alertBox.className = 'alert alert-error show'; alertBox.textContent = 'Escolha um território válido.'; return; }

    const btn = el('settlementConfirmBtn');
    btn.disabled = true;
    try {
      if (site.claim) { try { await Api.claimTerritory(Number(territoryId)); } catch (e) { throw new Error('Não deu para reivindicar o território: ' + e.message); } }
      await Api.foundSettlement(Number(territoryId), name, type);
      showToast('🏘️ Novo assentamento fundado!');
      settlementModal.classList.add('hidden');
      el('settlementName').value = '';
      await refreshAll();
    } catch (err) {
      alertBox.className = 'alert alert-error show';
      alertBox.textContent = err.message;
    } finally {
      btn.disabled = false;
    }
  });

  // ==============================================================
  // MODAL: DETALHE DE RECURSO
  // ==============================================================
  const resourceModal = el('resourceModalOverlay');
  async function openResourceModal(key) {
    resourceModal.classList.remove('hidden');
    const body = el('resourceModalBody');
    body.innerHTML = '<p class="hint">Consultando os arquivos do reino…</p>';
    try {
      const d = await Api.getResourceDetail(key);
      const meta = RESOURCE_META.find(r => r.key === key);
      body.innerHTML = `
        <div class="ficha-head">
          <span class="ficha-icon">${meta?.icon || ''}</span>
          <div><div class="ficha-name">${escapeHtml(d.label)} ${infoBtn(key === 'gold' ? 'gold' : 'resource')}</div><div class="ficha-role">${fmt(d.stock)} em estoque ${d.capacity ? `/ ${fmt(d.capacity)}` : ''}</div></div>
        </div>
        <div class="ficha-meta">
          <span>📈 Produção: +${fmt(d.dailyProduction)}/dia</span>
          <span>📉 Consumo: −${fmt(d.dailyConsumption)}/dia</span>
          <span>${d.dailyBalance >= 0 ? '✅' : '⚠️'} Saldo: ${d.dailyBalance >= 0 ? '+' : ''}${fmt(d.dailyBalance)}/dia</span>
        </div>
        ${d.price ? `
          <div class="ficha-meta">
            <span>💰 Comprar: ${d.price.buyPrice}/un</span>
            <span>💰 Vender: ${d.price.sellPrice}/un</span>
            <span class="mc-trend ${d.price.trend}">${d.price.trend === 'alta' ? '📈 escasso' : d.price.trend === 'baixa' ? '📉 abundante' : '➡️ estável'}</span>
          </div>
        ` : ''}
        ${d.goldBreakdown ? `
          <div class="ficha-section-title">📥 ENTRADAS diárias (+${fmt(d.goldBreakdown.totalIn)})</div>
          <div class="bc-stats">${d.goldBreakdown.entradas.map(e => `<span class="bc-stat prod">${e.icon} ${escapeHtml(e.label)}: +${fmt(e.amount)}</span>`).join('')}</div>
          <div class="ficha-section-title">📤 SAÍDAS diárias (−${fmt(d.goldBreakdown.totalOut)})</div>
          <div class="bc-stats">${d.goldBreakdown.saidas.length ? d.goldBreakdown.saidas.map(e => `<span class="bc-stat cons">${e.icon} ${escapeHtml(e.label)}: −${fmt(e.amount)}</span>`).join('') : '<span class="hint">Nenhuma despesa fixa.</span>'}</div>
          <p class="hint">Saldo estimado: ${d.goldBreakdown.balance >= 0 ? '+' : ''}${fmt(d.goldBreakdown.balance)} ouro/dia (ver histórico completo na aba Economia).</p>` : ''}
        <div class="ficha-section-title">Construções que produzem</div>
        <div class="bc-stats">${d.producers.length ? d.producers.map(p => `<span class="bc-stat prod">${p.icon} ${escapeHtml(p.name)}${p.level ? ` Nv.${p.level}` : ''} (+${p.amount}/dia)</span>`).join('') : '<span class="hint">Nenhuma construção ativa produz isso ainda.</span>'}</div>
        <div class="ficha-section-title">Quem consome (construções, população e exército)</div>
        <div class="bc-stats">${d.consumers.length ? d.consumers.map(c => `<span class="bc-stat cons">${c.icon} ${escapeHtml(c.name)}${c.level ? ` Nv.${c.level}` : ''} (−${c.amount}/dia)</span>`).join('') : '<span class="hint">Nada consome isso no momento.</span>'}</div>
        <div class="ficha-section-title">Onde construir para obter mais</div>
        <div class="bc-stats">${d.catalogSources.map(s => `<span class="bc-stat">${s.icon} ${escapeHtml(s.name)} (${s.role})</span>`).join('')}</div>
      `;
    } catch (err) {
      body.innerHTML = `<p class="hint" style="color:#7a1f2b;">${err.message}</p>`;
    }
  }
  el('resourceModalClose').addEventListener('click', () => resourceModal.classList.add('hidden'));
  resourceModal.addEventListener('click', (e) => { if (e.target === resourceModal) resourceModal.classList.add('hidden'); });

  // ==============================================================
  // MERCADO
  // ==============================================================
  function renderMarket() {
    const m = state.market;
    if (!m) return;
    el('marketList').innerHTML = m.prices.map(p => `
      <div class="market-card">
        <div class="market-card-head">
          <span class="mc-name">${RESOURCE_META.find(r => r.key === p.key)?.icon || ''} ${escapeHtml(p.label)}</span>
          <span class="mc-trend ${p.trend}">${p.trend}</span>
        </div>
        <div class="mc-stock">${fmt(p.stock)} / ${fmt(p.capacity)} em estoque (${p.stockRatio}%)</div>
        <div class="mc-prices"><span class="buy">Comprar: 💰${p.buyPrice}</span><span class="sell">Vender: 💰${p.sellPrice}</span></div>
        <div class="mc-actions">
          <input type="number" min="1" value="10" data-market-qty="${p.key}">
          <button class="btn btn-secondary" data-market-buy="${p.key}">Comprar</button>
          <button class="btn btn-ghost" data-market-sell="${p.key}">Vender</button>
        </div>
      </div>
    `).join('');

    el('marketList').querySelectorAll('[data-market-buy], [data-market-sell]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const key = btn.dataset.marketBuy || btn.dataset.marketSell;
        const action = btn.dataset.marketBuy ? 'buy' : 'sell';
        const qtyInput = el('marketList').querySelector(`[data-market-qty="${key}"]`);
        const qty = Math.max(1, Number(qtyInput.value) || 1);
        btn.disabled = true;
        try {
          const result = await Api.tradeMarket(key, action, qty);
          showToast(result.message);
          await refreshAll(true);
        } catch (err) {
          showToast(`⚠️ ${err.message}`);
        } finally {
          btn.disabled = false;
        }
      });
    });
  }

  // ==============================================================
  // ECONOMIA
  // ==============================================================
  function renderEconomy() {
    const e = state.economy;
    if (!e) return;
    if (e.storageCapacity) {
      el('storagePanel').innerHTML = RESOURCE_META.filter(m => m.key !== 'gold' && e.storageCapacity[m.key] > 0).map(m => {
        const cur = e.resources[m.key] || 0; const cap = e.storageCapacity[m.key];
        const pct = Math.min(100, Math.round((cur / cap) * 100));
        const cls = pct >= 100 ? 'cons' : pct >= 90 ? 'cons' : 'prod';
        return `<span class="bc-stat ${cls}">${m.icon} ${escapeHtml(m.label)}: ${fmt(Math.round(cur))}/${fmt(cap)} (${pct}%)</span>`;
      }).join('') || '<span class="hint">Nenhuma capacidade de armazenamento específica ainda.</span>';
    }
    const last = e.log.length ? e.log[e.log.length - 1] : null;
    el('economySummary').innerHTML = `
      <div class="economy-stat"><div class="es-label">OURO ATUAL</div><div class="es-value">💰 ${fmt(e.resources.gold)}</div></div>
      <div class="economy-stat income"><div class="es-label">RECEITA/DIA</div><div class="es-value">+${last ? fmt(last.income) : 0}</div></div>
      <div class="economy-stat expense"><div class="es-label">DESPESA/DIA</div><div class="es-value">−${last ? fmt(last.expense) : 0}</div></div>
      <div class="economy-stat"><div class="es-label">SALDO/DIA</div><div class="es-value">${last ? (last.balance >= 0 ? '+' : '') + fmt(last.balance) : 0}</div></div>
    `;

    el('taxSlider').value = e.taxRate;
    el('taxValue').textContent = `${e.taxRate}%`;

    const log = el('economyLog');
    log.innerHTML = `
      <div class="economy-log-row head"><span>Dia</span><span>Receita</span><span>Despesa</span><span>Saldo</span></div>
      ${e.log.slice().reverse().map(row => `
        <div class="economy-log-row">
          <span>${row.day}</span>
          <span class="pos">+${fmt(row.income)}</span>
          <span class="neg">−${fmt(row.expense)}</span>
          <span class="${row.balance >= 0 ? 'pos' : 'neg'}">${row.balance >= 0 ? '+' : ''}${fmt(row.balance)}</span>
        </div>
      `).join('') || '<p class="hint">Ainda não há histórico. Avance o tempo para gerar dados.</p>'}
    `;
  }

  el('taxSlider').addEventListener('input', () => { el('taxValue').textContent = `${el('taxSlider').value}%`; });
  el('saveTaxBtn').addEventListener('click', async () => {
    const box = el('taxAlert');
    try {
      await Api.setTaxRate(Number(el('taxSlider').value));
      box.className = 'alert alert-success show';
      box.textContent = 'Taxa de imposto atualizada.';
      setTimeout(() => box.classList.remove('show'), 2500);
      await refreshAll(true);
    } catch (err) {
      box.className = 'alert alert-error show';
      box.textContent = err.message;
    }
  });

  // ==============================================================
  // EVENTOS
  // ==============================================================
  function renderEvents() {
    const { pending, resolved } = state.events;
    el('eventsBadge').textContent = pending.length;
    el('eventsBadge').classList.toggle('hidden', pending.length === 0);
    { const cx = state.events.codex; const e = el('eventsCodex'); if (e && cx) e.textContent = `📖 Códice do Reino: você já viveu ${cx.lived.toLocaleString('pt-BR')} de ${cx.total.toLocaleString('pt-BR')} situações diferentes (${cx.composed.toLocaleString('pt-BR')} compostas a partir de 16 temas + histórias em várias etapas).`; }

    el('pendingEvents').innerHTML = pending.length
      ? pending.map(ev => `
        <div class="event-card">
          <div class="event-card-head"><span class="ev-icon">${ev.icon}</span><span class="ev-title">${escapeHtml(ev.title)}</span></div>
          ${window.KOT && window.KOT.art ? window.KOT.art.event(ev.key, ev.title, ev.category || (String(ev.key).match(/^gen_([a-z]+)_/) || [])[1] || 'cidade', ev.icon, (state.kingdom && state.kingdom.currentDay) || 1) : ''}
          <div class="event-text">${escapeHtml(ev.text)}</div>
          <div class="event-options">
            ${ev.options.map(o => `<div class="opt-wrap">` + `<button class="btn ${o.minigame ? 'btn-primary btn-mini' : 'btn-secondary'}" data-resolve="${ev.id}" data-option="${o.key}" ${o.minigame ? `data-minigame="${o.minigame}" title="Minijogo: seu desempenho define o prêmio"` : ''}>${escapeHtml(o.label)}</button>` + previewHtml(o) + `</div>`).join('')}
          </div>
        </div>
      `).join('')
      : '<p class="hint">Nenhum evento pendente no momento.</p>';

    el('resolvedEvents').innerHTML = resolved.length
      ? resolved.map(ev => `
        <div class="resolved-event">
          <span class="re-icon">${ev.icon}</span>
          <div><span class="re-day">DIA ${ev.day} · ${escapeHtml(ev.title)}</span>${escapeHtml(ev.outcomeText || '')}</div>
        </div>
      `).join('')
      : '<p class="hint">Nenhum evento resolvido ainda.</p>';

    document.querySelectorAll('[data-resolve]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (btn.dataset.minigame && window.KOT.mini) { window.KOT.mini.play(Number(btn.dataset.resolve)); return; } // opção de minijogo: abre o jogo; o prêmio sai ao final
        el('pendingEvents').querySelectorAll('button').forEach(b => b.disabled = true);
        try {
          await Api.resolveEvent(btn.dataset.resolve, btn.dataset.option);
          showToast('📯 Decisão registrada.');
          await refreshAll();
        } catch (err) {
          showToast(`⚠️ ${err.message}`);
          await refreshAll();
        }
      });
    });
  }

  // ==============================================================
  // OBJETIVOS (523 objetivos — filtrados por categoria)
  // ==============================================================
  el('claimAllObjectivesBtn').addEventListener('click', async () => {
    const btn = el('claimAllObjectivesBtn');
    btn.disabled = true;
    try {
      const result = await Api.claimAllObjectives();
      showToast(result.claimedCount ? `🎯 ${result.message}` : '🎯 Nenhum objetivo concluído para resgatar agora.');
      await refreshAll();
    } catch (err) {
      showToast(`⚠️ ${err.message}`);
    } finally {
      btn.disabled = false;
    }
  });

  const nfmt = (n) => Number(n).toLocaleString('pt-BR');
  function renderObjectives() {
    const everything = state.objectives;
    const core = everything.filter(o => o.tier !== 'extra'); const extras = everything.filter(o => o.tier === 'extra');
    const coreDone = core.filter(o => o.completed).length; const extraDone = extras.filter(o => o.completed).length;
    // Etapa 38: por padrao so o NUCLEO aparece e conta; as conquistas "de colecionador" (milhares de combinacoes construcao x nivel) ficam recolhidas
    const showExtra = !!state.objShowExtra; const all = showExtra ? everything : everything.filter(o => o.tier !== 'extra' || (o.completed && !o.claimed));
    el('objCount').textContent = `(${coreDone}/${core.length} do núcleo concluídos · ${nfmt(extras.length)} conquistas extras${extraDone ? ', ' + extraDone + ' feitas' : ''})`;

    // categorias presentes, na ordem em que aparecem
    const categories = [];
    const seen = new Set();
    all.forEach(o => { if (!seen.has(o.category)) { seen.add(o.category); categories.push({ key: o.category, label: o.categoryLabel }); } });

    const filterBar = el('objectivesFilter');
    filterBar.innerHTML = `
      <button class="category-chip ${showExtra ? 'active' : ''}" data-objextra="1" title="Combinações de construção × nível: continuam valendo recompensa, mas ficam fora da lista por padrão" aria-pressed="${showExtra}">🏗️ ${showExtra ? 'Ocultar' : 'Mostrar'} conquistas extras (${nfmt(extras.length)})</button>
      <button class="category-chip ${state.objectivesCategory === 'all' ? 'active' : ''}" data-objcat="all">Todas</button>
      ${categories.map(c => `<button class="category-chip ${state.objectivesCategory === c.key ? 'active' : ''}" data-objcat="${c.key}">${escapeHtml(c.label)}</button>`).join('')}
    `;
    filterBar.querySelectorAll('[data-objextra]').forEach((btn) => btn.addEventListener('click', () => { state.objShowExtra = !state.objShowExtra; renderObjectives(); }));
    filterBar.querySelectorAll('[data-objcat]').forEach((btn) => {
      btn.addEventListener('click', () => { state.objectivesCategory = btn.dataset.objcat; renderObjectives(); });
    });

    const filtered = state.objectivesCategory === 'all' ? all : all.filter(o => o.category === state.objectivesCategory);
    const completed = filtered.filter(o => o.completed).length;
    el('objectivesSummary').textContent = `${completed} de ${filtered.length} concluídos nesta categoria.`;

    // ordena: pendentes com progresso > concluidos nao resgatados > concluidos resgatados > resto
    const sorted = [...filtered].sort((a, b) => {
      const score = o => (o.completed && !o.claimed ? 0 : (!o.completed && o.current > 0 ? 1 : (o.completed ? 2 : 3)));
      return score(a) - score(b) || (b.current / b.target) - (a.current / a.target);
    });
    const visible = sorted.slice(0, 60); // evita renderizar centenas de cards de uma vez

    el('objectivesList').innerHTML = visible.map(o => {
      const pct = Math.min(100, Math.round((o.current / o.target) * 100));
      return `
        <div class="objective-card ${o.completed ? 'completed' : ''} ${o.claimed ? 'claimed' : ''}">
          <div class="objective-head"><span class="obj-icon">${o.icon}</span><span class="obj-title">${escapeHtml(o.title)}</span></div>
          <div class="objective-desc">${escapeHtml(o.desc)}</div>
          <div class="objective-track"><div class="objective-fill" style="width:${pct}%"></div></div>
          <div class="objective-progress"><span>${fmt(o.current)} / ${fmt(o.target)}</span><span>${pct}%</span></div>
          <div class="objective-reward">🎁 Recompensa: ${rewardText(o.reward)}</div>
          ${o.claimed
            ? '<span class="bc-upgrading">✅ Recompensa resgatada</span>'
            : (o.completed ? `<button class="btn btn-primary" data-claim="${o.key}">Resgatar recompensa</button>` : '')}
        </div>
      `;
    }).join('') + (sorted.length > visible.length ? `<p class="hint" style="grid-column:1/-1;">Mostrando os 60 mais relevantes de ${sorted.length} objetivos nesta categoria. Continue jogando para revelar mais.</p>` : '');

    document.querySelectorAll('[data-claim]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        btn.disabled = true;
        try {
          await Api.claimObjective(btn.dataset.claim);
          showToast('🎯 Objetivo concluído! Recompensa resgatada.');
          await refreshAll();
        } catch (err) {
          showToast(`⚠️ ${err.message}`);
          btn.disabled = false;
        }
      });
    });
  }

  // ==============================================================
  // PERSONAGENS
  // ==============================================================
  const barSm = (v, color) => `<div class="pm-bar" style="height:5px;margin-top:2px;"><div class="pm-fill" style="width:${Math.max(0, Math.min(100, v))}%;${color ? 'background:' + color + ';' : ''}"></div></div>`;
  function renderCharacters() {
    const countEl = el('charCount');
    if (countEl) countEl.textContent = `(${state.characters.length} no total, ${state.characters.filter(c => c.status === 'ativo').length} ativos${(state.charExtras || []).length ? ', +' + state.charExtras.length + ' da dinastia' : ''})`;
    const kindSel = el('charKindFilter');
    if (kindSel && kindSel.options.length <= 1) { [...new Set(state.characters.map(c => c.role))].sort().forEach(r => { const o = document.createElement('option'); o.value = r; o.textContent = r; kindSel.appendChild(o); }); }
    let filtered = state.charStatusFilter === 'all' ? state.characters.slice() : state.characters.filter(c => c.status === state.charStatusFilter);
    if (state.charKind) filtered = filtered.filter(c => c.role === state.charKind);
    if (state.charSearch) {
      const q = state.charSearch.toLowerCase();
      filtered = filtered.filter(c => c.name.toLowerCase().includes(q) || c.role.toLowerCase().includes(q) || (c.traits || []).some(t => t.name.toLowerCase().includes(q)));
    }
    const sorters = { name: (a, b) => a.name.localeCompare(b.name), loyalty: (a, b) => b.loyalty - a.loyalty, reputation: (a, b) => b.reputation - a.reputation, mood: (a, b) => (b.mood || 0) - (a.mood || 0), age: (a, b) => b.age - a.age };
    if (state.charSort && sorters[state.charSort]) filtered.sort(sorters[state.charSort]);
    const moodIcon = (m) => m >= 70 ? '😊' : m >= 45 ? '😐' : m >= 25 ? '😟' : '😠';
    const vacHtml = (state.charVacancies || []).length ? `<div class="pop-alert" style="grid-column:1/-1;">🪑 Cargos vagos: ${state.charVacancies.map(v => `${escapeHtml(v.role)} (vago desde a saída de ${escapeHtml(v.former_name || '?')}; um novo nome será escolhido em breve)`).join(' · ')}</div>` : '';
    const THREAT = { baixa: '🟢', 'média': '🟡', alta: '🟠', iminente: '🔴' };
    const consHtml = (state.charConspiracies || []).map(k => k.rumor
      ? `<div class="pop-alert" style="grid-column:1/-1;">🕸️ ${escapeHtml(k.text)} (ameaça ${THREAT[k.threat] || ''} ${k.threat})</div>`
      : `<div class="pol-law" style="grid-column:1/-1;${k.active ? '' : 'opacity:.65;'}"><div class="pl-head"><span>${k.icon} <strong>${escapeHtml(k.name)}</strong> · ${escapeHtml(k.goalName)}</span><span class="bc-level">${k.active ? `${THREAT[k.threat] || ''} ameaça ${k.threat} · ${k.progress}%` : escapeHtml(k.status)}</span></div>
        <div class="hint">${k.goals.map(g => `<div style="margin:2px 0;">${g.icon} <strong>${escapeHtml(g.name)}</strong>: ${escapeHtml(g.desc)} — ${g.done ? '✅ cumprido' : `<span class="bc-level">${g.progress}%</span>`}${k.active && !g.done ? ` <button class="btn btn-ghost btn-sm" data-consp="${k.id}:sabotar:${g.goal}">🔧 Sabotar (💰150)</button>` : ''}</div>`).join('')}${k.hiddenGoals ? `<div>❓ +${k.hiddenGoals} objetivo(s) desconhecido(s) — infiltre para descobrir.</div>` : ''}${k.ai ? ` · de olho em <strong>${escapeHtml(k.ai)}</strong>${k.agent ? ' (agente: ' + escapeHtml(k.agent) + ')' : ''}` : ''}. Membros conhecidos: ${k.members.map(m => `<a href="#" data-consp-open="${m.id}">${m.icon} ${escapeHtml(m.name)}${m.conspRole === 'líder' ? ' 👑' : ''}</a>`).join(', ') || 'nenhum'}${k.unknownCount ? ` + ${k.unknownCount} desconhecido(s)` : ''}.${k.outcome ? ' ' + escapeHtml(k.outcome) : ''}</div>
        ${k.active ? `<div class="tech-controls">${[['infiltrar', '🕵️ Infiltrar (💰100)'], ['prender_lider', '⛓️ Prender o líder'], ['prender_todos', '⛓️ Prender todos os conhecidos'], ['comprar', '💰 Comprar os membros (💰250)'], ['expor', '📣 Expor publicamente'], ['ignorar', 'Ignorar']].map(([a, l]) => `<button class="btn btn-secondary btn-sm" data-consp="${k.id}:${a}">${l}</button>`).join('')}</div>` : ''}</div>`).join('');
    const netHtml = (state.charNetworks || []).map(n => `<div class="pol-law" style="grid-column:1/-1;${n.active ? '' : 'opacity:.65;'}"><div class="pl-head"><span>🌍 <strong>Rede de espiões de ${escapeHtml(n.ai)}</strong></span><span class="bc-level">${n.active ? 'força ' + n.strength : escapeHtml(n.status)}</span></div>
      <div class="hint">${n.agents.map(a => `${a.rankKey === 'chefe' ? '👑' : a.rankKey === 'agente' ? '🕴️' : '🗣️'} ${escapeHtml(a.name)} (${escapeHtml(a.rank.toLowerCase())}, ${escapeHtml(a.status)})${n.active && a.status === 'ativo' ? ` <button class="btn btn-ghost btn-sm" data-net="${n.id}:recrutar:${a.id}">💰 Recrutar (100)</button>` : ''}`).join('<br>')}${n.unknownCount ? `<br>❓ +${n.unknownCount} agente(s) desconhecido(s)` : ''}${n.lastEvent ? '<br>📜 ' + escapeHtml(n.lastEvent) : ''}</div>
      ${n.active ? `<div class="tech-controls">${[['infiltrar', '🕵️ Infiltrar a rede (💰120)'], ['neutralizar_chefe', '⛓️ Capturar o chefe (💰150)'], ['desmantelar', '💥 Desmantelar a rede (💰200)']].map(([a, l]) => `<button class="btn btn-secondary btn-sm" data-net="${n.id}:${a}">${l}</button>`).join('')}</div>` : ''}</div>`).join('');
    const extras = state.charStatusFilter === 'ativo' || state.charStatusFilter === 'all' ? (state.charExtras || []).filter(x => !state.charSearch || x.name.toLowerCase().includes(state.charSearch.toLowerCase())) : [];
    el('charactersList').innerHTML = (filtered.length || extras.length)
      ? vacHtml + consHtml + netHtml + filtered.map(c => `
        <div class="character-card ${c.status !== 'ativo' ? 'character-inactive' : ''}" data-character="${c.id}" style="text-align:left;">
          ${c.status !== 'ativo' ? `<span class="ch-status-badge">${c.status === 'falecido' ? '⚰️ falecido' : '🚶 saiu do cargo'}</span>` : ''}
          <div style="text-align:center;">${window.KOT && window.KOT.art ? `<div class="ch-portrait">${window.KOT.art.portrait(c.name, c.role, { sex: c.sex, age: c.age, mood: c.mood })}</div>` : ''}<span class="ch-icon">${c.icon}</span><span class="ch-name">${escapeHtml(c.name)}</span><span class="ch-role">${escapeHtml(c.role)}</span></div>
          <div class="hint" style="text-align:center;">${c.age} anos · ${c.sex === 'F' ? '♀' : '♂'} · ${escapeHtml(c.marital || '')}${c.children ? ' · 👶 ' + c.children : ''} ${c.mood !== undefined ? moodIcon(c.mood) : ''}</div>
          <div class="bc-stats" style="justify-content:center;margin:4px 0;">${(c.traits || []).map(t => `<span class="bc-stat" title="${escapeHtml(t.name)}">${t.icon} ${escapeHtml(t.name)}</span>`).join('')}</div>
          <div class="ch-stats"><span>❤️ Lealdade ${c.loyalty}</span><span>⭐ Reputação ${c.reputation}</span></div>
          ${barSm(c.loyalty, c.loyalty < 35 ? '#c0392b' : '')}
        </div>`).join('') + extras.map(x => `
        <div class="character-card" data-dynasty-extra="${x.id}" style="cursor:pointer;">
          <span class="ch-status-badge">👑 dinastia</span><span class="ch-icon">${x.icon}</span><span class="ch-name">${escapeHtml(x.name)}</span><span class="ch-role">${escapeHtml(x.role)}</span>
          <div class="hint">${x.age} anos · ver na aba Dinastia →</div></div>`).join('')
      : '<p class="hint">Nenhum personagem encontrado com esse filtro.</p>';
    document.querySelectorAll('[data-character]').forEach((card) => { card.addEventListener('click', () => openCharacterModal(card.dataset.character)); });
    document.querySelectorAll('[data-consp-open]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); openCharacterModal(a.dataset.conspOpen); }));
    document.querySelectorAll('[data-net]').forEach((b) => b.addEventListener('click', async () => { const [id, kind, agent] = b.dataset.net.split(':'); try { const r = await Api.networkAction(Number(id), kind, agent ? Number(agent) : undefined); showToast(r.message); await refreshAll(true); } catch (err) { showToast(`⚠️ ${err.message}`); } }));
    document.querySelectorAll('[data-consp]').forEach((b) => b.addEventListener('click', async () => { const [id, kind, goal] = b.dataset.consp.split(':'); try { const r = await Api.conspiracyAction(Number(id), kind, goal); showToast(r.message); await refreshAll(true); } catch (err) { showToast(`⚠️ ${err.message}`); } }));
    document.querySelectorAll('[data-dynasty-extra]').forEach((card) => { card.addEventListener('click', () => { const b = document.querySelector('.nav-item[data-panel="dinastia"]'); if (b) b.click(); }); });
  }
  el('charSearch').addEventListener('input', (e) => { state.charSearch = e.target.value; renderCharacters(); });
  el('charSort').addEventListener('change', (e) => { state.charSort = e.target.value; renderCharacters(); });
  el('charKindFilter').addEventListener('change', (e) => { state.charKind = e.target.value; renderCharacters(); });
  el('charStatusFilter').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-charstatus]');
    if (!btn) return;
    state.charStatusFilter = btn.dataset.charstatus;
    el('charStatusFilter').querySelectorAll('.category-chip').forEach(b => b.classList.toggle('active', b === btn));
    renderCharacters();
  });

  const charModalOverlay = el('characterModalOverlay');
  const charModalBody = el('characterModalBody');

  const CH_TABS = [['perfil', '🧑 Perfil'], ['historia', '📖 História'], ['familia', '👪 Família'], ['relacoes', '🤝 Relações'], ['vida', '🕰️ Vida'], ['agir', '💬 Interagir']];
  let chState = { id: null, tab: 'perfil', data: null };
  async function openCharacterModal(id, keepTab) {
    chState.id = id; if (!keepTab) chState.tab = 'perfil';
    charModalBody.innerHTML = '<p class="hint">Consultando os arquivos do reino…</p>';
    charModalOverlay.classList.remove('hidden');
    try { chState.data = await Api.getCharacter(id); renderCharacterModal(); }
    catch (err) { charModalBody.innerHTML = `<p class="hint" style="color:#7a1f2b;">${err.message}</p>`; }
  }
  function renderCharacterModal() {
    const c = chState.data; const tab = chState.tab;
    const moodIcon = c.mood >= 70 ? '😊' : c.mood >= 45 ? '😐' : c.mood >= 25 ? '😟' : '😠';
    const bar = (label, v, color) => `<div class="ficha-attr-row"><div class="ficha-attr-head"><span>${label}</span><span>${Math.round(v)}</span></div><div class="ficha-attr-track"><div class="ficha-attr-fill" style="width:${v}%;${color ? 'background:' + color + ';' : ''}"></div></div></div>`;
    let body = '';
    if (tab === 'perfil') {
      body = `${c.death ? `<div class="pop-alert">⚰️ Faleceu no dia ${c.death.day} (${escapeHtml(c.death.cause || '')}).${c.death.heir ? ` Herdeiro: <a href="#" data-ch-open="${c.death.heir.id}">${escapeHtml(c.death.heir.name)}</a>.` : ' Sem herdeiros: o cargo ficou vago.'}</div>` : ''}${c.predecessor ? `<div class="hint">👑 Sucedeu <a href="#" data-ch-open="${c.predecessor.id}">${escapeHtml(c.predecessor.name)}</a> no cargo.</div>` : ''}<div class="ficha-meta"><span>🎂 ${c.age} anos</span><span>${c.sex === 'F' ? '♀️ Feminino' : '♂️ Masculino'}</span><span>🎭 ${escapeHtml(c.personality)}</span><span>📍 ${escapeHtml(c.birthplace)}</span><span>💍 ${escapeHtml(c.marital)}</span><span>💰 Riqueza ${fmt(c.wealth)}</span><span>🌟 Influência ${c.influence}</span>${c.residence ? `<span>🏠 Mora em ${escapeHtml(c.residence.name)}</span>` : '<span>🏠 Mora na capital</span>'}</div>
        ${c.special.length ? `<div class="bc-stats">${c.special.map(x => `<span class="bc-stat prod">${x.icon} ${escapeHtml(x.label)}: ${escapeHtml(x.text)}</span>`).join('')}</div>` : ''}
        <div class="ficha-section-title">Estado atual</div><div class="ficha-attrs">${bar('❤️ Lealdade à coroa', c.loyalty, c.loyalty < 35 ? '#c0392b' : '')}${bar('⭐ Reputação', c.reputation)}${bar(`${moodIcon} Humor`, c.mood, c.mood < 30 ? '#c0392b' : '')}${bar('🩺 Saúde', c.health, c.health < 35 ? '#c0392b' : '')}</div>
        <div class="ficha-section-title">Traços de personalidade</div><div class="pol-laws">${c.traits.map(t => `<div class="pol-law"><div class="pl-head"><span>${t.icon} <strong>${escapeHtml(t.name)}</strong></span></div><div class="hint">${escapeHtml(t.desc)}</div></div>`).join('')}</div>
        <div class="ficha-section-title">Desejos e medos</div><div class="hint">🎯 ${escapeHtml(c.ambition || '')}<br>😨 ${escapeHtml(c.fear || '')}<br>🎨 ${escapeHtml(c.hobby || '')}<br>🗣️ Lema: «${escapeHtml(c.motto || '')}»<br>🔒 Segredo: ${c.secretKnown ? escapeHtml(c.secret) + (c.secretInfo && c.secretInfo.state !== 'oculto' && c.secretInfo.state !== 'conhecido' ? ` <em>(${c.secretInfo.state === 'vazou' ? 'vazou!' : 'resolvido'})</em>` : '') : '<em>desconhecido — mande investigar na aba Interagir</em>'}${c.secretInfo && c.secretInfo.hint ? `<br>👁️ ${escapeHtml(c.secretInfo.hint)}` : ''}${c.secretInfo && c.secretInfo.outcome ? `<br>📜 Desfecho: ${escapeHtml(c.secretInfo.outcome)}` : ''}${c.conspiracy ? `<br>🕸️ Membro da conspiração <strong>${escapeHtml(c.conspiracy.name)}</strong> (${escapeHtml(c.conspiracy.role)})` : ''}${c.secretInfo && c.secretInfo.partner && c.secretInfo.partner.agent ? `<br>🌍 Agente estrangeiro: <strong>${escapeHtml(c.secretInfo.partner.agent.name)}</strong>, ${escapeHtml(c.secretInfo.partner.agent.role.toLowerCase())} de ${escapeHtml(c.secretInfo.partner.aiName || '')} (${escapeHtml(c.secretInfo.partner.agent.status)})` : ''}${c.secretInfo && c.secretInfo.partner && !c.secretInfo.partner.agent ? `<br>🤝 Envolvid${c.secretInfo.partner.kind === 'ai' ? 'o: reino de' : 'o(a):'} ${c.secretInfo.partner.kind === 'char' ? `<a href="#" data-ch-open="${c.secretInfo.partner.id}">${escapeHtml(c.secretInfo.partner.name)}</a>` : escapeHtml(c.secretInfo.partner.name)}${c.secretInfo.partner.kind === 'char' && !c.secretInfo.partner.active ? ' (já não está no cargo)' : ''}` : ''}</div>
        <div class="ficha-section-title">Atributos</div><div class="ficha-attrs">${c.attributes.map(a => bar(escapeHtml(a.label), a.value)).join('')}</div>`;
    } else if (tab === 'historia') {
      body = `<div class="ficha-bio" style="white-space:pre-line;">${escapeHtml(c.backstory)}</div><div class="ficha-section-title">Bio original</div><div class="hint">${escapeHtml(c.bio || '—')}</div>`;
    } else if (tab === 'familia') {
      const groups = [['Pais', r => ['pai', 'mãe'].includes(r.relation)], ['Cônjuge', r => ['esposa', 'marido'].includes(r.relation)], ['Filhos', r => ['filho', 'filha'].includes(r.relation)], ['Irmãos', r => ['irmão', 'irmã'].includes(r.relation)]];
      body = groups.map(([title, f]) => { const list = c.relatives.filter(f); return `<div class="ficha-section-title">${title}</div><div class="pol-laws">${list.map(r => `<div class="pol-law" style="${r.status === 'falecido' ? 'opacity:.6;' : ''}"><div class="pl-head"><span>${r.sex === 'F' ? '👩' : '👨'} <strong>${escapeHtml(r.name)}</strong> · ${escapeHtml(r.relation)}</span><span class="bc-level">${r.status === 'falecido' ? '🕯️ falecido(a)' : r.age + ' anos'}</span></div><div class="hint">${escapeHtml(r.occupation || '')}${r.note ? ' — ' + escapeHtml(r.note) : ''}</div></div>`).join('') || '<p class="hint">Ninguém registrado.</p>'}</div>`; }).join('');
    } else if (tab === 'relacoes') {
      body = `<p class="hint">Amizades e rivalidades se formam com o tempo, por eventos da vida.</p><div class="pol-laws">${c.bonds.map(b => `<div class="pol-law" data-ch-open="${b.id}" style="cursor:pointer;"><div class="pl-head"><span>${b.icon} <strong>${escapeHtml(b.name)}</strong> · ${escapeHtml(b.role)}</span><span class="bc-level">${b.kind === 'amizade' ? '🤝 amizade' : '⚔️ rivalidade'} ${b.strength}</span></div></div>`).join('') || '<p class="hint">Sem vínculos marcantes ainda.</p>'}</div>`;
    } else if (tab === 'vida') {
      body = `<ul class="ficha-history-list">${c.history.map(h => `<li><span>${h.icon}</span><div><span class="fh-day">DIA ${h.day}</span>${escapeHtml(h.title)}</div></li>`).join('') || '<li>Nenhum evento registrado ainda.</li>'}</ul>`;
    } else if (tab === 'agir') {
      body = c.status !== 'ativo' ? '<p class="hint">Este personagem não está mais no reino.</p>' : `<p class="hint">Cada interação tem sorteio e consequências reais. ${c.canTalk ? '' : `Aguarde ${c.talkWait} dia(s) para conversar ou pedir conselho de novo.`}</p>
        <div class="tech-controls"><button class="btn btn-primary" data-chact="conversar" ${c.canTalk ? '' : 'disabled'}>💬 Conversar</button><button class="btn btn-secondary" data-chact="consultar" ${c.canTalk ? '' : 'disabled'}>🧠 Pedir conselho</button><button class="btn btn-ghost" data-chact="investigar">🕵️ Investigar segredos (💰100)</button></div>
        <div class="tech-controls"><input type="number" id="chGift" min="10" max="2000" value="100" style="width:90px;"><button class="btn btn-secondary" data-chact="presentear">🎁 Presentear (💰)</button></div>
        ${c.secretInfo && c.secretInfo.canAct ? `<div class="ficha-section-title">🔓 Segredo descoberto ${infoBtn('char_secret')}</div><div class="hint">${escapeHtml(c.secret || '')}. Cada resposta tem consequências reais (algumas com sorteio)${c.secretInfo.partner ? ` — e afeta também ${escapeHtml(c.secretInfo.partner.name)}` : ''}:</div><div class="tech-controls">${c.secretInfo.options.map(o => `<button class="btn btn-secondary btn-sm" data-chsecret="${o.key}">${escapeHtml(o.label)}${o.chance < 100 ? ` · ${o.chance}%` : ''}</button>`).join('')}</div>` : (c.secretKnown ? '<div class="hint">O segredo desta pessoa já foi resolvido.</div>' : '')}
        <div class="tech-controls"><label class="hint">Residência</label><select id="chResidence"><option value="">Capital</option>${c.residences.filter(r => !r.isCapital).map(r => `<option value="${r.id}" ${c.residence && c.residence.id === r.id ? 'selected' : ''}>${escapeHtml(r.name)}</option>`).join('')}</select><button class="btn btn-ghost" data-chact="residencia">🏠 Mudar</button></div>`;
    }
    charModalBody.innerHTML = `
      <div class="ficha-head"><span class="ficha-icon">${c.icon}</span><div><div class="ficha-name">${escapeHtml(c.name)}</div><div class="ficha-role">${escapeHtml(c.role)} · ${c.age} anos ${c.status !== 'ativo' ? '· ' + c.status : ''}</div></div></div>
      <div class="category-filter" id="chTabs">${CH_TABS.map(([k, l]) => `<button class="category-chip ${tab === k ? 'active' : ''}" data-chtab="${k}">${l}</button>`).join('')}</div>
      <div id="chBody">${body}</div>`;
    charModalBody.querySelectorAll('[data-chtab]').forEach(b => b.addEventListener('click', () => { chState.tab = b.dataset.chtab; renderCharacterModal(); }));
    charModalBody.querySelectorAll('[data-ch-open]').forEach(b => b.addEventListener('click', (e) => { e.preventDefault(); openCharacterModal(b.dataset.chOpen); }));
    charModalBody.querySelectorAll('[data-chsecret]').forEach(b => b.addEventListener('click', async () => {
      try { const r = await Api.characterAction(c.id, 'segredo', b.dataset.chsecret); showToast(r.message); await refreshAll(true); await openCharacterModal(c.id, true); } catch (err) { showToast(`⚠️ ${err.message}`); }
    }));
    charModalBody.querySelectorAll('[data-chact]').forEach(b => b.addEventListener('click', async () => {
      const kind = b.dataset.chact; const amount = kind === 'presentear' ? Number(el('chGift').value) : kind === 'residencia' ? (el('chResidence').value || null) : undefined;
      try { const r = await Api.characterAction(c.id, kind, amount); showToast(r.message); await refreshAll(true); await openCharacterModal(c.id, true); }
      catch (err) { showToast(`⚠️ ${err.message}`); }
    }));
  }
  el('characterModalClose').addEventListener('click', () => charModalOverlay.classList.add('hidden'));
  charModalOverlay.addEventListener('click', (e) => { if (e.target === charModalOverlay) charModalOverlay.classList.add('hidden'); });

  // ==============================================================
  // HISTÓRICO
  // ==============================================================
  function renderHistory() {
    el('historyList').innerHTML = state.kingdom.history.map(h => `
      <li>
        <span class="h-icon">${h.icon}</span>
        <div><span class="h-year">ANO ${h.year}</span><span class="h-title">${escapeHtml(h.title)}</span></div>
      </li>
    `).join('');
  }

  // ==============================================================
  // NAVEGAÇÃO ENTRE ABAS
  // ==============================================================
  function goToPanel(panelName) {
    const btn = document.querySelector(`.nav-item[data-panel="${panelName}"]`);
    if (!btn) return;
    document.querySelectorAll('.nav-item').forEach(b => b.classList.toggle('active', b === btn));
    document.querySelectorAll('.dash-panel').forEach(p => p.classList.toggle('active', p.dataset.panel === panelName));
    if (panelName === 'mapa') { if (state.fullMapLoaded) refreshMapData(true); else loadFullMap(); }
    if (panelName === 'painel') refreshMiniMap();
    try { document.dispatchEvent(new CustomEvent('kot:panel', { detail: panelName })); } catch { /* noop */ }
  }
  document.querySelectorAll('.nav-item').forEach((btn) => {
    btn.addEventListener('click', () => goToPanel(btn.dataset.panel));
  });

  // Etapa 20: mapeia palavras-chave da notificação para a aba relevante
  const NOTIF_PANEL_KEYWORDS = [
    [/OBRA CONCLUÍDA|DESASTRE NA INFRA|SABOTAGEM:|MANUTENÇÃO NECESSÁRIA|manutenção da infra|Comboio|comboio|Cais |FALTA DE CARVÃO|torre de teletransporte|naufrágio|NAUFRÁGIO|Piratas atacaram|Porto .* concluído|concluído em/i, 'infra'],
    [/CISMA|CONFLITO RELIGIOSO|CULTO SECRETO|ARQUEOLOGIA|relíquia|milagre|texto sagrado|religião de Estado|abandonou .* e adotou|desapareceu: restam|fé de /i, 'religiao'],
    [/herdeiro|dinast|casa nobre|sucess|regente|regência|ilegítim|pretendente|testamento|herança|escândalo|REVOLTA NOBRE|ASCENSÃO SOCIAL|EXTINGUIU|Nasceu/i, 'dinastia'],
    [/construç|evolu|trabalhador|moradia|desempreg/i, 'construcoes'],
    [/armazém|armazenamento|estoque/i, 'painel'],
    [/população|doença|morte|habitante/i, 'populacao'],
    [/exército|batalha|general|cerco|prisioneiro|mercenári/i, 'guerra'],
    [/caravana|comércio|rota|mercador|tarifa/i, 'comercio'],
    [/diplomacia|tratado|guerra declarada|aliança/i, 'diplomacia'],
    [/crime|criminos|guarda|detetive|juiz|prisão|procurado/i, 'seguranca'],
    [/festival|religiã|cultura|sacerdote|artista|peregrina/i, 'cultura'],
    [/tecnologia|pesquisa|conhecimento/i, 'tecnologia'],
    [/expedição|exploração|descoberta|artefato/i, 'exploracao'],
    [/lei|corrupção|golpe|eleição|reforma/i, 'politica'],
  ];
  function guessNotifPanel(message) {
    for (const [re, panel] of NOTIF_PANEL_KEYWORDS) if (re.test(message)) return panel;
    return null;
  }

  // ==============================================================
  // CONFIGURAÇÕES
  // ==============================================================
  function fillConfigForm() {
    const user = Api.getUser();
    el('configUsername').value = user?.username || '';
    el('configKingdomName').value = state.kingdom.name;
    el('configRulerName').value = state.kingdom.rulerName;
  }

  el('saveConfigBtn').addEventListener('click', async () => {
    const alertBox = el('configAlert');
    alertBox.className = 'alert alert-success';
    const btn = el('saveConfigBtn');
    btn.disabled = true;
    try {
      state.kingdom = await Api.updateKingdom({
        name: el('configKingdomName').value.trim(),
        rulerName: el('configRulerName').value.trim(),
      });
      renderHeader();
      renderOverview();
      alertBox.textContent = 'Alterações salvas com sucesso.';
      alertBox.classList.add('show');
      setTimeout(() => alertBox.classList.remove('show'), 2500);
    } catch (err) {
      alertBox.className = 'alert alert-error show';
      alertBox.textContent = err.message;
    } finally {
      btn.disabled = false;
    }
  });

  function logout() {
    Api.logout().catch(() => {}).finally(() => { Api.clearSession(); window.location.href = 'index.html'; }); // encerra a sessão NO SERVIDOR (apaga o cookie)
  }
  el('logoutBtn').addEventListener('click', logout);
  el('logoutBtn2').addEventListener('click', logout);

  // ==============================================================
  // BOOT + REFRESH
  // ==============================================================
  // ==============================================================
  // POLITICA (Etapa 9): grupos, demandas, leis, reformas, conselho, dinastia
  // ==============================================================
  const POL_TABS = [
    ['visao', '🏛️ Visão Geral'], ['grupos', '🤝 Grupos e Demandas'], ['leis', '📜 Leis'], ['reformas', '🗳️ Reformas'],
    ['conselho', '🪑 Conselho'], ['dinastia', '👑 Dinastia'], ['sociedade', '⚖️ Sociedade'], ['historia', '📖 História Política'],
  ];
  const EFFECT_LABELS = { happiness: '😊 Felicidade', stability: '🛡️ Estabilidade', goldPct: '💰 Ouro', growth: '👥 Crescimento', corruption: '🕵️ Corrupção', popularity: '❤️ Popularidade' };
  function polBar(pct, kind) {
    const v = Math.max(0, Math.min(100, pct));
    const cls = kind === 'bad' ? (v > 60 ? 'bad' : v > 35 ? 'mid' : 'good') : (v >= 60 ? 'good' : v >= 35 ? 'mid' : 'bad');
    return `<div class="pol-track"><div class="pol-fill ${cls}" style="width:${v}%"></div></div>`;
  }
  function polMeter(icon, label, value, info, kind) {
    return `<div class="pol-meter"><div class="pm-head"><span>${icon} ${label} ${info ? infoBtn(info) : ''}</span><strong>${Math.round(value)}%</strong></div>${polBar(value, kind)}</div>`;
  }
  function effectsText(o) {
    const parts = Object.entries(o.effects || {}).map(([k, v]) => `${EFFECT_LABELS[k] || k} ${v > 0 ? '+' : ''}${v}`);
    const g = Object.entries(o.groups || {}).map(([k, v]) => { const gr = (state.politics.groups.find(x => x.key === k) || {}); return `${gr.icon || ''}${gr.name || k} ${v > 0 ? '+' : ''}${v}`; });
    return `${parts.map(x => `<span class="bc-stat">${x}</span>`).join('')}${g.map(x => `<span class="bc-stat pol-group-chip">${x}</span>`).join('')}` || '<span class="hint">Sem efeitos (situação padrão)</span>';
  }

  function renderPolitics() {
    const p = state.politics;
    if (!p) return;
    el('polTabs').innerHTML = POL_TABS.map(([k, label]) => `<button class="category-chip ${state.polTab === k ? 'active' : ''}" data-poltab="${k}">${label}${k === 'grupos' && p.demands.length ? ` (${p.demands.length})` : ''}</button>`).join('');
    const body = el('politicsBody');
    const tab = state.polTab;
    let html = '';

    if (tab === 'visao') {
      html = `
        <div class="ficha-head"><span class="ficha-icon">${p.government.icon}</span>
          <div><div class="ficha-name">${escapeHtml(p.government.name)}</div>
          <div class="ficha-role">Governante: ${escapeHtml(p.ruler.name)}, ${p.ruler.age} anos${p.government.councilName ? ` · ${escapeHtml(p.government.councilName)}` : ' · governa por decreto'}</div></div></div>
        <div class="pol-grid">
          ${polMeter('❤️', 'Popularidade', p.popularity, 'popularity')}
          ${polMeter('🎖️', 'Reputação', p.reputation, 'reputation')}
          ${polMeter('🛡️', 'Estabilidade', p.stability, 'stability')}
          ${polMeter('😊', 'Felicidade', p.happiness, 'happiness')}
          ${polMeter('🕵️', 'Corrupção', p.corruption, 'corruption', 'bad')}
          ${polMeter('🔒', 'Segurança do governante', p.security, 'security')}
        </div>
        <div class="ficha-section-title">Distribuição do Poder Político ${infoBtn('power')}</div>
        ${p.power.map(x => `<div class="pol-power"><span class="pp-label">${x.label}</span><div class="pol-track"><div class="pol-fill power" style="width:${x.percent}%"></div></div><span class="pp-val">${x.percent}%</span></div>`).join('')}
        <div class="ficha-section-title">Risco de Golpe ${infoBtn('coup')}</div>
        <p class="hint">Se uma conspiração surgir, esta é a chance de ela dar certo (sorteio real):</p>
        <div class="bc-stats">${p.coup.mods.map(m => `<span class="bc-stat ${m.value > 0 ? 'cons' : 'prod'}">${m.label}: ${m.value > 0 ? '+' : ''}${m.value}%</span>`).join('')}<span class="bc-stat"><strong>Chance final: ${p.coup.final}%</strong></span></div>
        <div class="ficha-section-title">Efeitos das Leis e Reformas em Vigor</div>
        <div class="bc-stats">${Object.entries(p.modifiers).filter(([, v]) => Math.abs(v) > 0.01).map(([k, v]) => `<span class="bc-stat">${EFFECT_LABELS[k] || k} ${v > 0 ? '+' : ''}${Math.round(v * 10) / 10}</span>`).join('') || '<span class="hint">Nenhum modificador ativo.</span>'}</div>
        <div class="ficha-section-title">Combater a Corrupção</div>
        <button class="btn btn-secondary" data-pol-act="investigate">🕵️ Abrir Investigação (150 ouro)</button>
        <p class="hint">Pode descobrir corrupção, não achar provas ou até acusar um inocente. Cooldown de 10 dias.</p>`;
    }

    if (tab === 'grupos') {
      html = `<div class="ficha-section-title">📨 Demandas e Protestos Pendentes ${infoBtn('demands')}</div>` +
        (p.demands.length ? p.demands.map(d => `
          <div class="pol-demand ${d.kind === 'protesto' ? 'protest' : ''}">
            <div class="pd-head"><span>${d.group.icon} <strong>${escapeHtml(d.title)}</strong></span><span class="bc-level">${d.kind === 'protesto' ? '🔥 Protesto' : 'Demanda'}${d.status === 'postponed' ? ' (adiada)' : ''}</span></div>
            <p>${escapeHtml(d.text)}</p>
            ${d.status === 'pending' ? `<div class="pd-actions">
              <button class="btn btn-primary" data-pol-demand="${d.id}" data-action="accept">✅ Atender${d.acceptCost ? ` (${d.acceptCost}💰)` : ''}</button>
              <button class="btn btn-secondary" data-pol-demand="${d.id}" data-action="negotiate">🤝 Negociar (50💰)</button>
              <button class="btn btn-secondary" data-pol-demand="${d.id}" data-action="compensate">🎁 Compensar (100💰)</button>
              <button class="btn btn-ghost" data-pol-demand="${d.id}" data-action="postpone">⏳ Adiar</button>
              <button class="btn btn-ghost" data-pol-demand="${d.id}" data-action="refuse">❌ Recusar${d.kind === 'protesto' ? ' / Dispersar' : ''}</button>
            </div>` : '<p class="hint">Este pedido voltará em alguns dias.</p>'}
          </div>`).join('') : '<p class="hint">Nenhuma demanda no momento. Os grupos se manifestam conforme a situação do reino.</p>') +
        `<div class="ficha-section-title">Grupos Políticos ${infoBtn('groups')}</div>
        <div class="pol-groups">${p.groups.map(g => `
          <div class="pol-group">
            <div class="pg-head"><span>${g.icon} <strong>${escapeHtml(g.name)}</strong></span><span>${g.satisfaction}%</span></div>
            ${polBar(g.satisfaction)}
            <div class="hint">${escapeHtml(g.ideology)} · Líder: ${escapeHtml(g.leader)}</div>
            <div class="hint">Influência ${g.influence}% · ~${fmt(g.supporters)} apoiadores · Quer: ${escapeHtml(g.wants)}</div>
          </div>`).join('')}</div>` +
        (p.recentDemands.length ? `<div class="ficha-section-title">Decisões Recentes</div>${p.recentDemands.map(r => `<p class="hint">• <strong>${escapeHtml(r.title)}</strong>: ${escapeHtml(r.outcome || '')}</p>`).join('')}` : '');
    }

    if (tab === 'leis') {
      html = `<p class="hint">${p.government.hasCouncil ? `Neste governo as leis passam por VOTAÇÃO no ${escapeHtml(p.government.councilName)} — o resultado nunca é garantido.` : 'Neste governo o governante decreta leis diretamente.'} Cada alteração custa ${p.lawCost} ouro e a mesma lei só pode mudar a cada ${p.lawCooldown} dias. ${infoBtn('laws')}</p>` +
        (p.lastVote ? `<div class="pol-vote ${p.lastVote.passed ? 'ok' : 'fail'}">🗳️ Última votação: <strong>${escapeHtml(p.lastVote.title)}</strong> — ${p.lastVote.passed ? 'APROVADA' : 'REJEITADA'} (${p.lastVote.yes} a favor · ${p.lastVote.no} contra · ${p.lastVote.abstain} abstenções)</div>` : '') +
        Object.entries(p.lawCategories).map(([cat, label]) => `
          <div class="ficha-section-title">${label}</div>
          <div class="pol-laws">${p.laws.filter(l => l.category === cat).map(l => `
            <div class="pol-law">
              <div class="pl-head"><span>${l.icon} <strong>${escapeHtml(l.name)}</strong></span><span class="bc-level">${escapeHtml((l.options.find(o => o.key === l.current) || {}).label || '')}</span></div>
              <div class="hint">${escapeHtml(l.desc)}</div>
              ${l.options.map(o => `<div class="pl-opt ${o.key === l.current ? 'current' : ''}">
                <div><strong>${escapeHtml(o.label)}</strong>${o.key === l.current ? ' ✔ em vigor' : ''}</div>
                <div class="bc-stats">${effectsText(o)}</div>
                ${o.key === l.current ? '' : `<button class="btn btn-secondary" data-pol-law="${l.key}" data-option="${o.key}">${p.government.hasCouncil ? 'Propor ao ' + escapeHtml(p.government.councilName) : 'Decretar'}</button>`}
              </div>`).join('')}
            </div>`).join('')}</div>`).join('');
    }

    if (tab === 'reformas') {
      html = `<p class="hint">Reformas são projetos longos que custam ouro, precisam de apoio e geram oposição. Máximo de 2 ao mesmo tempo. ${infoBtn('reforms')}</p>
        <div class="pol-laws">${p.reforms.map(r => `
          <div class="pol-law">
            <div class="pl-head"><span>${r.icon} <strong>${escapeHtml(r.name)}</strong></span><span class="bc-level">${r.status === 'done' ? '✅ Concluída' : r.status === 'active' ? `⏳ ${r.daysRemaining}d` : 'Disponível'}</span></div>
            <div class="hint">${escapeHtml(r.desc)}</div>
            <div class="bc-stats"><span class="bc-stat">💰 ${r.cost}</span><span class="bc-stat">⏳ ${r.days} dias</span>
              <span class="bc-stat prod">Apoio: ${r.support.join(', ')} (${r.supportPct}%)</span><span class="bc-stat cons">Oposição: ${r.opposition.join(', ')}</span></div>
            <div class="bc-stats">${Object.entries(r.mods).map(([k, v]) => `<span class="bc-stat">${EFFECT_LABELS[k] || k} ${v > 0 ? '+' : ''}${v}</span>`).join('')}</div>
            ${r.status === 'disponivel' ? `<button class="btn btn-primary" data-pol-reform="${r.key}">Iniciar Reforma</button>` : ''}
          </div>`).join('')}</div>`;
    }

    if (tab === 'conselho') {
      html = p.government.hasCouncil ? `<div class="ficha-section-title">${escapeHtml(p.government.councilName)} ${infoBtn('council')}</div>
        <div class="characters-grid">${p.council.map(m => `
          <div class="character-card" style="cursor:default;">
            <span class="ch-icon">${m.groupIcon}</span><span class="ch-name">${escapeHtml(m.name)}</span>
            <span class="ch-role">${escapeHtml(m.group)} · ${m.age} anos</span>
            <div class="ch-stats"><span>❤️ Lealdade ${m.loyalty}</span><span>🎯 Influência ${m.influence}</span></div>
            <div class="hint">${escapeHtml(m.ideology)} · Riqueza ${fmt(m.wealth)}</div>
          </div>`).join('')}</div>
        ${p.lastVote ? `<div class="ficha-section-title">Última Votação: ${escapeHtml(p.lastVote.title)}</div>
          <div class="bc-stats">${p.lastVote.details.map(d => `<span class="bc-stat ${d.vote === 'favor' ? 'prod' : d.vote === 'contra' ? 'cons' : ''}">${d.vote === 'favor' ? '👍' : d.vote === 'contra' ? '👎' : '🤷'} ${escapeHtml(d.name)}</span>`).join('')}</div>` : ''}`
        : '<p class="hint">Seu governo não possui conselho ou parlamento: o governante decreta as leis. Para ter um, escolha um governo como República, Parlamentarismo ou Monarquia Constitucional.</p>';
    }

    if (tab === 'dinastia') {
      html = `<div class="ficha-section-title">Dinastia ${infoBtn('dynasty')}</div>
        <p class="hint">${p.government.hereditary ? 'Neste governo o poder passa por HERANÇA: o herdeiro mais velho assume; sem herdeiro maduro há regência ou crise de sucessão.' : p.government.elective ? 'Neste governo o sucessor é ELEITO; eleições acontecem a cada 4 ciclos de governo (320 dias).' : 'Neste governo a sucessão é decidida pela força: generais podem tomar o poder.'} O governante tem ${p.ruler.age} anos e, com a idade, o risco de morte cresce.</p>
        <div class="characters-grid">${p.dynasty.map(m => `
          <div class="character-card ${m.status !== 'vivo' ? 'character-inactive' : ''}" style="cursor:default;">
            <span class="ch-icon">${m.role === 'governante' ? '👑' : m.role === 'consorte' ? '💍' : (m.sex === 'F' ? '👧' : '👦')}</span>
            <span class="ch-name">${escapeHtml(m.name)}</span>
            <span class="ch-role">${m.role === 'governante' ? 'Governante' : m.role === 'consorte' ? 'Consorte' : 'Herdeiro(a)'} · ${m.age} anos</span>
            ${m.status !== 'vivo' ? `<span class="ch-status-badge">${m.status}</span>` : ''}
          </div>`).join('')}</div>`;
    }

    if (tab === 'sociedade') {
      const classes = (state.population && state.population.economicClasses) || [];
      html = `<div class="ficha-section-title">Desigualdade ${infoBtn('inequality')}</div>` +
        (p.inequality ? `<div class="pol-grid">${polMeter('⚖️', 'Índice de desigualdade', p.inequality.gini, null, 'bad')}
          <div class="pol-meter"><div class="pm-head"><span>🏆 Riqueza dos 2 estratos mais ricos</span><strong>${p.inequality.topShare}%</strong></div></div>
          <div class="pol-meter"><div class="pm-head"><span>😞 População pobre ou miserável</span><strong>${p.inequality.poorPct}%</strong></div></div></div>` : '') +
        `<div class="ficha-section-title">Classes Sociais</div><div class="economic-classes">${classes.map(c => `
          <div class="eco-class-row"><span class="ec-icon">${c.icon}</span><span class="ec-label">${escapeHtml(c.label)}</span>
          <div class="ec-track"><div class="ec-fill" style="width:${c.percent}%"></div></div><span class="ec-value">${fmt(c.count)} (${c.percent}%)</span></div>`).join('')}</div>`;
    }

    if (tab === 'historia') {
      html = `<div class="ficha-section-title">Linha do Tempo Política</div>` +
        (p.history.length ? `<ul class="history-list">${p.history.map(h => `<li><span class="h-icon">${h.icon}</span><div><span class="h-year">ANO ${h.year}</span><span class="h-title">${escapeHtml(h.title)}</span></div></li>`).join('')}</ul>` : '<p class="hint">Nenhum acontecimento político registrado ainda.</p>');
    }

    body.innerHTML = html;
  }

  async function polAction(fn, okPrefix) {
    try {
      const r = await fn();
      showToast(`${okPrefix} ${r.message || ''}`);
      await refreshAll(true);
    } catch (err) { showToast(`⚠️ ${err.message}`); }
  }
  el('polTabs').addEventListener('click', (e) => {
    const b = e.target.closest('[data-poltab]');
    if (!b) return;
    state.polTab = b.dataset.poltab;
    renderPolitics();
  });
  el('politicsBody').addEventListener('click', (e) => {
    const t = e.target.closest('button');
    if (!t) return;
    if (t.dataset.polDemand) polAction(() => Api.resolveDemand(t.dataset.polDemand, t.dataset.action), '🏛️');
    else if (t.dataset.polLaw) polAction(async () => {
      const r = await Api.enactLaw(t.dataset.polLaw, t.dataset.option);
      return r;
    }, '📜');
    else if (t.dataset.polReform) polAction(() => Api.startReform(t.dataset.polReform), '🗳️');
    else if (t.dataset.polAct === 'investigate') polAction(() => Api.investigate(), '🕵️');
  });

  // ==============================================================
  // TECNOLOGIA (Etapa 10): arvore, pesquisa, pesquisadores, educacao, invencoes
  // ==============================================================
  const TECH_TABS = [
    ['arvore', '🌳 Árvore Tecnológica'], ['pesquisa', '🔬 Pesquisa'], ['pesquisadores', '🎓 Pesquisadores'], ['educacao', '📚 Educação'],
    ['invencoes', '💡 Invenções'], ['descobertas', '🌠 Descobertas'], ['reinos', '🌍 Outros Reinos'], ['historia', '📖 História Científica'],
  ];
  const TECH_EFFECT_LABELS = { foodPct: '🌾 Comida', woodPct: '🌳 Madeira', stonePct: '🧱 Pedra', ironPct: '⛏️ Ferro', coalPct: '⚫ Carvão', copperPct: '🟤 Cobre', silverPct: '🥈 Prata',
    crystalsPct: '💎 Cristais', manaPct: '🔮 Mana', goldPct: '💰 Ouro', buildSpeed: '🏗️ Velocidade de obra', maintenancePct: '🔧 Manutenção', happiness: '😊 Felicidade', stability: '🛡️ Estabilidade',
    growth: '👥 Crescimento', knowledgePct: '📚 Conhecimento', health: '⚕️ Saúde (menos mortes)', corruption: '🕵️ Corrupção' };
  const techEffText = (eff) => Object.entries(eff).map(([k, v]) => `<span class="bc-stat prod">${TECH_EFFECT_LABELS[k] || k} ${v > 0 ? '+' : ''}${v}${/Pct|buildSpeed|health/.test(k) ? '%' : ''}</span>`).join('');
  const SOURCE_LABEL = { pesquisa: 'pesquisada', roubada: '🕵️ roubada', perdida: '📜 recuperada', secundaria: '✨ descoberta' };

  function techHeader(t) {
    const era = t.era;
    return `<div class="pol-grid">
      <div class="pol-meter"><div class="pm-head"><span>📚 Conhecimento ${infoBtn('knowledge')}</span><strong>${fmt(t.knowledge)}</strong></div><div class="hint">+${t.knowledgePerDay}/dia (popular ${t.knowledgeBreakdown.popular} · instituições ${t.knowledgeBreakdown.instituicoes} · pesquisadores ${t.knowledgeBreakdown.pesquisadores} · bônus ${t.knowledgeBreakdown.bonusPct}%)</div></div>
      <div class="pol-meter"><div class="pm-head"><span>${era.icon} ${escapeHtml(era.name)} ${infoBtn('era')}</span><strong>Nível ${t.techLevel}</strong></div><div class="hint">${era.magic ? `${era.magic.icon} ${escapeHtml(era.magic.name)} · ` : ''}${era.next ? `Próxima: ${era.next.icon} ${escapeHtml(era.next.name)} (faltam ${era.next.need})` : 'Era máxima alcançada'}</div></div>
      <div class="pol-meter"><div class="pm-head"><span>🔬 Tecnologias ${infoBtn('tech')}</span><strong>${t.techsDone}/${t.techsTotal}</strong></div>${polBar((t.techsDone / t.techsTotal) * 100)}</div>
    </div>`;
  }

  function techNode(tc) {
    const badge = { done: '✅', active: '⏳', available: '🔓', locked: '🔒' }[tc.status];
    return `<div class="tech-node ${tc.status}">
      <div class="tn-head"><span class="tn-icon">${tc.icon}</span><div><strong>${escapeHtml(tc.name)}</strong><div class="hint">Nível ${tc.tier}${tc.combo ? ' · 🔗 combinação' : ''}${tc.risky ? ' · ⚠️ arriscada' : ''}</div></div><span class="tn-badge">${badge}</span></div>
      <div class="bc-stats">${techEffText(tc.effects)}</div>
      ${tc.unlocks ? `<div class="hint">🔓 Libera: ${[...tc.unlocks.buildings, ...tc.unlocks.units].map(escapeHtml).join(', ')}</div>` : ''}
      ${tc.requires.length ? `<div class="hint">Requer: ${tc.requires.map(r => `<span class="${r.done ? 'req-ok' : 'req-no'}">${r.done ? '✔' : '✘'} ${escapeHtml(r.name)}</span>`).join(' · ')}</div>` : ''}
      ${tc.status === 'done' ? `<div class="hint">${SOURCE_LABEL[tc.source] || 'concluída'}</div>`
        : tc.status === 'active' ? `<div class="hint">⏳ ${tc.daysRemaining} dias restantes</div>`
        : `<div class="bc-cost"><span class="bc-stat">💰 ${tc.costGold}</span><span class="bc-stat">📚 ${tc.costKnowledge}</span><span class="bc-stat">⏳ ${tc.days}d</span></div>`}
      ${tc.status === 'available' ? `<button class="btn btn-primary" data-tech-start="${tc.key}">Pesquisar</button>` : ''}
    </div>`;
  }

  const { ARMY_STATUS, WR_TABS, WR_TIER_CLASS, expedOverlay, openQuickExpedition, renderDiplomacy, renderExploration, renderTech, renderTradeIntl } = window.KOT.panels['tecnologia-comercio']({ TECH_EFFECT_LABELS, TECH_TABS, TERRAIN_ICON, TERRAIN_LABEL, el, escapeHtml, fmt, infoBtn, polBar, polMeter, refreshAll, showToast, state, techEffText, techHeader, techNode }); // Etapa 66: extraído para js/painel-tecnologia-comercio.js
  function battleVisualHtml(battle) {
    const r = battle.report;
    const won = ['vitoria', 'vitoria_decisiva'].includes(r.tier) === (battle.mode !== 'defesa');
    const resultClass = r.tier.includes('vitoria') ? 'battle-win' : r.tier === 'empate' ? 'battle-draw' : 'battle-loss';
    const atkIcons = (r.attackerLosses && r.attackerLosses.length ? r.attackerLosses : [{ icon: r.isNaval ? '⛵' : '💂', lost: 0 }]).map(l => l.icon);
    const defIcon = r.isNaval ? '🚢' : (battle.mode === 'defesa' ? '⚔️' : '🏰');
    return `<div class="battle-visual ${resultClass}">
      <div class="bv-side bv-attacker">${atkIcons.map(ic => `<span class="bv-unit">${ic}</span>`).join('')}</div>
      <div class="bv-clash">${r.tierIcon}</div>
      <div class="bv-side bv-defender"><span class="bv-unit bv-def-icon">${defIcon}</span><span class="bv-unit">${escapeHtml(r.territory ? (TERRAIN_ICON[r.territory.terrain] || '🏳️') : '🏳️')}</span></div>
    </div>`;
  }
  function armyCompHtml(comp) {
    return comp.map(u => `<span class="bc-stat">${u.icon} ${escapeHtml(u.name)}: ${u.qty}</span>`).join('') || '<span class="hint">Sem unidades</span>';
  }

  const { dyChip, dyFilterPartners, dySexIcon, dyStatBars, renderCulture, renderDynasty, renderMagic, renderSecurity, renderWar } = window.KOT.panels['guerra-cultura']({ ARMY_STATUS, TECH_EFFECT_LABELS, TERRAIN_ICON, TERRAIN_LABEL, WR_TABS, WR_TIER_CLASS, armyCompHtml, battleVisualHtml, el, escapeHtml, expedOverlay, fmt, infoBtn, loadDynastyTree, polBar, refreshAll, renderFamiliesList, showToast, state }); // Etapa 66: extraído para js/painel-guerra-cultura.js
  async function loadDynastyTree() {
    const dy = state.dynasty; const famId = state.dyFamily || (dy.royalFamily && dy.royalFamily.id); const box = el('dyTree');
    if (!famId || !box) return;
    try {
      const { members } = await Api.getDynastyGenealogy(famId);
      const byId = new Map(members.map(m => [m.id, m]));
      const gens = [...new Set(members.map(m => m.generation))].sort((a, b) => a - b);
      box.innerHTML = gens.map(g => `<div class="ficha-section-title">Geração ${g + 1}</div><div class="bc-stats">${members.filter(m => m.generation === g).map(m => {
        const sp = m.spouseId ? byId.get(m.spouseId) : null;
        return `<span style="display:inline-flex;gap:3px;align-items:center;">${dyChip(m)}${sp && sp.generation === g && m.id < sp.id ? `<span>⚭</span>${dyChip(sp)}` : ''}</span>`;
      }).join('')}</div>`).join('') || '<p class="hint">Sem membros registrados.</p>';
    } catch (err) { box.innerHTML = `<p class="hint">${escapeHtml(err.message)}</p>`; }
  }
  function renderFamiliesList() {
    const dy = state.dynasty; const box = el('dyFamList'); if (!box) return;
    const q = (state.dySearch || '').toLowerCase(), kind = state.dyKind || '', sort = (el('dyFamSort') && el('dyFamSort').value) || 'prestige';
    let list = dy.families.filter(f => (!q || f.name.toLowerCase().includes(q)) && (!kind || f.kind === kind));
    list.sort((a, b) => sort === 'name' ? a.name.localeCompare(b.name) : sort === 'wealth' ? b.wealth - a.wealth : sort === 'alive' ? b.aliveCount - a.aliveCount : b.prestige - a.prestige);
    box.innerHTML = `<div class="characters-grid">${list.map(f => `<div class="character-card" style="cursor:default;${f.status !== 'ativa' ? 'opacity:.55;' : ''}">
      <span class="ch-icon">${f.symbol}</span><span class="ch-name">${escapeHtml(f.name)}</span><span class="ch-role">${f.kindIcon} ${escapeHtml(f.kindName)}${f.status !== 'ativa' ? ' (extinta)' : ''}${f.declining ? ' · 📉 em declínio' : ''}</span>
      <div class="ch-stats"><span>⭐ ${f.prestige}</span><span>💰 ${f.wealth}</span><span>👥 ${f.aliveCount}/${f.totalCount}</span></div>
      <div class="hint">${f.head ? 'Chefe: ' + escapeHtml((f.head.title ? f.head.title + ' ' : '') + f.head.name) : ''}</div>
      <div class="hint">Origem: ${escapeHtml(f.origin || '—')}</div>
      <button class="btn btn-ghost" data-dytree="${f.id}" style="margin-top:4px;">🌳 Ver árvore</button></div>`).join('') || '<p class="hint">Nenhuma família encontrada.</p>'}</div>`;
  }

  async function openDynastyMember(id) {
    try {
      const d = await Api.getDynastyMember(id);
      const m = d.member;
      const link = (x) => x ? `<button class="bc-stat dy-chip" data-dymember="${x.id}" style="cursor:pointer;">${dySexIcon(x)} ${escapeHtml(x.name)} (${x.status === 'falecido' ? '✝' : x.age})</button>` : '<span class="hint">—</span>';
      const fam = state.dynasty.families.find(f => f.id === m.familyId);
      const heirsOfFam = fam ? state.dynasty.succession : [];
      el('expedModalBody').innerHTML = `
        <h3>${m.personality ? m.personality.icon : '👤'} ${m.title ? escapeHtml(m.title) + ' ' : ''}${escapeHtml(m.name)}</h3>
        <p class="hint">${m.stageIcon} ${m.stage} · ${m.age} anos · ${m.sex === 'F' ? 'mulher' : 'homem'} · ${m.status === 'falecido' ? '🕯️ Falecido(a)' + (m.deathCause ? ' (' + escapeHtml(m.deathCause) + ')' : '') : m.status === 'vivo' ? 'Vivo(a)' : escapeHtml(m.status)}${m.familyName ? ' · Casa ' + escapeHtml(m.familyName) : ''}${d.foreignKingdom ? ' · 🌍 ligação com ' + escapeHtml(d.foreignKingdom) : ''}</p>
        <div class="bc-stats">${m.personality ? `<span class="bc-stat">${m.personality.icon} ${m.personality.name}</span>` : ''}<span class="bc-stat">❤️ Saúde ${m.health}</span>${m.disease ? `<span class="bc-stat cons">🤒 ${escapeHtml(m.disease)}</span>` : ''}
          ${m.education ? `<span class="bc-stat prod">🎓 ${escapeHtml(m.education.name)}</span>` : ''}${m.legit === 0 ? '<span class="bc-stat cons">🍃 Ilegítimo</span>' : m.legit === 2 ? '<span class="bc-stat">Reconhecido</span>' : ''}${m.adopted ? '<span class="bc-stat">🤝 Adotado</span>' : ''}${d.isFamilyHead ? '<span class="bc-stat prod">👑 Chefe da casa</span>' : ''}</div>
        ${dyStatBars(m.stats)}
        <div class="ficha-section-title">Família</div>
        <div class="bc-stats"><span>Pai:</span>${link(d.father)}<span>Mãe:</span>${link(d.mother)}<span>Cônjuge:</span>${link(d.spouse)}</div>
        <div class="bc-stats"><span>Irmãos:</span>${d.siblings.map(link).join('') || '<span class="hint">—</span>'}</div>
        <div class="bc-stats"><span>Filhos:</span>${d.children.map(link).join('') || '<span class="hint">—</span>'}</div>
        ${d.will ? `<p class="hint">📜 Testamento: ${escapeHtml(d.will.heirName || '')} herdará a chefia da casa.</p>` : ''}
        ${m.status === 'vivo' ? `<div class="ficha-section-title">Ações</div><div class="tech-controls">
          ${m.role !== 'governante' ? `<button class="btn btn-secondary" data-dyact="exilar:${m.id}">🚪 Exilar</button><button class="btn btn-ghost" data-dyact="deserdar:${m.id}">📜 Deserdar</button>` : ''}
          ${d.isFamilyHead && d.children.filter(c => c.status === 'vivo').length ? `<select id="dyWillHeir">${d.children.filter(c => c.status === 'vivo').map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('')}</select><button class="btn btn-primary" data-dyact="testamento:${m.id}">📜 Fazer testamento</button>` : ''}</div>` : ''}
        <button class="btn btn-primary" id="dyModalClose" style="margin-top:10px;">Fechar</button>`;
      expedOverlay.classList.remove('hidden');
    } catch (err) { showToast(`⚠️ ${err.message}`); }
  }

  const { renderInfra, renderReligion } = window.KOT.panels['religiao-infra']({ RESOURCE_META, TERRAIN_ICON, TERRAIN_LABEL, dyFilterPartners, el, escapeHtml, expedOverlay, fmt, infoBtn, loadDynastyTree, openDynastyMember, refreshAll, renderDynasty, renderFamiliesList, showToast, state }); // Etapa 66: extraído para js/painel-religiao-infra.js
  const GROUPS = {
    military: async () => { state.military = await Api.getMilitary(); },
    settlements: async () => { const r = await Api.getSettlements(); state.settlements = r.settlements; state.settlementTypes = r.types; },
    market: async () => { state.market = await Api.getMarket(); }, politics: async () => { state.politics = await Api.getPolitics(); }, tech: async () => { state.tech = await Api.getTech(); },
    exploration: async () => { state.exploration = await Api.getExploration(); }, tradeIntl: async () => { state.tradeIntl = await Api.getTradeIntl(); }, diplomacy: async () => { state.diplomacy = await Api.getDiplomacy(); },
    war: async () => { state.war = await Api.getWar(); }, culture: async () => { state.culture = await Api.getCulture(); }, security: async () => { state.security = await Api.getSecurity(); }, magic: async () => { state.magic = await Api.getMagic(); },
    dynasty: async () => { state.dynasty = await Api.getDynasty(); }, religion: async () => { state.religion = await Api.getReligion(); }, infra: async () => { state.infra = await Api.getInfra(); },
    gov: async () => { try { state.gov = await Api.getGovernment(); } catch { /* o governo nao deve derrubar a carga */ } },
    characters: async () => { const r = await Api.getCharacters(); state.characters = r.characters; state.charExtras = r.extras || []; state.charVacancies = r.vacancies || []; state.charConspiracies = r.conspiracies || []; state.charNetworks = r.spyNetworks || []; },
  };
  const GROUP_RENDER = { military: () => renderMilitary(), settlements: () => renderSettlements(), market: () => renderMarket(), politics: () => renderPolitics(), tech: () => renderTech(), exploration: () => renderExploration(), tradeIntl: () => renderTradeIntl(), diplomacy: () => renderDiplomacy(), war: () => renderWar(), culture: () => renderCulture(), security: () => renderSecurity(), magic: () => renderMagic(), dynasty: () => renderDynasty(), religion: () => renderReligion(), infra: () => renderInfra(), gov: () => renderGovernment(), characters: () => renderCharacters() };
  const PANEL_GROUPS = { exercito: ['military', 'war'], guerra: ['war', 'military', 'diplomacy'], cidades: ['settlements', 'diplomacy'], economia: ['market'], comerciointl: ['tradeIntl', 'market'], politica: ['politics', 'gov'], governo: ['gov', 'politics'], tecnologia: ['tech'], exploracao: ['exploration'], diplomacia: ['diplomacy'], cultura: ['culture', 'diplomacy', 'religion'], religiao: ['religion', 'culture'], seguranca: ['security'], magia: ['magic'], dinastia: ['dynasty', 'characters'], personagens: ['characters', 'dynasty'], infra: ['infra'], mapa: ['diplomacy', 'religion', 'infra', 'war', 'military', 'exploration', 'tradeIntl', 'market'], mundo: ['diplomacy', 'tradeIntl', 'war'], festas: [], hoje: [], painel: [], campanha: [], objetivos: [], eventos: [], construcoes: [], populacao: [], historico: [], config: [] };
  const ALL_GROUPS = new Set(Object.keys(GROUPS)); const staleGroups = new Set();
  async function loadAllData(groups, opts) {
    const names = [...(groups || ALL_GROUPS)].filter((g) => GROUPS[g]); const skipCore = !!(opts && opts.skipCore);
    const corePromise = skipCore ? Promise.resolve(null) : Promise.all([Api.getKingdom(), Api.getBuildings(), Api.getPopulation(), Api.getEconomy(), Api.getObjectives(), Api.getEvents(), Api.getNotifications()]);
    const [core] = await Promise.all([corePromise, Promise.all(names.map((g) => GROUPS[g]()))]);
    if (core) { const [kingdom, buildingsRes, population, economy, objectivesRes, events, notifications] = core; state.kingdom = kingdom; state.buildings = buildingsRes.buildings; state.buildersInfo = buildingsRes.builders; state.buildQueueMax = buildingsRes.queue ? buildingsRes.queue.max : null; state.population = population; state.economy = economy; state.objectives = objectivesRes.objectives; state.events = events; state.notifications = notifications; try { state.campaign = await Api.getCampaign(); } catch { /* a campanha nao deve derrubar a carga */ } }
  }


  // ==============================================================
  // GOVERNO (Etapa 35): poder, instituicoes, decretos, partidos, regioes, crises e mudanca de regime
  // ==============================================================
  function govBar(label, v, color, extra) { return `<div class="ficha-attr-row"><div class="ficha-attr-head"><span>${label}</span><span>${Math.round(v)}${extra || ''}</span></div><div class="ficha-attr-track"><div class="ficha-attr-fill" style="width:${Math.max(0, Math.min(100, v))}%;${color ? 'background:' + color + ';' : ''}"></div></div></div>`; }

  // --- Etapa 36: gabinete e orcamento, partidos e campanha, constituicao e votacoes, faccoes, militar, mundo ---
  function govExtraHtml(v) {
    const nf = (n) => Number(n).toLocaleString('pt-BR'); const c = v.cabinet, p = v.politics, e = escapeHtml;
    const minCard = (m) => `<div class="pol-law" style="${m.vacant ? 'border-left:4px solid #c0392b;' : ''}"><div class="pl-head"><span>${m.icon} <strong>${e(m.name)}</strong></span><span class="bc-level">${m.share}% do orçamento</span></div>
      <div class="hint">${m.minister ? `👤 <strong>${e(m.minister.name)}</strong> · competência ${m.minister.competence}` : '⚠️ <strong>VAGO</strong> — sem ministro o orçamento da pasta não é gasto'} · ${m.effects.length ? m.effects.map(e).join(' · ') : 'sem efeito direto (' + e(m.text) + ')'}</div>
      <div class="tech-controls">${m.canAppoint ? (c.method === 'coalizao' ? `<select data-appsel="${m.key}">${c.parties.map(pt => `<option value="${pt.id}">${e(pt.name)}</option>`).join('')}</select>` : `<select data-appsel="${m.key}">${m.candidates.map(x => `<option value="${x.id}">${e(x.name)} (${x.competence})</option>`).join('') || '<option value="">sem candidatos</option>'}</select>`) + `<button class="btn btn-secondary btn-sm" data-appoint="${m.key}">Nomear</button>` : ''}${m.minister && m.canAppoint ? `<button class="btn btn-ghost btn-sm" data-dismiss="${m.key}">Exonerar</button>` : ''}</div></div>`;
    const b = c.budget;
    let html = `<div class="ficha-section-title">🗂️ Gabinete e orçamento <button type="button" class="info-btn" data-info="gov_cabinet">ⓘ</button></div>
      <p class="hint">${e(c.methodText)} Orçamento: <strong>${b.rate}%</strong> da renda (≈ 💰 ${nf(b.daily)}/dia de ${nf(b.income)}/dia) · execução ${b.execution}% · ${b.needsApproval ? 'aprovado por <strong>' + e(b.body) + '</strong> (sorteio)' : 'decidido pelo governante'}${b.approvedThisYear ? ' · ✅ já aprovado neste ciclo' : ''}${b.rejectedWait ? ` · 🚫 rejeitado, tente em ${b.rejectedWait}d` : ''}</p>
      <div class="pol-laws">${c.ministries.map(minCard).join('')}</div>
      <div class="pol-law"><strong>📊 Orçamento do ciclo</strong><div class="tech-controls">Parcela da renda (%): <input type="number" id="budRate" min="0" max="30" value="${b.rate}" style="width:64px;"> ${c.ministries.map(m => `<label>${m.icon}<input type="number" data-alloc="${m.key}" min="0" max="100" value="${m.share}" style="width:54px;"></label>`).join(' ')}<button class="btn btn-secondary btn-sm" data-budget-save>Propor orçamento</button></div>
        <div class="tech-controls">🚨 Emergencial: <select id="emMin">${c.ministries.map(m => `<option value="${m.key}">${m.icon} ${e(m.name.replace('Ministério da ', '').replace('Ministério das ', '').replace('Ministério de ', ''))}</option>`).join('')}</select> 💰<input type="number" id="emAmt" value="500" min="100" style="width:80px;"><button class="btn btn-ghost btn-sm" data-emerg>Financiar (60 dias)</button></div>
        <div class="hint">🏦 Dívida: <strong>💰 ${nf(b.debt)}</strong> de limite ${nf(b.debtLimit)} (${Math.round(c.debtRatio * 100)}% da renda do ciclo; juros 4,8% por ciclo de 80 dias) <input type="number" id="debtAmt" value="500" min="200" style="width:80px;"> <button class="btn btn-ghost btn-sm" data-debt="issue">Emitir títulos</button> <button class="btn btn-ghost btn-sm" data-debt="repay">Amortizar</button> · 🔎 <button class="btn btn-ghost btn-sm" data-audit ${b.auditWait ? 'disabled' : ''}>Auditoria${b.auditWait ? ' (' + b.auditWait + 'd)' : ''}</button></div></div>`;
    if (v.parties) {
      const cmp = p.campaign;
      html += `<div class="ficha-section-title">🏳️ Partidos, candidatos e negociação</div><div class="pol-laws">${v.parties.map(pt => `<div class="pol-law"><div class="pl-head"><span>${pt.icon} <strong>${e(pt.name)}</strong> ${pt.isPlayer ? '(seu governo)' : pt.inCoalition ? '(coalizão)' : ''}</span><span class="bc-level">${pt.seats} cadeiras · pop. ${pt.popularity}</span></div>
        <div class="hint">🎤 Candidato: <strong>${e(pt.candidate)}</strong> (carisma ${pt.charisma}) · relação ${pt.relation} · bandeiras: ${pt.planks.map(x => e(p.planks[x] || x)).join(', ') || '—'}</div>
        ${pt.isPlayer || pt.inCoalition ? '' : `<div class="tech-controls"><select data-negoffer="${pt.id}"><option value="ministerio">Oferecer ministério</option><option value="verba">Oferecer verba (💰800)</option><option value="politica">Conceder bandeira</option><option value="cargo">Oferecer cargo (💰300)</option></select><select data-negmin="${pt.id}">${c.ministries.filter(m => m.vacant).map(m => `<option value="${m.key}">${m.icon} ${e(m.name.replace('Ministério da ', '').replace('Ministério das ', ''))}</option>`).join('') || '<option value="">(sem ministério vago)</option>'}</select><button class="btn btn-secondary btn-sm" data-negotiate="${pt.id}">Negociar</button></div>`}</div>`).join('')}</div>`;
      html += `<div class="pol-law"><strong>🗳️ Campanha eleitoral</strong> ${cmp ? (cmp.active ? `<span class="bc-stat prod">ABERTA — eleição em ${cmp.daysToElection} dias</span>` : `<span class="hint">abre ${cmp.campaignDays} dias antes da eleição (faltam ${cmp.daysToElection}d)</span>`) : ''}
        <div class="tech-controls">${cmp ? cmp.actions.map(x => `<button class="btn btn-secondary btn-sm" data-camp="${x.key}" ${cmp.active ? '' : 'disabled'} title="${e(x.desc)}">${e(x.name)} (💰${x.cost.gold} · 🏛️${x.cost.cap})</button>`).join('') : ''}<select id="campTarget">${v.parties.filter(x => !x.isPlayer).map(x => `<option value="${x.id}">alvo: ${e(x.name.replace('Partido ', ''))}</option>`).join('')}</select></div>
        <div class="tech-controls">🤞 Promessas (cobradas na próxima eleição): ${cmp ? cmp.promiseTypes.map(x => `<button class="btn btn-ghost btn-sm" data-promise="${x.key}" ${cmp.promises.includes(x.key) ? 'disabled' : ''}>${cmp.promises.includes(x.key) ? '✔ ' : ''}${e(x.name)}</button>`).join('') : ''}</div></div>`;
    }
    html += `<div class="ficha-section-title">📖 Constituição e votações</div><p class="hint">${p.needsBody ? 'Emendas exigem 60% do órgão do regime. Encomende pesquisas de opinião (margem de erro menor a cada uma) antes de votar.' : 'Neste regime o governante emenda a Constituição por conta própria (risco de resistência e −2 de legitimidade).'}</p>
      <div class="pol-laws">${p.constitution.map(a => `<div class="pol-law"><div class="pl-head"><span>${a.icon} <strong>${e(a.name)}</strong></span><span class="bc-level">${e(a.options.find(o => o.key === a.current).label)}</span></div><div class="tech-controls">${a.options.filter(o => o.key !== a.current).map(o => `<button class="btn btn-ghost btn-sm" data-const="${a.key}:${o.key}" title="${e(o.effects)}">Propor: ${e(o.label)}${o.effects ? ' (' + e(o.effects) + ')' : ''}</button>`).join('')}</div></div>`).join('')}</div>
      ${p.topics.length ? `<div class="tech-controls">🗳️ Referendo popular: ${p.topics.map(t => `<button class="btn btn-secondary btn-sm" data-referendum="${t.key}">${e(t.title)} (💰300 · 🏛️25)</button>`).join('')}</div>` : ''}
      <div class="pol-laws">${p.proposals.map(pr => `<div class="pol-law" style="border-left:4px solid ${pr.status === 'aberta' ? '#b08d3c' : pr.status === 'aprovada' ? '#4a8f3f' : '#c0392b'};"><div class="pl-head"><span>📜 <strong>${e(pr.title)}</strong></span><span class="bc-level">${e(pr.status)}</span></div>
        ${pr.polls.length ? `<div class="hint">📊 Pesquisas: ${pr.polls.map(x => `${x.estimate}% (±${x.margin})`).join(' → ')}</div>` : ''}
        ${pr.result ? `<div class="hint">Resultado: <strong>${pr.result.share}%</strong> (mínimo ${pr.result.threshold}%) · comparecimento ${pr.result.turnout}% · ${pr.result.blocs.map(x => e(x.name.replace('Partido ', '')) + ': ' + e(x.stance)).join(' | ')}</div>` : ''}
        ${pr.status === 'aberta' ? `<div class="tech-controls"><button class="btn btn-ghost btn-sm" data-poll="${pr.id}" ${pr.polls.length >= 3 ? 'disabled' : ''}>📊 Pesquisa (💰${pr.nextPollCost})</button><button class="btn btn-secondary btn-sm" data-vote="${pr.id}">Votar agora</button></div>` : ''}</div>`).join('') || '<p class="hint">Nenhuma proposta ainda.</p>'}</div>`;
    html += `<div class="ficha-section-title">🤝 Grupos de poder (facções)</div><div class="pol-laws">${v.factions.map(f => `<div class="pol-law" style="${f.pressure ? 'border-left:4px solid #c0392b;' : ''}"><div class="pl-head"><span>${f.icon} <strong>${e(f.name)}</strong></span><span class="bc-level">influência ${f.influence}%</span></div>
      ${govBar('apoio', f.support, f.support < 35 ? '#c0392b' : '')}${govBar('mobilização', f.mobilization, f.mobilization > 60 ? '#c0392b' : '#8a6d3b')}
      ${f.pressure ? `<div class="pop-alert">⚠️ Pressionando o governo (${f.pressure}d)</div>` : ''}${f.demand ? `<div class="hint">📜 <strong>Demanda:</strong> ${e(f.demand.text)} (${f.demand.daysLeft}d)</div>` : ''}
      <div class="tech-controls">${f.demand ? `<button class="btn btn-secondary btn-sm" data-faction="${f.key}:satisfazer">Atender</button>` : ''}<button class="btn btn-ghost btn-sm" data-faction="${f.key}:negociar">Negociar</button><button class="btn btn-ghost btn-sm" data-faction="${f.key}:cooptar">Cooptar</button><button class="btn btn-ghost btn-sm" data-faction="${f.key}:reprimir">Reprimir</button></div></div>`).join('')}</div>`;
    const m = v.military, rv = v.regimeVictory;
    html += `<div class="ficha-section-title">⚔️ Organização militar do regime</div><div class="pol-law"><div class="pl-head"><span>${m.icon} <strong>${e(m.name)}</strong></span><span class="bc-level">poder ×${m.powerNow} · lealdade militar ${m.loyalty}</span></div><div class="hint">${e(m.desc)} Custo de recrutamento ×${m.cost}, manutenção ×${m.upkeep}. Teto: ${nf(m.armyCap)} soldados (${m.armyPct}% da população).</div></div>`;
    if (rv) html += `<div class="ficha-section-title">🏆 Caminho de vitória do regime: ${rv.icon} ${e(rv.name)} — ${rv.pct}%</div><div class="pol-law"><div class="hint">${e(rv.desc)} Mantenha por ${rv.holdDays} dias.</div>${rv.items.map(r => `<div class="hint" style="display:flex;justify-content:space-between;"><span>${r.ok ? '✅' : '⬜'} ${e(r.label)}</span><span>${nf(Math.round(r.value))} / ${r.op === 'lte' ? '≤ ' : ''}${nf(r.target)}</span></div>`).join('')}</div>`;
    html += `<div class="ficha-section-title">🌍 Governos dos outros reinos</div><div class="pol-laws">${v.world.map(w => `<div class="pol-law"><div class="pl-head"><span>${w.government.icon} <strong>${e(w.name)}</strong></span><span class="bc-level">${e(w.government.name)}</span></div><div class="hint">Afinidade com o seu regime: <strong>${w.compat > 0 ? '+' : ''}${w.compat}</strong> (confiança ${w.compat > 0 ? 'sobe' : w.compat < 0 ? 'cai' : 'estável'}) · agressividade ×${w.aggression}</div></div>`).join('')}</div>`;
    return html;
  }
  function bindGovExtra(box, act) {
    const val = (sel) => { const x = box.querySelector(sel); return x ? x.value : undefined; };
    box.querySelectorAll('[data-appoint]').forEach(b => b.addEventListener('click', () => { const m = b.dataset.appoint; const v = val(`[data-appsel="${m}"]`); const coal = state.gov.cabinet.method === 'coalizao'; act(() => Api.govPost('/ministers/appoint', { ministry: m, ...(coal ? { partyId: Number(v) } : { characterId: Number(v) }) })); }));
    box.querySelectorAll('[data-dismiss]').forEach(b => b.addEventListener('click', () => act(() => Api.govPost('/ministers/dismiss', { ministry: b.dataset.dismiss }))));
    box.querySelectorAll('[data-budget-save]').forEach(b => b.addEventListener('click', () => { const alloc = {}; box.querySelectorAll('[data-alloc]').forEach(i => { alloc[i.dataset.alloc] = Number(i.value); }); act(() => Api.govPost('/budget', { rate: Number(val('#budRate')), alloc })); }));
    box.querySelectorAll('[data-emerg]').forEach(b => b.addEventListener('click', () => act(() => Api.govPost('/budget/emergency', { ministry: val('#emMin'), amount: Number(val('#emAmt')) }))));
    box.querySelectorAll('[data-debt]').forEach(b => b.addEventListener('click', () => act(() => Api.govPost('/debt/' + b.dataset.debt, { amount: Number(val('#debtAmt')) }))));
    box.querySelectorAll('[data-audit]').forEach(b => b.addEventListener('click', () => act(() => Api.govPost('/audit'))));
    box.querySelectorAll('[data-negotiate]').forEach(b => b.addEventListener('click', () => { const id = b.dataset.negotiate; act(() => Api.govPost(`/parties/${id}/negotiate`, { offer: val(`[data-negoffer="${id}"]`), ministry: val(`[data-negmin="${id}"]`) })); }));
    box.querySelectorAll('[data-camp]').forEach(b => b.addEventListener('click', () => act(() => Api.govPost('/campaign/' + b.dataset.camp, { partyId: Number(val('#campTarget')) }))));
    box.querySelectorAll('[data-promise]').forEach(b => b.addEventListener('click', () => act(() => Api.govPost('/promises', { type: b.dataset.promise }))));
    box.querySelectorAll('[data-const]').forEach(b => b.addEventListener('click', () => { const [article, option] = b.dataset.const.split(':'); act(() => Api.govPost('/constitution/propose', { article, option })); }));
    box.querySelectorAll('[data-referendum]').forEach(b => b.addEventListener('click', () => act(() => Api.govPost('/referendum/propose', { topic: b.dataset.referendum }))));
    box.querySelectorAll('[data-poll]').forEach(b => b.addEventListener('click', () => act(() => Api.govPost(`/proposals/${b.dataset.poll}/poll`))));
    box.querySelectorAll('[data-vote]').forEach(b => b.addEventListener('click', () => act(() => Api.govPost(`/proposals/${b.dataset.vote}/vote`))));
    box.querySelectorAll('[data-faction]').forEach(b => b.addEventListener('click', () => { const [k, a] = b.dataset.faction.split(':'); act(() => Api.govPost(`/factions/${k}/${a}`)); }));
  }

  function renderGovernment() {
    const v = state.gov; const box = el('govBody'); if (!v || !box) return;
    for (const [k, x] of Object.entries(v.explain || {})) INFO['gov_' + k] = { title: x.title, what: x.what, purpose: x.what, how: x.how, up: x.up, down: x.down, affects: x.affects };
    INFO.gov_cabinet = { title: '🗂️ Gabinete e orçamento', what: 'Os ministros tocam áreas do governo e o orçamento financia essas áreas.', purpose: 'Cada ministro dá bônus proporcionais à competência e ao dinheiro recebido; pasta vaga não recebe verba.', how: 'O modo de nomear muda com o governo (livre, por coalizão, aprovado pelo conselho ou comissões). O orçamento anual passa pelo órgão do regime; dívida cobra juros; auditoria combate a corrupção.', up: 'Ministros competentes, orçamento equilibrado, auditorias.', down: 'Cargos vagos, dívida alta, corrupção.', affects: 'Renda, comida, pesquisa, exército, felicidade, estabilidade, corrupção e relações com outros reinos.' };
    INFO.gov_main = { title: '🏛️ Governo', what: 'O seu tipo de governo define quem tem poder, o que você pode ou não fazer, quais instituições existem e como as decisões são tomadas.', purpose: 'Cada governo joga diferente: decretos exclusivos, aprovações por instituições, limites reais (imposto, exército, pesquisa), crises e caminhos próprios.', how: 'Decretos gastam capital político (que regenera por dia) e têm sorteio. Decisões maiores passam pelo órgão do regime (parlamento, conselho, votação popular…).', up: 'Cuidar dos pilares de apoio que pesam no SEU regime.', down: 'Ignorar os pilares, a corrupção e as crises.', affects: 'Estabilidade, felicidade, renda, exército, pesquisa, guerras, leis, sucessão e crises.' };
    const s = v.state; const nf = (n) => Number(n).toLocaleString('pt-BR');
    const decreeCard = (d) => `<div class="pol-law" style="${d.available ? '' : 'opacity:.62;'}"><div class="pl-head"><span>${d.icon} <strong>${escapeHtml(d.name)}</strong>${d.major ? ' <span class="hint">(decisão maior)</span>' : ''}</span><span class="bc-level">${d.cost.cap ? '🏛️ ' + d.cost.cap + ' ' : ''}${d.cost.gold ? '💰 ' + nf(d.cost.gold) : ''}</span></div>
      <div class="hint">${escapeHtml(d.desc)}</div>
      <div class="hint">${d.risky ? `🎲 chance de sucesso ~${d.chance}%` : '✔️ efeito garantido'} · espera ${d.cd}d${d.approval ? ` · exige aprovação: ${escapeHtml(d.approval.body)} (~${d.approval.pct}%)` : ''}${d.reason ? ` · <strong>${escapeHtml(d.reason)}</strong>` : ''}</div>
      <div class="tech-controls">${d.options ? `<select data-decopt="${d.key}">${d.options.map(o => `<option value="${o.key}">${escapeHtml(o.label)}</option>`).join('')}</select>` : ''}<button class="btn btn-secondary btn-sm" data-decree="${d.key}" ${d.available ? '' : 'disabled'}>Decretar</button></div></div>`;
    const crisisCard = (c) => `<div class="pol-law" style="border-left:4px solid ${c.status === 'pendente' ? '#c0392b' : '#999'};${c.status === 'pendente' ? '' : 'opacity:.7;'}"><div class="pl-head"><span>${c.icon} <strong>${escapeHtml(c.name)}</strong></span><span class="bc-level">${c.status === 'pendente' ? `⏳ ${c.daysLeft}d` : escapeHtml(c.status)}</span></div>
      <div class="hint">${escapeHtml(c.desc)} <strong>Causas reais:</strong> ${c.factors.map(escapeHtml).join('; ') || '—'}.${c.outcome ? ' ' + escapeHtml(c.outcome) : ''}</div>
      ${c.options.length ? `<div class="tech-controls">${c.options.map(o => `<button class="btn btn-secondary btn-sm" data-gcrisis="${c.id}:${o.key}">${escapeHtml(o.label)}${o.cost ? ' (💰' + nf(o.cost) + ')' : ''}${o.chance < 100 ? ' · ' + o.chance + '%' : ''}</button>`).join('')}</div>` : ''}</div>`;
    box.innerHTML = `
      <div class="pol-law" style="background:linear-gradient(90deg,rgba(236,200,95,.18),transparent);">
        <div class="pl-head"><span style="font-size:1.2em;">${v.icon} <strong>${escapeHtml(v.name)}</strong> <span class="hint">— ${escapeHtml(v.profile.tag)}</span></span><span class="bc-level">há ${Math.floor(s.sinceDays / 365)} ano(s) neste regime</span></div>
        <div class="hint">${escapeHtml(v.profile.summary)}</div>
        <div class="hint">🎯 <strong>Estilo:</strong> ${escapeHtml(v.profile.style)} · ⚠️ <strong>Dificuldade:</strong> ${escapeHtml(v.profile.hard)}</div>
        ${s.opposition ? `<div class="pop-alert">🗳️ Você está na OPOSIÇÃO${s.oppositionLeft ? ` (por mais ~${Math.ceil(s.oppositionLeft / 30)} meses)` : ''}: aprovações muito mais difíceis. Articule uma coalizão ou prepare a volta.</div>` : ''}
      </div>
      ${(v.warnings || []).map(w => `<div class="pop-alert">⚠️ ${escapeHtml(w)}</div>`).join('')}
      <div class="ficha-section-title">Indicadores do regime</div>
      <div class="ficha-attrs">${govBar(`🏛️ Capital político ${infoBtn('gov_capital')}`, s.capital, '', ` (+${s.regen}/dia)`)}${govBar(`⚖️ Legitimidade ${infoBtn('gov_legit')}`, s.legitimacy, s.legitimacy < 35 ? '#c0392b' : '')}${govBar(`🎯 Centralização ${infoBtn('gov_centr')}`, s.centralization)}${govBar(`🗽 Liberdade política ${infoBtn('gov_lib')}`, s.liberty)}${govBar(`🗳️ Participação popular ${infoBtn('gov_part')}`, s.participation)}${govBar('💸 Corrupção', s.corruption, s.corruption > 40 ? '#c0392b' : '')}</div>
      <div class="ficha-section-title">Pilares de apoio — o peso mostra o quanto cada um importa NESTE regime</div>
      <div class="ficha-attrs">${v.pillars.map(p => govBar(`${p.icon} ${escapeHtml(p.name)} <span class="hint">(pesa ${p.weight}%)</span>`, p.value, p.value < 35 && p.weight >= 15 ? '#c0392b' : '')).join('')}</div>
      <div class="bc-stats"><span class="bc-stat ${v.risks.coup > 40 ? 'cons' : ''}">⚔️ Risco de golpe ${v.risks.coup}% ${infoBtn('gov_coup')}</span><span class="bc-stat ${v.risks.revolt > 40 ? 'cons' : ''}">✊ Risco de revolta ${v.risks.revolt}% ${infoBtn('gov_revolt')}</span><span class="bc-stat ${v.risks.constitutional > 40 ? 'cons' : ''}">📖 Crise constitucional ${v.risks.constitutional}% ${infoBtn('gov_constitutional')}</span></div>
      <div class="ficha-section-title">Poderes, limitações e regras reais</div>
      <div class="bc-stats"><span class="bc-stat">💰 Imposto máx. ${v.limits.taxCap}%</span><span class="bc-stat">⚔️ Exército máx. ${nf(v.limits.armyCap)} (${v.limits.armyPct}% da pop.)</span><span class="bc-stat">🔬 Pesquisa ×${v.limits.researchMult}</span><span class="bc-stat">${v.limits.approvalBody ? '🗳️ Aprovação: ' + escapeHtml(v.limits.approvalBody) + ' (' + v.limits.approvalCats.join(', ') + ')' : '👑 Decide sem aprovação'}</span>${v.limits.election ? `<span class="bc-stat">📅 Eleição a cada ${v.limits.election.term} anos</span>` : ''}${v.modifiers.goldPct ? `<span class="bc-stat ${v.modifiers.goldPct < 0 ? 'cons' : 'prod'}">renda ${v.modifiers.goldPct > 0 ? '+' : ''}${v.modifiers.goldPct}%</span>` : ''}</div>
      <div class="pol-laws"><div class="pol-law"><strong>Você pode</strong><ul>${v.profile.powers.map(x => `<li>${escapeHtml(x)}</li>`).join('')}</ul></div><div class="pol-law"><strong>Limitações</strong><ul>${v.profile.limits.map(x => `<li>${escapeHtml(x)}</li>`).join('')}</ul></div></div>
      <div class="bc-stats">${v.profile.institutions.map(i => `<span class="bc-stat" title="${escapeHtml(i.d)}">${i.i} ${escapeHtml(i.n)}</span>`).join('')}</div>
      <div class="hint">👑 <strong>Sucessão:</strong> ${escapeHtml(v.profile.succession)}</div>
      ${v.temps.length ? `<div class="ficha-section-title">Efeitos ativos</div><div class="bc-stats">${v.temps.map(t => `<span class="bc-stat prod">${escapeHtml(t.label)} · ${t.daysLeft}d</span>`).join('')}</div>` : ''}
      <div class="ficha-section-title">Decretos exclusivos deste governo ${infoBtn('gov_main')}</div>
      <div class="pol-laws">${v.decrees.map(decreeCard).join('')}</div>
      ${govExtraHtml(v)}
      ${['federacao', 'imperio', 'anarquia'].includes(v.key) ? `<div class="ficha-section-title">${v.key === 'imperio' ? 'Províncias' : v.key === 'anarquia' ? 'Comunidades' : 'Regiões'}</div><div class="pol-laws">${v.regions.map(r => `<div class="pol-law"><div class="pl-head"><span>🗺️ <strong>${escapeHtml(r.name)}</strong>${r.isCapital ? ' 👑' : ''}</span><span class="bc-level">lealdade ${r.loyalty}</span></div><div class="hint">autonomia ${r.autonomy} · integração ${r.integration}</div>${govBar('', r.loyalty, r.loyalty < 35 ? '#c0392b' : '')}</div>`).join('')}</div>` : ''}
      <div class="ficha-section-title">Crises políticas</div>
      <div class="pol-laws">${v.crises.map(crisisCard).join('') || '<p class="hint">Nenhuma crise até agora. Elas nascem das condições reais do reino (apoio, legitimidade, corrupção…).</p>'}</div>
      <div class="ficha-section-title">Ideal do governo: ${escapeHtml(v.ideal.name)} ${v.ideal.claimed ? '✅' : ''}</div>
      <div class="pol-law">${v.ideal.reqs.map(r => `<div class="hint" style="display:flex;justify-content:space-between;"><span>${r.ok ? '✅' : '⬜'} ${escapeHtml(r.label)}</span><span>${nf(r.value)} / ${r.op === 'lte' ? '≤ ' : ''}${nf(r.target)}</span></div>`).join('')}<div class="hint">Recompensa: ⭐ ${v.ideal.reward.prestige} prestígio e 💰 ${nf(v.ideal.reward.gold)}.</div></div>
      <div class="ficha-section-title">Mudar de regime</div>
      <p class="hint">Mudar o governo refaz as instituições e começa com legitimidade baixa (40). Cada caminho tem custo, requisitos e sorteio.</p>
      <div class="pol-laws">${v.regime.map(r => `<div class="pol-law" style="${r.available ? '' : 'opacity:.65;'}"><div class="pl-head"><span>${r.icon} <strong>${escapeHtml(r.name)}</strong></span><span class="bc-level">🎲 ${r.chance}% · ${r.cost.cap ? '🏛️ ' + r.cost.cap + ' ' : ''}${r.cost.gold ? '💰 ' + nf(r.cost.gold) : ''}</span></div><div class="hint">${escapeHtml(r.desc)}${r.reasons.length ? ' <strong>Indisponível:</strong> ' + r.reasons.map(escapeHtml).join('; ') + '.' : ''}</div>${r.available ? `<div class="tech-controls"><select data-regtarget="${r.key}">${r.targets.map(t => `<option value="${t.key}">${escapeHtml(t.name)}</option>`).join('')}</select><button class="btn btn-ghost btn-sm" data-regime="${r.key}">Tentar</button></div>` : ''}</div>`).join('')}</div>
      <div class="ficha-section-title">Histórico político</div>
      <ul class="ficha-history-list">${v.history.map(l => `<li><span>${l.icon}</span><div><span class="fh-day">DIA ${l.day}</span>${escapeHtml(l.title)}</div></li>`).join('') || '<li>Nada ainda.</li>'}</ul>`;
    const act = async (fn) => { try { const r = await fn(); showToast(r.message); await refreshAll(true); } catch (err) { showToast(`⚠️ ${err.message}`); } };
    bindGovExtra(box, act);
    box.querySelectorAll('[data-decree]').forEach(b => b.addEventListener('click', () => { const k = b.dataset.decree; const sel = box.querySelector(`[data-decopt="${k}"]`); act(() => Api.doDecree(k, sel ? sel.value : undefined)); }));
    box.querySelectorAll('[data-gcrisis]').forEach(b => b.addEventListener('click', () => { const [id, o] = b.dataset.gcrisis.split(':'); act(() => Api.resolveGovCrisis(Number(id), o)); }));
    box.querySelectorAll('[data-regime]').forEach(b => b.addEventListener('click', () => { const k = b.dataset.regime; const t = box.querySelector(`[data-regtarget="${k}"]`).value; if (!confirm('Mudar o regime refaz as instituições do reino e é arriscado. Continuar?')) return; act(() => Api.changeRegime(k, t)); }));
  }

  // ==============================================================
  // CAMPANHA (Etapa 34): eras, crises, marcos, vitoria e derrota
  // ==============================================================
  const { renderCampaign } = window.KOT.panels.campanha({ el, escapeHtml, infoBtn, refreshAll, showToast, state }); // Etapa 66: extraído para js/painel-campanha.js
  function renderEverything(G = ALL_GROUPS) {
    renderResourceStrip();
    renderBuildersChip();
    renderTimeDisplay();
    renderNotifDropdown();
    renderHeader();
    renderOverview();
    renderWellbeing();
    renderCapitalGrid();
    renderQueue();
    renderMyBuildings();
    renderCatalog();
    renderPopulation();
    if (G.has('military')) renderMilitary();
    if (G.has('settlements')) renderSettlements();
    if (G.has('market')) renderMarket();
    if (G.has('politics')) renderPolitics();
    if (G.has('tech')) renderTech();
    if (G.has('exploration')) renderExploration();
    if (G.has('tradeIntl')) renderTradeIntl();
    if (G.has('diplomacy')) renderDiplomacy();
    if (G.has('war')) renderWar();
    if (G.has('culture')) renderCulture();
    if (G.has('security')) renderSecurity();
    if (G.has('magic')) renderMagic();
    if (G.has('dynasty')) renderDynasty();
    if (G.has('religion')) renderReligion();
    if (G.has('infra')) renderInfra();
    renderCampaign();
    if (G.has('gov')) renderGovernment();
    try { document.dispatchEvent(new CustomEvent('kot:refreshed')); } catch { /* noop */ }
    renderEconomy();
    renderEvents();
    renderObjectives();
    if (G.has('characters')) renderCharacters();
    renderHistory();
    fillConfigForm();
  }

  // Etapa 47: uma atualização por vez (as simultâneas viram UMA), só logout no 401 e nova tentativa nos demais erros.
  let refreshInflight = null, refreshQueued = null, refreshFails = 0, firstLoadDone = false;
  const activePanelName = () => { const a = document.querySelector('.dash-panel.active'); return a ? a.dataset.panel : 'painel'; };
  async function refreshAll(quiet) {
    // se já há uma atualização em andamento, todas as chamadas que chegarem viram UMA atualização seguinte (e só resolvem depois dela: dado novo, nunca velho)
    if (refreshInflight) { if (!refreshQueued) refreshQueued = refreshInflight.catch(() => {}).then(() => { refreshQueued = null; return refreshAll(quiet); }); return refreshQueued; }
    refreshInflight = (async () => {
      try {
        const want = firstLoadDone ? new Set(PANEL_GROUPS[activePanelName()] || []) : new Set(ALL_GROUPS); // 1ª carga: tudo; depois: núcleo + o painel aberto
        await loadAllData(want); firstLoadDone = true; for (const g of ALL_GROUPS) { if (want.has(g)) staleGroups.delete(g); else staleGroups.add(g); }
        renderEverything(want);
        state.mapDirty = true;
        const mp = document.querySelector('.dash-panel[data-panel="mapa"]'); if (state.fullMapLoaded && mp && mp.classList.contains('active')) refreshMapData();
        const hp = document.querySelector('.dash-panel[data-panel="painel"]'); if (hp && hp.classList.contains('active')) refreshMiniMap();
        refreshFails = 0;
      } catch (err) {
        if (err && err.status === 401) { Api.clearSession(); window.location.href = 'login.html'; return; } // sessão expirada de verdade
        if (!quiet) { refreshFails++; showToast(`⚠️ Não consegui atualizar agora (${(err && err.message) || 'erro'}). Tentando de novo…`); if (refreshFails <= 3) setTimeout(() => refreshAll(true), 3000 * refreshFails); }
      } finally { refreshInflight = null; }
    })();
    return refreshInflight;
  }
  // ao abrir um painel, carrega os grupos que estavam velhos e redesenha SÓ ele
  document.addEventListener('kot:panel', async (e) => { const need = (PANEL_GROUPS[e.detail] || []).filter((g) => staleGroups.has(g)); if (!need.length || !firstLoadDone) return; try { await loadAllData(new Set(need), { skipCore: true }); need.forEach((g) => { staleGroups.delete(g); if (GROUP_RENDER[g]) GROUP_RENDER[g](); }); } catch (err) { if (err && err.status === 401) { Api.clearSession(); window.location.href = 'login.html'; } } });

  function setupCollapsiblePanels() {
    const STORAGE_KEY = 'ek_collapsed_panels';
    let collapsed;
    try { collapsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { collapsed = {}; }
    document.querySelectorAll('.parchment-panel').forEach((panel, idx) => {
      const h3 = panel.querySelector(':scope > h3');
      if (!h3 || h3.dataset.collapsibleReady) return;
      h3.dataset.collapsibleReady = '1';
      const panelKey = h3.textContent.trim().replace(/\s+/g, '_').slice(0, 40) + '_' + idx;
      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'panel-collapse-btn';
      toggle.setAttribute('aria-label', 'Minimizar ou expandir esta seção');
      toggle.textContent = collapsed[panelKey] ? '▶' : '▼';
      if (collapsed[panelKey]) panel.classList.add('panel-collapsed');
      toggle.addEventListener('click', () => {
        const isCollapsed = panel.classList.toggle('panel-collapsed');
        toggle.textContent = isCollapsed ? '▶' : '▼';
        collapsed[panelKey] = isCollapsed;
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(collapsed)); } catch { /* noop */ }
      });
      h3.insertBefore(toggle, h3.firstChild);
    });
  }

  (async function boot() {
    try {
      await loadAllData(); firstLoadDone = true;

      const [catalogRes, mapRes, govRes] = await Promise.all([Api.getBuildingsCatalog(), Api.getMap(), Api.getGovernments()]);
      state.catalog = catalogRes.buildings;
      state.categories = catalogRes.categories;
      state.governmentsCatalog = govRes.governments;
      renderMiniMap(mapRes.territories, mapRes.cols); state.latestMap = mapRes.territories; state.latestMapAt = Date.now(); state.mapCols = mapRes.cols;

      renderEverything();
      setupCollapsiblePanels();

      el('loading').classList.add('hidden');
      el('dash').classList.remove('hidden');
    } catch (err) {
      console.error('boot', err);
      if (err.status === 404) {
        window.location.href = 'create-kingdom.html';
      } else if (err.status === 401 || err.status === 403) {
        Api.clearSession();
        window.location.href = 'login.html';
      } else {
        // erro de renderizacao/servidor: NAO desloga o jogador; mostra o problema e permite tentar de novo
        const ld = el('loading'); ld.classList.remove('hidden');
        ld.innerHTML = `<p style="color:#7a1f2b;">⚠️ Algo deu errado ao carregar o reino: ${escapeHtml(err.message || String(err))}</p><button class="btn btn-primary" data-act="reload">Tentar novamente</button>`;
        const rb = ld.querySelector('[data-act="reload"]'); if (rb) rb.addEventListener('click', () => location.reload());
      }
    }
  })();
  // Etapa 37: pontos de extensao para ux.js e world.js
  window.KOT = Object.assign(window.KOT || {}, { loadFullMap, showTerritoryInfo, state, goToPanel, showToast, refreshAll, renderNotifDropdown, guessNotifPanel, escapeHtml, el });
})();
