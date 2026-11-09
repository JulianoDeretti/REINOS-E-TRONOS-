// js/painel-tecnologia-comercio.js — extraído de kingdom.js (Etapa 66) por backend/tools/extractPanel.js.
// O contexto (ctx) lista o que o trecho usa do fechamento do kingdom.js; o teste de contrato (tests/painel-contrato.test.js) falha se algo ficar sem dono.
(function () {
  const K = window.KOT || (window.KOT = {}); K.panels = K.panels || {};
  K.panels['tecnologia-comercio'] = function (ctx) {
    const { TECH_EFFECT_LABELS, TECH_TABS, TERRAIN_ICON, TERRAIN_LABEL, el, escapeHtml, fmt, infoBtn, polBar, polMeter, refreshAll, showToast, state, techEffText, techHeader, techNode } = ctx;
    function renderTech() {
      const t = state.tech;
      if (!t) return;
      el('techTabs').innerHTML = TECH_TABS.map(([k, label]) => `<button class="category-chip ${state.techTab === k ? 'active' : ''}" data-techtab="${k}">${label}${k === 'invencoes' && t.inventions.some(i => i.status === 'nova') ? ' (!)' : ''}</button>`).join('');
      const tab = state.techTab;
      let html = techHeader(t);

      if (tab === 'arvore') {
        const q = (state.techSearch || '').toLowerCase();
        const cats = state.techCat === 'all' ? t.categories : t.categories.filter(c => c.key === state.techCat);
        html += `<p class="hint">Arraste ou role cada linha para navegar pelos níveis. Ao pesquisar, escolha também o pesquisador: ${infoBtn('tree')}</p>
          <div class="tech-controls">
            <input type="text" class="search-input" id="techSearch" placeholder="🔎 Pesquisar tecnologia..." value="${escapeHtml(state.techSearch || '')}" style="max-width:260px;margin:0;">
            <select id="techResearcherSel"><option value="">Sem pesquisador</option>${t.researchers.map(r => `<option value="${r.id}" ${String(state.techResearcher) === String(r.id) ? 'selected' : ''} ${r.assignedTo ? 'disabled' : ''}>${escapeHtml(r.name)} (${r.specialtyName}, hab. ${r.skill})${r.assignedTo ? ' — ocupado' : ''}</option>`).join('')}</select>
            <select id="techStatusSel">${[['all', 'Todas'], ['available', 'Disponíveis'], ['done', 'Concluídas'], ['locked', 'Bloqueadas'], ['active', 'Em pesquisa']].map(([v, l]) => `<option value="${v}" ${state.techStatus === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
          </div>
          <div class="category-filter"><button class="category-chip ${state.techCat === 'all' ? 'active' : ''}" data-techcat="all">Todas</button>${t.categories.map(c => `<button class="category-chip ${state.techCat === c.key ? 'active' : ''}" data-techcat="${c.key}">${c.icon} ${escapeHtml(c.name)} ${c.done}/${c.total}</button>`).join('')}</div>`;
        html += cats.map(c => {
          const nodes = t.techs.filter(x => x.category === c.key && (state.techStatus === 'all' || x.status === state.techStatus) && (!q || x.name.toLowerCase().includes(q)));
          if (!nodes.length) return '';
          return `<div class="tech-row"><div class="tech-row-title">${c.icon} <strong>${escapeHtml(c.name)}</strong> <span class="hint">${c.done}/${c.total}</span></div>
            <div class="tech-scroll">${nodes.map(techNode).join('<span class="tech-arrow">➜</span>')}</div></div>`;
        }).join('') || '<p class="hint">Nenhuma tecnologia encontrada com esse filtro.</p>';
      }

      if (tab === 'pesquisa') {
        const s = t.settings;
        html += `<div class="ficha-section-title">Política de Pesquisa ${infoBtn('budget')}</div>
          <div class="tech-controls">
            ${Object.entries(s.budgets).map(([k, b]) => `<button class="category-chip ${s.budget === k ? 'active' : ''}" data-tech-budget="${k}">${b.label} (×${b.speed}${b.dailyCost ? `, ${b.dailyCost}💰/dia` : ''})</button>`).join('')}
          </div>
          <div class="tech-controls"><label>Prioridade: </label><select id="techPrioritySel"><option value="">Nenhuma</option>${t.categories.map(c => `<option value="${c.key}" ${s.priority === c.key ? 'selected' : ''}>${c.icon} ${escapeHtml(c.name)}</option>`).join('')}</select>
            <span class="hint">Prioridade acelera 30% essa área e desacelera 10% as demais.</span></div>
          <p class="hint">Custo diário atual: ${s.dailyCost} ouro (orçamento + salários). Pesquisas simultâneas: ${t.active.length}/${t.slots}. ${t.favored.length ? `Seu governo favorece: ${t.favored.map(escapeHtml).join(', ')} (+20%).` : ''}</p>
          <div class="ficha-section-title">Pesquisas em Andamento ${infoBtn('research')}</div>` +
          (t.active.length ? t.active.map(a => `<div class="pol-law">
            <div class="pl-head"><span>${a.icon} <strong>${escapeHtml(a.name)}</strong>${a.risky ? ' ⚠️' : ''}</span><span class="bc-level">${a.daysRemaining} dias</span></div>
            ${polBar(a.daysTotal ? ((a.daysTotal - a.daysRemaining) / a.daysTotal) * 100 : 0)}
            <div class="hint">Ritmo ×${a.speed} (${a.speedParts.map(escapeHtml).join(' · ')})${a.researcher ? ` · Pesquisador: ${escapeHtml(a.researcher)}` : ''}</div>
            <div class="hint">Chance de sucesso ao concluir: <strong>${a.chance}%</strong> ${infoBtn('chance')}</div>
            <div class="bc-stats">${a.chanceMods.map(m => `<span class="bc-stat ${m.value >= 0 ? 'prod' : 'cons'}">${escapeHtml(m.label)} ${m.value > 0 ? '+' : ''}${m.value}%</span>`).join('')}</div>
            <button class="btn btn-ghost" data-tech-cancel="${a.key}">⏹️ Interromper (devolve 30% do ouro)</button>
          </div>`).join('') : '<p class="hint">Nenhuma pesquisa em andamento. Escolha uma tecnologia na árvore.</p>');
      }

      if (tab === 'pesquisadores') {
        html += `<div class="ficha-section-title">Contratar Pesquisador ${infoBtn('researchers')}</div>
          <div class="tech-controls"><select id="hireSpecialty">${t.categories.map(c => `<option value="${c.key}">${c.icon} ${escapeHtml(c.name)}</option>`).join('')}</select>
            <button class="btn btn-primary" data-tech-hire="1">🎓 Contratar (150💰)</button><span class="hint">${t.researchers.length}/${t.maxResearchers} pesquisadores · salário 2💰/dia cada</span></div>
          <div class="characters-grid">${t.researchers.map(r => `<div class="character-card" style="cursor:default;">
            <span class="ch-icon">${r.specialtyIcon}</span><span class="ch-name">${escapeHtml(r.name)}</span>
            <span class="ch-role">${escapeHtml(r.specialtyName)} · ${r.age} anos</span>
            <div class="ch-stats"><span>🧠 Habilidade ${r.skill}</span><span>⭐ Exp. ${r.experience}</span></div>
            <div class="ch-stats"><span>❤️ Lealdade ${r.loyalty}</span><span>🌠 ${r.discoveries} descobertas</span></div>
            <div class="hint">${r.origin === 'formado' ? '🎓 formado no reino' : r.origin === 'atraido' ? '✈️ atraído do exterior' : 'contratado'}${r.assignedTo ? ` · pesquisando ${escapeHtml(r.assignedTo)}` : ' · livre'}</div>
          </div>`).join('') || '<p class="hint">Nenhum pesquisador ainda.</p>'}</div>`;
      }

      if (tab === 'educacao') {
        const e = t.education;
        html += `<div class="ficha-section-title">Educação da População ${infoBtn('education')}</div>
          <div class="pol-grid">${polMeter('🎓', 'Índice de educação', e.index)}</div>
          <div class="economic-classes">${e.levels.map(l => `<div class="eco-class-row"><span class="ec-label" style="width:200px;">${escapeHtml(l.name)}</span><div class="ec-track"><div class="ec-fill" style="width:${l.percent}%"></div></div><span class="ec-value">${fmt(l.count)} (${l.percent}%)</span></div>`).join('')}</div>
          <p class="hint">Instituições produzem ${t.institutions.knowledge.toFixed(1)} de conhecimento/dia (${t.institutions.schools} instituições de ensino, ${t.institutions.labs} laboratório(s), ${t.institutions.unis} universidade(s), ${t.institutions.institutes} instituto(s)). A lei de Educação Pública ${e.lawBonus >= 0 ? '+' : ''}${e.lawBonus} no índice. População educada rende até +5% de ouro. Construa escolas, bibliotecas, universidades e laboratórios (algumas exigem tecnologia).</p>`;
      }

      if (tab === 'invencoes') {
        const LABEL = { nova: '🆕 Nova', patenteada: '📜 Patenteada', licenciada: '🤝 Licenciada', vendida: '💰 Vendida', secreta: '🤫 Secreta', compartilhada: '🌐 Compartilhada' };
        html += `<div class="ficha-section-title">Invenções e Patentes ${infoBtn('patents')}</div>` + (t.inventions.length ? t.inventions.map(i => `<div class="pol-law">
          <div class="pl-head"><span>💡 <strong>${escapeHtml(i.name)}</strong></span><span class="bc-level">${LABEL[i.status] || i.status}</span></div>
          <div class="hint">Área: ${escapeHtml((t.categories.find(c => c.key === i.category) || {}).name || i.category)}${i.income ? ` · renda ${i.income} ouro/dia` : ''}</div>
          ${i.status === 'nova' ? `<div class="pd-actions">
            <button class="btn btn-primary" data-tech-inv="${i.id}" data-action="patentear">📜 Patentear (100💰, +6/dia)</button>
            <button class="btn btn-secondary" data-tech-inv="${i.id}" data-action="licenciar">🤝 Licenciar (+3/dia)</button>
            <button class="btn btn-secondary" data-tech-inv="${i.id}" data-action="vender">💰 Vender</button>
            <button class="btn btn-ghost" data-tech-inv="${i.id}" data-action="secreto">🤫 Manter secreta (+1 conhecimento/dia)</button>
            <button class="btn btn-ghost" data-tech-inv="${i.id}" data-action="compartilhar">🌐 Compartilhar com aliados</button></div>` : ''}
        </div>`).join('') : '<p class="hint">Nenhuma invenção ainda. Elas surgem de pesquisas bem-sucedidas, descobertas e pesquisadores talentosos.</p>');
      }

      if (tab === 'descobertas') {
        html += `<div class="ficha-section-title">Descobertas Científicas ${infoBtn('discoveries')}</div>` + (t.discoveries.length ? t.discoveries.map(d => `<div class="pol-law"><div class="pl-head"><span>${d.icon} <strong>${escapeHtml(d.title)}</strong></span><span class="bc-level">${d.good ? '✅ sucesso' : '⚠️ revés'} · dia ${d.day}</span></div><div class="hint">${escapeHtml(d.text)}</div></div>`).join('') : '<p class="hint">Nenhuma descoberta ainda. Pesquisadores, laboratórios e institutos aumentam a chance de descobertas inesperadas.</p>');
      }

      if (tab === 'reinos') {
        html += `<div class="ficha-section-title">Nível Tecnológico dos Outros Reinos ${infoBtn('spy')}</div>
          <p class="hint">Espionagem científica custa 200💰 e tem sorteio: pode roubar uma tecnologia, ser flagrada (incidente diplomático) ou falhar. Intervalo de 8 dias.</p>
          <div class="characters-grid">${t.kingdoms.map(k => `<div class="character-card" style="cursor:default; border-left:4px solid ${k.color};">
            <span class="ch-icon">${k.symbol}</span><span class="ch-name">${escapeHtml(k.name)}</span><span class="ch-role">${k.eraIcon} ${escapeHtml(k.era)}</span>
            <div class="ch-stats"><span>🔬 Nível ${k.level}</span><span>${k.focusIcon} ${escapeHtml(k.focusName)}</span></div>
            <button class="btn btn-secondary" data-tech-spy="${k.id}">🕵️ Espionar</button></div>`).join('')}</div>
          <p class="hint">Seu nível: ${t.techLevel}. Contadores: ${t.counters.spies} missões bem-sucedidas · ${t.counters.lostRecovered} tecnologias perdidas recuperadas · ${t.counters.techLost} esquecidas.</p>`;
      }

      if (tab === 'historia') {
        html += `<div class="ficha-section-title">História Científica</div>` + (t.history.length
          ? `<ul class="history-list">${t.history.map(h => `<li><span class="h-icon">${h.icon}</span><div><span class="h-year">ANO ${h.year}</span><span class="h-title">${escapeHtml(h.title)}</span></div></li>`).join('')}</ul>`
          : '<p class="hint">Nenhum acontecimento científico ainda.</p>');
      }
      el('techBody').innerHTML = html;
    }

    async function techAction(fn, prefix) {
      try { const r = await fn(); showToast(`${prefix} ${r.message || ''}`); await refreshAll(true); }
      catch (err) { showToast(`⚠️ ${err.message}`); }
    }
    el('techTabs').addEventListener('click', (e) => { const b = e.target.closest('[data-techtab]'); if (!b) return; state.techTab = b.dataset.techtab; renderTech(); });
    el('techBody').addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.techcat) { state.techCat = b.dataset.techcat; renderTech(); }
      else if (b.dataset.techStart) techAction(() => Api.startResearch(b.dataset.techStart, state.techResearcher ? Number(state.techResearcher) : null), '🔬');
      else if (b.dataset.techCancel) techAction(() => Api.cancelResearch(b.dataset.techCancel), '⏹️');
      else if (b.dataset.techBudget) techAction(() => Api.setTechSettings({ budget: b.dataset.techBudget }), '🔬');
      else if (b.dataset.techHire) techAction(() => Api.hireResearcher(el('hireSpecialty').value), '🎓');
      else if (b.dataset.techInv) techAction(() => Api.decideInvention(b.dataset.techInv, b.dataset.action), '💡');
      else if (b.dataset.techSpy) techAction(() => Api.spyOn(b.dataset.techSpy), '🕵️');
    });
    el('techBody').addEventListener('input', (e) => {
      if (e.target.id === 'techSearch') { state.techSearch = e.target.value; const pos = e.target.selectionStart; renderTech(); const n = el('techSearch'); if (n) { n.focus(); n.setSelectionRange(pos, pos); } }
    });
    el('techBody').addEventListener('change', (e) => {
      if (e.target.id === 'techResearcherSel') state.techResearcher = e.target.value;
      if (e.target.id === 'techStatusSel') { state.techStatus = e.target.value; renderTech(); }
      if (e.target.id === 'techPrioritySel') techAction(() => Api.setTechSettings({ priority: e.target.value }), '🔬');
    });
    // arrastar as linhas da arvore com o mouse
    (function enableTechDrag() {
      let down = null;
      el('techBody').addEventListener('mousedown', (e) => { const sc = e.target.closest('.tech-scroll'); if (sc && !e.target.closest('button')) down = { sc, x: e.clientX, l: sc.scrollLeft }; });
      window.addEventListener('mousemove', (e) => { if (down) down.sc.scrollLeft = down.l - (e.clientX - down.x); });
      window.addEventListener('mouseup', () => { down = null; });
    })();

    // ==============================================================
    // EXPLORAÇÃO (Etapa 11): nevoa, expedicoes, descobertas, cartografia...
    // ==============================================================
    const EXP_TABS = [
      ['visao', '🧭 Visão Geral'], ['expedicoes', '🧭 Expedições'], ['descobertas', '📜 Descobertas'], ['cartografia', '🗺️ Cartografia'],
      ['bestiario', '🐉 Bestiário'], ['artefatos', '🏺 Artefatos'], ['recursos', '💎 Recursos Raros'], ['projetos', '🏰 Maravilhas'],
      ['missoes', '📌 Missões'], ['exploradores', '🎒 Exploradores'], ['historia', '📖 História'],
    ];
    const STATUS_LABEL = { avistado: '👁️ Avistado', investigado: '✅ Investigado', perdido: '🏴 Perdido para outro reino' };
    const EXP_STATUS_LABEL = { em_curso: '⏳ Em curso', concluida: '✅ Concluída', retornou: '↩️ Retornou', perdida: '💀 Perdida' };

    function renderExploration() {
      const x = state.exploration;
      if (!x) return;
      el('expTabs').innerHTML = EXP_TABS.map(([k, label]) => `<button class="category-chip ${state.expTab === k ? 'active' : ''}" data-exptab="${k}">${label}${k === 'expedicoes' && x.expeditions.some(e => e.decision) ? ' (!)' : ''}</button>`).join('');
      const tab = state.expTab;
      let html = `<div class="pol-grid">
        <div class="pol-meter"><div class="pm-head"><span>🗺️ Mundo conhecido ${infoBtn('fog')}</span><strong>${x.knownPercent}%</strong></div>${polBar(x.knownPercent)}</div>
        <div class="pol-meter"><div class="pm-head"><span>🏅 Prestígio de exploração ${infoBtn('prestige')}</span><strong>${x.prestige}</strong></div></div>
        <div class="pol-meter"><div class="pm-head"><span>🎒 Exploradores</span><strong>${x.explorers.length}/${x.maxExplorers}</strong></div></div>
      </div>`;

      if (tab === 'visao') {
        html += `<div class="ficha-section-title">Níveis de Conhecimento das Regiões ${infoBtn('levels')}</div>
          <div class="bc-stats">${Object.entries(x.levels).map(([lv, d]) => `<span class="bc-stat">${d.icon} ${escapeHtml(d.name)}: ${fmt(x.byLevel[lv] || 0)}</span>`).join('')}</div>
          <div class="ficha-section-title">Contadores</div>
          <div class="bc-stats">
            <span class="bc-stat">🧭 ${x.counters.expeditionsDone} expedições concluídas</span><span class="bc-stat cons">💀 ${x.counters.expeditionsLost} perdidas</span>
            <span class="bc-stat">📜 ${x.counters.sitesFound} locais descobertos</span><span class="bc-stat">✅ ${x.counters.sitesInvestigated} investigados</span>
            <span class="bc-stat">🗺️ ${x.counters.mapsMade} mapas feitos</span><span class="bc-stat">📌 ${x.counters.missionsDone} missões cumpridas</span>
          </div>
          <div class="ficha-section-title">Bônus ativos (recursos raros, artefatos e maravilhas)</div>
          <div class="bc-stats">${Object.entries(x.modifiers).filter(([, v]) => Math.abs(v) > 0.01).map(([k, v]) => `<span class="bc-stat prod">${TECH_EFFECT_LABELS[k] || k} ${v > 0 ? '+' : ''}${Math.round(v * 10) / 10}</span>`).join('') || '<span class="hint">Nenhum ainda.</span>'}</div>
          <div class="ficha-section-title">Reinos Vizinhos Explorando ${infoBtn('rivals')}</div>
          <div class="bc-stats">${x.kingdoms.map(k => `<span class="bc-stat" style="border-left:3px solid ${k.color};">${k.symbol} ${escapeHtml(k.name)}: ~${k.explored}% explorado, ${k.claims} local(is) reivindicado(s)</span>`).join('')}</div>
          <button class="btn btn-primary" id="newExpedBtn" style="margin-top:12px;">🧭 Organizar Nova Expedição</button>`;
      }

      if (tab === 'expedicoes') {
        html += `<button class="btn btn-primary" id="newExpedBtn" style="margin-bottom:10px;">🧭 Organizar Nova Expedição</button>`;
        html += x.expeditions.length ? x.expeditions.map(e => `
          <div class="exp-card ${e.status}">
            <div class="pl-head"><span>${e.typeIcon} <strong>${escapeHtml(e.name)}</strong></span><span class="bc-level">${EXP_STATUS_LABEL[e.status]}</span></div>
            <div class="hint">${escapeHtml(e.typeName)} · ${e.transportIcon} ${escapeHtml(e.transport)} · Líder: ${escapeHtml(e.leader)} · Destino: (${e.target.row + 1},${e.target.col + 1}) ${TERRAIN_ICON[e.target.terrain] || ''}</div>
            <div class="hint">👥 ${e.alive}/${e.members} vivos${e.injured ? ` · 🩹 ${e.injured} feridos` : ''} · 🎒 suprimentos: ${e.supplies}</div>
            ${e.status === 'em_curso' ? `${polBar(e.progress)}<div class="hint">Dia ${e.elapsed}/${e.totalDays} · fase: ${e.phase === 'ida' ? 'em viagem' : e.phase === 'exploracao' ? 'explorando' : 'retornando'}</div>` : `<div class="hint">${escapeHtml(e.result || '')}</div>`}
            ${e.decision ? `<div class="exp-decision"><strong>⚠️ ${escapeHtml(e.decision.title)}</strong><p>${escapeHtml(e.decision.text)}</p>
              ${e.decision.options.map(o => `<button class="btn btn-secondary" data-exp-decide="${e.id}" data-option="${o.key}">${o.label}${o.skill ? ` (${o.chance}%)` : ''}</button>`).join('')}</div>` : ''}
            ${e.status === 'em_curso' && !e.decision ? `<button class="btn btn-ghost" data-exp-recall="${e.id}" style="margin-top:6px;">↩️ Chamar de volta</button>` : ''}
            <button class="btn btn-ghost" data-exp-log="${e.id}" style="margin-top:6px;">📖 ${state.expLogOpen === e.id ? 'Ocultar diário' : 'Ver diário'}</button>
            ${state.expLogOpen === e.id ? `<div class="exp-log">${e.log.map(l => `<div class="exp-log-line"><span class="el-day">DIA ${l.day}</span>${l.icon} ${escapeHtml(l.text)}</div>`).join('')}</div>` : ''}
          </div>`).join('') : '<p class="hint">Nenhuma expedição ainda.</p>';
      }

      if (tab === 'descobertas') {
        html += x.sites.length ? `<div class="bc-stats" style="margin-bottom:10px;">${Object.entries(STATUS_LABEL).map(([k, l]) => `<span class="bc-stat">${l}: ${x.sites.filter(s => s.status === k).length}</span>`).join('')}</div>
          <div class="pol-laws">${x.sites.map(s => `<div class="pol-law"><div class="pl-head"><span>${s.icon} <strong>${escapeHtml(s.name)}</strong></span><span class="bc-level">${STATUS_LABEL[s.status]}</span></div>
            <div class="hint">${TERRAIN_ICON[s.terrain] || ''} ${TERRAIN_LABEL[s.terrain] || ''} — (${s.row + 1},${s.col + 1})${s.typeName ? ` · ${escapeHtml(s.typeName)}` : ''}${s.rival ? ` · 🏴 reivindicado por ${escapeHtml(s.rival)}` : ''}</div>
            ${s.detail ? `<div class="hint">${escapeHtml(s.detail)}</div>` : ''}</div>`).join('')}</div>` : '<p class="hint">Nenhum local descoberto ainda — envie expedições para avistar segredos do mundo.</p>';
      }

      if (tab === 'cartografia') {
        html += `<div class="ficha-section-title">Criar Novo Mapa ${infoBtn('cartography')}</div>
          <div class="tech-controls">
            <select id="mapKind">${Object.entries(x.mapKinds).map(([k, l]) => `<option value="${k}">${l}</option>`).join('')}</select>
            <input type="number" id="mapCenterId" placeholder="ID do território (clique no mapa)" style="width:220px;">
            <input type="number" id="mapRadius" value="6" min="3" max="12" style="width:70px;" title="raio">
            <select id="mapCartographer"><option value="">Sem cartógrafo</option>${x.explorers.filter(e => e.status === 'ativo').map(e => `<option value="${e.id}">${escapeHtml(e.name)} (${e.specialtyName})</option>`).join('')}</select>
            <button class="btn btn-primary" id="createMapBtn">Criar (50+ ouro)</button>
          </div>
          <p class="hint">Clique num território na aba Mapa do reino para ver o ID e usá-lo aqui. Quanto mais explorada a área, maior a precisão.</p>
          <div class="pol-laws">${x.maps.map(m => `<div class="pol-law"><div class="pl-head"><span>🗺️ <strong>${escapeHtml(m.name)}</strong></span><span class="bc-level">${m.accuracy}%</span></div>
            <div class="hint">${escapeHtml(m.label)} · raio ${m.radius} · atualizado há ${m.age} dia(s)</div>${polBar(m.accuracy)}
            <button class="btn btn-secondary" data-map-update="${m.id}" style="margin-top:6px;">🔄 Atualizar (30 ouro)</button></div>`).join('') || '<p class="hint">Nenhum mapa criado ainda.</p>'}</div>`;
      }

      if (tab === 'bestiario') {
        html += `<div class="bestiary-grid">${x.bestiary.map(b => `
          <div class="beast-card ${b.known ? '' : 'unknown'}">
            <span class="bc-icon-big">${b.icon}</span><strong>${escapeHtml(b.name)}</strong>
            ${b.known ? `<div class="hint">${b.kind === 'fauna' ? '🐾 Fauna' : '🌿 Flora'} · raridade ${'⭐'.repeat(b.rarity)}</div>
              ${b.behavior ? `<div class="hint">${escapeHtml(b.habitat)} · ${escapeHtml(b.behavior)}</div>` : ''}
              ${b.utility ? `<div class="hint">Utilidade: ${escapeHtml(b.utility)}</div>` : ''}` : '<div class="hint">Ainda não catalogado</div>'}
          </div>`).join('')}</div>`;
      }

      if (tab === 'artefatos') {
        const LBL = { guardado: '🗄️ Guardado', exibido: '🏛️ Exibido', estudado: '📖 Estudado', vendido: '💰 Vendido', presenteado: '🎁 Presenteado' };
        html += x.artifacts.length ? x.artifacts.map(a => `<div class="pol-law"><div class="pl-head"><span>${a.icon} <strong>${escapeHtml(a.name)}</strong></span><span class="bc-level">${LBL[a.status] || a.status}</span></div>
          <div class="hint">Origem: ${escapeHtml(a.origin)} · Raridade ${'⭐'.repeat(a.rarity)}</div>
          <div class="bc-stats">${techEffText(a.effects)}</div><div class="hint">⚠️ ${escapeHtml(a.limit)}</div>
          ${['guardado', 'exibido', 'estudado'].includes(a.status) ? `<div class="pd-actions">
            ${a.status !== 'exibido' ? `<button class="btn btn-secondary" data-art="${a.id}" data-action="exibir">🏛️ Exibir</button>` : ''}
            ${a.status !== 'estudado' ? `<button class="btn btn-secondary" data-art="${a.id}" data-action="estudar">📖 Estudar</button>` : ''}
            <button class="btn btn-ghost" data-art="${a.id}" data-action="vender">💰 Vender</button>
            <button class="btn btn-ghost" data-art="${a.id}" data-action="presentear">🎁 Presentear (diplomacia)</button></div>` : ''}
        </div>`).join('') : '<p class="hint">Nenhum artefato encontrado ainda.</p>';
      }

      if (tab === 'recursos') {
        html += `<div class="pol-laws">${x.rare.map(r => `<div class="pol-law"><div class="pl-head"><span>${r.icon} <strong>${escapeHtml(r.name)}</strong></span><span class="bc-level">${r.quantity}x</span></div>
          <div class="hint">${escapeHtml(r.desc)}</div><div class="bc-stats">${techEffText(r.effects)}</div></div>`).join('')}</div>`;
      }

      if (tab === 'projetos') {
        html += `<p class="hint">Maravilhas usam recursos raros para efeitos permanentes e prestígio. ${infoBtn('projects')}</p>
          <div class="pol-laws">${x.projects.map(p => `<div class="pol-law"><div class="pl-head"><span>${p.icon} <strong>${escapeHtml(p.name)}</strong></span><span class="bc-level">${p.done ? '✅ Construída' : ''}</span></div>
          <div class="hint">${escapeHtml(p.desc)}</div><div class="bc-stats">${techEffText(p.effects)}</div>
          <div class="bc-stats"><span class="bc-stat">💰 ${p.cost.gold}</span><span class="bc-stat">📚 ${p.cost.knowledge}</span>${p.rareNeeded.map(r => `<span class="bc-stat ${r.have >= r.n ? 'prod' : 'cons'}">${r.icon} ${r.have}/${r.n} ${escapeHtml(r.name)}</span>`).join('')}</div>
          ${!p.done ? `<button class="btn btn-primary" data-project="${p.key}" style="margin-top:6px;">Construir</button>` : ''}
        </div>`).join('')}</div>`;
      }

      if (tab === 'missoes') {
        const LBL = { aberta: '🟡 Aberta', concluida: '✅ Concluída', expirada: '⌛ Expirada' };
        html += x.missions.length ? x.missions.map(m => `<div class="pol-law"><div class="pl-head"><span>📌 <strong>${escapeHtml(m.title)}</strong></span><span class="bc-level">${LBL[m.status]}</span></div>
          <div class="hint">${escapeHtml(m.description)}</div><div class="bc-stats"><span class="bc-stat prod">+${m.reward.gold} ouro</span><span class="bc-stat prod">+${m.reward.knowledge || 0} conhecimento</span></div></div>`).join('') : '<p class="hint">Nenhuma missão disponível no momento — elas surgem aos poucos.</p>';
      }

      if (tab === 'exploradores') {
        html += `<div class="ficha-section-title">Contratar Explorador ${infoBtn('explorers')}</div>
          <div class="tech-controls"><select id="hireExplSpecialty">${x.specialties.map(s => `<option value="${s.key}">${s.icon} ${escapeHtml(s.name)}</option>`).join('')}</select>
          <button class="btn btn-primary" id="hireExplBtn">🎒 Contratar (120💰)</button></div>
          <div class="characters-grid">${x.explorers.map(e => `<div class="character-card" style="cursor:default;">
            <span class="ch-icon">${e.icon}</span><span class="ch-name">${escapeHtml(e.name)}${e.title ? ` · ${e.title}` : ''}</span>
            <span class="ch-role">${escapeHtml(e.specialtyName)} · ${e.age} anos${e.status === 'em_expedicao' ? ' · 🧭 em expedição' : ''}</span>
            <div class="ch-stats"><span>${e.main} ${e.mainValue}</span><span>⭐ Fama ${e.fame}</span></div>
            <div class="ch-stats"><span>💪 Coragem ${e.courage}</span><span>🍀 Sorte ${e.luck}</span></div>
            <div class="hint">${e.expeditionsDone} expedição(ões) concluída(s)</div></div>`).join('')}</div>
          ${x.lostExplorers.length ? `<div class="ficha-section-title">Perdidos em Expedições</div><div class="bc-stats">${x.lostExplorers.map(l => `<span class="bc-stat cons">${escapeHtml(l.name)} (${l.status})</span>`).join('')}</div>` : ''}`;
      }

      if (tab === 'historia') {
        html += x.history.length ? `<ul class="history-list">${x.history.map(h => `<li><span class="h-icon">${h.icon}</span><div><span class="h-year">ANO ${h.year}</span><span class="h-title">${escapeHtml(h.title)}</span></div></li>`).join('')}</ul>` : '<p class="hint">Nenhum acontecimento de exploração ainda.</p>';
      }
      el('expBody').innerHTML = html;
    }

    async function expAction(fn, prefix) {
      try { const r = await fn(); showToast(`${prefix} ${r.message || ''}`); await refreshAll(true); }
      catch (err) { showToast(`⚠️ ${err.message}`); }
    }
    el('expTabs').addEventListener('click', (e) => { const b = e.target.closest('[data-exptab]'); if (!b) return; state.expTab = b.dataset.exptab; renderExploration(); });
    el('expBody').addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.id === 'newExpedBtn') openQuickExpedition(null);
      else if (b.dataset.expDecide) expAction(() => Api.decideExpedition(b.dataset.expDecide, b.dataset.option), '🧭');
      else if (b.dataset.expRecall) expAction(() => Api.recallExpedition(b.dataset.expRecall), '↩️');
      else if (b.dataset.expLog) { state.expLogOpen = state.expLogOpen === Number(b.dataset.expLog) ? null : Number(b.dataset.expLog); renderExploration(); }
      else if (b.id === 'createMapBtn') expAction(() => Api.createExpMap({ kind: el('mapKind').value, centerId: Number(el('mapCenterId').value), radius: Number(el('mapRadius').value), cartographerId: el('mapCartographer').value || null }), '🗺️');
      else if (b.dataset.mapUpdate) expAction(() => Api.updateExpMap(b.dataset.mapUpdate), '🔄');
      else if (b.dataset.art) expAction(() => Api.decideArtifact(b.dataset.art, b.dataset.action), '🏺');
      else if (b.dataset.project) expAction(() => Api.startExpProject(b.dataset.project), '🏰');
      else if (b.id === 'hireExplBtn') expAction(() => Api.hireExplorer(el('hireExplSpecialty').value), '🎒');
    });

    // ---- modal de nova expedicao ----
    const expedOverlay = el('expedModalOverlay');
    function openQuickExpedition(territoryId) {
      const x = state.exploration; if (!x) return;
      const explorers = x.explorers.filter(e => e.status === 'ativo');
      el('expedModalBody').innerHTML = `
        <div class="ficha-name" style="margin-bottom:10px;">🧭 Nova Expedição</div>
        <div class="field"><label>Nome (opcional)</label><input type="text" id="qeName" placeholder="Ex.: Expedição das Areias"></div>
        <div class="field"><label>Tipo de expedição</label><select id="qeType">${x.types.map(t => `<option value="${t.key}">${t.icon} ${t.name}</option>`).join('')}</select></div>
        <div class="field"><label>Território de destino (ID)</label><input type="number" id="qeTarget" value="${territoryId || ''}" placeholder="Clique numa região no mapa para ver o ID"></div>
        <div class="field"><label>Transporte</label><select id="qeTransport">${x.transports.map(t => `<option value="${t.key}" ${!t.available ? 'disabled' : ''}>${t.icon} ${t.name} (alcance ${t.range})${!t.available ? ` — requer ${t.tech}` : ''}</option>`).join('')}</select></div>
        <div class="field"><label>Líder</label><select id="qeLeader">${explorers.map(e => `<option value="${e.id}">${e.icon} ${escapeHtml(e.name)} (${e.specialtyName}, ${e.main} ${e.mainValue})</option>`).join('') || '<option value="">Nenhum explorador disponível — contrate um na aba Exploradores</option>'}</select></div>
        <div class="field"><label>Companheiros (opcional, até 3)</label><select id="qeCompanions" multiple size="4">${explorers.map(e => `<option value="${e.id}">${e.icon} ${escapeHtml(e.name)}</option>`).join('')}</select></div>
        <div class="field"><label>Integrantes: <span id="qeMembersLabel">10</span> (desempregados disponíveis: ${x.unemployed})</label><input type="range" id="qeMembers" min="3" max="40" value="10"></div>
        <div class="field"><label>Suprimentos</label><select id="qeSupply"><option value="minimo">Mínimo (barato, arriscado)</option><option value="normal" selected>Normal</option><option value="farto">Farto (caro, mais seguro)</option></select></div>
        <div class="field"><label>Equipamento</label><select id="qeEquip"><option value="basico">Básico</option><option value="reforcado">Reforçado (+60 ouro, +15 ferro, mais seguro)</option></select></div>
        <div id="qeAlert" class="alert alert-error"></div>
        <button class="btn btn-primary btn-block" id="qeConfirm">🧭 Partir</button>`;
      expedOverlay.classList.remove('hidden');
      el('qeMembers').addEventListener('input', (e) => { el('qeMembersLabel').textContent = e.target.value; });
      el('qeConfirm').addEventListener('click', async () => {
        const companions = Array.from(el('qeCompanions').selectedOptions).map(o => o.value);
        const alertBox = el('qeAlert');
        try {
          const r = await Api.launchExpedition({ name: el('qeName').value, type: el('qeType').value, transport: el('qeTransport').value, targetId: Number(el('qeTarget').value),
            leaderId: Number(el('qeLeader').value) || null, companions, members: Number(el('qeMembers').value), supply: el('qeSupply').value, equipment: el('qeEquip').value });
          showToast(`🧭 ${r.message}`);
          expedOverlay.classList.add('hidden');
          state.expTab = 'expedicoes';
          await refreshAll(true);
        } catch (err) { alertBox.textContent = err.message; alertBox.classList.add('show'); }
      });
    }
    el('expedModalClose').addEventListener('click', () => expedOverlay.classList.add('hidden'));
    expedOverlay.addEventListener('click', (e) => { if (e.target === expedOverlay) expedOverlay.classList.add('hidden'); });

    // ==============================================================
    // COMÉRCIO INTERNACIONAL (Etapa 12)
    // ==============================================================
    const TI_TABS = [
      ['visao', '🌍 Visão Geral'], ['reinos', '🏰 Reinos Parceiros'], ['rotas', '🧭 Rotas'], ['caravanas', '🐫 Caravanas'],
      ['mercadores', '🎒 Mercadores'], ['empresas', '🏪 Empresas'], ['contratos', '📜 Contratos'], ['negro', '🕶️ Mercado Negro'],
      ['precos', '📈 Preços'], ['historia', '📖 História'],
    ];
    const TI_STATUS = { ativa: '🟢 Ativa', cancelada: '⚪ Cancelada', em_curso: '⏳ Em curso', concluida: '✅ Concluída', perdida: '💀 Perdida',
      falida: '📉 Falida', liquidada: '⚪ Liquidada', ativo: '🟢 Ativo', quebrado: '💥 Quebrado', concluido: '✅ Concluído' };

    function renderTradeIntl() {
      const ti = state.tradeIntl;
      if (!ti) return;
      el('tiTabs').innerHTML = TI_TABS.map(([k, label]) => `<button class="category-chip ${state.tiTab === k ? 'active' : ''}" data-titab="${k}">${label}${k === 'caravanas' && ti.caravans.some(c => c.decision) ? ' (!)' : ''}</button>`).join('');
      const tab = state.tiTab;
      let html = `<div class="pol-grid">
        <div class="pol-meter"><div class="pm-head"><span>🏅 Prestígio comercial ${infoBtn('trade_prestige')}</span><strong>${ti.prestige}</strong></div></div>
        <div class="pol-meter"><div class="pm-head"><span>📦 Volume total negociado</span><strong>${fmt(ti.counters.tradeVolume)}</strong></div></div>
        <div class="pol-meter"><div class="pm-head"><span>🛃 Tarifa da lei / imposto comercial</span><strong>${ti.laws.tariff >= 0 ? '+' : ''}${ti.laws.tariff}% / ${ti.laws.comercial >= 0 ? '+' : ''}${ti.laws.comercial}%</strong></div></div>
      </div>`;

      if (tab === 'visao') {
        html += `<div class="ficha-section-title">Contadores</div>
          <div class="bc-stats">
            <span class="bc-stat">🐫 ${ti.counters.caravansDone} caravanas concluídas</span><span class="bc-stat cons">💀 ${ti.counters.caravansLost} perdidas</span>
            <span class="bc-stat">🧭 ${ti.counters.routesEstablished} rotas estabelecidas</span><span class="bc-stat">📜 ${ti.counters.contractsSigned} contratos assinados</span>
            <span class="bc-stat">🏪 ${ti.counters.companiesFounded} empresas fundadas</span><span class="bc-stat cons">📉 ${ti.counters.companiesFailed} faliram</span>
            <span class="bc-stat">🕶️ ${ti.counters.blackMarketUses} negociações no mercado negro</span><span class="bc-stat cons">🕵️ ${ti.counters.blackMarketCaught} flagradas</span>
          </div>
          <div class="ficha-section-title">Ações rápidas</div>
          <div class="tech-controls">
            <button class="btn btn-primary" id="newRouteBtn">🧭 Nova Rota Comercial</button>
            <button class="btn btn-primary" id="newCaravanBtn">🐫 Nova Caravana</button>
            <button class="btn btn-secondary" id="newCompanyBtn">🏪 Fundar Empresa</button>
            <button class="btn btn-secondary" id="newContractBtn">📜 Assinar Contrato</button>
          </div>`;
      }

      if (tab === 'reinos') {
        html += `<p class="hint">Cada reino vizinho produz em excesso (superávit — compra barato de você) e precisa de certos recursos (déficit — paga mais). A relação melhora com o comércio. ${infoBtn('ai_profile')}</p>
          <div class="characters-grid">${ti.kingdoms.map(k => `<div class="character-card" style="cursor:default; border-left:4px solid ${k.color};">
            <span class="ch-icon">${k.symbol}</span><span class="ch-name">${escapeHtml(k.name)}</span><span class="ch-role">${escapeHtml(k.personalityLabel)} · tarifa ${k.tariff}%</span>
            <div class="ch-stats"><span>🤝 Relação ${k.relation}</span></div>
            <div class="hint">📈 Superávit: ${k.surplus.map(s => s.icon + ' ' + escapeHtml(s.name)).join(', ') || '—'}</div>
            <div class="hint">📉 Déficit: ${k.deficit.map(s => s.icon + ' ' + escapeHtml(s.name)).join(', ') || '—'}</div>
          </div>`).join('')}</div>`;
      }

      if (tab === 'rotas') {
        html += `<button class="btn btn-primary" id="newRouteBtn" style="margin-bottom:10px;">🧭 Nova Rota Comercial ${infoBtn('routes')}</button>`;
        html += ti.routes.length ? ti.routes.map(r => `<div class="pol-law">
          <div class="pl-head"><span style="border-left:4px solid ${r.aiColor}; padding-left:6px;">${r.resourceIcon} <strong>${r.direction === 'export' ? 'Exportando' : 'Importando'} ${escapeHtml(r.resourceName)}</strong> com ${escapeHtml(r.aiName)}</span><span class="bc-level">${TI_STATUS[r.status]}</span></div>
          <div class="hint">${escapeHtml(r.transport)} · ${fmt(r.volume)} a cada ${r.cycleDays} dias${r.status === 'ativa' ? ` · próximo em ${r.nextRun}d` : ''}</div>
          <div class="bc-stats"><span class="bc-stat prod">Total negociado: ${fmt(r.totalVolume)}</span><span class="bc-stat prod">💰 ${fmt(r.totalGold)}</span></div>
          ${r.status === 'ativa' ? `<button class="btn btn-ghost" data-route-cancel="${r.id}" style="margin-top:6px;">⏹️ Encerrar rota</button>` : ''}
        </div>`).join('') : '<p class="hint">Nenhuma rota comercial ainda.</p>';
      }

      if (tab === 'caravanas') {
        html += `<button class="btn btn-primary" id="newCaravanBtn" style="margin-bottom:10px;">🐫 Nova Caravana ${infoBtn('caravans')}</button>`;
        html += ti.caravans.length ? ti.caravans.map(c => `<div class="exp-card ${c.status}">
          <div class="pl-head"><span>${c.transportIcon} <strong>${escapeHtml(c.name)}</strong></span><span class="bc-level">${TI_STATUS[c.status]}</span></div>
          <div class="hint">${escapeHtml(c.transport)} · ${c.quantity} ${c.resourceIcon} ${escapeHtml(c.resourceName)} · destino: ${escapeHtml(c.aiName)} · guardas: ${c.guards}</div>
          ${c.status === 'em_curso' ? `${polBar(c.progress)}<div class="hint">Dia ${c.elapsed}/${c.totalDays}</div>` : `<div class="hint">${escapeHtml(c.result || '')}</div>`}
          ${c.decision ? `<div class="exp-decision"><strong>⚠️ ${escapeHtml(c.decision.title)}</strong><p>${escapeHtml(c.decision.text)}</p>
            ${c.decision.options.map(o => `<button class="btn btn-secondary" data-car-decide="${c.id}" data-option="${o.key}">${o.label} (${o.chance}%)</button>`).join('')}</div>` : ''}
          <button class="btn btn-ghost" data-car-log="${c.id}" style="margin-top:6px;">📖 ${state.tiLogOpen === c.id ? 'Ocultar diário' : 'Ver diário'}</button>
          ${state.tiLogOpen === c.id ? `<div class="exp-log">${c.log.map(l => `<div class="exp-log-line"><span class="el-day">DIA ${l.day}</span>${l.icon} ${escapeHtml(l.text)}</div>`).join('')}</div>` : ''}
        </div>`).join('') : '<p class="hint">Nenhuma caravana ainda.</p>';
      }

      if (tab === 'mercadores') {
        html += `<div class="ficha-section-title">Contratar Mercador ${infoBtn('merchants')}</div>
          <div class="tech-controls"><select id="hireMerchSpecialty">${ti.specialties.map(s => `<option value="${s.key}">${s.icon} ${escapeHtml(s.name)}</option>`).join('')}</select>
          <button class="btn btn-primary" id="hireMerchBtn">🎒 Contratar (130💰)</button></div>
          <div class="characters-grid">${ti.merchants.map(m => `<div class="character-card" style="cursor:default;">
            <span class="ch-icon">${m.icon}</span><span class="ch-name">${escapeHtml(m.name)}</span>
            <span class="ch-role">${escapeHtml(m.specialtyName)} · ${m.age} anos${m.status === 'em_viagem' ? ' · 🧭 em viagem' : ''}</span>
            <div class="ch-stats"><span>🧠 Habilidade ${m.skill}</span><span>⭐ Exp. ${m.experience}</span></div>
            <div class="hint">${m.tripsDone} viagem(ns) concluída(s) · Reputação ${m.reputation}</div>
          </div>`).join('') || '<p class="hint">Nenhum mercador ainda.</p>'}</div>`;
      }

      if (tab === 'empresas') {
        html += `<button class="btn btn-primary" id="newCompanyBtn" style="margin-bottom:10px;">🏪 Fundar Empresa ${infoBtn('companies')}</button>`;
        html += ti.companies.length ? ti.companies.map(c => `<div class="pol-law">
          <div class="pl-head"><span>${c.icon} <strong>${escapeHtml(c.name)}</strong></span><span class="bc-level">${TI_STATUS[c.status]}</span></div>
          <div class="hint">${escapeHtml(c.typeName)} · capital ${fmt(c.capital)} · retorno diário ${Math.round(c.dailyReturn[0] * 100)}–${Math.round(c.dailyReturn[1] * 100)}% · risco de falência ${c.failChance}%/dia</div>
          <div class="bc-stats"><span class="bc-stat ${c.totalProfit >= 0 ? 'prod' : 'cons'}">Lucro total: ${fmt(c.totalProfit)}</span></div>
          ${c.status === 'ativa' ? `<button class="btn btn-ghost" data-company-liquidate="${c.id}" style="margin-top:6px;">💰 Liquidar (40% do capital)</button>` : ''}
        </div>`).join('') : '<p class="hint">Nenhuma empresa fundada ainda.</p>';
      }

      if (tab === 'contratos') {
        html += `<button class="btn btn-primary" id="newContractBtn" style="margin-bottom:10px;">📜 Assinar Contrato ${infoBtn('contracts')}</button>`;
        html += ti.contracts.length ? ti.contracts.map(c => `<div class="pol-law">
          <div class="pl-head"><span>${c.resourceIcon} <strong>${c.direction === 'export' ? 'Vender' : 'Comprar'} ${escapeHtml(c.resourceName)}</strong> com ${escapeHtml(c.aiName)}</span><span class="bc-level">${TI_STATUS[c.status]}</span></div>
          <div class="hint">${escapeHtml(c.durationName)} · ${c.qtyPerCycle} a cada 10 dias · preço travado ${c.price} · ${c.cyclesDone} ciclo(s) cumpridos</div>
          ${c.status === 'ativo' ? `<div class="hint">${c.daysLeft} dias restantes · multa de quebra: 💰 ${fmt(c.penalty)}</div>
            <button class="btn btn-ghost" data-contract-break="${c.id}" style="margin-top:6px;">💥 Quebrar contrato</button>` : ''}
        </div>`).join('') : '<p class="hint">Nenhum contrato assinado ainda.</p>';
      }

      if (tab === 'negro') {
        html += `<p class="hint">🕶️ O mercado negro evita tarifas mas tem chance de flagrante (multa e perda de reputação/aumento de corrupção). ${infoBtn('black_market')}</p>
          <div class="transfer-form">
            <select id="bmResource">${ti.tradeable.map(r => `<option value="${r.key}">${r.icon} ${escapeHtml(r.name)}</option>`).join('')}</select>
            <select id="bmAction"><option value="sell">Vender</option><option value="buy">Comprar</option></select>
            <input type="number" id="bmQty" min="1" value="50">
            <button class="btn btn-secondary" id="bmGo" type="button">Negociar</button>
          </div>`;
      }

      if (tab === 'precos') {
        html += `<p class="hint">Histórico de preços dos últimos ~90 dias (amostrado a cada 3 dias). ${infoBtn('prices')}</p>
          <div class="category-filter" id="priceResSel">${ti.tradeable.map((r, i) => `<button class="category-chip ${state.tiPriceRes === r.key || (!state.tiPriceRes && i === 0) ? 'active' : ''}" data-priceres="${r.key}">${r.icon} ${escapeHtml(r.name)}</button>`).join('')}</div>
          <div id="priceChartHost"></div>`;
      }

      if (tab === 'historia') {
        html += ti.history.length ? `<ul class="history-list">${ti.history.map(h => `<li><span class="h-icon">${h.icon}</span><div><span class="h-year">ANO ${h.year}</span><span class="h-title">${escapeHtml(h.title)}</span></div></li>`).join('')}</ul>` : '<p class="hint">Nenhum acontecimento comercial ainda.</p>';
      }
      el('tiBody').innerHTML = html;
      if (tab === 'precos') renderPriceChart();
    }

    function renderPriceChart() {
      const ti = state.tradeIntl;
      const resKey = state.tiPriceRes || ti.tradeable[0].key;
      const points = ti.priceHistory[resKey] || [];
      const host = el('priceChartHost');
      if (!host || points.length < 2) { if (host) host.innerHTML = '<p class="hint">Histórico insuficiente ainda — volte depois de alguns dias.</p>'; return; }
      const W = 560, H = 180, PAD = 30;
      const vals = points.map(p => p.price);
      const min = Math.min(...vals), max = Math.max(...vals);
      const range = Math.max(0.0001, max - min);
      const x = (i) => PAD + (i / (points.length - 1)) * (W - PAD * 2);
      const y = (v) => H - PAD - ((v - min) / range) * (H - PAD * 2);
      const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(p.price).toFixed(1)}`).join(' ');
      const last = points[points.length - 1].price;
      const first = points[0].price;
      const trendColor = last >= first ? 'var(--forest)' : 'var(--crimson)';
      host.innerHTML = `<svg viewBox="0 0 ${W} ${H}" style="width:100%; max-width:560px; height:auto; background:rgba(255,252,240,.5); border:1px solid var(--wood-light); border-radius:6px;">
        <path d="${pathD}" fill="none" stroke="${trendColor}" stroke-width="2"/>
        <circle cx="${x(points.length - 1)}" cy="${y(last)}" r="3.5" fill="${trendColor}"/>
        <text x="${PAD}" y="16" font-size="11" fill="var(--ink-soft)">Máx ${max.toFixed(2)}</text>
        <text x="${PAD}" y="${H - 12}" font-size="11" fill="var(--ink-soft)">Mín ${min.toFixed(2)}</text>
        <text x="${W - PAD}" y="16" font-size="12" fill="${trendColor}" text-anchor="end">Atual: ${last.toFixed(2)} ${last >= first ? '↑' : '↓'}</text>
      </svg>`;
    }

    async function tiAction(fn, prefix) {
      try { const r = await fn(); showToast(`${prefix} ${r.message || ''}`); await refreshAll(true); }
      catch (err) { showToast(`⚠️ ${err.message}`); }
    }
    el('tiTabs').addEventListener('click', (e) => { const b = e.target.closest('[data-titab]'); if (!b) return; state.tiTab = b.dataset.titab; renderTradeIntl(); });
    el('tiBody').addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.id === 'newRouteBtn') openTradeModal('route');
      else if (b.id === 'newCaravanBtn') openTradeModal('caravan');
      else if (b.id === 'newCompanyBtn') openTradeModal('company');
      else if (b.id === 'newContractBtn') openTradeModal('contract');
      else if (b.dataset.routeCancel) tiAction(() => Api.cancelTradeRoute(b.dataset.routeCancel), '🧭');
      else if (b.dataset.carDecide) tiAction(() => Api.decideCaravan(b.dataset.carDecide, b.dataset.option), '🐫');
      else if (b.dataset.carLog) { state.tiLogOpen = state.tiLogOpen === Number(b.dataset.carLog) ? null : Number(b.dataset.carLog); renderTradeIntl(); }
      else if (b.dataset.companyLiquidate) tiAction(() => Api.liquidateCompany(b.dataset.companyLiquidate), '🏪');
      else if (b.dataset.contractBreak) tiAction(() => Api.breakTradeContract(b.dataset.contractBreak), '📜');
      else if (b.id === 'hireMerchBtn') tiAction(() => Api.hireTradeMerchant(el('hireMerchSpecialty').value), '🎒');
      else if (b.id === 'bmGo') tiAction(() => Api.blackMarketTrade(el('bmResource').value, el('bmAction').value, Number(el('bmQty').value)), '🕶️');
      else if (b.dataset.priceres) { state.tiPriceRes = b.dataset.priceres; renderTradeIntl(); }
    });

    // ---- modal generico (rota / caravana / empresa / contrato) ----
    function openTradeModal(kind) {
      const ti = state.tradeIntl; if (!ti) return;
      const aiOptions = ti.kingdoms.map(k => `<option value="${k.id}">${k.symbol} ${escapeHtml(k.name)} (${escapeHtml(k.personalityLabel)}, relação ${k.relation})</option>`).join('');
      const resOptions = ti.tradeable.map(r => `<option value="${r.key}">${r.icon} ${escapeHtml(r.name)}</option>`).join('');
      let body = '';
      if (kind === 'route') {
        body = `<div class="ficha-name" style="margin-bottom:10px;">🧭 Nova Rota Comercial</div>
          <div class="field"><label>Reino parceiro</label><select id="mAi">${aiOptions}</select></div>
          <div class="field"><label>Direção</label><select id="mDir"><option value="export">Exportar (vender)</option><option value="import">Importar (comprar)</option></select></div>
          <div class="field"><label>Recurso</label><select id="mRes">${resOptions}</select></div>
          <div class="field"><label>Transporte</label><select id="mTransport">${ti.transports.map(t => `<option value="${t.key}" ${!t.available ? 'disabled' : ''}>${t.icon} ${t.name} (cap. ${t.capacity})${!t.available ? ` — requer ${t.tech}` : ''}</option>`).join('')}</select></div>
          <div class="field"><label>Volume por ciclo</label><input type="number" id="mVolume" value="100" min="20"></div>
          <div class="field"><label>Ciclo (dias)</label><input type="number" id="mCycle" value="10" min="5" max="30"></div>
          <div class="field"><label>Mercador (opcional)</label><select id="mMerchant"><option value="">Nenhum</option>${ti.merchants.filter(m => m.status === 'ativo').map(m => `<option value="${m.id}">${m.icon} ${escapeHtml(m.name)}</option>`).join('')}</select></div>
          <div id="mAlert" class="alert alert-error"></div><button class="btn btn-primary btn-block" id="mConfirm">Estabelecer Rota</button>`;
      } else if (kind === 'caravan') {
        body = `<div class="ficha-name" style="margin-bottom:10px;">🐫 Nova Caravana</div>
          <div class="field"><label>Nome (opcional)</label><input type="text" id="mName"></div>
          <div class="field"><label>Reino de destino</label><select id="mAi">${aiOptions}</select></div>
          <div class="field"><label>Recurso a transportar</label><select id="mRes">${resOptions}</select></div>
          <div class="field"><label>Quantidade</label><input type="number" id="mQty" value="200" min="10"></div>
          <div class="field"><label>Transporte</label><select id="mTransport">${ti.transports.map(t => `<option value="${t.key}" ${!t.available ? 'disabled' : ''}>${t.icon} ${t.name} (cap. ${t.capacity})${!t.available ? ` — requer ${t.tech}` : ''}</option>`).join('')}</select></div>
          <div class="field"><label>Guardas (custam 15💰 cada, reduzem risco)</label><input type="number" id="mGuards" value="1" min="0" max="10"></div>
          <div class="field"><label>Mercador (opcional)</label><select id="mMerchant"><option value="">Nenhum</option>${ti.merchants.filter(m => m.status === 'ativo').map(m => `<option value="${m.id}">${m.icon} ${escapeHtml(m.name)}</option>`).join('')}</select></div>
          <div id="mAlert" class="alert alert-error"></div><button class="btn btn-primary btn-block" id="mConfirm">🐫 Partir</button>`;
      } else if (kind === 'company') {
        body = `<div class="ficha-name" style="margin-bottom:10px;">🏪 Fundar Empresa</div>
          <div class="field"><label>Nome (opcional)</label><input type="text" id="mName"></div>
          <div class="field"><label>Tipo</label><select id="mType">${ti.companyTypes.map(c => `<option value="${c.key}">${c.icon} ${escapeHtml(c.name)} (💰${c.cost}, ${Math.round(c.dailyReturn[0] * 100)}–${Math.round(c.dailyReturn[1] * 100)}%/dia, risco ${c.failChance}%)</option>`).join('')}</select></div>
          <div id="mAlert" class="alert alert-error"></div><button class="btn btn-primary btn-block" id="mConfirm">Fundar</button>`;
      } else if (kind === 'contract') {
        body = `<div class="ficha-name" style="margin-bottom:10px;">📜 Assinar Contrato</div>
          <div class="field"><label>Reino parceiro</label><select id="mAi">${aiOptions}</select></div>
          <div class="field"><label>Direção</label><select id="mDir"><option value="export">Vender</option><option value="import">Comprar</option></select></div>
          <div class="field"><label>Recurso</label><select id="mRes">${resOptions}</select></div>
          <div class="field"><label>Quantidade por ciclo (10 dias)</label><input type="number" id="mQty" value="50" min="10"></div>
          <div class="field"><label>Duração</label><select id="mDuration">${ti.contractDurations.map(d => `<option value="${d.key}">${d.name} (${d.days}d${d.priceBonus ? `, +${Math.round(d.priceBonus * 100)}% no preço` : ''})</option>`).join('')}</select></div>
          <div id="mAlert" class="alert alert-error"></div><button class="btn btn-primary btn-block" id="mConfirm">Assinar</button>`;
      }
      el('expedModalBody').innerHTML = body;
      expedOverlay.classList.remove('hidden');
      el('mConfirm').addEventListener('click', async () => {
        const alertBox = el('mAlert');
        try {
          let r;
          if (kind === 'route') r = await Api.proposeTradeRoute({ aiKingdomId: Number(el('mAi').value), direction: el('mDir').value, resource: el('mRes').value, transport: el('mTransport').value, volume: Number(el('mVolume').value), cycleDays: Number(el('mCycle').value), merchantId: el('mMerchant').value || null });
          else if (kind === 'caravan') r = await Api.launchCaravan({ name: el('mName').value, aiKingdomId: Number(el('mAi').value), resource: el('mRes').value, quantity: Number(el('mQty').value), transport: el('mTransport').value, guards: Number(el('mGuards').value), merchantId: el('mMerchant').value || null });
          else if (kind === 'company') r = await Api.foundCompany(el('mType').value, el('mName').value);
          else if (kind === 'contract') r = await Api.signTradeContract({ aiKingdomId: Number(el('mAi').value), direction: el('mDir').value, resource: el('mRes').value, qtyPerCycle: Number(el('mQty').value), duration: el('mDuration').value });
          showToast(`🌍 ${r.message}`);
          expedOverlay.classList.add('hidden');
          state.tiTab = kind === 'route' ? 'rotas' : kind === 'caravan' ? 'caravanas' : kind === 'company' ? 'empresas' : 'contratos';
          await refreshAll(true);
        } catch (err) { alertBox.textContent = err.message; alertBox.classList.add('show'); }
      });
    }

    // ==============================================================
    // DIPLOMACIA (Etapa 13)
    // ==============================================================
    const DP_TABS = [
      ['visao', '🌍 Visão Geral'], ['relacoes', '🤝 Relações'], ['tratados', '📜 Tratados'], ['diplomatas', '🕊️ Diplomatas'],
      ['embaixadas', '🏛️ Embaixadas'], ['presentes', '🎁 Presentes'], ['negociar', '💬 Negociar'],
      ['sancoes', '🚫 Sanções'], ['casamentos', '💍 Casamentos'], ['ajuda', '🤲 Ajuda Internacional'], ['espionagem_dip', '🕵️ Espionagem'], ['fronteiras', '🗺️ Fronteiras'],
      ['organizacoes', '🏛️ Organizações'], ['refugiados', '🧳 Refugiados'],
      ['conselho', '⚖️ Conselho dos Reinos'], ['historia', '📖 História'],
    ];

    function relStanceChip(r) {
      const cls = r.atWar ? 'cons' : r.trust >= 65 ? 'prod' : r.trust < 35 ? 'cons' : '';
      return `<span class="bc-stat ${cls}">${r.stance.icon} ${escapeHtml(r.stance.name)}</span>`;
    }

    function renderDiplomacy() {
      const dp = state.diplomacy;
      if (!dp) return;
      el('dpTabs').innerHTML = DP_TABS.map(([k, label]) => `<button class="category-chip ${state.dpTab === k ? 'active' : ''}" data-dptab="${k}">${label}${k === 'relacoes' && dp.demands.length ? ` (${dp.demands.length})` : ''}</button>`).join('');
      const tab = state.dpTab;
      let html = `<div class="pol-grid">
        <div class="pol-meter"><div class="pm-head"><span>🌍 Influência diplomática ${infoBtn('influence')}</span><strong>${dp.influence}</strong></div>${polBar(dp.influence)}</div>
        <div class="pol-meter"><div class="pm-head"><span>🏅 Prestígio diplomático</span><strong>${dp.prestige}</strong></div></div>
        <div class="pol-meter"><div class="pm-head"><span>⚔️ Reinos em guerra</span><strong>${dp.atWarCount}</strong></div></div>
      </div>`;
      if (dp.titles.length) html += `<div class="bc-stats">${dp.titles.map(t => `<span class="bc-stat prod">${t.icon} ${escapeHtml(t.name)}</span>`).join('')}</div>`;

      if (tab === 'visao') {
        html += `<div class="ficha-section-title">Contadores</div>
          <div class="bc-stats">
            <span class="bc-stat">📜 ${dp.counters.treatiesSigned} tratados assinados</span><span class="bc-stat cons">💥 ${dp.counters.treatiesBroken} quebrados</span>
            <span class="bc-stat">⚔️ ${dp.counters.warsDeclared} guerras declaradas</span><span class="bc-stat prod">🕊️ ${dp.counters.warsEnded} encerradas em paz</span>
            <span class="bc-stat">🏛️ ${dp.counters.embassiesBuilt} embaixadas</span><span class="bc-stat">🎁 ${dp.counters.giftsSent} presentes enviados</span>
          </div>
          <div class="ficha-section-title">Reinos com quem você negocia</div>
          <div class="characters-grid">${dp.relations.slice(0, 6).map(r => `<div class="character-card" style="cursor:default; border-left:4px solid ${r.color};">
            <span class="ch-icon">${r.symbol}</span><span class="ch-name">${escapeHtml(r.name)}</span><span class="ch-role">${relStanceChip(r)}</span>
            <div class="ch-stats"><span>🤝 Confiança ${r.trust}</span>${r.hasAlliance ? '<span>⚔️ Aliado</span>' : ''}</div>
          </div>`).join('')}</div>`;
      }

      if (tab === 'relacoes') {
        html += (dp.demands.length ? `<div class="ficha-section-title">📨 Demandas Diplomáticas Pendentes ${infoBtn('demands')}</div>` + dp.demands.map(d => `
          <div class="pol-demand"><div class="pd-head"><span>${d.icon} <strong>${escapeHtml(d.title)}</strong></span></div>
          <p>${escapeHtml(d.text)}</p>
          <div class="pd-actions">${d.options.map(o => `<button class="btn btn-secondary" data-demand="${d.id}" data-action="${o.key}">${o.label}</button>`).join('')}</div>
          </div>`).join('') : '') +
          `<div class="ficha-section-title">Relações com Cada Reino ${infoBtn('relations')}</div>
          <div class="characters-grid">${dp.relations.map(r => `<div class="character-card" style="cursor:default; border-left:4px solid ${r.color};">
            <span class="ch-icon">${r.symbol}</span><span class="ch-name">${escapeHtml(r.name)}</span><span class="ch-role">${relStanceChip(r)}</span>
            <div class="ch-stats"><span>🤝 Confiança ${r.trust}</span><span>🎖️ Respeito ${r.respect}</span></div>
            <div class="ch-stats"><span>😨 Medo ${r.fear}</span>${r.embassyLevel ? `<span>🏛️ ${escapeHtml(r.embassyName)}</span>` : ''}</div>
            <div class="hint">${r.hasAlliance ? '⚔️ Aliados · ' : ''}${r.hasNonAggression ? '🤝 Não-agressão · ' : ''}Tarifa comercial: ${r.tariffDelta >= 0 ? '+' : ''}${r.tariffDelta}%</div>
            ${!r.atWar ? `<button class="btn btn-ghost" data-declare-war="${r.id}" style="margin-top:6px;">⚔️ Declarar Guerra</button>` : '<span class="bc-level" style="margin-top:6px;">⚔️ EM GUERRA</span>'}
          </div>`).join('')}</div>`;
      }

      if (tab === 'tratados') {
        html += `<div class="ficha-section-title">Propor Novo Tratado ${infoBtn('treaties')}</div>
          <div class="tech-controls">
            <select id="treatyAi">${dp.relations.map(r => `<option value="${r.id}">${r.symbol} ${escapeHtml(r.name)} (confiança ${r.trust}${r.atWar ? ', EM GUERRA' : ''})</option>`).join('')}</select>
            <select id="treatyType">${dp.treatyCatalog.map(t => `<option value="${t.key}">${t.icon} ${escapeHtml(t.name)} (💰${t.cost}${t.onlyAtWar ? ', só em guerra' : `, confiança ${t.minTrust}+`})</option>`).join('')}</select>
            <button class="btn btn-primary" id="signTreatyBtn">Assinar</button>
          </div>
          <div class="pol-laws">${dp.treaties.map(t => `<div class="pol-law"><div class="pl-head"><span style="border-left:4px solid ${t.aiColor}; padding-left:6px;">${t.icon} <strong>${escapeHtml(t.name)}</strong></span><span class="bc-level">${t.status === 'ativo' ? '🟢 Ativo' : t.status === 'expirado' ? '⚪ Expirado' : '💥 Quebrado'}</span></div>
            <div class="hint">Com ${escapeHtml(t.aiName)}${t.daysLeft !== null ? ` · ${t.daysLeft} dias restantes` : ' · sem prazo definido'}</div>
            <div class="hint">${escapeHtml(t.desc)}</div>
            ${t.status === 'ativo' ? `<button class="btn btn-ghost" data-break-treaty="${t.id}" style="margin-top:6px;">💥 Quebrar tratado</button>` : ''}
          </div>`).join('') || '<p class="hint">Nenhum tratado ainda.</p>'}`;
      }

      if (tab === 'diplomatas') {
        html += `<div class="ficha-section-title">Contratar Diplomata ${infoBtn('diplomats')}</div>
          <div class="tech-controls"><select id="hireDipSpecialty">${dp.specialties.map(s => `<option value="${s.key}">${s.icon} ${escapeHtml(s.name)}</option>`).join('')}</select>
          <button class="btn btn-primary" id="hireDipBtn">🕊️ Contratar (140💰)</button><span class="hint">${dp.diplomats.length}/${dp.maxDiplomats}</span></div>
          <div class="characters-grid">${dp.diplomats.map(m => `<div class="character-card" style="cursor:default;">
            <span class="ch-icon">${m.icon}</span><span class="ch-name">${escapeHtml(m.name)}</span>
            <span class="ch-role">${escapeHtml(m.specialtyName)} · ${m.age} anos${m.status === 'designado' ? ' · 🏛️ em embaixada' : ''}</span>
            <div class="ch-stats"><span>🧠 Habilidade ${m.skill}</span><span>⭐ Exp. ${m.experience}</span></div>
          </div>`).join('') || '<p class="hint">Nenhum diplomata ainda.</p>'}</div>`;
      }

      if (tab === 'embaixadas') {
        html += `<p class="hint">Cada embaixada gera confiança automaticamente todo dia. ${infoBtn('embassies')}</p>
          <div class="tech-controls">
            <select id="embAi">${dp.relations.map(r => `<option value="${r.id}">${r.symbol} ${escapeHtml(r.name)}${r.embassyLevel ? ` (nível ${r.embassyLevel})` : ''}</option>`).join('')}</select>
            <select id="embDiplomat"><option value="">Sem diplomata</option>${dp.diplomats.filter(d => d.status === 'ativo').map(d => `<option value="${d.id}">${d.icon} ${escapeHtml(d.name)}</option>`).join('')}</select>
            <button class="btn btn-primary" id="buildEmbassyBtn">🏛️ Construir/Melhorar</button>
          </div>
          <div class="bc-stats">${dp.embassyLevels.map(l => `<span class="bc-stat">${l.icon} Nv.${l.level} ${escapeHtml(l.name)}: 💰${l.cost}, +${l.trustPerDay}/dia</span>`).join('')}</div>
          <div class="characters-grid" style="margin-top:10px;">${dp.relations.filter(r => r.embassyLevel > 0).map(r => `<div class="character-card" style="cursor:default; border-left:4px solid ${r.color};">
            <span class="ch-icon">🏛️</span><span class="ch-name">${escapeHtml(r.name)}</span><span class="ch-role">${escapeHtml(r.embassyName)}</span></div>`).join('') || '<p class="hint">Nenhuma embaixada construída ainda.</p>'}</div>`;
      }

      if (tab === 'presentes') {
        html += `<p class="hint">Presentes aumentam a confiança imediatamente. ${infoBtn('gifts')}</p>
          <div class="tech-controls">
            <select id="giftAi">${dp.relations.map(r => `<option value="${r.id}">${r.symbol} ${escapeHtml(r.name)}</option>`).join('')}</select>
            <select id="giftKind">${dp.giftTypes.map(g => `<option value="${g.key}">${g.icon} ${escapeHtml(g.name)}</option>`).join('')}</select>
            <input type="number" id="giftAmount" value="200" min="10">
            <button class="btn btn-primary" id="sendGiftBtn">🎁 Enviar</button>
          </div>`;
      }

      if (tab === 'negociar') {
        html += `<p class="hint">Negociações são resolvidas na hora, com sorteio baseado na confiança e no respeito. ${infoBtn('negotiate')}</p>
          <div class="tech-controls">
            <select id="negAi">${dp.relations.map(r => `<option value="${r.id}">${r.symbol} ${escapeHtml(r.name)} (confiança ${r.trust})</option>`).join('')}</select>
            <select id="negKind">${dp.negotiationTypes.map(n => `<option value="${n.key}">${escapeHtml(n.label)}</option>`).join('')}</select>
            <button class="btn btn-primary" id="negotiateBtn2">💬 Negociar</button>
          </div>
          <div id="negResult">${state.negResult ? `<div class="pol-vote ${state.negResultGood ? 'ok' : 'fail'}">${escapeHtml(state.negResult)}</div><div class="bc-stats">${(state.negResultMods || []).map(m => `<span class="bc-stat ${m.value >= 0 ? 'prod' : 'cons'}">${escapeHtml(m.label)} ${m.value > 0 ? '+' : ''}${m.value}%</span>`).join('')}</div>` : ''}</div>`;
      }

      if (tab === 'sancoes') {
        html += `<p class="hint">Reputação internacional: <strong>${dp.reputation}</strong> ${infoBtn('reputation')}</p>
          <div class="ficha-section-title">Impor Sanção ${infoBtn('sanctions')}</div>
          <div class="tech-controls"><select id="sancAi">${dp.relations.map(r => `<option value="${r.id}">${r.symbol} ${escapeHtml(r.name)}</option>`).join('')}</select>
          <select id="sancType">${dp.sanctionCatalog.map(s => `<option value="${s.key}">${s.icon} ${escapeHtml(s.name)}</option>`).join('')}</select>
          <button class="btn btn-primary" id="imposeSancBtn">Impor (💰${dp.sanctionCost})</button></div>
          <div class="ficha-section-title">Sanções Ativas</div>
          <div class="pol-laws">${dp.sanctions.map(s => `<div class="pol-law"><div class="pl-head"><span>${s.icon} <strong>${escapeHtml(s.name)}</strong></span><span class="bc-level">${escapeHtml(s.aiName)}</span></div>
            ${s.imposedBy === 'jogador' ? `<button class="btn btn-ghost" data-liftsanc="${s.id}">Suspender</button>` : '<div class="hint">Imposta por eles contra você.</div>'}</div>`).join('') || '<p class="hint">Nenhuma sanção ativa.</p>'}</div>`;
      }

      if (tab === 'casamentos') {
        html += `<p class="hint">Requer confiança mínima de ${dp.marriageMinTrust}. ${infoBtn('marriage')}</p>
          <div class="tech-controls"><select id="marrAi">${dp.relations.map(r => `<option value="${r.id}">${r.symbol} ${escapeHtml(r.name)} (confiança ${r.trust})</option>`).join('')}</select>
          <button class="btn btn-primary" id="marriageBtn">💍 Propor Casamento (💰${dp.marriageCost})</button></div>
          <div class="ficha-section-title">Casamentos Realizados</div>
          <div class="bc-stats">${dp.marriages.map(m => `<span class="bc-stat prod">💍 ${escapeHtml(m.aiName)}</span>`).join('') || '<span class="hint">Nenhum ainda.</span>'}</div>`;
      }

      if (tab === 'ajuda') {
        html += `<p class="hint">${infoBtn('aid')}</p>
          <div class="ficha-section-title">Pedir Ajuda</div>
          <div class="tech-controls"><select id="aidReqAi">${dp.relations.map(r => `<option value="${r.id}">${r.symbol} ${escapeHtml(r.name)}</option>`).join('')}</select>
          <select id="aidReqType">${dp.aidTypes.map(a => `<option value="${a.key}">${a.icon} ${escapeHtml(a.name)}</option>`).join('')}</select>
          <button class="btn btn-primary" id="aidReqBtn">Pedir</button></div>
          <div class="ficha-section-title">Enviar Ajuda</div>
          <div class="tech-controls"><select id="aidSendAi">${dp.relations.map(r => `<option value="${r.id}">${r.symbol} ${escapeHtml(r.name)}</option>`).join('')}</select>
          <select id="aidSendType">${dp.aidTypes.map(a => `<option value="${a.key}">${a.icon} ${escapeHtml(a.name)}</option>`).join('')}</select>
          <button class="btn btn-secondary" id="aidSendBtn">Enviar</button></div>
          <div class="ficha-section-title">Histórico</div>
          <div class="bc-stats">${dp.aidLog.map(a => `<span class="bc-stat ${a.direction === 'recebida' ? 'prod' : ''}">${a.icon} ${a.direction === 'recebida' ? 'De' : 'Para'} ${escapeHtml(a.aiName)}: ${escapeHtml(a.typeName)}</span>`).join('') || '<span class="hint">Nenhuma ajuda trocada ainda.</span>'}</div>`;
      }

      if (tab === 'espionagem_dip') {
        html += `<p class="hint">${infoBtn('dipspy')}</p>
          <div class="tech-controls"><select id="dipSpyAi">${dp.relations.map(r => `<option value="${r.id}">${r.symbol} ${escapeHtml(r.name)}</option>`).join('')}</select></div>
          <div class="pol-laws">${dp.diplomaticSpyMissions.map(m => `<div class="pol-law"><div class="pl-head"><span>${m.icon} <strong>${escapeHtml(m.name)}</strong></span><span class="bc-level">💰${m.cost}</span></div>
            <div class="hint">${escapeHtml(m.desc)}</div><button class="btn btn-primary" data-dipspy="${m.key}">Executar</button></div>`).join('')}</div>`;
      }

      if (tab === 'fronteiras') {
        html += `<p class="hint">Disputas de fronteira podem surgir perto de territórios de reinos de IA sem Tratado de Fronteiras. ${infoBtn('borders')}</p>
          <div class="pol-laws">${dp.borderDisputes.map(bd => `<div class="pol-law"><div class="pl-head"><span>🗺️ <strong>Disputa com ${escapeHtml(bd.aiName)}</strong></span></div>
            <div class="hint">Perto de (${bd.row + 1},${bd.col + 1})</div>
            <div class="tech-controls"><button class="btn btn-primary" data-borderresolve="${bd.id}:negociar">Negociar</button><button class="btn btn-ghost" data-borderresolve="${bd.id}:ignorar">Ignorar</button></div></div>`).join('') || '<p class="hint">Nenhuma disputa de fronteira pendente.</p>'}</div>`;
      }

      if (tab === 'organizacoes') {
        html += `<p class="hint">Seu peso de voto atual: <strong>${dp.myOrgWeight}</strong> (influência + exército + população). ${infoBtn('organizations')}</p>
          <div class="characters-grid">${dp.organizations.map(o => `<div class="character-card" style="cursor:default;">
            <span class="ch-icon">${o.icon}</span><span class="ch-name">${escapeHtml(o.name)}</span><span class="ch-role">${escapeHtml(o.desc)}</span>
            <div class="hint">Influência mínima: ${o.minInfluence}</div>
            ${o.isMember ? `<button class="btn btn-ghost" data-leaveorg="${o.key}" style="margin-top:6px;">Sair</button>` : `<button class="btn btn-primary" data-joinorg="${o.key}" style="margin-top:6px;">Ingressar</button>`}</div>`).join('')}</div>
          <div class="ficha-section-title">Propor Resolução ${infoBtn('resolutions')}</div>
          <div class="tech-controls"><select id="resOrg">${dp.organizations.filter(o => o.isMember).map(o => `<option value="${o.key}">${o.icon} ${escapeHtml(o.name)}</option>`).join('') || '<option value="">Entre em uma organização primeiro</option>'}</select>
          <select id="resTemplate">${dp.resolutionTemplates.map(t => `<option value="${t.key}" data-needstarget="${t.needsTarget}">${t.icon} ${escapeHtml(t.name)}${t.cost ? ` (💰${t.cost})` : ''}</option>`).join('')}</select>
          <select id="resTarget">${dp.relations.map(r => `<option value="${r.id}">${r.symbol} ${escapeHtml(r.name)}</option>`).join('')}</select>
          <button class="btn btn-primary" id="proposeResBtn">Propor</button></div>
          <div class="ficha-section-title">Resoluções</div>
          <div class="pol-laws">${dp.resolutions.map(r => `<div class="pol-law"><div class="pl-head"><span>${r.templateIcon} <strong>${escapeHtml(r.templateName)}</strong></span><span class="bc-level">${r.status === 'votando' ? `⏳ ${r.daysLeft}d` : r.status === 'aprovada' ? '✅ Aprovada' : '❌ Rejeitada'}</span></div>
            <div class="hint">${escapeHtml(r.orgName)}${r.targetName ? ` · Alvo: ${escapeHtml(r.targetName)}` : ''}${r.status !== 'votando' ? ` · ${r.yesWeight} a favor, ${r.noWeight} contra` : ''}</div>
            ${r.status === 'votando' && !r.playerVote ? `<div class="tech-controls"><button class="btn btn-secondary" data-vote="${r.id}:sim">👍 A Favor</button><button class="btn btn-ghost" data-vote="${r.id}:nao">👎 Contra</button></div>` : r.playerVote ? `<div class="hint">Seu voto: ${r.playerVote === 'sim' ? '👍 A favor' : '👎 Contra'}</div>` : ''}</div>`).join('') || '<p class="hint">Nenhuma resolução proposta ainda.</p>'}</div>`;
      }

      if (tab === 'refugiados') {
        html += `<p class="hint">${infoBtn('refugees')}</p>
          <div class="pol-laws">${dp.refugeeWaves.map(w => `<div class="pol-law"><div class="pl-head"><span>🧳 <strong>${w.size} refugiados de ${escapeHtml(w.aiName)}</strong></span></div>
            <div class="tech-controls"><button class="btn btn-primary" data-refugee="${w.id}:aceitar">Acolher Todos</button><button class="btn btn-secondary" data-refugee="${w.id}:limitar">Acolher Metade</button><button class="btn btn-ghost" data-refugee="${w.id}:recusar">Recusar</button></div></div>`).join('') || '<p class="hint">Nenhuma leva de refugiados no momento.</p>'}</div>`;
      }

      if (tab === 'conselho') {
        html += `<div class="ficha-section-title">⚖️ Conselho dos Reinos ${infoBtn('council_intl')}</div>
          <p class="hint">Uma organização que reúne os reinos do mundo. Entrar exige 20+ de influência diplomática.</p>
          ${dp.council.inCouncil ? '<span class="bc-stat prod">✅ Seu reino é membro</span>' : `<button class="btn btn-primary" id="joinCouncilBtn">Solicitar Adesão</button>`}
          <div class="characters-grid" style="margin-top:10px;">${dp.council.members.map(m => `<div class="character-card" style="cursor:default; border-left:4px solid ${m.color};"><span class="ch-icon">${m.symbol}</span><span class="ch-name">${escapeHtml(m.name)}</span><span class="ch-role">Membro</span></div>`).join('')}</div>`;
      }

      if (tab === 'historia') {
        html += dp.history.length ? `<ul class="history-list">${dp.history.map(h => `<li><span class="h-icon">${h.icon}</span><div><span class="h-year">ANO ${h.year}</span><span class="h-title">${escapeHtml(h.title)}</span></div></li>`).join('')}</ul>` : '<p class="hint">Nenhum acontecimento diplomático ainda.</p>';
      }
      el('dpBody').innerHTML = html;
    }

    async function dpAction(fn, prefix) {
      try { const r = await fn(); showToast(`${prefix} ${r.message || ''}`); await refreshAll(true); }
      catch (err) { showToast(`⚠️ ${err.message}`); }
    }
    el('dpTabs').addEventListener('click', (e) => { const b = e.target.closest('[data-dptab]'); if (!b) return; state.dpTab = b.dataset.dptab; renderDiplomacy(); });
    el('dpBody').addEventListener('click', async (e) => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.demand) dpAction(() => Api.resolveDiploDemand(b.dataset.demand, b.dataset.action), '🕊️');
      else if (b.dataset.declareWar) { if (confirm('Tem certeza que deseja declarar guerra? Isso rompe tratados e bloqueia o comércio com este reino.')) dpAction(() => Api.declareWar(b.dataset.declareWar), '⚔️'); }
      else if (b.id === 'signTreatyBtn') dpAction(() => Api.signTreaty(Number(el('treatyAi').value), el('treatyType').value), '📜');
      else if (b.dataset.breakTreaty) dpAction(() => Api.breakTreaty(b.dataset.breakTreaty), '💥');
      else if (b.id === 'hireDipBtn') dpAction(() => Api.hireDiplomat(el('hireDipSpecialty').value), '🕊️');
      else if (b.id === 'buildEmbassyBtn') dpAction(() => Api.buildEmbassy(Number(el('embAi').value), el('embDiplomat').value || null), '🏛️');
      else if (b.id === 'sendGiftBtn') dpAction(() => Api.sendDiploGift(Number(el('giftAi').value), el('giftKind').value, Number(el('giftAmount').value)), '🎁');
      else if (b.id === 'joinCouncilBtn') dpAction(() => Api.joinCouncil(), '⚖️');
      else if (b.id === 'negotiateBtn2') {
        const aiId = Number(el('negAi').value), kind = el('negKind').value;
        try {
          const r = await Api.negotiateDiplo(aiId, kind);
          state.negResult = r.message; state.negResultGood = /BEM-SUCEDIDA/.test(r.message); state.negResultMods = r.mods;
          state.dpTab = 'negociar';
          await refreshAll(true);
        } catch (err) { showToast(`⚠️ ${err.message}`); }
      }
      else if (b.id === 'imposeSancBtn') dpAction(() => Api.imposeSanction(Number(el('sancAi').value), el('sancType').value), '🚫');
      else if (b.dataset.liftsanc) dpAction(() => Api.liftSanction(b.dataset.liftsanc), '🚫');
      else if (b.id === 'marriageBtn') dpAction(() => Api.requestMarriage(Number(el('marrAi').value)), '💍');
      else if (b.id === 'aidReqBtn') dpAction(() => Api.requestDiploAid(Number(el('aidReqAi').value), el('aidReqType').value, 0), '🤲');
      else if (b.id === 'aidSendBtn') dpAction(() => Api.sendDiploAid(Number(el('aidSendAi').value), el('aidSendType').value, 0), '🤲');
      else if (b.dataset.dipspy) {
        const aiId = el('dipSpyAi').value;
        if (!aiId) { showToast('⚠️ Escolha um reino.'); return; }
        dpAction(() => Api.diplomaticSpy(Number(aiId), b.dataset.dipspy), '🕵️');
      }
      else if (b.dataset.borderresolve) {
        const [id, action] = b.dataset.borderresolve.split(':');
        dpAction(() => Api.resolveBorderDispute(id, action), '🗺️');
      }
      else if (b.dataset.joinorg) dpAction(() => Api.joinOrganization(b.dataset.joinorg), '🏛️');
      else if (b.dataset.leaveorg) dpAction(() => Api.leaveOrganization(b.dataset.leaveorg), '🏛️');
      else if (b.id === 'proposeResBtn') {
        const orgKey = el('resOrg').value, templateKey = el('resTemplate').value;
        const needsTarget = el('resTemplate').selectedOptions[0].dataset.needstarget === 'true';
        const targetAiId = needsTarget ? Number(el('resTarget').value) : null;
        if (!orgKey) { showToast('⚠️ Entre em uma organização primeiro.'); return; }
        dpAction(() => Api.proposeResolution(orgKey, templateKey, targetAiId), '📜');
      }
      else if (b.dataset.vote) { const [id, choice] = b.dataset.vote.split(':'); dpAction(() => Api.voteResolution(id, choice), '🗳️'); }
      else if (b.dataset.refugee) { const [id, action] = b.dataset.refugee.split(':'); dpAction(() => Api.respondToRefugees(id, action), '🧳'); }
    });
    el('dpBody').addEventListener('change', (e) => {
      if (e.target.id === 'resTemplate') {
        const needsTarget = e.target.selectedOptions[0].dataset.needstarget === 'true';
        const targetSel = el('resTarget');
        if (targetSel) targetSel.style.display = needsTarget ? '' : 'none';
      }
    });

    // ==============================================================
    // GUERRA (Etapa 15)
    // ==============================================================
    const WR_TABS = [
      ['visao', '⚔️ Visão Geral'], ['exercitos', '🎖️ Exércitos'], ['generais', '🫡 Generais'],
      ['atacar', '🗡️ Atacar'], ['cercos', '🏰 Cercos'], ['prisioneiros', '⛓️ Prisioneiros'], ['espionagem', '🕵️ Espionagem'],
      ['alvos', '🏰 Reinos em Guerra'], ['historia', '📖 História'],
    ];
    const WR_TIER_CLASS = { vitoria_decisiva: 'ok', vitoria: 'ok', empate: '', derrota: 'fail', derrota_decisiva: 'fail' };
    const ARMY_STATUS = { em_casa: '🏠 Em casa', em_campanha: '⚔️ Em campanha', destruido: '💀 Destruído' };

    return { ARMY_STATUS, WR_TABS, WR_TIER_CLASS, expedOverlay, openQuickExpedition, renderDiplomacy, renderExploration, renderTech, renderTradeIntl };
  };
})();
