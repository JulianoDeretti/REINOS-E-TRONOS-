// js/create-kingdom.js
// Controla o assistente de fundacao do reino (5 etapas).

(function () {
  if (!Api.isLoggedIn()) { window.location.href = 'login.html'; return; }

  const TOTAL_STEPS = 6;

  // 30 simbolos, cada um com nome exibido (nao dependemos so do desenho).
  const SYMBOLS = [
    { emoji: '👑', name: 'Coroa' }, { emoji: '🦁', name: 'Leão' }, { emoji: '🐺', name: 'Lobo' },
    { emoji: '🦅', name: 'Águia' }, { emoji: '🐉', name: 'Dragão' }, { emoji: '🐍', name: 'Serpente' },
    { emoji: '☀️', name: 'Sol' }, { emoji: '🌙', name: 'Lua' }, { emoji: '⚔️', name: 'Espadas' },
    { emoji: '🛡️', name: 'Escudo' }, { emoji: '🕯️', name: 'Chama' }, { emoji: '⭐', name: 'Estrela' },
    { emoji: '🌊', name: 'Onda' }, { emoji: '⛰️', name: 'Montanha' }, { emoji: '🌳', name: 'Árvore' },
    { emoji: '💎', name: 'Diamante' }, { emoji: '🏰', name: 'Castelo' }, { emoji: '🐻', name: 'Urso' },
    { emoji: '🦌', name: 'Cervo' }, { emoji: '🐎', name: 'Cavalo' }, { emoji: '🔨', name: 'Martelo' },
    { emoji: '🛠️', name: 'Machado' }, { emoji: '🏹', name: 'Arco' }, { emoji: '🗼', name: 'Torre' },
    { emoji: '🌸', name: 'Flor' }, { emoji: '💀', name: 'Crânio' }, { emoji: '🔥', name: 'Fênix' },
    { emoji: '🐲', name: 'Grifo' }, { emoji: '🦉', name: 'Coruja' }, { emoji: 'ᚱ', name: 'Runa' },
    { emoji: '🐈', name: 'Gato Preto' },
  ];

  // Paleta de cores nomeadas (pedido explicito: branco, preto e uma boa
  // variedade de tons nomeados, alem da grande grade de 300 cores).
  const NAMED_COLORS = [
    { name: 'Vermelho escuro', hex: '#6B1414' }, { name: 'Vermelho', hex: '#B22222' },
    { name: 'Vermelho vivo', hex: '#E63946' }, { name: 'Laranja', hex: '#E07A2C' },
    { name: 'Laranja escuro', hex: '#A85A1E' }, { name: 'Amarelo', hex: '#E8C547' },
    { name: 'Dourado', hex: '#C9A227' }, { name: 'Verde escuro', hex: '#1F4D2C' },
    { name: 'Verde', hex: '#3F7D3F' }, { name: 'Verde vivo', hex: '#4CAF50' },
    { name: 'Verde claro', hex: '#8BC34A' }, { name: 'Ciano', hex: '#2E9C9C' },
    { name: 'Azul claro', hex: '#5DA9D6' }, { name: 'Azul', hex: '#2C5F9E' },
    { name: 'Azul escuro', hex: '#1A3A6B' }, { name: 'Azul-marinho', hex: '#0F2340' },
    { name: 'Roxo', hex: '#6A3FA0' }, { name: 'Violeta', hex: '#8A4FD1' },
    { name: 'Rosa', hex: '#D6689A' }, { name: 'Magenta', hex: '#B23A8E' },
    { name: 'Marrom', hex: '#6B4226' }, { name: 'Bege', hex: '#C9B48A' },
    { name: 'Cinza', hex: '#7A7A7A' }, { name: 'Cinza escuro', hex: '#3D3D3D' },
    { name: 'Branco', hex: '#FFFFFF' }, { name: 'Preto', hex: '#000000' },
  ];

  const TERRAIN_ICON = {
    floresta: '🌲', montanha: '⛰️', planicie: '🌾', deserto: '🏜️', oceano: '🌊',
    pantano: '🐊', tundra: '🌬️', selva: '🌴', costa: '🏖️', vale: '🏞️', colina: '⛅',
    vulcanica: '🌋', congelada: '🧊', magico: '🔮', ruinas: '🏛️', antigas: '🗿',
  };
  const TERRAIN_LABEL = {
    floresta: 'Floresta', montanha: 'Montanha', planicie: 'Planície', deserto: 'Deserto', oceano: 'Oceano',
    pantano: 'Pântano', tundra: 'Tundra', selva: 'Selva', costa: 'Costa', vale: 'Vale', colina: 'Colina',
    vulcanica: 'Vulcânica', congelada: 'Congelada', magico: 'Mágica', ruinas: 'Ruínas', antigas: 'Terras Antigas',
  };

  const state = {
    step: 1,
    kingdomName: '',
    rulerName: '',
    capitalName: '',
    color: '#8B2E2E',
    bannerSymbol: '👑',
    bannerPattern: 'solid',
    government: null,
    territoryId: null,
    territoryLabel: null,
    origin: '', rulerPast: '', tradition: '', rulerTraits: [], faithOn: false, faithName: '', faithPrinciples: [], dynasty: '', motto: '', bannerBg2: '#f2e3b3', bannerDivision: 'inteira',
    territories: [],
    governments: [],
    govCategories: {},
  };

  const el = (id) => document.getElementById(id);
  const alertBox = el('alert');

  function showError(msg) {
    alertBox.textContent = msg;
    alertBox.className = 'alert alert-error show';
    alertBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  function hideAlert() { alertBox.className = 'alert wizard-alert'; }
  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str ?? '';
    return d.innerHTML;
  }

  // ------------------------------------------------------------
  // Paleta de 300 cores (20 matizes x 5 luminosidades x 3 saturacoes)
  // ------------------------------------------------------------
  function buildPalette() {
    const colors = [];
    const hues = 20, lights = [30, 42, 54, 66, 78], sats = [40, 65, 90];
    for (let h = 0; h < hues; h++) {
      const hue = Math.round((360 / hues) * h);
      for (const s of sats) {
        for (const l of lights) {
          colors.push(hslToHex(hue, s, l));
        }
      }
    }
    return colors;
  }

  function hslToHex(h, s, l) {
    s /= 100; l /= 100;
    const k = n => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    const toHex = x => Math.round(255 * x).toString(16).padStart(2, '0');
    return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
  }

  function darken(hex, amount = 0.45) {
    const num = parseInt(hex.slice(1), 16);
    let r = (num >> 16) & 255, g = (num >> 8) & 255, b = num & 255;
    r = Math.round(r * (1 - amount)); g = Math.round(g * (1 - amount)); b = Math.round(b * (1 - amount));
    return `#${[r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')}`;
  }

  // --- linha de cores nomeadas ---
  const paletteNamed = el('paletteNamed');
  NAMED_COLORS.forEach((c) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.hex = c.hex.toLowerCase();
    btn.innerHTML = `<span class="named-swatch" style="background:${c.hex}; ${c.hex === '#FFFFFF' ? 'box-shadow:inset 0 0 0 1px #999;' : ''}"></span><span class="named-label">${c.name}</span>`;
    btn.title = `${c.name} (${c.hex})`;
    btn.addEventListener('click', () => selectColor(c.hex));
    paletteNamed.appendChild(btn);
  });

  // --- grade grande de 300 cores ---
  const paletteGrid = el('paletteGrid');
  const palette = buildPalette();
  palette.forEach((hex) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'palette-swatch';
    btn.dataset.hex = hex.toLowerCase();
    btn.style.backgroundColor = hex;
    btn.title = hex;
    btn.addEventListener('click', () => selectColor(hex));
    paletteGrid.appendChild(btn);
  });

  function selectColor(hex) {
    state.color = hex;
    el('colorHexLabel').textContent = hex.toUpperCase();
    const lower = hex.toLowerCase();
    [...paletteGrid.children].forEach(c => c.classList.toggle('active', c.dataset.hex === lower));
    [...paletteNamed.children].forEach(c => c.classList.toggle('active', c.dataset.hex === lower));
    updateBannerPreview();
  }

  // ------------------------------------------------------------
  // Simbolos da bandeira (30, com nome visivel + tooltip)
  // ------------------------------------------------------------
  const symbolGrid = el('symbolGrid');
  SYMBOLS.forEach((sym) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.title = sym.name;
    btn.innerHTML = `<span>${sym.emoji}</span><span class="sym-name">${sym.name}</span>`;
    if (sym.emoji === state.bannerSymbol) btn.classList.add('active');
    btn.addEventListener('click', () => {
      state.bannerSymbol = sym.emoji;
      [...symbolGrid.children].forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      updateBannerPreview();
    });
    symbolGrid.appendChild(btn);
  });

  // ------------------------------------------------------------
  // Padrao da bandeira
  // ------------------------------------------------------------
  const patternGrid = el('patternGrid');
  patternGrid.querySelectorAll('.pattern-opt').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.bannerPattern = btn.dataset.pattern;
      patternGrid.querySelectorAll('.pattern-opt').forEach(b => b.classList.toggle('active', b === btn));
      updateBannerPreview();
    });
  });

  // CORRIGIDO: usar backgroundColor (nao o atalho "background") para nao
  // apagar o background-image que os padroes (listras/diagonal/chevron)
  // definem via classe CSS. Esse era o bug que travava os padroes.
  /* Etapa 92: bandeira de duas cores (a divisão sobrepõe o padrão) */
  function divisionGradient(c1, c2, d) {
    if (d === 'metade') return `linear-gradient(90deg, ${c1} 50%, ${c2} 50%)`; if (d === 'faixa') return `linear-gradient(180deg, ${c1} 0 33%, ${c2} 33% 67%, ${c1} 67%)`;
    if (d === 'diagonal') return `linear-gradient(135deg, ${c1} 50%, ${c2} 50%)`; if (d === 'quartelado') return `conic-gradient(${c1} 0 25%, ${c2} 0 50%, ${c1} 0 75%, ${c2} 0)`; return '';
  }
  el('divisionGrid').querySelectorAll('.pattern-opt').forEach((btn) => btn.addEventListener('click', () => { state.bannerDivision = btn.dataset.division; el('divisionGrid').querySelectorAll('.pattern-opt').forEach((b) => b.classList.toggle('active', b === btn)); updateBannerPreview(); }));
  el('bannerColor2').addEventListener('input', (e) => { state.bannerBg2 = e.target.value; updateBannerPreview(); });
  function updateBannerPreview() {
    const cloth = el('bannerCloth');
    cloth.style.backgroundColor = state.color;
    cloth.style.setProperty('--pat-color', darken(state.color, 0.5));
    cloth.className = 'banner-cloth' + (state.bannerPattern !== 'solid' && state.bannerDivision === 'inteira' ? ` pattern-${state.bannerPattern}` : '');
    cloth.style.backgroundImage = state.bannerDivision === 'inteira' ? '' : divisionGradient(state.color, state.bannerBg2, state.bannerDivision);
    el('bannerSymbolPreview').textContent = state.bannerSymbol;
  }
  selectColor(state.color);
  updateBannerPreview();

  // ------------------------------------------------------------
  // Governo — carregado dinamicamente da API, agrupado por categoria
  // ------------------------------------------------------------
  async function loadGovernments() {
    const container = el('govCategories');
    container.innerHTML = '<p class="hint">Consultando os arquivos de governo…</p>';
    try {
      const { categories, governments } = await Api.getGovernments();
      state.governments = governments;
      state.govCategories = categories;
      renderGovernments();
    } catch (err) {
      container.innerHTML = `<p class="hint" style="color:#7a1f2b;">${err.message}</p>`;
    }
  }

  function renderGovernments() {
    const container = el('govCategories');
    container.innerHTML = Object.entries(state.govCategories).map(([catKey, catLabel]) => {
      const govsInCat = state.governments.filter(g => g.category === catKey);
      if (!govsInCat.length) return '';
      return `
        <div class="gov-category">
          <div class="gov-category-title">${escapeHtml(catLabel)}</div>
          <div class="gov-grid">
            ${govsInCat.map(g => `
              <button type="button" class="gov-card ${state.government === g.key ? 'active' : ''}" data-gov="${g.key}">
                <span class="gov-icon">${g.icon}</span>
                <span class="gov-name">${escapeHtml(g.name)}</span>
                <span class="gov-desc">${escapeHtml(g.description)}</span>
                <div class="gov-traits">${g.traits.map(t => `<span class="gov-trait">${escapeHtml(t)}</span>`).join('')}</div>
              </button>
            `).join('')}
          </div>
        </div>
      `;
    }).join('');

    container.querySelectorAll('.gov-card').forEach((card) => {
      card.addEventListener('click', () => {
        state.government = card.dataset.gov;
        container.querySelectorAll('.gov-card').forEach(c => c.classList.toggle('active', c === card));
        renderGovDetail();
      });
    });
    loadGovCatalog();
  }

  // Etapa 35: o governo e uma ESCOLHA ESTRATEGICA — mostramos poderes, limitacoes, instituicoes e regras reais
  async function loadGovCatalog() {
    if (state.govCatalog) { renderGovDetail(); return; }
    try { const { governments } = await Api.getGovernmentCatalog(); state.govCatalog = Object.fromEntries(governments.map(g => [g.key, g])); renderGovDetail(); } catch { /* a escolha continua funcionando sem o detalhe */ }
  }
  function renderGovDetail() {
    const box = el('govDetail'); if (!box) return; const g = state.govCatalog && state.govCatalog[state.government];
    if (!g) { box.innerHTML = state.government ? '<p class="hint">Carregando os detalhes do governo…</p>' : '<p class="hint">Selecione um governo para ver como ele muda a sua campanha.</p>'; return; }
    const li = (a) => a.map(x => `<li>${escapeHtml(x)}</li>`).join('');
    box.innerHTML = `<div class="gov-detail-card" style="border:2px solid #b08d3c;border-radius:8px;padding:14px;background:rgba(255,248,225,.55);">
      <h3>${g.icon} ${escapeHtml(g.name)} — <em>${escapeHtml(g.tag)}</em></h3><p>${escapeHtml(g.summary)}</p>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px;">
        <div><strong>✅ O que você pode fazer</strong><ul>${li(g.powers)}</ul></div>
        <div><strong>⛔ Limitações reais</strong><ul>${li(g.limits)}</ul></div>
        <div><strong>🏛️ Instituições</strong><ul>${g.institutions.map(i => `<li>${i.i} <strong>${escapeHtml(i.n)}</strong>: ${escapeHtml(i.d)}</li>`).join('')}</ul></div>
      </div>
      <p><strong>👑 Sucessão:</strong> ${escapeHtml(g.succession)}</p>
      <p><strong>💰 Imposto máx.:</strong> ${g.caps.tax}% · <strong>⚔️ Exército máx.:</strong> ${g.caps.armyPct}% da população · <strong>🔬 Pesquisa:</strong> ×${g.caps.research} · <strong>🗳️ Aprovação:</strong> ${g.approval ? escapeHtml(g.approval.body) + ' (' + g.approval.cats.join(', ') + ')' : 'decide sem aprovação'}${g.election ? ' · <strong>📅 Eleições:</strong> a cada ' + g.election.term + ' anos' : ''}</p>
      <p><strong>🎯 Estilo de jogo:</strong> ${escapeHtml(g.style)} <br><strong>⚠️ Dificuldade:</strong> ${escapeHtml(g.hard)} <br><strong>🏅 Ideal:</strong> ${escapeHtml(g.ideal)} — ${escapeHtml(g.win)}</p>
      <p><strong>Pilares que mais importam:</strong> ${g.topPillars.map(p => `${p.icon} ${escapeHtml(p.name)} (${p.weight}%)`).join(' · ')}</p>
      <p><strong>Decretos exclusivos (${g.decrees.length}):</strong> ${g.decrees.map(d => `${d.icon} ${escapeHtml(d.name)}`).join(' · ')}</p>
      <p><strong>Crises típicas:</strong> ${g.crises.map(escapeHtml).join(' · ')}</p></div>`;
  }
  function renderGovCompare() {
    const box = el('govCompare'); if (!box || !state.govCatalog) return; const rows = Object.values(state.govCatalog);
    box.innerHTML = `<div style="overflow-x:auto;"><table class="gov-compare" style="border-collapse:collapse;width:100%;font-size:.85em;"><thead><tr style="background:rgba(176,141,60,.25);"><th>Governo</th><th>Imposto máx.</th><th>Exército máx.</th><th>Pesquisa</th><th>Aprovação</th><th>Eleição</th><th>Poder maior</th><th>Centr./Lib./Part.</th><th>Capital pol./dia</th></tr></thead><tbody>${rows.map(g => `<tr data-govrow="${g.key}" style="${state.government === g.key ? 'background:rgba(236,200,95,.35);' : ''}cursor:pointer;"><td>${g.icon} ${escapeHtml(g.name)}</td><td>${g.caps.tax}%</td><td>${g.caps.armyPct}%</td><td>×${g.caps.research}</td><td>${g.approval ? escapeHtml(g.approval.body) : '—'}</td><td>${g.election ? g.election.term + ' anos' : '—'}</td><td>${g.topPillars[0].icon} ${g.topPillars[0].weight}%</td><td>${g.base.c}/${g.base.l}/${g.base.p}</td><td>${g.caps.regen}</td></tr>`).join('')}</tbody></table></div>`;
    box.querySelectorAll('[data-govrow]').forEach(r => r.addEventListener('click', () => { state.government = r.dataset.govrow; document.querySelectorAll('.gov-card').forEach(c => c.classList.toggle('active', c.dataset.gov === state.government)); renderGovDetail(); renderGovCompare(); }));
  }
  document.addEventListener('click', (e) => { if (e.target && e.target.id === 'govCompareBtn') { const b = el('govCompare'); if (!state.govCatalog) { loadGovCatalog().then(renderGovCompare); } else renderGovCompare(); b.classList.toggle('hidden'); } });

  // ------------------------------------------------------------
  // Territorio
  // ------------------------------------------------------------
  const territoryGrid = el('territoryGrid');

  function renderWizardLegend() {
    const legend = el('wizardMapLegend');
    legend.innerHTML = Object.entries(TERRAIN_LABEL).map(([key, label]) => `
      <span><i class="sw sw-${key}"></i> ${label}</span>
    `).join('') + '<span><i class="sw sw-ocupado"></i> Ocupado</span>';
  }

  async function loadMap() {
    territoryGrid.innerHTML = '<p style="padding:20px;">Desenhando o mapa do mundo…</p>';
    try {
      const { territories, cols } = await Api.getMap();
      state.territories = territories;
      state.mapCols = cols;
      renderMap();
      const last = territories[territories.length - 1];
      if (last && state.mapView) state.mapView.centerOn(last.row / 2, last.col / 2);
    } catch (err) {
      territoryGrid.innerHTML = `<p style="padding:20px;color:#7a1f2b;">${err.message}</p>`;
    }
  }

  function renderMap() {
    territoryGrid.innerHTML = '';
    territoryGrid.style.display = 'grid';
    if (!state.mapView) state.mapView = MapView.attach(territoryGrid.parentElement, territoryGrid, { cell: 30 });
    state.mapView.setCols(state.mapCols || 120);
    state.territories.forEach((t) => {
      const cell = document.createElement('div');
      cell.className = `territory-cell terrain-${t.terrain}`;
      cell.textContent = TERRAIN_ICON[t.terrain] || '';
      cell.title = `${TERRAIN_LABEL[t.terrain]} — linha ${t.row + 1}, coluna ${t.col + 1}`;

      if (t.terrain === 'oceano') {
        cell.classList.add('oceano-cell');
      } else if (t.owned) {
        cell.classList.add('owned');
        cell.title += ' (ocupado)';
      } else {
        cell.dataset.tid = t.id;
        cell.addEventListener('click', () => {
          showTerritoryPreview(t.id);
          state.territoryId = t.id;
          state.territoryLabel = `${TERRAIN_LABEL[t.terrain]} — linha ${t.row + 1}, coluna ${t.col + 1}`;
          territoryGrid.querySelectorAll('.territory-cell').forEach(c => c.classList.remove('selected'));
          cell.classList.add('selected');
          el('territorySelectedInfo').textContent = `Território selecionado: ${state.territoryLabel} ${TERRAIN_ICON[t.terrain]}`;
        });
      }
      territoryGrid.appendChild(cell);
    });
    if (!territoryGrid.dataset.hover) { territoryGrid.dataset.hover = '1'; territoryGrid.addEventListener('mouseover', (e) => { const c = e.target.closest('[data-tid]'); if (!c) return; clearTimeout(tpTimer); tpTimer = setTimeout(() => showTerritoryPreview(Number(c.dataset.tid)), 250); }); }
  }

  // ------------------------------------------------------------
  // Navegacao entre etapas
  // ------------------------------------------------------------

  // ------------------------------------------------------------
  // Etapa 92: Povo (origem, governante, tradição, fé), território informativo e reinos prontos
  // ------------------------------------------------------------
  const IDS = { data: null };
  async function renderIdentityStep() {
    const host = el('identityBody');
    if (!IDS.data) { try { IDS.data = await Api.getOrigins(); } catch (err) { host.innerHTML = `<p style="color:#7a1f2b;">${escapeHtml(err.message)}</p>`; return; } }
    const d = IDS.data;
    const card = (kind, o, cur) => `<button type="button" class="id-card${cur === o.key ? ' active' : ''}" data-kind="${kind}" data-key="${o.key}"><span class="id-ico">${o.icon}</span><strong>${escapeHtml(o.name)}</strong><small>${escapeHtml(o.story)}</small>${o.bonus ? `<small class="id-pos">+ ${escapeHtml(o.bonus.replace(/^[+−-]\s*/, ''))}</small>` : ''}${o.cost ? `<small class="id-neg">− ${escapeHtml(o.cost.replace(/^[+−-]\s*/, ''))}</small>` : ''}</button>`;
    host.innerHTML = `
      <h3 class="id-section">Origem do povo</h3><div class="id-grid" data-group="origin">${d.origins.map((o) => card('origin', o, state.origin)).join('')}</div><p class="hint-inline">Sem origem escolhida, o reino começa do jeito padrão. Clique de novo na escolhida para desmarcar.</p>
      <h3 class="id-section">Quem governa: passado</h3><div class="id-grid" data-group="rulerPast">${d.pasts.map((o) => card('rulerPast', o, state.rulerPast)).join('')}</div>
      <h3 class="id-section">Quem governa: até 2 traços de personalidade <span class="hint-inline" id="traitCount">(${state.rulerTraits.length}/2)</span></h3><div class="id-chips" id="traitChips">${d.traits.map((x) => `<button type="button" class="id-chip${state.rulerTraits.includes(x.key) ? ' active' : ''}" data-trait="${x.key}" ${!state.rulerTraits.includes(x.key) && state.rulerTraits.length >= 2 ? 'disabled' : ''}>${x.icon} ${escapeHtml(x.name)}</button>`).join('')}</div>
      <h3 class="id-section">Tradição do povo</h3><div class="id-grid" data-group="tradition">${d.traditions.map((o) => card('tradition', o, state.tradition)).join('')}</div>
      <h3 class="id-section">Fé do reino</h3><div class="faith-box"><label><input type="checkbox" id="faithOn" ${state.faithOn ? 'checked' : ''}> Definir a fé do reino agora (vira a religião de Estado, sem custo)</label><div id="faithFields" class="${state.faithOn ? '' : 'hidden'}"><div class="field"><label for="faithName">Nome da fé</label><input type="text" id="faithName" maxlength="30" value="${escapeHtml(state.faithName)}" placeholder="Fé do Vale"></div><p class="hint-inline">Escolha exatamente 2 princípios <span id="prCount">(${state.faithPrinciples.length}/2)</span>:</p><div class="id-chips" id="prChips">${d.principles.map((x) => `<button type="button" class="id-chip${state.faithPrinciples.includes(x.key) ? ' active' : ''}" data-pr="${x.key}">${x.icon} ${escapeHtml(x.name)}</button>`).join('')}</div></div></div>`;
    host.onclick = (e) => {
      const c = e.target.closest('.id-card'); const tr = e.target.closest('[data-trait]'); const pr = e.target.closest('[data-pr]');
      if (c) { const k = c.dataset.kind, key = c.dataset.key; state[k] = state[k] === key ? '' : key; host.querySelectorAll(`.id-card[data-kind="${k}"]`).forEach((b) => b.classList.toggle('active', b.dataset.key === state[k])); }
      if (tr) { const key = tr.dataset.trait; const i = state.rulerTraits.indexOf(key); if (i >= 0) state.rulerTraits.splice(i, 1); else if (state.rulerTraits.length < 2) state.rulerTraits.push(key); host.querySelectorAll('[data-trait]').forEach((b) => { const on = state.rulerTraits.includes(b.dataset.trait); b.classList.toggle('active', on); b.disabled = !on && state.rulerTraits.length >= 2; }); el('traitCount').textContent = `(${state.rulerTraits.length}/2)`; }
      if (pr) { const key = pr.dataset.pr; const i = state.faithPrinciples.indexOf(key); if (i >= 0) state.faithPrinciples.splice(i, 1); else if (state.faithPrinciples.length < 2) state.faithPrinciples.push(key); host.querySelectorAll('[data-pr]').forEach((b) => b.classList.toggle('active', state.faithPrinciples.includes(b.dataset.pr))); el('prCount').textContent = `(${state.faithPrinciples.length}/2)`; }
    };
    el('faithOn').onchange = (e) => { state.faithOn = e.target.checked; el('faithFields').classList.toggle('hidden', !state.faithOn); };
    el('faithName').oninput = (e) => { state.faithName = e.target.value; };
  }
  const tpCache = new Map(); let tpTimer = null;
  async function showTerritoryPreview(id) {
    const box = el('territoryPreview'); if (!box) return; let p = tpCache.get(id);
    if (!p) { try { p = await Api.territoryPreview(id); tpCache.set(id, p); } catch (err) { box.innerHTML = `<p class="hint-inline">${escapeHtml(err.message)}</p>`; return; } }
    box.innerHTML = `<div class="tp-head">${escapeHtml(p.verdict)} · ${escapeHtml(TERRAIN_LABEL[p.terrain] || p.terrain)}</div><p>${escapeHtml(p.terrainNote)}</p><ul>${p.lines.map((l) => `<li class="${l.good === false ? 'tp-warn' : l.good ? 'tp-good' : ''}">${escapeHtml(l.text)}</li>`).join('')}</ul><p class="hint-inline">Vizinhança: ${p.neighbors.free} região(ões) livre(s), ${p.neighbors.ocean} de oceano${p.neighbors.rival ? `, ${p.neighbors.rival} de reino rival` : ''}. Vocação natural das cidades aqui: ${p.suggested.map((s) => s.icon + ' ' + escapeHtml(s.name)).join(', ')}.</p>`;
  }
  function identityPayload() {
    const o = {}; if (state.origin) o.origin = state.origin; if (state.rulerPast) o.rulerPast = state.rulerPast; if (state.tradition) o.tradition = state.tradition; if (state.rulerTraits.length) o.rulerTraits = state.rulerTraits;
    if (state.faithOn && state.faithName.trim() && state.faithPrinciples.length === 2) o.faith = { name: state.faithName.trim(), principles: state.faithPrinciples };
    if (state.dynasty) o.dynasty = state.dynasty; if (state.motto) o.motto = state.motto; if (state.bannerDivision !== 'inteira') { o.bannerDivision = state.bannerDivision; o.bannerBg2 = state.bannerBg2; } return o;
  }
  // reinos prontos e sorteio: preenchem TUDO e levam direto ao resumo (dá para voltar e mudar qualquer coisa)
  const PRESETS = {
    vale: { name: 'Vale Dourado', ruler: 'Aurora', capital: 'Alvorada', color: '#3b7a3a', sym: 14, pattern: 'solid', gov: 'monarquia_constitucional', origin: 'colonos_alem_mar', past: 'sacerdote', tradition: 'hospitalidade', traits: ['generoso', 'trabalhador'], faith: { name: 'Fé da Colheita', principles: ['fartura', 'acolher'] }, dynasty: 'Casa Aurora', motto: 'A terra provê', terrain: ['planicie', 'vale'] },
    mar: { name: 'República do Sal', ruler: 'Maré', capital: 'Porto Alvorada', color: '#1f5f8f', sym: 12, pattern: 'stripes', gov: 'republica', origin: 'republica_mercantil', past: 'mercador', tradition: 'engenho', traits: ['racional', 'carismatico'], dynasty: 'Casa da Maré', motto: 'Vento em popa', terrain: ['costa', 'recife'] },
    montanha: { name: 'Pico Antigo', ruler: 'Brenna', capital: 'Rocha Funda', color: '#6a4a3a', sym: 13, pattern: 'chevron', gov: 'aristocracia', origin: 'cla_montanhas', past: 'soldado', tradition: 'bravura', traits: ['corajoso', 'protetor'], faith: { name: 'Culto da Pedra', principles: ['tradicao', 'rigor'] }, dynasty: 'Clã do Pico', motto: 'Firmes como a pedra', terrain: ['montanha', 'colina'] },
  };
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  async function applyPreset(key) {
    hideAlert(); let pr = PRESETS[key];
    if (!IDS.data) { try { IDS.data = await Api.getOrigins(); } catch (err) { showError(err.message); return; } } /* o resumo precisa dos nomes de origem, passado e tradição */
    if (key === 'sorteio') {
      if (!IDS.data) { try { IDS.data = await Api.getOrigins(); } catch (err) { showError(err.message); return; } }
      const d = IDS.data; const faixa = pick(['#8B2E2E', '#2E5A8B', '#2E7A4A', '#7A5A2E', '#5A2E7A', '#8B6B1F']); const traits = [...d.traits].sort(() => Math.random() - 0.5).slice(0, 2).map((x) => x.key); const govs = ['monarquia_absoluta', 'monarquia_constitucional', 'republica', 'aristocracia', 'imperio', 'teocracia', 'plutocracia', 'federacao'];
      pr = { name: pick(['Reino de Aldoria', 'Terras do Norte', 'Reino de Vale Claro', 'Reino da Estrela', 'Reino de Corvalho']), ruler: pick(['Elandra', 'Bram', 'Isolde', 'Magnus', 'Rowena', 'Cedric']), capital: pick(['Valoria', 'Pedra Alta', 'Porto Claro', 'Monte Sol', 'Campo Largo']), color: faixa, sym: Math.floor(Math.random() * 30), pattern: pick(['solid', 'stripes', 'cross', 'diagonal', 'chevron']), gov: pick(govs), origin: pick(d.origins).key, past: pick(d.pasts).key, tradition: pick(d.traditions).key, traits, dynasty: '', motto: '', terrain: ['planicie', 'vale', 'costa', 'colina', 'floresta'] };
    }
    state.kingdomName = pr.name; state.rulerName = pr.ruler; state.capitalName = pr.capital; el('kingdomName').value = pr.name; el('rulerName').value = pr.ruler; el('capitalName').value = pr.capital;
    state.dynasty = pr.dynasty || ''; state.motto = pr.motto || ''; el('dynasty').value = state.dynasty; el('motto').value = state.motto; state.color = pr.color; state.bannerSymbol = (SYMBOLS[pr.sym] || SYMBOLS[0]).emoji; state.bannerPattern = pr.pattern; selectColor(state.color); updateBannerPreview();
    state.government = pr.gov; state.origin = pr.origin; state.rulerPast = pr.past; state.tradition = pr.tradition; state.rulerTraits = [...pr.traits]; state.faithOn = !!pr.faith; state.faithName = pr.faith ? pr.faith.name : ''; state.faithPrinciples = pr.faith ? [...pr.faith.principles] : [];
    if (state.governments.length === 0) { try { await loadGovernments(); } catch { /* o resumo mostra só o nome */ } }
    if (state.territories.length === 0) { renderWizardLegend(); await loadMap(); }
    const livres = state.territories.filter((x) => !x.owned && x.terrain !== 'oceano'); const pref = livres.filter((x) => (pr.terrain || []).includes(x.terrain)); const t = pick(pref.length ? pref : livres);
    if (!t) { showError('Não achei um território livre. Escolha um no mapa.'); goToStep(5); return; }
    state.territoryId = t.id; state.territoryLabel = `${TERRAIN_LABEL[t.terrain]} · linha ${t.row + 1}, coluna ${t.col + 1}`; goToStep(TOTAL_STEPS);
  }
  el('quickStart').querySelectorAll('[data-preset]').forEach((b) => b.addEventListener('click', () => applyPreset(b.dataset.preset)));

  const stepsTrack = el('stepsTrack');
  const panels = [...document.querySelectorAll('[data-step-panel]')];
  const backBtn = el('backBtn');
  const nextBtn = el('nextBtn');
  const foundBtn = el('foundBtn');

  function validateStep(step) {
    if (step === 1) {
      if (!el('kingdomName').value.trim()) return 'Informe o nome do seu reino.';
      if (!el('rulerName').value.trim()) return 'Informe o nome do governante.';
      if (!el('capitalName').value.trim()) return 'Informe o nome da sua capital.';
    }
    if (step === 3 && !state.government) return 'Escolha uma forma de governo.';
    if (step === 4 && state.faithOn && ((state.faithName || '').trim().length < 3 || state.faithPrinciples.length !== 2)) return 'Para definir a fé do reino, dê um nome (3 letras ou mais) e escolha exatamente 2 princípios, ou desligue a opção.';
    if (step === 5 && !state.territoryId) return 'Selecione um território no mapa.';
    return null;
  }

  function goToStep(step) {
    hideAlert();
    state.step = step;

    panels.forEach(p => p.classList.toggle('active', Number(p.dataset.stepPanel) === step));
    stepsTrack.querySelectorAll('li').forEach((li) => {
      const n = Number(li.dataset.step);
      li.classList.toggle('active', n === step);
      li.classList.toggle('done', n < step);
    });

    backBtn.style.visibility = step === 1 ? 'hidden' : 'visible';
    nextBtn.classList.toggle('hidden', step === TOTAL_STEPS);
    foundBtn.classList.toggle('hidden', step !== TOTAL_STEPS);

    if (step === 3 && state.governments.length === 0) loadGovernments();
    el('wizardWrap').classList.toggle('map-mode', step === 5);
    if (step === 4) renderIdentityStep();
    if (step === 5 && state.territories.length === 0) { renderWizardLegend(); loadMap(); }
    if (step === 6) renderSummary();

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  nextBtn.addEventListener('click', () => {
    if (state.step === 1) {
      state.kingdomName = el('kingdomName').value.trim();
      state.rulerName = el('rulerName').value.trim();
      state.capitalName = el('capitalName').value.trim();
      state.dynasty = el('dynasty').value.trim(); state.motto = el('motto').value.trim();
    }
    const error = validateStep(state.step);
    if (error) { showError(error); return; }
    goToStep(Math.min(state.step + 1, TOTAL_STEPS));
  });

  backBtn.addEventListener('click', () => goToStep(Math.max(state.step - 1, 1)));

  function renderSummary() {
    const gov = state.governments.find(g => g.key === state.government);
    const grid = el('summaryGrid');
    grid.innerHTML = `
      <div class="summary-item"><span class="k">REINO</span><span class="v">${escapeHtml(state.kingdomName)}</span></div>
      <div class="summary-item"><span class="k">GOVERNANTE</span><span class="v">${escapeHtml(state.rulerName)}</span></div>
      <div class="summary-item"><span class="k">CAPITAL</span><span class="v">${escapeHtml(state.capitalName)}</span></div>
      <div class="summary-item"><span class="k">GOVERNO</span><span class="v">${gov ? `${gov.icon} ${escapeHtml(gov.name)}` : '—'}</span></div>
      <div class="summary-item"><span class="k">BANDEIRA</span><span class="v">${state.bannerSymbol} — padrão ${state.bannerPattern}</span></div>
      <div class="summary-item"><span class="k">COR DO REINO</span><span class="v"><span style="display:inline-block;width:14px;height:14px;border-radius:3px;background:${state.color};vertical-align:middle;margin-right:6px;box-shadow:inset 0 0 0 1px rgba(0,0,0,.3);"></span>${state.color.toUpperCase()}</span></div>
      ${state.origin && IDS.data ? `<div class="summary-item"><span class="k">ORIGEM</span><span class="v">${escapeHtml((IDS.data.origins.find((o) => o.key === state.origin) || {}).name || '')}</span></div>` : ''}
      ${state.rulerPast && IDS.data ? `<div class="summary-item"><span class="k">PASSADO</span><span class="v">${escapeHtml((IDS.data.pasts.find((o) => o.key === state.rulerPast) || {}).name || '')}</span></div>` : ''}
      ${state.tradition && IDS.data ? `<div class="summary-item"><span class="k">TRADIÇÃO</span><span class="v">${escapeHtml((IDS.data.traditions.find((o) => o.key === state.tradition) || {}).name || '')}</span></div>` : ''}
      ${state.rulerTraits.length && IDS.data ? `<div class="summary-item"><span class="k">TRAÇOS</span><span class="v">${state.rulerTraits.map((k) => escapeHtml((IDS.data.traits.find((x) => x.key === k) || {}).name || k)).join(', ')}</span></div>` : ''}
      ${state.faithOn && state.faithName ? `<div class="summary-item"><span class="k">FÉ</span><span class="v">${escapeHtml(state.faithName)}</span></div>` : ''}
      ${state.dynasty ? `<div class="summary-item"><span class="k">DINASTIA</span><span class="v">${escapeHtml(state.dynasty)}${state.motto ? ' · “' + escapeHtml(state.motto) + '”' : ''}</span></div>` : ''}
      <div class="summary-item full"><span class="k">TERRITÓRIO INICIAL</span><span class="v">${escapeHtml(state.territoryLabel || '—')}</span></div>
    `;
  }

  // ------------------------------------------------------------
  // Fundacao final
  // ------------------------------------------------------------
  foundBtn.addEventListener('click', async () => {
    hideAlert();
    foundBtn.disabled = true;
    el('foundLabel').innerHTML = '<span class="spinner"></span> Fundando o reino…';

    try {
      const criado = await Api.createKingdom({
        name: state.kingdomName,
        rulerName: state.rulerName,
        capitalName: state.capitalName,
        government: state.government,
        color: state.color,
        bannerSymbol: state.bannerSymbol,
        bannerBg: state.color,
        bannerPattern: state.bannerPattern,
        territoryId: state.territoryId,
        ...identityPayload(),
      });
      el('foundLabel').textContent = '👑 Reino fundado! Redirecionando…';
      const avisos = (criado && criado.warnings) || []; if (avisos.length) { showError('Reino fundado, mas: ' + avisos.join(' ')); } /* nada de erro mudo: o jogador lê o aviso antes de seguir */
      setTimeout(() => { window.location.href = 'kingdom.html'; }, avisos.length ? 4500 : 700);
    } catch (err) {
      showError(err.message);
      foundBtn.disabled = false;
      el('foundLabel').textContent = '👑 Fundar meu Reino';
    }
  });

  // ------------------------------------------------------------
  // Boot: garante que o jogador ainda nao possui reino
  // ------------------------------------------------------------
  (async function boot() {
    try {
      const { hasKingdom } = await Api.me();
      if (hasKingdom) { window.location.href = 'kingdom.html'; return; }
      el('loading').classList.add('hidden');
      el('wizardWrap').classList.remove('hidden');
      goToStep(1);
    } catch (err) {
      Api.clearSession();
      window.location.href = 'login.html';
    }
  })();
})();
