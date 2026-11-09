// js/painel-religiao-infra.js — extraído de kingdom.js (Etapa 66) por backend/tools/extractPanel.js.
// O contexto (ctx) lista o que o trecho usa do fechamento do kingdom.js; o teste de contrato (tests/painel-contrato.test.js) falha se algo ficar sem dono.
(function () {
  const K = window.KOT || (window.KOT = {}); K.panels = K.panels || {};
  K.panels['religiao-infra'] = function (ctx) {
    const { RESOURCE_META, TERRAIN_ICON, TERRAIN_LABEL, dyFilterPartners, el, escapeHtml, expedOverlay, fmt, infoBtn, loadDynastyTree, openDynastyMember, refreshAll, renderDynasty, renderFamiliesList, showToast, state } = ctx;
    async function dyAction(fn, prefix) {
      try { const r = await fn(); showToast(`${prefix} ${r.message || ''}`); await refreshAll(true); }
      catch (err) { showToast(`⚠️ ${err.message}`); }
    }
    el('dyTabs').addEventListener('click', (e) => { const b = e.target.closest('[data-dytab]'); if (!b) return; state.dyTab = b.dataset.dytab; renderDynasty(); });
    el('dyBody').addEventListener('input', (e) => { if (e.target.id === 'dyFamSearch') { state.dySearch = e.target.value; renderFamiliesList(); } });
    el('dyBody').addEventListener('change', (e) => {
      if (e.target.id === 'dyFamSelect') { state.dyFamily = Number(e.target.value); loadDynastyTree(); }
      else if (e.target.id === 'dyFamKind') { state.dyKind = e.target.value; renderFamiliesList(); }
      else if (e.target.id === 'dyFamSort') renderFamiliesList();
      else if (e.target.id === 'dyMarrMember') dyFilterPartners();
      else if (e.target.id === 'dyMarrType') { el('dyMarrNobleRow').style.display = e.target.value === 'noble' ? '' : 'none'; el('dyMarrAiRow').style.display = e.target.value === 'foreign' ? '' : 'none'; }
    });
    el('dyBody').addEventListener('click', (e) => {
      const chip = e.target.closest('[data-dymember]'); if (chip) { openDynastyMember(chip.dataset.dymember); return; }
      const tr = e.target.closest('[data-dytree]'); if (tr) { state.dyFamily = Number(tr.dataset.dytree); state.dyTab = 'arvore'; renderDynasty(); return; }
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.dydesignate) dyAction(() => Api.designateHeir(b.dataset.dydesignate), '👑');
      else if (b.id === 'dyEduBtn') { const id = el('dyEduMember').value; if (!id) { showToast('⚠️ Ninguém em idade de estudar.'); return; } dyAction(() => Api.educateMember(id, el('dyEduArea').value), '🎓'); }
      else if (b.id === 'dyMarryBtn') {
        const mid = el('dyMarrMember').value; if (!mid) { showToast('⚠️ Ninguém disponível para casar.'); return; }
        const type = el('dyMarrType').value;
        const pid = type === 'noble' ? el('dyMarrPartner').value : el('dyMarrAi').value;
        if (type === 'noble' && !pid) { showToast('⚠️ Nenhum parceiro compatível (sexo oposto, outra família) disponível.'); return; }
        dyAction(() => Api.dynastyMarry(mid, type, pid), '💍');
      }
      else if (b.id === 'dyAdoptBtn') dyAction(() => Api.adoptChild(), '🧒');
      else if (b.id === 'dyTitleBtn') { const id = el('dyTitleMember').value; if (!id) return; dyAction(() => Api.grantTitle(id, el('dyTitleKey').value), '🏰'); }
      else if (b.id === 'dyFoundBtn') dyAction(() => Api.foundFamily(el('dyFoundKind').value), '🏛️');
      else if (b.dataset.dydec) { const [id, choice] = b.dataset.dydec.split(':'); dyAction(() => Api.resolveDynDecision(id, choice), '📜'); }
    });
    el('expedModalBody').addEventListener('click', async (e) => {
      const chip = e.target.closest('[data-dymember]'); if (chip) { openDynastyMember(chip.dataset.dymember); return; }
      if (e.target.id === 'dyModalClose') { expedOverlay.classList.add('hidden'); return; }
      const b = e.target.closest('[data-dyact]'); if (!b) return;
      const [act, id] = b.dataset.dyact.split(':');
      expedOverlay.classList.add('hidden');
      if (act === 'exilar' || act === 'deserdar') dyAction(() => Api.banishMember(id, act), '🚪');
      else if (act === 'testamento') dyAction(() => Api.setWill(id, el('dyWillHeir') ? el('dyWillHeir').value : null), '📜');
    });

    // ==============================================================
    // FÉ E RELIGIÕES (Etapa 26)
    // ==============================================================
    const RL_TABS = [
      ['visao', '⛪ Visão Geral'], ['religioes', '📿 Religiões'], ['divindades', '🌟 Divindades'], ['ordens', '🛡️ Ordens'], ['milagres', '🙏 Milagres'],
      ['reliquias', '🏺 Relíquias e Textos'], ['conflitos', '⚖️ Conflitos e Cultos'], ['tesouro', '💰 Tesouro'], ['reinos', '🌍 Fé dos Reinos'], ['historia', '📖 História'],
    ];
    const rlStatusLabel = { ativa: 'Ativa', proibida: '🚫 Proibida', oculta: 'Oculta', esquecida: '🗿 Esquecida', extinta: '🥀 Extinta' };
    function rlStepper(id, unitCost, value = 1) {
      return `<span class="rl-stepper" style="display:inline-flex;align-items:center;gap:4px;"><button type="button" class="btn btn-ghost btn-sm" data-rlstep="${id}:-1">−</button>
        <input type="number" id="${id}" min="1" max="50" value="${value}" style="width:56px;text-align:center;" data-unit="${unitCost}"><button type="button" class="btn btn-ghost btn-sm" data-rlstep="${id}:1">+</button>
        <span class="hint" id="${id}Cost">= 💰 ${fmt(unitCost * value)}</span></span>`;
    }
    function renderReligion() {
      const rl = state.religion;
      if (!rl || !el('rlBody')) return;
      el('rlTabs').innerHTML = RL_TABS.map(([k, label]) => `<button class="category-chip ${state.rlTab === k ? 'active' : ''}" data-rltab="${k}">${label}${k === 'conflitos' && rl.decisions.some(d => d.status === 'pendente') ? ` (${rl.decisions.filter(d => d.status === 'pendente').length})` : ''}</button>`).join('');
      const tab = state.rlTab; let html = '';
      const active = rl.religions.filter(r => ['ativa', 'proibida', 'oculta'].includes(r.status));
      const modChips = Object.entries(rl.modifiers).filter(([, v]) => Math.abs(v) >= 0.05).map(([k, v]) => `<span class="bc-stat ${(k === 'crime' ? v <= 0 : v >= 0) ? 'prod' : 'cons'}">${k}: ${v > 0 ? '+' : ''}${v}</span>`).join('') || '<span class="hint">Sem efeitos relevantes.</span>';

      if (tab === 'visao') {
        const bar = active.filter(r => r.share > 0).map(r => `<div title="${escapeHtml(r.name)} ${r.share}%" style="width:${r.share}%;background:${r.color};"></div>`).join('') + `<div title="Sem religião ${rl.atheistShare}%" style="width:${rl.atheistShare}%;background:#777;"></div>`;
        html = `<div class="ficha-section-title">Distribuição da população ${infoBtn('religion_share')}</div>
          <div style="display:flex;height:22px;border-radius:6px;overflow:hidden;border:1px solid var(--wood-light);">${bar}</div>
          <div class="bc-stats" style="margin-top:8px;">${active.map(r => `<span class="bc-stat"><i class="sw" style="background:${r.color}"></i> ${r.symbol} ${escapeHtml(r.name)}: ${r.share}% (${fmt(r.followers)})${r.isState ? ' 🏛️' : ''}</span>`).join('')}<span class="bc-stat"><i class="sw" style="background:#777"></i> Sem religião: ${rl.atheistShare}%</span></div>
          <div class="tech-controls" style="margin-top:10px;"><label class="hint">Religião de Estado ${infoBtn('state_religion')}</label>
            <select id="rlStateSel"><option value="">⚖️ Estado neutro</option>${active.filter(r => r.status === 'ativa').map(r => `<option value="${r.id}" ${r.isState ? 'selected' : ''}>${r.symbol} ${escapeHtml(r.name)}</option>`).join('')}</select><button class="btn btn-primary" id="rlStateBtn">Definir</button></div>
          <div class="tech-controls"><label class="hint">Tolerância ${infoBtn('tolerance_rel')}</label><select id="rlTolSel">${rl.toleranceLevels.map(t => `<option value="${t.key}" ${t.key === rl.tolerance ? 'selected' : ''}>${t.icon} ${escapeHtml(t.name)}</option>`).join('')}</select><button class="btn btn-secondary" id="rlTolBtn">Aplicar</button></div>
          <div class="bc-stats"><span class="bc-stat ${rl.tension >= 12 ? 'cons' : ''}">🔥 Tensão religiosa: ${rl.tension} ${infoBtn('tension')}</span><span class="bc-stat">⛪ ${rl.religiousBuildings} construção(ões) religiosa(s)</span>${rl.hiddenCultsHint ? `<span class="bc-stat cons">🕯️ ${escapeHtml(rl.hiddenCultsHint)}</span>` : ''}</div>
          <div class="ficha-section-title">Efeitos no Reino</div><div class="bc-stats">${modChips}</div>
          <div class="ficha-section-title">Contadores</div><div class="bc-stats"><span class="bc-stat">🙏 ${rl.counters.miraclesOk} milagres (${rl.counters.miraclesFail} falhas)</span><span class="bc-stat">📣 ${fmt(rl.counters.conversions)} conversões</span><span class="bc-stat">✂️ ${rl.counters.schisms} cismas</span><span class="bc-stat">🏺 ${rl.counters.relicsFound} relíquias</span><span class="bc-stat">📖 ${rl.counters.textsWritten} textos</span><span class="bc-stat">🕯️ ${rl.counters.cultsFound} cultos descobertos</span><span class="bc-stat">⚖️ ${rl.counters.conflictsResolved} conflitos resolvidos</span></div>`;
      }

      if (tab === 'religioes') {
        const q = (state.rlSearch || '').toLowerCase(), stf = state.rlStatus || '';
        const list = rl.religions.filter(r => (!q || r.name.toLowerCase().includes(q)) && (!stf || r.status === stf));
        html = `<div class="tech-controls"><input type="text" id="rlSearch" class="search-input" placeholder="🔎 Pesquisar religião..." value="${escapeHtml(state.rlSearch || '')}" style="flex:1;min-width:150px;">
          <select id="rlStatusFilter"><option value="">Todos os status</option>${Object.entries(rlStatusLabel).map(([k, v]) => `<option value="${k}" ${stf === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
          <details class="rl-create" ${state.rlCreateOpen ? 'open' : ''}><summary><strong>✨ Fundar uma nova religião (💰${rl.catalog.costs.custom})</strong> ${infoBtn('create_religion')}</summary>
            <div class="tech-controls"><input type="text" id="rcName" placeholder="Nome da religião" style="flex:1;min-width:150px;"><input type="text" id="rcSymbol" placeholder="Símbolo (emoji)" style="width:90px;" value="☀️"><input type="color" id="rcColor" value="#d9a441"></div>
            <div class="tech-controls"><select id="rcType">${rl.catalog.types.map(t => `<option value="${t.key}">${t.icon} ${escapeHtml(t.name)}</option>`).join('')}</select>
              <select id="rcDomain">${rl.catalog.domains.map(d => `<option value="${d.key}">${d.icon} ${escapeHtml(d.name)}</option>`).join('')}</select>
              <select id="rcHier">${rl.catalog.hierarchies.map(h => `<option value="${h.key}">${escapeHtml(h.name)} (${h.ranks.length} níveis)</option>`).join('')}</select></div>
            <div class="hint">Doutrinas — cada escolha tem consequências reais ${infoBtn('doctrines')}</div>
            <div class="characters-grid">${rl.catalog.doctrines.map(d => `<label class="hint" style="display:block;">${d.icon} ${escapeHtml(d.name)}<br><select data-rcdoc="${d.axis}">${d.options.map(o => `<option value="${o.key}">${escapeHtml(o.name)}</option>`).join('')}</select></label>`).join('')}</div>
            <button class="btn btn-primary" id="rcCreateBtn" style="margin-top:8px;">Fundar religião</button></details>
          <div class="characters-grid" style="margin-top:10px;">${list.map(r => `<div class="character-card" style="cursor:default;border-left:5px solid ${r.color};${['extinta'].includes(r.status) ? 'opacity:.5;' : ''}">
            <span class="ch-icon">${r.symbol}</span><span class="ch-name">${escapeHtml(r.name)}${r.isState ? ' 🏛️' : ''}</span><span class="ch-role">${r.typeIcon} ${escapeHtml(r.typeName)} · ${rlStatusLabel[r.status] || r.status}</span>
            <div class="ch-stats"><span>👥 ${r.share}% (${fmt(r.followers)})</span><span>🔥 Fervor ${r.fervor}</span><span>⭐ ${r.prestige}</span></div>
            <div class="hint">${r.deity.domainIcon} ${escapeHtml(r.deity.name || '')}, ${escapeHtml(r.deity.title || '')} · ${escapeHtml(r.hierarchy.name)}${r.parent ? ' · cisma de ' + escapeHtml(r.parent.name) : ''}</div>
            <div class="hint">Origem: ${escapeHtml(r.origin || '—')} · 💰 ${fmt(r.wealth)} · hostilidade ${r.hostility}</div>
            <details><summary class="hint" style="cursor:pointer;">📜 Doutrinas</summary><div class="bc-stats">${r.doctrines.map(d => `<span class="bc-stat">${d.icon} ${escapeHtml(d.optionName || d.option)}</span>`).join('')}</div>
              ${(r.custom || r.isState) && ['ativa', 'proibida', 'oculta'].includes(r.status) ? `<div class="tech-controls"><select data-docaxis="${r.id}">${rl.catalog.doctrines.map(d => `<option value="${d.axis}">${escapeHtml(d.name)}</option>`).join('')}</select><select data-docopt="${r.id}"></select><button class="btn btn-ghost btn-sm" data-docapply="${r.id}">Reformar (💰100)</button></div>` : ''}</details>
            ${r.status === 'esquecida' ? `<button class="btn btn-primary" data-rlrevive="${r.id}">🗿 Reviver (💰250)</button>` : ['ativa', 'proibida', 'oculta'].includes(r.status) ? `<div class="tech-controls">
              ${r.status === 'ativa' && !r.isState ? `<button class="btn btn-ghost btn-sm" data-rlstatus="${r.id}:proibida">🚫 Proibir</button>` : r.status === 'proibida' ? `<button class="btn btn-ghost btn-sm" data-rlstatus="${r.id}:ativa">✅ Legalizar</button>` : ''}
              ${rlStepper('conv' + r.id, 50, 1)}<button class="btn btn-secondary btn-sm" data-rlconv="${r.id}">📣 Enviar missões</button></div>` : ''}</div>`).join('') || '<p class="hint">Nenhuma religião encontrada.</p>'}</div>`;
      }

      if (tab === 'divindades') {
        html = `<p class="hint">Cada religião venera uma divindade principal, cujo domínio dá um pequeno bônus. ${infoBtn('deities')}</p><div class="pol-laws">${active.concat(rl.religions.filter(r => r.status === 'esquecida')).map(r => `<div class="pol-law"><div class="pl-head"><span>${r.deity.domainIcon || '✨'} <strong>${escapeHtml(r.deity.name || '?')}</strong>, ${escapeHtml(r.deity.title || '')}</span><span class="bc-level">${escapeHtml(r.deity.domainName || '')}</span></div>
          <div class="hint">Venerada em ${r.symbol} ${escapeHtml(r.name)} (${r.share}% da população) · ${r.typeIcon} ${escapeHtml(r.typeName)}</div></div>`).join('')}</div>`;
      }

      if (tab === 'ordens') {
        html = `<p class="hint">Ordens especializadas dão bônus próprios e crescem com membros. ${infoBtn('orders')}</p>
          <div class="tech-controls"><select id="roReligion">${active.filter(r => r.status === 'ativa').map(r => `<option value="${r.id}">${r.symbol} ${escapeHtml(r.name)} (${r.share}%)</option>`).join('')}</select>
          <select id="roKey">${rl.catalog.orders.map(o => `<option value="${o.key}">${o.icon} ${escapeHtml(o.name)} (💰${o.cost})</option>`).join('')}</select><button class="btn btn-primary" id="roFoundBtn">Fundar ordem</button></div>
          <div class="pol-laws">${rl.orders.map(o => `<div class="pol-law"><div class="pl-head"><span>${o.icon} <strong>${escapeHtml(o.name)}</strong></span><span class="bc-level">${escapeHtml(o.religionName)}</span></div>
            <div class="hint">${escapeHtml(o.desc)} · 👥 ${o.members} membros · influência ${o.influence} · líder ${escapeHtml(o.leader || '')}</div>
            <div class="tech-controls">${rlStepper('grow' + o.id, 15, 5)}<button class="btn btn-secondary btn-sm" data-rlgrow="${o.id}">Recrutar</button><button class="btn btn-ghost btn-sm" data-rldissolve="${o.id}">Dissolver</button></div></div>`).join('') || '<p class="hint">Nenhuma ordem fundada.</p>'}</div>`;
      }

      if (tab === 'milagres') {
        html = `<p class="hint">Milagres NUNCA são garantidos: podem funcionar, funcionar pela metade, não dar em nada, ter efeito inesperado ou dar muito errado. Custo: 💰${rl.catalog.costs.miracle}. ${infoBtn('miracles')}</p>
          <div class="tech-controls"><select id="rmPriest">${rl.priests.map(p => `<option value="${p.id}">${escapeHtml(p.name)} (fé ${p.faith}, carisma ${p.charisma})</option>`).join('') || '<option value="">Contrate sacerdotes na aba Religião e Cultura</option>'}</select></div>
          <div class="pol-laws">${rl.catalog.miracles.map(m => `<div class="pol-law"><div class="pl-head"><span>${m.icon} <strong>${escapeHtml(m.name)}</strong></span><span class="bc-level">Dificuldade ${m.difficulty}</span></div>
            <button class="btn btn-primary" data-rmiracle="${m.key}">Tentar</button></div>`).join('')}</div>`;
      }

      if (tab === 'reliquias') {
        html = `<div class="ficha-section-title">Relíquias ${infoBtn('relics')}</div>
          <div class="tech-controls"><select id="rrReligion">${active.map(r => `<option value="${r.id}">${r.symbol} ${escapeHtml(r.name)}</option>`).join('')}</select><button class="btn btn-primary" id="rrSearchBtn">🔍 Buscar relíquia (💰${rl.catalog.costs.relicSearch})</button></div>
          <div class="pol-laws">${rl.relics.map(x => `<div class="pol-law"><div class="pl-head"><span>${x.rarityIcon} <strong>${escapeHtml(x.name)}</strong></span><span class="bc-level">${escapeHtml(x.status)}${x.verified ? (x.authentic ? ' · ✅ autêntica' : ' · ❌ falsa') : ' · não verificada'}</span></div>
            <div class="hint">${escapeHtml(x.rarity)} · poder ${x.power}${x.religionName ? ' · ' + escapeHtml(x.religionName) : ''}</div>
            ${['guardada', 'exibida'].includes(x.status) || x.status === 'falsa' ? `<div class="tech-controls">${!x.verified ? `<button class="btn btn-ghost btn-sm" data-rrelic="${x.id}:verificar">🔎 Verificar (💰60)</button>` : ''}${x.status === 'guardada' ? `<button class="btn btn-secondary btn-sm" data-rrelic="${x.id}:exibir">Exibir</button>` : x.status === 'exibida' ? `<button class="btn btn-ghost btn-sm" data-rrelic="${x.id}:guardar">Guardar</button>` : ''}${x.status !== 'falsa' ? `<button class="btn btn-ghost btn-sm" data-rrelic="${x.id}:vender">Vender</button>` : ''}</div>` : ''}</div>`).join('') || '<p class="hint">Nenhuma relíquia ainda.</p>'}</div>
          <div class="ficha-section-title">Textos Sagrados ${infoBtn('texts')}</div>
          <div class="tech-controls"><select id="rtReligion">${active.map(r => `<option value="${r.id}">${r.symbol} ${escapeHtml(r.name)}</option>`).join('')}</select><select id="rtKind">${rl.catalog.textKinds.map(k => `<option value="${k.key}">${k.icon} ${escapeHtml(k.name)}</option>`).join('')}</select><button class="btn btn-secondary" id="rtBtn">Encomendar (💰${rl.catalog.costs.text})</button></div>
          <div class="bc-stats">${rl.texts.map(x => `<span class="bc-stat ${x.status === 'perdido' ? 'cons' : ''}">${x.icon} ${escapeHtml(x.title)} (${x.status})</span>`).join('') || '<span class="hint">Nenhum texto.</span>'}</div>`;
      }

      if (tab === 'conflitos') {
        html = `<p class="hint">Decisões têm prazo: ignorar piora o problema. ${infoBtn('conflicts')}</p>
          <div class="pol-laws">${rl.decisions.map(d => `<div class="pol-law"><div class="pl-head"><span>${d.icon || '⚖️'} <strong>${escapeHtml(d.title)}</strong></span><span class="bc-level">${d.status === 'pendente' ? `⏳ ${d.daysLeft}d` : d.status === 'resolvida' ? '✅' : '⌛ Expirada'}</span></div>
            ${d.status === 'pendente' ? (d.kind === 'conflito' ? `<div class="tech-controls"><button class="btn btn-primary" data-rldec="${d.id}:mediar">Mediar (💰80)</button><button class="btn btn-secondary" data-rldec="${d.id}:reprimir">Reprimir</button><button class="btn btn-ghost" data-rldec="${d.id}:ignorar">Ignorar</button></div>`
              : d.kind === 'cisma' ? `<div class="tech-controls"><button class="btn btn-primary" data-rldec="${d.id}:reconhecer">Reconhecer</button><button class="btn btn-secondary" data-rldec="${d.id}:reprimir">Reprimir</button><button class="btn btn-ghost" data-rldec="${d.id}:reunificar">Reunificar (💰120)</button></div>`
              : `<div class="tech-controls"><button class="btn btn-primary" data-rldec="${d.id}:dissolver">Dissolver</button><button class="btn btn-secondary" data-rldec="${d.id}:infiltrar">Infiltrar</button><button class="btn btn-ghost" data-rldec="${d.id}:tolerar">Tolerar</button></div>`)
              : `<div class="hint">${escapeHtml(d.outcome || '')}</div>`}</div>`).join('') || '<p class="hint">Nenhum conflito no momento.</p>'}</div>
          <div class="ficha-section-title">Cultos Conhecidos ${infoBtn('cults')}</div><div class="bc-stats">${rl.cults.map(c => `<span class="bc-stat cons">🕯️ ${escapeHtml(c.name)} (${c.members}, ${c.status})</span>`).join('') || '<span class="hint">Nenhum culto descoberto (os cultos secretos só aparecem quando descobertos).</span>'}</div>`;
      }

      if (tab === 'tesouro') {
        const t = rl.treasury;
        html = `<p class="hint">Doações dos fiéis enchem o tesouro de cada religião; sacerdotes e ordens custam salários. ${infoBtn('treasury_rel')}</p>
          <div class="bc-stats"><span class="bc-stat prod">💰 Patrimônio total: ${fmt(t.wealthTotal)}</span><span class="bc-stat">📥 Doações por ciclo: ~${t.donationsPerCycle}</span><span class="bc-stat">📊 Entrou ${fmt(t.totalIn)} · Saiu ${fmt(t.totalOut)}</span><span class="bc-stat">🏛️ Dízimo arrecadado: ${fmt(t.titheCollected)}</span></div>
          <div class="ficha-section-title">Política do Estado ${infoBtn('tithe')}</div>
          <div class="tech-controls"><label class="hint">Dízimo (% das doações, máx. 20)</label><input type="number" id="rtTithe" min="0" max="20" value="${t.tithePct}" style="width:70px;"><label class="hint">Subsídio por ciclo (💰)</label><input type="number" id="rtSub" min="0" max="200" value="${t.subsidy}" style="width:80px;"><button class="btn btn-primary" id="rtPolicyBtn">Aplicar</button></div>
          <div class="pol-laws">${active.map(r => `<div class="pol-law"><div class="pl-head"><span>${r.symbol} ${escapeHtml(r.name)}</span><span class="bc-level">💰 ${fmt(r.wealth)}</span></div></div>`).join('')}</div>`;
      }

      if (tab === 'reinos') {
        html = `<p class="hint">Cada reino de IA tem sua própria fé, que pode mudar. Você só a conhece onde tem embaixada. Mesma fé que a sua religião de Estado → mais confiança com o tempo. ${infoBtn('ai_faith')}</p>
          <div class="pol-laws">${rl.aiFaith.map(a => `<div class="pol-law"><div class="pl-head"><span>${a.symbol} <strong>${escapeHtml(a.aiName)}</strong></span><span class="bc-level">${a.known ? `${a.icon} ${escapeHtml(a.name)}` : '❔ desconhecida'}</span></div>${a.known ? `<div class="hint">Fervor ${a.fervor}${a.sameFaith ? ' · 🤝 mesma fé que a sua' : ''}</div>` : ''}</div>`).join('')}</div>`;
      }

      if (tab === 'historia') {
        html = rl.history.length ? `<ul class="history-list">${rl.history.map(h => `<li><span class="h-icon">${h.icon}</span><div><span class="h-year">ANO ${h.year}</span><span class="h-title">${escapeHtml(h.title)}</span></div></li>`).join('')}</ul>` : '<p class="hint">A história religiosa ainda está começando.</p>';
      }
      el('rlBody').innerHTML = html;
      el('rlBody').querySelectorAll('[data-docaxis]').forEach(sel => rlFillDocOpts(sel));
    }
    function rlFillDocOpts(axisSel) {
      const rl = state.religion; const rid = axisSel.dataset.docaxis; const optSel = el('rlBody').querySelector(`[data-docopt="${rid}"]`);
      const axis = rl.catalog.doctrines.find(d => d.axis === axisSel.value); if (!axis || !optSel) return;
      optSel.innerHTML = axis.options.map(o => `<option value="${o.key}">${escapeHtml(o.name)}</option>`).join('');
    }
    async function rlAction(fn, prefix) {
      try { const r = await fn(); showToast(`${prefix} ${r.message || ''}`); await refreshAll(true); }
      catch (err) { showToast(`⚠️ ${err.message}`); }
    }
    el('rlTabs').addEventListener('click', (e) => { const b = e.target.closest('[data-rltab]'); if (!b) return; state.rlTab = b.dataset.rltab; renderReligion(); });
    el('rlBody').addEventListener('input', (e) => {
      if (e.target.id === 'rlSearch') { state.rlSearch = e.target.value; const pos = e.target.selectionStart; renderReligion(); const i = el('rlSearch'); if (i) { i.focus(); i.setSelectionRange(pos, pos); } }
      else if (e.target.dataset && e.target.dataset.unit) { const v = Math.max(1, Math.min(50, Number(e.target.value) || 1)); const c = el(e.target.id + 'Cost'); if (c) c.textContent = `= 💰 ${fmt(Number(e.target.dataset.unit) * v)}`; }
    });
    el('rlBody').addEventListener('change', (e) => {
      if (e.target.id === 'rlStatusFilter') { state.rlStatus = e.target.value; renderReligion(); }
      else if (e.target.dataset && e.target.dataset.docaxis) rlFillDocOpts(e.target);
    });
    el('rlBody').addEventListener('toggle', (e) => { if (e.target.classList && e.target.classList.contains('rl-create')) state.rlCreateOpen = e.target.open; }, true);
    el('rlBody').addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      const d = b.dataset;
      if (d.rlstep) { const [id, delta] = d.rlstep.split(':'); const inp = el(id); const v = Math.max(1, Math.min(50, (Number(inp.value) || 1) + Number(delta))); inp.value = v; el(id + 'Cost').textContent = `= 💰 ${fmt(Number(inp.dataset.unit) * v)}`; return; }
      if (b.id === 'rlStateBtn') rlAction(() => Api.setStateReligion(el('rlStateSel').value || null), '🏛️');
      else if (b.id === 'rlTolBtn') rlAction(() => Api.setReligionTolerance(el('rlTolSel').value), '⚖️');
      else if (b.id === 'rcCreateBtn') {
        const doctrines = {}; el('rlBody').querySelectorAll('[data-rcdoc]').forEach(s => { doctrines[s.dataset.rcdoc] = s.value; });
        rlAction(() => Api.createReligion({ name: el('rcName').value, symbol: el('rcSymbol').value, color: el('rcColor').value, type: el('rcType').value, domain: el('rcDomain').value, hierarchy: el('rcHier').value, doctrines }), '✨');
      }
      else if (d.docapply) { const rid = d.docapply; rlAction(() => Api.setReligionDoctrine(rid, el('rlBody').querySelector(`[data-docaxis="${rid}"]`).value, el('rlBody').querySelector(`[data-docopt="${rid}"]`).value), '📜'); }
      else if (d.rlstatus) { const [id, st] = d.rlstatus.split(':'); rlAction(() => Api.setReligionStatus(id, st), '⛪'); }
      else if (d.rlconv) { const qty = el('conv' + d.rlconv).value; rlAction(() => Api.convertReligion(d.rlconv, qty), '📣'); }
      else if (d.rlrevive) rlAction(() => Api.reviveReligion(d.rlrevive), '🗿');
      else if (b.id === 'roFoundBtn') { const rid = el('roReligion').value; if (!rid) { showToast('⚠️ Nenhuma religião ativa.'); return; } rlAction(() => Api.foundReligiousOrder(rid, el('roKey').value), '🛡️'); }
      else if (d.rlgrow) rlAction(() => Api.growReligiousOrder(d.rlgrow, el('grow' + d.rlgrow).value), '👥');
      else if (d.rldissolve) rlAction(() => Api.dissolveReligiousOrder(d.rldissolve), '🛡️');
      else if (d.rmiracle) { const pid = el('rmPriest').value; if (!pid) { showToast('⚠️ Contrate um sacerdote primeiro.'); return; } rlAction(() => Api.attemptMiracle(pid, d.rmiracle), '🙏'); }
      else if (b.id === 'rrSearchBtn') rlAction(() => Api.searchRelic(el('rrReligion').value), '🔍');
      else if (d.rrelic) { const [id, action] = d.rrelic.split(':'); rlAction(() => Api.relicAction(id, action), '🏺'); }
      else if (b.id === 'rtBtn') rlAction(() => Api.commissionSacredText(el('rtReligion').value, el('rtKind').value), '📖');
      else if (d.rldec) { const [id, choice] = d.rldec.split(':'); rlAction(() => Api.resolveReligionDecision(id, choice), '⚖️'); }
      else if (b.id === 'rtPolicyBtn') rlAction(() => Api.setReligionPolicy(el('rtTithe').value, el('rtSub').value), '💰');
    });

    // ==============================================================
    // INFRAESTRUTURA E TRANSPORTE (Etapa 27)
    // ==============================================================
    const IF_TABS = [
      ['visao', '🛣️ Visão da Rede'], ['estradas', '🏗️ Estradas e Obras'], ['portos', '⚓ Portos e Navios'], ['instalacoes', '📦 Instalações'],
      ['hidrovias', '🌊 Rios e Canais'], ['ar', '🎈 Transporte Aéreo'], ['urbano', '🏙️ Transporte Urbano'], ['comboios', '🛒 Comboios'], ['guerra', '⚔️ Guerra e Disputas'], ['empresas', '🏢 Empresas'],
      ['politicas', '⚙️ Manutenção e Taxas'], ['valor', '💎 Valor dos Territórios'], ['reinos', '🌍 Outros Reinos'], ['historia', '📖 História'],
    ];
    const ifCost = (c) => Object.entries(c || {}).map(([k, v]) => { const m = RESOURCE_META.find(r => r.key === k); return `${m ? m.icon : k} ${fmt(v)}`; }).join(' · ') || '—';
    const ifBar = (pct, bad) => `<div class="pm-bar" style="height:7px;"><div class="pm-fill" style="width:${Math.max(0, Math.min(100, pct))}%;${bad ? 'background:#c0392b;' : ''}"></div></div>`;
    function ifStepper(id, value = 1, max = 50) {
      return `<span style="display:inline-flex;align-items:center;gap:4px;"><button type="button" class="btn btn-ghost btn-sm" data-ifstep="${id}:-1:${max}">−</button><input type="number" id="${id}" min="1" max="${max}" value="${value}" style="width:60px;text-align:center;"><button type="button" class="btn btn-ghost btn-sm" data-ifstep="${id}:1:${max}">+</button></span>`;
    }
    function renderInfra() {
      const inf = state.infra;
      if (!inf || !el('ifBody')) return;
      el('ifTabs').innerHTML = IF_TABS.map(([k, label]) => `<button class="category-chip ${state.ifTab === k ? 'active' : ''}" data-iftab="${k}">${label}${k === 'estradas' && inf.projects.length ? ` (${inf.projects.length})` : ''}</button>`).join('');
      const tab = state.ifTab; let html = '';
      const nodeOpts = (list, sel) => list.map(n => `<option value="${n.id}" ${String(sel) === String(n.id) ? 'selected' : ''}>${n.isCapital ? '👑 ' : '🏘️ '}${escapeHtml(n.name)}${n.coastal ? ' 🌊' : ''}</option>`).join('');
      const mods = Object.entries(inf.modifiers).filter(([k, v]) => ['goldPct', 'stability', 'happiness', 'knowledgePct', 'crime', 'tariffDelta', 'warRange', 'commDays'].includes(k) && Math.abs(v) >= 0.05).map(([k, v]) => `<span class="bc-stat ${(k === 'crime' || k === 'tariffDelta' ? v <= 0 : v >= 0) ? 'prod' : 'cons'}">${k}: ${v > 0 ? '+' : ''}${v}</span>`).join('') || '<span class="hint">Sem efeitos ainda — construa estradas!</span>';

      if (tab === 'visao') {
        html = `<div class="pol-grid"><div class="pol-meter"><div class="pm-head"><span>🛣️ Qualidade da rede ${infoBtn('infra_score')}</span><strong>${inf.network.roadScore}%</strong></div>${ifBar(inf.network.roadScore)}</div>
          <div class="pol-meter"><div class="pm-head"><span>🔗 Cidades conectadas</span><strong>${inf.network.connected}/${Math.max(0, inf.nodes.length - 1)}</strong></div></div>
          <div class="pol-meter"><div class="pm-head"><span>🚫 Cidades isoladas</span><strong class="${inf.network.isolated ? 'pop-alert' : ''}">${inf.network.isolated}</strong></div></div></div>
          ${inf.railStarved ? '<div class="pop-alert">🚂 FALTA DE CARVÃO: as locomotivas pararam.</div>' : ''}
          <div class="ficha-section-title">Conexão de cada cidade com a capital ${infoBtn('infra_conn')}</div>
          <div class="pol-laws">${inf.network.nodes.filter(n => !n.isCapital).map(n => `<div class="pol-law"><div class="pl-head"><span>🏘️ <strong>${escapeHtml(n.name)}</strong> ${n.via === 'mar' ? '⛵' : n.via === 'magia' ? '🌀' : ''}</span>
            <span class="bc-level">${n.reachable ? `${n.days} dias${n.baseDays && n.baseDays > n.days ? ` (sem estradas: ${n.baseDays})` : ''}` : '🚫 ISOLADA'}</span></div>
            ${n.reachable ? `<div class="hint">Cobertura de estrada ${n.coverage}% · tempo economizado ${n.quality}% · rota ${n.securityLabel ? n.securityLabel.icon + ' ' + n.securityLabel.name : ''}</div>${ifBar(n.quality)}` : '<div class="hint">Sem caminho. Construa estradas (com pontes, se houver água) ou um porto.</div>'}</div>`).join('') || '<p class="hint">Você só tem a capital. Funde cidades na aba Cidades.</p>'}</div>
          <div class="ficha-section-title">Efeitos no reino</div><div class="bc-stats">${mods}</div>
          <div class="bc-stats"><span class="bc-stat">🛤️ ${fmt(inf.network.segments)} regiões de estrada</span><span class="bc-stat">⚓ ${inf.ports.length} porto(s)</span><span class="bc-stat">⛵ ${inf.ships.length} navio(s)</span><span class="bc-stat">📦 ${inf.facilities.length} instalação(ões)</span><span class="bc-stat">🌊 ${inf.counters.disasters} desastres</span></div>
          <div class="tech-controls"><button class="btn btn-secondary" id="ifReallocBtn">👷 Realocar Todos os Trabalhadores</button><span class="hint">Frentes de obra: ${inf.projectSlots.used}/${inf.projectSlots.max} (casas de construtores aumentam)</span></div>`;
      }

      if (tab === 'estradas') {
        const f = state.ifForm;
        html = `<p class="hint">As estradas seguem o terreno e reaproveitam o que já existe. Estradas melhores diminuem o tempo de viagem, os custos e os riscos. ${infoBtn('infra_roads')}</p>
          <div class="tech-controls"><select id="ifFrom">${nodeOpts(inf.nodes, f.from)}</select><span>→</span><select id="ifTo">${nodeOpts(inf.nodes, f.to)}</select></div>
          <div class="tech-controls"><select id="ifType">${inf.catalog.roads.map(r => `<option value="${r.key}" ${f.type === r.key ? 'selected' : ''} ${r.locked ? 'disabled' : ''}>${r.icon} ${escapeHtml(r.name)} · vel. ×${(1 / r.mult).toFixed(1)}${r.locked ? ' 🔒 ' + escapeHtml(r.tech) : ''}</option>`).join('')}</select>
            <label class="hint"><input type="checkbox" id="ifBridges" ${f.bridges ? 'checked' : ''}> pontes ${infoBtn('infra_bridges')}</label><label class="hint"><input type="checkbox" id="ifTunnels" ${f.tunnels ? 'checked' : ''}> túneis</label>
            <button class="btn btn-secondary" id="ifQuoteBtn">📐 Cotar</button></div>
          <div id="ifQuoteBox"></div>
          <div class="ficha-section-title">Obras em andamento</div>
          <div class="pol-laws">${inf.projects.map(p => `<div class="pol-law"><div class="pl-head"><span>${p.icon} <strong>${escapeHtml(p.name)}</strong></span><span class="bc-level">${p.progress}% · ${p.daysLeft}d</span></div>${ifBar(p.progress)}
            <div class="hint">${p.tiles} regiões${p.bridges ? ` · ${p.bridges} ponte(s)` : ''}${p.tunnels ? ` · ${p.tunnels} túnel(is)` : ''} · investido: ${ifCost(p.cost)}</div><button class="btn btn-ghost btn-sm" data-ifcancel="${p.id}">Cancelar</button></div>`).join('') || '<p class="hint">Nenhuma obra em andamento.</p>'}</div>
          <div class="ficha-section-title">Rotas construídas ${infoBtn('infra_maint')}</div>
          <div class="pol-laws">${inf.routes.map(r => `<div class="pol-law"><div class="pl-head"><span>${r.icon} <strong>${escapeHtml(r.name)}</strong></span><span class="bc-level ${r.condition < 40 ? 'pop-alert' : ''}">${r.condition}%</span></div>${ifBar(r.condition, r.condition < 40)}
            <div class="hint">${r.tiles} regiões${r.bridges ? ` · ${r.bridges} ponte(s)` : ''}${r.tunnels ? ` · ${r.tunnels} túnel(is)` : ''} · pior trecho ${r.worst}%</div>${r.condition < 95 ? `<button class="btn btn-secondary btn-sm" data-ifrepair="${r.id}">🔧 Reparar (sorteio)</button>` : ''}</div>`).join('') || '<p class="hint">Nenhuma rota concluída.</p>'}</div>`;
      }

      if (tab === 'portos') {
        const coastal = inf.nodes.filter(n => n.coastal);
        html = `<p class="hint">Portos exigem litoral, rio ou canal (portos fluviais vão até o nível 3 e só recebem barcos de rio). Navios dão capacidade comercial e fazem missões — todas com risco. ${infoBtn('infra_ports')}</p>
          <div class="ficha-section-title">Construir / ampliar porto</div>
          <div class="tech-controls"><select id="ifPortNode">${nodeOpts(coastal, '')}</select><button class="btn btn-primary" id="ifPortBtn">⚓ Construir / ampliar</button></div>
          ${coastal.length ? '' : '<p class="hint">Nenhuma das suas cidades está no litoral.</p>'}
          <div class="pol-laws">${inf.ports.map(p => `<div class="pol-law"><div class="pl-head"><span>${p.kind === 'rio' ? '🛶' : '⚓'} <strong>${escapeHtml(p.name)}</strong> · ${escapeHtml(p.city)}${p.kind === 'rio' ? ' (fluvial)' : ''}</span><span class="bc-level ${p.condition < 40 ? 'pop-alert' : ''}">${p.status === 'em_obra' ? `🏗️ ${p.daysLeft}d` : 'nível ' + p.level + ' · casco ' + p.condition + '%'}</span></div>${p.status === 'ativo' && p.condition < 90 ? `<button class="btn btn-secondary btn-sm" data-ifportrepair="${p.id}">🔧 Reparar porto</button>` : ''}
            <div class="hint">Navios ${p.ships}/${p.shipCapacity} · carga ${fmt(p.cargoCapacity)} · taxa ${p.tax} · ${p.specialtyIcon} ${escapeHtml(p.specialtyName)}${p.next ? ` · próximo: ${escapeHtml(p.next.name)} (${ifCost(p.next.cost)})` : ''}</div>
            ${p.status === 'ativo' && p.level >= 3 ? `<div class="tech-controls"><select data-ifspec="${p.id}">${inf.catalog.specialties.map(s => `<option value="${s.key}" ${p.specialty === s.key ? 'selected' : ''}>${s.icon} ${escapeHtml(s.name)}</option>`).join('')}</select><button class="btn btn-ghost btn-sm" data-ifspecbtn="${p.id}">Especializar (💰${inf.catalog.specialtyCost})</button></div>` : ''}</div>`).join('') || ''}</div>
          <div class="ficha-section-title">Construir navios ${infoBtn('infra_ships')}</div>
          <div class="tech-controls"><select id="ifShipPort">${inf.ports.filter(p => p.status === 'ativo').map(p => `<option value="${p.id}">${escapeHtml(p.city)} (${p.ships}/${p.shipCapacity})</option>`).join('') || '<option value="">Sem porto ativo</option>'}</select>
            <select id="ifShipType">${inf.catalog.ships.map(s => `<option value="${s.key}" ${s.locked ? 'disabled' : ''}>${s.icon} ${escapeHtml(s.name)} · carga ${s.capacity} · porto nv.${s.minPort}${s.locked ? ' 🔒 ' + escapeHtml(s.tech) : ''}</option>`).join('')}</select>
            ${ifStepper('ifShipQty', 1, 50)}<span class="hint" id="ifShipCost"></span><button class="btn btn-primary" id="ifShipBtn">Construir</button></div>
          <div class="pol-laws">${inf.ships.map(s => `<div class="pol-law"><div class="pl-head"><span>${s.icon} <strong>${escapeHtml(s.name)}</strong> · ${escapeHtml(s.typeName)}</span><span class="bc-level">${s.status === 'missao' ? `⛵ ${escapeHtml(s.mission || '')} (${s.missionDaysLeft}d)` : 'no porto'}</span></div>
            <div class="hint">Carga ${s.capacity} · tripulação ${s.crew} · ${escapeHtml(s.port)} · casco ${s.condition}%</div>${ifBar(s.condition, s.condition < 40)}
            ${s.status === 'porto' ? `<div class="tech-controls">${inf.catalog.missions.map(m => `<button class="btn btn-secondary btn-sm" data-ifmission="${s.id}:${m.key}">${m.icon} ${escapeHtml(m.name)}</button>`).join('')}${s.condition < 90 ? `<button class="btn btn-ghost btn-sm" data-ifshiprepair="${s.id}">🔧 Reparar</button>` : ''}</div>` : ''}</div>`).join('') || '<p class="hint">Nenhum navio.</p>'}</div>`;
      }

      if (tab === 'instalacoes') {
        html = `<p class="hint">Instalações dão bônus por cidade: comércio, comunicação, segurança, alcance militar. ${infoBtn('infra_fac')}</p>
          <div class="tech-controls"><select id="ifFacNode">${nodeOpts(inf.nodes, '')}</select>
            <select id="ifFacKind">${inf.catalog.facilities.map(f => `<option value="${f.key}" ${f.locked ? 'disabled' : ''}>${f.icon} ${escapeHtml(f.name)} (${ifCost(f.cost).replace(/<[^>]*>/g, '')})${f.locked ? ' 🔒 ' + escapeHtml(f.tech) : ''}</option>`).join('')}</select><button class="btn btn-primary" id="ifFacBtn">Construir / ampliar</button></div>
          <div class="pol-laws">${inf.facilities.map(f => `<div class="pol-law"><div class="pl-head"><span>${f.icon} <strong>${escapeHtml(f.name)}</strong> · ${escapeHtml(f.city)}</span><span class="bc-level">${f.status === 'em_obra' ? `🏗️ ${f.daysLeft}d` : f.status === 'inativo' ? '⚠️ inativa' : 'nível ' + f.level}</span></div><div class="hint">${escapeHtml(f.desc)}</div></div>`).join('') || '<p class="hint">Nenhuma instalação ainda.</p>'}</div>`;
      }


      if (tab === 'hidrovias') {
        const wnodes = inf.nodes.filter(n => n.waterKind);
        const canals = inf.routes.filter(r => r.roadType === 'canal');
        html = `<p class="hint">Rios ligam o interior ao mar. Estradas cruzam rios a vau (barato, arriscado) ou por ponte; barcos de rio usam portos fluviais (até o nível 3); canais artificiais ligam cidades a rios e ao mar. ${infoBtn('infra_rivers')}</p>
          <div class="bc-stats"><span class="bc-stat">🌊 Cidades com acesso à água: ${wnodes.length}/${inf.nodes.length}</span><span class="bc-stat">🛶 Portos fluviais: ${inf.ports.filter(p => p.kind === 'rio').length}</span><span class="bc-stat">⚓ Portos marítimos: ${inf.ports.filter(p => p.kind !== 'rio').length}</span><span class="bc-stat">🌊 Canais: ${inf.mapTiles.filter(t => t.type === 'canal').length} regiões</span></div>
          <div class="ficha-section-title">Acesso à água de cada cidade</div>
          <div class="pol-laws">${inf.nodes.map(n => `<div class="pol-law"><div class="pl-head"><span>${n.isCapital ? '👑' : '🏘️'} <strong>${escapeHtml(n.name)}</strong></span><span class="bc-level">${n.waterKind === 'mar' ? '⚓ litoral' : n.waterKind === 'rio' ? '🛶 rio/canal' : '🏜️ sem água'}</span></div></div>`).join('')}</div>
          <div class="tech-controls"><button class="btn btn-primary" id="ifPlanCanalBtn">🌊 Planejar um canal</button><span class="hint">Abre o planejador de obras já com "Canal Artificial" selecionado.</span></div>
          <div class="ficha-section-title">Canais construídos</div>
          <div class="pol-laws">${canals.map(r => `<div class="pol-law"><div class="pl-head"><span>🌊 <strong>${escapeHtml(r.name)}</strong></span><span class="bc-level ${r.condition < 40 ? 'pop-alert' : ''}">${r.condition}%</span></div>${ifBar(r.condition, r.condition < 40)}${r.condition < 95 ? `<button class="btn btn-secondary btn-sm" data-ifrepair="${r.id}">🔧 Limpar/reparar (sorteio)</button>` : ''}</div>`).join('') || '<p class="hint">Nenhum canal ainda (exige a tecnologia Canais).</p>'}</div>`;
      }

      if (tab === 'ar') {
        const ex = inf.extra;
        html = `<p class="hint">Aeronaves usam um Porto Aéreo (Torre de Pouso → Porto Aéreo → Aeroporto) e dependem da tecnologia (ou de magia/criaturas). Missões têm sorteio de tempestade, ataque de criaturas e acidente. ${infoBtn('infra_air')}</p>
          <div class="bc-stats"><span class="bc-stat">🛫 ${ex.airFacilities.length} porto(s) aéreo(s)</span><span class="bc-stat">🎈 ${ex.aircraft.length} aeronave(s)</span><span class="bc-stat">📈 desenvolvimento tecnológico ${ex.techLevel}</span></div>
          <div class="pol-laws">${ex.airFacilities.map(f => `<div class="pol-law"><div class="pl-head"><span>🛫 <strong>${escapeHtml(f.levelName)}</strong> · ${escapeHtml(f.city)}</span><span class="bc-level">${f.status === 'ativo' ? 'capacidade ' + f.capacity : 'em obras'}</span></div></div>`).join('') || '<p class="hint">Construa um Porto Aéreo na aba Instalações (exige desenvolvimento tecnológico 120+).</p>'}</div>
          <div class="ficha-section-title">Construir aeronaves</div>
          <div class="tech-controls"><select id="ifAirFac">${ex.airFacilities.filter(f => f.status === 'ativo').map(f => `<option value="${f.id}">${escapeHtml(f.city)} (${escapeHtml(f.levelName)})</option>`).join('') || '<option value="">Sem porto aéreo ativo</option>'}</select>
            <select id="ifAirType">${ex.aircraftCatalog.map(a => `<option value="${a.key}" ${a.locked ? 'disabled' : ''}>${a.icon} ${escapeHtml(a.name)} · carga ${a.capacity}${a.locked ? ' 🔒 ' + escapeHtml(a.why || '') : ''}</option>`).join('')}</select>
            ${ifStepper('ifAirQty', 1, 20)}<span class="hint" id="ifAirCost"></span><button class="btn btn-primary" id="ifAirBtn">Construir</button></div>
          <div class="pol-laws">${ex.aircraft.map(a => `<div class="pol-law"><div class="pl-head"><span>${a.icon} <strong>${escapeHtml(a.name)}</strong> · ${escapeHtml(a.typeName)}</span><span class="bc-level">${a.status === 'missao' ? `🛩️ ${escapeHtml(a.mission || '')} (${a.daysLeft}d)` : 'na base'}</span></div>
            <div class="hint">Carga ${a.capacity} · ${escapeHtml(a.base)} · casco ${a.condition}%</div>${ifBar(a.condition, a.condition < 40)}
            ${a.status === 'base' ? `<div class="tech-controls">${ex.airMissions.map(m => `<button class="btn btn-secondary btn-sm" data-ifair="${a.id}:${m.key}">${m.icon} ${escapeHtml(m.name)}</button>`).join('')}${a.condition < 90 ? `<button class="btn btn-ghost btn-sm" data-ifairrepair="${a.id}">🔧 Reparar</button>` : ''}</div>` : ''}</div>`).join('') || '<p class="hint">Nenhuma aeronave.</p>'}</div>`;
      }

      if (tab === 'urbano') {
        html = `<p class="hint">Cidades grandes precisam de transporte público (Carruagens → Ônibus e Bondes → Metrô e Trens Urbanos, conforme a era). Sem ele, o congestionamento derruba a felicidade e o ouro e causa acidentes. ${infoBtn('infra_urban')}</p>
          <div class="pol-laws">${inf.extra.urban.map(u => `<div class="pol-law"><div class="pl-head"><span>${u.isCapital ? '👑' : '🏘️'} <strong>${escapeHtml(u.name)}</strong> · 👥 ${fmt(u.population)}</span><span class="bc-level ${u.congestion >= 35 ? 'pop-alert' : ''}">🚦 ${u.congestion}%</span></div>${ifBar(u.congestion, u.congestion >= 35)}
            <div class="hint">Demanda ${u.need} · capacidade ${u.capacity} · ${escapeHtml(u.tierName)}</div></div>`).join('')}</div>
          <div class="tech-controls"><span class="hint">Construa ou amplie o Transporte Público na aba Instalações.</span></div>`;
      }

      if (tab === 'guerra') {
        const ex = inf.extra;
        html = `<p class="hint">Exércitos longe de casa gastam suprimentos mais depressa. Depósitos militares, fortalezas de estrada e estradas militares reduzem o desgaste; comboios reabastecem o exército em campanha (com risco de emboscada). ${infoBtn('infra_war')}</p>
          <div class="ficha-section-title">Plano logístico dos exércitos</div>
          <div class="pol-laws">${ex.supply.armies.map(a => `<div class="pol-law"><div class="pl-head"><span>⚔️ <strong>${escapeHtml(a.name)}</strong></span><span class="bc-level">suprimentos ${a.supplies}%</span></div>${ifBar(a.supplies, a.supplies < 35)}
            <div class="hint">${a.plan ? `Alvo a ${a.plan.distance} regiões de ${escapeHtml(a.plan.base || '')} · desgaste ×${a.plan.drainMult} · depósito ${a.plan.depot ? '✅' : '❌'} · estradas militares ${a.plan.milRoads}` : 'Sem alvo definido.'}</div>
            ${a.inCampaign ? `<div class="tech-controls">${ifStepper('ifSup' + a.id, 3, 10)}<span class="hint">carroças (💰40 + 🌾40 cada, +${ex.supply.perVehicle} suprimentos)</span><input type="number" id="ifSupG${a.id}" min="0" max="20" value="2" style="width:56px;" title="guardas"><button class="btn btn-primary btn-sm" data-ifsupply="${a.id}">🛒 Enviar comboio</button></div>` : '<div class="hint">Em casa: reabastece sozinho.</div>'}</div>`).join('') || '<p class="hint">Nenhum exército.</p>'}</div>
          <div class="pol-laws">${ex.supply.convoys.map(c => `<div class="pol-law"><div class="pl-head"><span>🛒 ${escapeHtml(c.army)} · ${c.vehicles} carroça(s)</span><span class="bc-level">${c.status === 'em_curso' ? `⏳ ${c.elapsed}/${c.travelDays}d` : c.status}</span></div><div class="hint">rota ${c.securityLabel.icon} ${c.securityLabel.name} · perda ${c.lossPct}% · ${c.log.slice(-1).map(escapeHtml).join('')}</div></div>`).join('')}</div>
          <div class="ficha-section-title">Disputas de rota com outros reinos ${infoBtn('infra_disputes')}</div>
          <div class="pol-laws">${ex.disputes.map(d => `<div class="pol-law"><div class="pl-head"><span>${d.icon} <strong>${escapeHtml(d.kindName)}</strong> · ${escapeHtml(d.aiName)}${d.toll ? ` (${d.toll}%)` : ''}</span><span class="bc-level">${d.status === 'pendente' ? `⏳ ${d.daysLeft}d` : d.status === 'em_vigor' ? `⚠️ em vigor ${d.daysLeft}d` : d.status === 'resolvida' ? '✅' : '⌛'}</span></div>
            <div class="hint">${escapeHtml(d.status === 'pendente' ? d.desc : (d.outcome || ''))}</div>
            ${d.status === 'pendente' ? (d.kind === 'pedagio' ? `<div class="tech-controls"><button class="btn btn-primary btn-sm" data-ifdisp="${d.id}:negociar">Negociar (💰60)</button><button class="btn btn-secondary btn-sm" data-ifdisp="${d.id}:pagar">Pagar (💰${d.toll * 20})</button><button class="btn btn-ghost btn-sm" data-ifdisp="${d.id}:retaliar">Retaliar</button><button class="btn btn-ghost btn-sm" data-ifdisp="${d.id}:ignorar">Ignorar</button></div>`
              : d.kind === 'bloqueio' ? `<div class="tech-controls"><button class="btn btn-primary btn-sm" data-ifdisp="${d.id}:negociar">Negociar (💰80)</button><button class="btn btn-secondary btn-sm" data-ifdisp="${d.id}:pressionar">Pressão militar</button><button class="btn btn-ghost btn-sm" data-ifdisp="${d.id}:ignorar">Ignorar</button></div>`
              : `<div class="tech-controls"><button class="btn btn-primary btn-sm" data-ifdisp="${d.id}:aceitar">Aceitar</button><button class="btn btn-secondary btn-sm" data-ifdisp="${d.id}:cobrar">Cobrar pedágio</button><button class="btn btn-ghost btn-sm" data-ifdisp="${d.id}:recusar">Recusar</button></div>`) : ''}</div>`).join('') || '<p class="hint">Nenhuma disputa no momento. Elas surgem quando suas estradas/portos chegam perto de outros reinos.</p>'}</div>
          <div class="ficha-section-title">Bloqueio de rotas inimigas</div>
          <div class="tech-controls"><select id="ifBlockAi">${ex.war.warAis.map(a => `<option value="${a.id}">${escapeHtml(a.name)} (desenv. ${a.infraLevel})</option>`).join('') || '<option value="">Você não está em guerra</option>'}</select><button class="btn btn-primary" id="ifBlockBtn">🚧 Bloquear (💰${ex.war.blockadeCost})</button></div>
          <div class="ficha-section-title">Espionagem e contraespionagem ${infoBtn('infra_spy')}</div>
          <div class="tech-controls"><label class="hint">Contraespionagem</label><select id="ifCounter"><option value="0" ${ex.counterIntel.level === 0 ? 'selected' : ''}>Nenhuma</option><option value="1" ${ex.counterIntel.level === 1 ? 'selected' : ''}>Básica (💰25/ciclo)</option><option value="2" ${ex.counterIntel.level === 2 ? 'selected' : ''}>Completa (💰60/ciclo)</option></select><button class="btn btn-secondary" id="ifCounterBtn">Aplicar</button>
            <span class="bc-stat">🛡️ Captura ${ex.counterIntel.catchChance}% · 🕵️ ${ex.counterIntel.spiesCaught} capturados · ${ex.counterIntel.spyHits} ataques bem-sucedidos</span></div>
          <div class="tech-controls"><select id="ifSpyAi">${inf.aiInfra.map(a => `<option value="${a.aiId}">${a.symbol} ${escapeHtml(a.aiName)}</option>`).join('')}</select>
            ${ex.spyMissions.map(m => `<button class="btn btn-ghost btn-sm" data-ifspy="${m.key}" title="${escapeHtml(m.desc)}">${m.icon} ${escapeHtml(m.name)} (💰${m.cost})</button>`).join('')}</div>`;
      }

      if (tab === 'empresas') {
        const ex = inf.extra;
        html = `<p class="hint">Empresas de transporte crescem com a qualidade da rede, pagam parte do lucro ao reino, reduzem o frete e as obras — e podem falir. ${infoBtn('infra_companies')}</p>
          <div class="bc-stats"><span class="bc-stat prod">🚚 Desconto no frete ${ex.freightDiscount}%</span><span class="bc-stat prod">🏗️ Desconto em obras ${ex.buildDiscount}%</span><span class="bc-stat">💰 Lucro recebido: ${fmt(ex.extraCounters.companyProfit)}</span></div>
          <div class="tech-controls"><select id="ifCoKind">${ex.companyKinds.map(k => `<option value="${k.key}">${k.icon} ${escapeHtml(k.name)} (mín. 💰${k.min})</option>`).join('')}</select><input type="text" id="ifCoName" placeholder="Nome (opcional)" style="width:150px;"><input type="number" id="ifCoAmt" min="100" value="800" style="width:90px;"><button class="btn btn-primary" id="ifCoBtn">🏢 Fundar</button></div>
          <div class="pol-laws">${ex.companies.map(c => `<div class="pol-law"><div class="pl-head"><span>${c.icon} <strong>${escapeHtml(c.name)}</strong></span><span class="bc-level ${c.status !== 'ativa' ? 'pop-alert' : ''}">${c.status === 'ativa' ? '💰 ' + fmt(c.capital) : c.status}</span></div>
            <div class="hint">${escapeHtml(c.kindName)} · ${c.vehicles} veículo(s) · lucro total ${fmt(c.profitTotal)} (último ciclo ${fmt(c.lastProfit)}) · ${c.contracts} contrato(s)${c.losingStreak ? ` · ⚠️ ${c.losingStreak} prejuízo(s) seguido(s)` : ''}</div>
            ${c.status === 'ativa' ? `<div class="tech-controls"><input type="number" id="ifInv${c.id}" min="50" value="200" style="width:80px;"><button class="btn btn-secondary btn-sm" data-ifinvest="${c.id}">Aportar</button><button class="btn btn-ghost btn-sm" data-ifliq="${c.id}">Liquidar (70%)</button></div>` : ''}</div>`).join('') || '<p class="hint">Nenhuma empresa fundada.</p>'}</div>`;
      }

      if (tab === 'comboios') {
        const cities = inf.nodes.filter(n => !n.isCapital);
        html = `<p class="hint">Comboios levam recursos entre a capital e as cidades pela rede de estradas — com tempo de viagem, custo e risco de bandidos e acidentes (diferente da transferência instantânea, que cobra taxa). ${infoBtn('infra_ship')}</p>
          <div class="tech-controls"><select id="ifSNode">${nodeOpts(cities, '')}</select><select id="ifSDir"><option value="toCity">Capital → Cidade</option><option value="toCapital">Cidade → Capital</option></select>
            <select id="ifSRes">${inf.catalog.resources.map(r => `<option value="${r.key}">${escapeHtml(r.name)}</option>`).join('')}</select>
            <input type="number" id="ifSQty" min="1" max="5000" value="200" style="width:90px;"><label class="hint">guardas</label><input type="number" id="ifSGuards" min="0" max="20" value="0" style="width:60px;"><button class="btn btn-secondary" id="ifSQuoteBtn">📐 Cotar</button><button class="btn btn-primary" id="ifSendBtn">Enviar</button></div>
          <div id="ifSBox"></div>
          <div class="pol-laws">${inf.shipments.map(s => `<div class="pol-law"><div class="pl-head"><span>🛒 <strong>${s.quantity} ${escapeHtml(s.resourceName)}</strong> ${s.direction === 'toCity' ? '→' : '←'} ${escapeHtml(s.city)}</span><span class="bc-level">${s.status === 'em_curso' ? `⏳ ${s.elapsed}/${s.travelDays}d` : s.status === 'entregue' ? '✅ entregue' : '☠️ perdido'}</span></div>
            <div class="hint">${s.vehicles} carroça(s) · ${s.guards} guarda(s) · rota ${s.securityLabel.icon} ${s.securityLabel.name} · perda ${s.lossPct}%</div><div class="hint">${s.log.slice(-3).map(escapeHtml).join('<br>')}</div></div>`).join('') || '<p class="hint">Nenhum comboio.</p>'}</div>`;
      }

      if (tab === 'politicas') {
        const p = inf.policy;
        html = `<p class="hint">A manutenção reduz o desgaste (mas custa ouro e ainda assim reparos podem falhar). Taxas altas rendem ouro, mas encarecem o comércio e estimulam contrabando. ${infoBtn('infra_toll')}</p>
          <div class="tech-controls"><label class="hint">Manutenção</label><select id="ifMaint">${p.maintLevels.map(m => `<option value="${m.level}" ${p.maintLevel === m.level ? 'selected' : ''}>${escapeHtml(m.name)}</option>`).join('')}</select></div>
          <div class="tech-controls"><label class="hint">Pedágio %</label><input type="number" id="ifToll" min="0" max="30" value="${p.tollPct}" style="width:70px;"><label class="hint">Taxa de porto %</label><input type="number" id="ifPortTax" min="0" max="30" value="${p.portTaxPct}" style="width:70px;"><label class="hint">Taxa de fronteira %</label><input type="number" id="ifBorderTax" min="0" max="30" value="${p.borderTaxPct}" style="width:70px;"><button class="btn btn-primary" id="ifPolicyBtn">Aplicar</button></div>
          <div class="bc-stats"><span class="bc-stat prod">💰 Receita de taxas: ${fmt(inf.counters.income)}</span><span class="bc-stat">🔧 Gasto com manutenção: ${fmt(inf.counters.maintSpent)}</span><span class="bc-stat">🔧 ${inf.counters.repairsOk} reparos ok / ${inf.counters.repairsFailed} falhos</span><span class="bc-stat">🌊 ${inf.counters.disasters} desastres · 💣 ${inf.counters.sabotages} sabotagens</span><span class="bc-stat">🛒 ${inf.counters.shipmentsDone} comboios entregues / ${inf.counters.shipmentsLost} perdidos</span><span class="bc-stat">⛵ ${inf.counters.missionsOk} missões ok / ${inf.counters.missionsFail} falhas · ${inf.counters.shipsLost} navios perdidos</span></div>
          <div class="ficha-section-title">Catálogo de estradas</div><div class="pol-laws">${inf.catalog.roads.map(r => `<div class="pol-law"><div class="pl-head"><span>${r.icon} <strong>${escapeHtml(r.name)}</strong></span><span class="bc-level">${r.locked ? '🔒 ' + escapeHtml(r.tech) : 'disponível'}</span></div>
            <div class="hint">Custo/região: ${ifCost(r.cost)} · velocidade ×${(1 / r.mult).toFixed(1)} · capacidade ${r.capacity} · segurança +${r.security} · comércio ×${r.commerce} · militar ×${r.military} · manutenção ${r.maint}${r.fuel ? ' · consome carvão' : ''}</div></div>`).join('')}</div>`;
      }

      if (tab === 'valor') {
        html = `<p class="hint">Valor médio: <strong>${inf.avgValue}</strong> · total da rede: <strong>${fmt(inf.totalValue)}</strong> ${infoBtn('infra_value')}</p>
          <div class="pol-laws">${inf.territoryValues.map(t => `<div class="pol-law"><div class="pl-head"><span>${t.city ? '🏘️ ' + escapeHtml(t.city) : '📍 (' + (t.row + 1) + ',' + (t.col + 1) + ')'} · ${TERRAIN_ICON[t.terrain] || ''} ${TERRAIN_LABEL[t.terrain] || ''}${t.hasRoad ? ' · 🛤️' : ''}</span><span class="bc-level">💎 ${t.value}</span></div></div>`).join('') || '<p class="hint">Sem dados.</p>'}</div>`;
      }

      if (tab === 'reinos') {
        html = `<p class="hint">Reinos de IA também constroem infraestrutura. Você só conhece onde tem embaixada. Uma estrada que chega à fronteira cria uma rota internacional (tarifas menores, mais confiança). ${infoBtn('infra_ai')}</p>
          <div class="pol-laws">${inf.aiInfra.map(a => `<div class="pol-law"><div class="pl-head"><span>${a.symbol} <strong>${escapeHtml(a.aiName)}</strong></span><span class="bc-level">${a.linked ? '🔗 conectado' : ''}</span></div>${a.known ? `<div class="hint">Desenvolvimento ${a.level} · estratégia ${escapeHtml(a.strategy || '')}</div>${ifBar(a.level)}` : '<div class="hint">Desconhecido — construa uma embaixada.</div>'}</div>`).join('')}</div>`;
      }

      if (tab === 'historia') {
        html = inf.history.length ? `<ul class="history-list">${inf.history.map(h => `<li><span class="h-icon">${h.icon}</span><div><span class="h-year">ANO ${h.year}</span><span class="h-title">${escapeHtml(h.title)}</span></div></li>`).join('')}</ul>` : '<p class="hint">A história da infraestrutura ainda está começando.</p>';
      }
      el('ifBody').innerHTML = html;
      if (tab === 'estradas') ifRenderQuote();
      if (tab === 'portos') ifUpdateShipCost();
      if (tab === 'ar') ifUpdateAirCost();
    }
    function ifUpdateAirCost() {
      const inf = state.infra; const t = el('ifAirType'), q = el('ifAirQty'), c = el('ifAirCost'); if (!t || !q || !c) return;
      const a = inf.extra.aircraftCatalog.find(x => x.key === t.value); if (!a) return; const n = Math.max(1, Number(q.value) || 1);
      c.textContent = `Custo total: ${Object.entries(a.cost).map(([k, v]) => { const m = RESOURCE_META.find(r => r.key === k); return `${m ? m.icon : k} ${fmt(v * n)}`; }).join(' · ')}`;
    }
    function ifReadForm() {
      state.ifForm = { from: el('ifFrom') && el('ifFrom').value, to: el('ifTo') && el('ifTo').value, type: el('ifType') && el('ifType').value, bridges: el('ifBridges') && el('ifBridges').checked, tunnels: el('ifTunnels') && el('ifTunnels').checked };
      return state.ifForm;
    }
    function ifRenderQuote() {
      const box = el('ifQuoteBox'); const q = state.ifQuote; if (!box) return;
      if (!q) { box.innerHTML = ''; return; }
      if (q.error) { box.innerHTML = `<div class="pop-alert">⚠️ ${escapeHtml(q.error)}</div>`; return; }
      box.innerHTML = `<div class="pol-law"><div class="pl-head"><span>📐 <strong>${escapeHtml(q.name)}</strong></span><span class="bc-level">${q.days} dias</span></div>
        <div class="hint">${q.length} regiões (${q.newTiles} novas, ${q.reusedTiles} já existentes) · ${q.bridges} ponte(s) · ${q.tunnels} túnel(is) · terrenos: ${Object.entries(q.byTerrain).map(([k, v]) => `${v} ${escapeHtml(k)}`).join(', ') || '—'}</div>
        <div class="hint">Custo total: ${ifCost(q.cost)} · manutenção ~${q.maintenancePer5Days} ouro/ciclo · equipes ×${q.crew} · frentes de obra ${q.projectSlots.used}/${q.projectSlots.max}</div>
        ${q.missing.length ? `<div class="pop-alert">Faltam: ${q.missing.map(m => `${m.lack} de ${((RESOURCE_META.find(r => r.key === m.resource) || {}).label || m.resource)} (tem ${fmt(m.have)}, precisa ${fmt(m.need)})`).join('; ')}. Com o que você tem, cabem ${q.maxAffordableTiles} regiões.</div>` : '<div class="hint">✅ Recursos suficientes.</div>'}
        <div class="tech-controls"><button class="btn btn-primary" id="ifBuildBtn" ${q.missing.length ? 'disabled' : ''}>Construir tudo</button>${q.missing.length && q.maxAffordableTiles > 0 ? `<button class="btn btn-secondary" id="ifBuildPartBtn" data-limit="${q.maxAffordableTiles}">Construir só as primeiras ${q.maxAffordableTiles}</button>` : ''}</div></div>`;
    }
    function ifUpdateShipCost() {
      const inf = state.infra; const t = el('ifShipType'), q = el('ifShipQty'), c = el('ifShipCost'); if (!t || !q || !c) return;
      const s = inf.catalog.ships.find(x => x.key === t.value); if (!s) return;
      const n = Math.max(1, Number(q.value) || 1);
      c.textContent = `Custo total: ${Object.entries(s.cost).map(([k, v]) => { const m = RESOURCE_META.find(r => r.key === k); return `${m ? m.icon : k} ${fmt(v * n)}`; }).join(' · ')}`;
    }
    async function ifAction(fn, prefix) {
      try { const r = await fn(); showToast(`${prefix} ${r.message || ''}`); await refreshAll(true); }
      catch (err) { showToast(`⚠️ ${err.message}`); }
    }
    el('ifTabs').addEventListener('click', (e) => { const b = e.target.closest('[data-iftab]'); if (!b) return; if (state.ifTab === 'estradas') ifReadForm(); state.ifTab = b.dataset.iftab; renderInfra(); });
    el('ifBody').addEventListener('input', (e) => { if (e.target.id === 'ifShipQty') ifUpdateShipCost(); else if (e.target.id === 'ifAirQty') ifUpdateAirCost(); });
    el('ifBody').addEventListener('change', (e) => { if (e.target.id === 'ifShipType') ifUpdateShipCost(); else if (e.target.id === 'ifAirType') ifUpdateAirCost(); else if (['ifFrom', 'ifTo', 'ifType', 'ifBridges', 'ifTunnels'].includes(e.target.id)) { ifReadForm(); state.ifQuote = null; ifRenderQuote(); } });
    el('ifBody').addEventListener('click', async (e) => {
      const b = e.target.closest('button'); if (!b) return; const d = b.dataset;
      if (d.ifstep) { const [id, delta, max] = d.ifstep.split(':'); const inp = el(id); inp.value = Math.max(1, Math.min(Number(max), (Number(inp.value) || 1) + Number(delta))); if (id === 'ifShipQty') ifUpdateShipCost(); if (id === 'ifAirQty') ifUpdateAirCost(); return; }
      if (b.id === 'ifReallocBtn') return ifAction(() => Api.reallocateWorkers(), '👷');
      if (b.id === 'ifPlanCanalBtn') { state.ifForm.type = 'canal'; state.ifQuote = null; state.ifTab = 'estradas'; return renderInfra(); }
      if (d.ifportrepair) return ifAction(() => Api.repairPort(Number(d.ifportrepair)), '🔧');
      if (b.id === 'ifAirBtn') { const f = el('ifAirFac').value; if (!f) { showToast('⚠️ Construa um Porto Aéreo primeiro.'); return; } return ifAction(() => Api.buildAircraft(Number(f), el('ifAirType').value, Number(el('ifAirQty').value)), '🎈'); }
      if (d.ifair) { const [id, kind] = d.ifair.split(':'); return ifAction(() => Api.airMission(Number(id), kind), '🛩️'); }
      if (d.ifairrepair) return ifAction(() => Api.repairAircraft(Number(d.ifairrepair)), '🔧');
      if (d.ifsupply) return ifAction(() => Api.supplyConvoy(Number(d.ifsupply), Number(el('ifSup' + d.ifsupply).value), Number(el('ifSupG' + d.ifsupply).value)), '🛒');
      if (d.ifdisp) { const [id, choice] = d.ifdisp.split(':'); return ifAction(() => Api.resolveRouteDispute(Number(id), choice), '🤝'); }
      if (b.id === 'ifBlockBtn') { const a = el('ifBlockAi').value; if (!a) { showToast('⚠️ Você não está em guerra com ninguém.'); return; } return ifAction(() => Api.blockadeRoutes(Number(a)), '🚧'); }
      if (b.id === 'ifCounterBtn') return ifAction(() => Api.setCounterIntel(Number(el('ifCounter').value)), '🕵️');
      if (d.ifspy) return ifAction(() => Api.spyInfra(Number(el('ifSpyAi').value), d.ifspy), '🕵️');
      if (b.id === 'ifCoBtn') return ifAction(() => Api.foundTransportCompany(el('ifCoKind').value, el('ifCoName').value, Number(el('ifCoAmt').value)), '🏢');
      if (d.ifinvest) return ifAction(() => Api.investCompany(Number(d.ifinvest), Number(el('ifInv' + d.ifinvest).value)), '🏢');
      if (d.ifliq) return ifAction(() => Api.liquidateCompany(Number(d.ifliq)), '🏢');
      if (b.id === 'ifQuoteBtn') {
        const f = ifReadForm(); if (!f.from || !f.to || f.from === f.to) { showToast('⚠️ Escolha dois pontos diferentes.'); return; }
        try { state.ifQuote = await Api.quoteRoute({ fromId: Number(f.from), toId: Number(f.to), roadType: f.type, bridges: f.bridges, tunnels: f.tunnels }); } catch (err) { state.ifQuote = { error: err.message }; }
        ifRenderQuote(); return;
      }
      if (b.id === 'ifBuildBtn' || b.id === 'ifBuildPartBtn') { const f = ifReadForm(); const limit = b.id === 'ifBuildPartBtn' ? Number(d.limit) : 0; state.ifQuote = null; return ifAction(() => Api.buildRoute({ fromId: Number(f.from), toId: Number(f.to), roadType: f.type, bridges: f.bridges, tunnels: f.tunnels, limit }), '🏗️'); }
      if (d.ifcancel) return ifAction(() => Api.cancelInfraProject(d.ifcancel), '🏗️');
      if (d.ifrepair) return ifAction(() => Api.repairRoute(d.ifrepair), '🔧');
      if (b.id === 'ifPortBtn') { const id = el('ifPortNode').value; if (!id) { showToast('⚠️ Nenhuma cidade litorânea.'); return; } return ifAction(() => Api.buildPort(Number(id)), '⚓'); }
      if (d.ifspecbtn) return ifAction(() => Api.portSpecialty(Number(d.ifspecbtn), el('ifBody').querySelector(`[data-ifspec="${d.ifspecbtn}"]`).value), '⚓');
      if (b.id === 'ifShipBtn') { const p = el('ifShipPort').value; if (!p) { showToast('⚠️ Construa um porto primeiro.'); return; } return ifAction(() => Api.buildShips(Number(p), el('ifShipType').value, Number(el('ifShipQty').value)), '⛵'); }
      if (d.ifmission) { const [id, kind] = d.ifmission.split(':'); return ifAction(() => Api.shipMission(Number(id), kind), '⛵'); }
      if (d.ifshiprepair) return ifAction(() => Api.repairShip(Number(d.ifshiprepair)), '🔧');
      if (b.id === 'ifFacBtn') return ifAction(() => Api.buildFacility(Number(el('ifFacNode').value), el('ifFacKind').value), '📦');
      if (b.id === 'ifSQuoteBtn' || b.id === 'ifSendBtn') {
        const body = { nodeId: Number(el('ifSNode').value), direction: el('ifSDir').value, resource: el('ifSRes').value, qty: Number(el('ifSQty').value), guards: Number(el('ifSGuards').value) };
        if (b.id === 'ifSendBtn') return ifAction(() => Api.createShipment(body), '🛒');
        try { const q = await Api.quoteShipment(body); el('ifSBox').innerHTML = `<div class="pol-law"><div class="hint">📐 ${q.quantity} unidades · ${q.vehicles} carroça(s) · <strong>${q.days} dia(s)</strong> · frete 💰 ${fmt(q.cost)} · rota ${q.securityLabel.icon} ${escapeHtml(q.securityLabel.name)} (${q.security}) · cobertura de estrada ${q.coverage}%${q.via !== 'terra' ? ' · via ' + q.via : ''}</div></div>`; }
        catch (err) { el('ifSBox').innerHTML = `<div class="pop-alert">⚠️ ${escapeHtml(err.message)}</div>`; }
        return;
      }
      if (b.id === 'ifPolicyBtn') return ifAction(() => Api.setInfraPolicy({ maintLevel: Number(el('ifMaint').value), tollPct: Number(el('ifToll').value), portTaxPct: Number(el('ifPortTax').value), borderTaxPct: Number(el('ifBorderTax').value) }), '⚙️');
    });

    // Etapa 47: ATUALIZAÇÃO PARCIAL. Antes, cada ação recarregava 27 endpoints e redesenhava os 29 painéis (inclusive os escondidos).
    // Agora: o NÚCLEO (reino, construções, população, economia, objetivos, eventos, notificações, campanha) sempre; os grupos de cada painel só quando ele está aberto.
    // Os demais ficam "velhos" (staleGroups) e são carregados ao abrir o painel.
    return { renderInfra, renderReligion };
  };
})();
