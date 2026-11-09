// js/painel-guerra-cultura.js — extraído de kingdom.js (Etapa 66) por backend/tools/extractPanel.js.
// O contexto (ctx) lista o que o trecho usa do fechamento do kingdom.js; o teste de contrato (tests/painel-contrato.test.js) falha se algo ficar sem dono.
(function () {
  const K = window.KOT || (window.KOT = {}); K.panels = K.panels || {};
  K.panels['guerra-cultura'] = function (ctx) {
    const { ARMY_STATUS, TECH_EFFECT_LABELS, TERRAIN_ICON, TERRAIN_LABEL, WR_TABS, WR_TIER_CLASS, armyCompHtml, battleVisualHtml, el, escapeHtml, expedOverlay, fmt, infoBtn, loadDynastyTree, polBar, refreshAll, renderFamiliesList, showToast, state } = ctx;
    function renderWar() {
      const wr = state.war;
      if (!wr) return;
      el('wrTabs').innerHTML = WR_TABS.map(([k, label]) => `<button class="category-chip ${state.wrTab === k ? 'active' : ''}" data-wrtab="${k}">${label}${k === 'alvos' && wr.warTargets.length ? ` (${wr.warTargets.length})` : ''}</button>`).join('');
      const tab = state.wrTab;
      let html = `<div class="pol-grid">
        <div class="pol-meter"><div class="pm-head"><span>⚔️ Batalhas travadas</span><strong>${wr.counters.battlesFought}</strong></div></div>
        <div class="pol-meter"><div class="pm-head"><span>🏆 Vitórias</span><strong>${wr.counters.battlesWon}/${wr.counters.battlesFought}</strong></div></div>
        <div class="pol-meter"><div class="pm-head"><span>🏰 Bônus de fortificação ${infoBtn('fortress')}</span><strong>+${wr.fortressBonusPct}%</strong></div></div>
      </div>`;

      if (tab === 'visao') {
        html += `<div class="ficha-section-title">Contadores</div>
          <div class="bc-stats">
            <span class="bc-stat">🗺️ ${wr.counters.territoriesConquered} território(s) conquistado(s)</span>
            <span class="bc-stat">🎖️ ${wr.counters.armiesCreated} exército(s) formado(s)</span>
            <span class="bc-stat cons">⚰️ ${wr.counters.generalsLost} general(is) perdido(s)</span>
          </div>
          <div class="ficha-section-title">Triângulo de Vantagens ${infoBtn('counter')}</div>
          <div class="bc-stats"><span class="bc-stat prod">🐴 Cavalaria > 🏹 Arqueiros</span><span class="bc-stat prod">🏹 Arqueiros > 💂 Infantaria</span><span class="bc-stat prod">💂 Infantaria > 🐴 Cavalaria</span></div>
          ${wr.warTargets.length ? `<div class="ficha-section-title">Em Guerra Com</div><div class="bc-stats">${wr.warTargets.map(t => `<span class="bc-stat cons" style="border-left:3px solid ${t.color};">${t.symbol} ${escapeHtml(t.name)}</span>`).join('')}</div>` : '<p class="hint">Seu reino não está em guerra com ninguém no momento (declare guerra na aba Diplomacia).</p>'}`;
      }

      if (tab === 'exercitos') {
        html += `<button class="btn btn-primary" id="newArmyBtn" style="margin-bottom:10px;">🎖️ Formar Novo Exército</button>`;
        html += wr.armies.map(a => `<div class="exp-card">
          <div class="pl-head"><span>${a.isHome ? '🏠' : '🎖️'} <strong>${escapeHtml(a.name)}</strong></span><span class="bc-level">${ARMY_STATUS[a.status] || a.status}</span></div>
          <div class="hint">${a.general ? `${a.general.icon} General: ${escapeHtml(a.general.name)}` : 'Sem general designado'} · ${a.totalUnits} unidades · ⚔️ ${a.attack} / 🛡️ ${a.defense}</div>
          <div class="pol-grid"><div class="pol-meter"><div class="pm-head"><span>😊 Moral</span><strong>${a.morale}%</strong></div>${polBar(a.morale)}</div><div class="pol-meter"><div class="pm-head"><span>🎒 Suprimentos</span><strong>${a.supplies}%</strong></div>${polBar(a.supplies)}</div></div>
          <div class="bc-stats">${armyCompHtml(a.composition)}</div>
          ${!a.isHome && a.status === 'em_casa' ? `<button class="btn btn-ghost" data-disband="${a.id}" style="margin-top:6px;">Dissolver</button>` : ''}
        </div>`).join('') || '<p class="hint">Nenhum exército de campanha formado ainda.</p>';
      }

      if (tab === 'generais') {
        html += `<div class="ficha-section-title">Nomear General ${infoBtn('generals')}</div>
          <div class="tech-controls"><select id="genSpecialty">${wr.specialties.map(s => `<option value="${s.key}">${s.icon} ${escapeHtml(s.name)}</option>`).join('')}</select>
          <button class="btn btn-primary" id="appointGenBtn">🫡 Nomear (200💰)</button><span class="hint">${wr.generals.length}/${wr.maxGenerals}</span></div>
          <div class="characters-grid">${wr.generals.map(g => `<div class="character-card" style="cursor:default;">
            <span class="ch-icon">${g.icon}</span><span class="ch-name">${escapeHtml(g.name)}</span>
            <span class="ch-role">${escapeHtml(g.specialtyName)} · ${g.age} anos${g.status === 'ferido' ? ' · 🩸 ferido' : g.status === 'em_campanha' ? ' · ⚔️ em campanha' : ''}</span>
            <div class="ch-stats"><span>👑 Liderança ${g.leadership}</span><span>🧠 Estratégia ${g.strategy}</span></div>
            <div class="ch-stats"><span>🎯 Tática ${g.tactics}</span><span>🏆 ${g.victories}V ${g.defeats}D</span></div>
          </div>`).join('') || '<p class="hint">Nenhum general nomeado ainda.</p>'}</div>`;
      }

      if (tab === 'atacar') {
        const lastBattle = wr.battles[0];
        html += `<p class="hint">Escolha um exército em casa (com unidades), uma postura de batalha e um território de um reino em guerra com você para atacar (terrestre ou marítimo, conforme as unidades do exército). Territórios muito fortificados geram um CERCO em vez de batalha única. Clique num território conhecido na aba Mapa para ver o ID. ${infoBtn('battle')}</p>
          <div class="tech-controls">
            <select id="atkArmy">${wr.armies.filter(a => !a.isHome && a.status === 'em_casa' && a.totalUnits > 0).map(a => `<option value="${a.id}">${escapeHtml(a.name)} (${a.totalUnits} unidades)</option>`).join('') || '<option value="">Nenhum exército disponível</option>'}</select>
            <select id="atkStance"><option value="">Sem postura especial</option>${wr.stances.map(s => `<option value="${s.key}">${s.icon} ${escapeHtml(s.name)}</option>`).join('')}</select>
            <input type="number" id="atkTerritory" placeholder="ID do território inimigo">
            <label class="hint" style="display:flex;align-items:center;gap:6px" title="Você decide formação, ordens por ala e táticas, rodada a rodada. Desmarcado: o jogo resolve pelo sorteio clássico."><input type="checkbox" id="atkCommand" ${(() => { try { return JSON.parse(localStorage.getItem('kot_atk_cmd') ?? 'true') ? 'checked' : ''; } catch { return 'checked'; } })()}> 🎮 Comandar a batalha</label>
            <button class="btn btn-primary" id="attackBtn">🗡️ Atacar!</button>
          </div>
          ${lastBattle ? `<div class="ficha-section-title">Último Relatório de Batalha ${infoBtn('battle_visual')}</div>
            <div class="pol-vote ${WR_TIER_CLASS[lastBattle.result] || ''}">${lastBattle.report.tierIcon} <strong>${escapeHtml(lastBattle.report.tierLabel)}</strong> ${lastBattle.mode === 'defesa' ? `defendendo contra ${escapeHtml(lastBattle.report.aiName)}` : `contra ${escapeHtml(lastBattle.report.aiName)}`}${lastBattle.report.isNaval ? ' ⚓ (batalha naval)' : ''} (dia ${lastBattle.day})</div>
            ${battleVisualHtml(lastBattle)}
            <div class="bc-stats">${lastBattle.mode !== 'defesa' ? `<span class="bc-stat">Força relativa: ${lastBattle.report.ratio}%</span><span class="bc-stat cons">${lastBattle.report.attackerLost}/${lastBattle.report.attackerBefore} baixas</span>${lastBattle.captured ? '<span class="bc-stat prod">🗺️ Território conquistado!</span>' : ''}${lastBattle.report.prisonersCaptured ? `<span class="bc-stat prod">⛓️ ${lastBattle.report.prisonersCaptured} prisioneiros</span>` : ''}` : `<span class="bc-stat cons">${lastBattle.report.defenderLost}/${lastBattle.report.defenderBefore} baixas na defesa</span>`}</div>
            ${lastBattle.report.attackerLosses ? `<div class="bc-stats">${lastBattle.report.attackerLosses.map(l => `<span class="bc-stat cons">${l.icon} −${l.lost} ${escapeHtml(l.unit)}</span>`).join('')}</div>` : ''}
            ${lastBattle.report.events && lastBattle.report.events.length ? `<div class="hint">${lastBattle.report.events.map(e => `${e.icon} ${escapeHtml(e.text)}`).join(' · ')}</div>` : ''}
            ${lastBattle.report.generalNote ? `<div class="hint">⚠️${escapeHtml(lastBattle.report.generalNote)}</div>` : ''}` : ''}`;
      }

      if (tab === 'cercos') {
        html += `<p class="hint">Territórios fortemente defendidos (alta tecnologia ou reinos militaristas) exigem um cerco: seu exército consome suprimentos todo dia até a defesa ceder. ${infoBtn('siege')}</p>`;
        html += wr.sieges.length ? wr.sieges.map(s => `<div class="exp-card">
          <div class="pl-head"><span>🏰 <strong>${escapeHtml(s.armyName)}</strong> cercando ${escapeHtml(s.aiName)}</span><span class="bc-level">Dia ${s.daysElapsed}/${s.maxDays}</span></div>
          <div class="hint">Território em (${s.territory.row + 1},${s.territory.col + 1}), ${TERRAIN_ICON[s.territory.terrain] || ''} ${escapeHtml(TERRAIN_LABEL[s.territory.terrain] || '')}</div>
          <div class="pol-grid"><div class="pol-meter"><div class="pm-head"><span>🎒 Suprimentos do exército</span><strong>${s.armySupplies}%</strong></div>${polBar(s.armySupplies)}</div>
          <div class="pol-meter"><div class="pm-head"><span>🛡️ Defesa restante</span><strong>${s.defenseRemaining}</strong></div></div></div>
          <div class="pd-actions"><button class="btn btn-primary" data-assault="${s.id}">⚔️ Ordenar Assalto Agora</button><button class="btn btn-ghost" data-abandon-siege="${s.id}">↩️ Abandonar Cerco</button></div>
        </div>`).join('') : '<p class="hint">Nenhum cerco em andamento.</p>';
      }

      if (tab === 'prisioneiros') {
        html += `<p class="hint">Prisioneiros de guerra podem ser resgatados por ouro, postos em trabalho forçado (pequeno bônus de produção) ou libertados (melhora a reputação). ${infoBtn('prisoners')}</p>
          <div class="pol-grid"><div class="pol-meter"><div class="pm-head"><span>⛓️ Prisioneiros</span><strong>${wr.prisoners.count}</strong></div></div>
          <div class="pol-meter"><div class="pm-head"><span>⚒️ Em trabalho forçado</span><strong>${wr.prisoners.in_labor}</strong></div></div></div>
          <div class="tech-controls"><input type="number" id="prisonerAmount" value="1" min="1" style="width:70px;">
            <button class="btn btn-secondary" data-prisoner-action="ransom">💰 Resgatar</button>
            <button class="btn btn-secondary" data-prisoner-action="labor">⚒️ Trabalho Forçado</button>
            <button class="btn btn-secondary" data-prisoner-action="release">🕊️ Libertar</button></div>`;
      }

      if (tab === 'espionagem') {
        html += `<p class="hint">Missões de espionagem militar contra reinos em guerra com você. ${infoBtn('milspy')}</p>
          <div class="tech-controls"><select id="spyAi">${wr.warTargets.map(t => `<option value="${t.id}">${t.symbol} ${escapeHtml(t.name)}</option>`).join('') || '<option value="">Nenhum reino em guerra</option>'}</select></div>
          <div class="pol-laws">${wr.spyMissions.map(m => `<div class="pol-law"><div class="pl-head"><span>${m.icon} <strong>${escapeHtml(m.name)}</strong></span><span class="bc-level">💰${m.cost}</span></div>
            <div class="hint">${escapeHtml(m.desc)}</div><button class="btn btn-primary" data-milspy="${m.key}">Executar</button></div>`).join('')}</div>`;
      }

      if (tab === 'alvos') {
        html += wr.warTargets.length ? `<div class="characters-grid">${wr.warTargets.map(t => `<div class="character-card" style="cursor:default; border-left:4px solid ${t.color};">
          <span class="ch-icon">${t.symbol}</span><span class="ch-name">${escapeHtml(t.name)}</span><span class="ch-role">${escapeHtml(t.personality)}</span>
          <div class="ch-stats"><span>🔬 Nível tecnológico ${t.techLevel}</span></div></div>`).join('')}</div>` : '<p class="hint">Nenhuma guerra em andamento.</p>';
      }

      if (tab === 'historia') {
        html += wr.history.length ? `<ul class="history-list">${wr.history.map(h => `<li><span class="h-icon">${h.icon}</span><div><span class="h-year">ANO ${h.year}</span><span class="h-title">${escapeHtml(h.title)}</span></div></li>`).join('')}</ul>` : '<p class="hint">Nenhum acontecimento militar ainda.</p>';
      }
      el('wrBody').innerHTML = html;
    }

    async function wrAction(fn, prefix) {
      try { const r = await fn(); showToast(`${prefix} ${r.message || ''}`); await refreshAll(true); if (r && r.battleId && window.KOT && window.KOT.world) window.KOT.world.openBattle(r.battleId); return r; } // batalha comandada: abre o tabuleiro na hora
      catch (err) { showToast(`⚠️ ${err.message}`); }
    }
    const wantsCommand = () => { const c = el('atkCommand'); if (c) return c.checked; try { return JSON.parse(localStorage.getItem('kot_atk_cmd') ?? 'true'); } catch { return true; } };
    el('wrTabs').addEventListener('click', (e) => { const b = e.target.closest('[data-wrtab]'); if (!b) return; state.wrTab = b.dataset.wrtab; renderWar(); });
    el('wrBody').addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.id === 'newArmyBtn') openWarArmyModal();
      else if (b.dataset.disband) { if (confirm('Dissolver este exército? As unidades voltam a ficar disponíveis.')) wrAction(() => Api.disbandArmy(b.dataset.disband), '🎖️'); }
      else if (b.id === 'appointGenBtn') wrAction(() => Api.appointGeneral(el('genSpecialty').value), '🫡');
      else if (b.id === 'attackBtn') {
        const armyId = el('atkArmy').value, territoryId = el('atkTerritory').value, stance = el('atkStance').value;
        if (!armyId || !territoryId) { showToast('⚠️ Escolha um exército e informe o ID do território.'); return; }
        try { localStorage.setItem('kot_atk_cmd', JSON.stringify(wantsCommand())); } catch { /* noop */ }
        wrAction(() => Api.attackTerritory(armyId, Number(territoryId), stance || null, wantsCommand()), '🗡️');
      }
      else if (b.dataset.assault) wrAction(() => Api.assaultSiege(b.dataset.assault, null, wantsCommand()), '🏰');
      else if (b.dataset.abandonSiege) { if (confirm('Abandonar o cerco? O exército recua para casa.')) wrAction(() => Api.abandonSiege(b.dataset.abandonSiege), '↩️'); }
      else if (b.dataset.prisonerAction) {
        const amt = Number(el('prisonerAmount').value) || 1;
        const fn = { ransom: Api.ransomPrisoners, labor: Api.laborPrisoners, release: Api.releasePrisoners }[b.dataset.prisonerAction];
        wrAction(() => fn(amt), '⛓️');
      }
      else if (b.dataset.milspy) {
        const aiId = el('spyAi').value;
        if (!aiId) { showToast('⚠️ Escolha um reino em guerra.'); return; }
        wrAction(() => Api.militarySpy(Number(aiId), b.dataset.milspy), '🕵️');
      }
    });

    function openWarArmyModal() {
      const wr = state.war; if (!wr) return;
      el('expedModalBody').innerHTML = `
        <div class="ficha-name" style="margin-bottom:10px;">🎖️ Formar Exército</div>
        <div class="field"><label>Nome</label><input type="text" id="waName" placeholder="Ex.: Exército do Norte"></div>
        <div class="field"><label>General (opcional)</label><select id="waGeneral"><option value="">Nenhum</option>${wr.generals.filter(g => g.status === 'ativo').map(g => `<option value="${g.id}">${g.icon} ${escapeHtml(g.name)} (${escapeHtml(g.specialtyName)})</option>`).join('')}</select></div>
        <div class="ficha-section-title">Unidades Disponíveis</div>
        ${wr.availableUnits.map(u => `<div class="field"><label>${u.icon} ${escapeHtml(u.name)} (disponível: ${u.qty})</label><input type="number" min="0" max="${u.qty}" value="0" data-waunit="${u.key}"></div>`).join('') || '<p class="hint">Nenhuma unidade disponível — recrute na aba Exército.</p>'}
        <div id="waAlert" class="alert alert-error"></div>
        <button class="btn btn-primary btn-block" id="waConfirm">Formar Exército</button>`;
      expedOverlay.classList.remove('hidden');
      el('waConfirm').addEventListener('click', async () => {
        const composition = {};
        el('expedModalBody').querySelectorAll('[data-waunit]').forEach(inp => { const v = Number(inp.value); if (v > 0) composition[inp.dataset.waunit] = v; });
        try {
          const r = await Api.createArmy(el('waName').value, el('waGeneral').value || null, composition);
          showToast(`🎖️ ${r.message}`);
          expedOverlay.classList.add('hidden');
          state.wrTab = 'exercitos';
          await refreshAll(true);
        } catch (err) { el('waAlert').textContent = err.message; el('waAlert').classList.add('show'); }
      });
    }

    // ==============================================================
    // RELIGIÃO E CULTURA (Etapa 16)
    // ==============================================================
    const CU_TABS = [
      ['visao', '🎭 Visão Geral'], ['religiao', '⛪ Religião'], ['sacerdotes', '🙏 Sacerdotes'], ['artistas', '🎨 Artistas'],
      ['museu', '🏛️ Museu'], ['reliquias', '✨ Relíquias'], ['festivais', '🎉 Festivais'], ['monumentos', '🗿 Monumentos'],
      ['idiomas', '🗣️ Idiomas'], ['missoes', '⛪ Missões e Peregrinações'], ['espionagem_cult', '🕵️ Espionagem Cultural'], ['historia', '📖 História'],
    ];
    function renderCulture() {
      const cu = state.culture;
      if (!cu) return;
      el('cuTabs').innerHTML = CU_TABS.map(([k, label]) => `<button class="category-chip ${state.cuTab === k ? 'active' : ''}" data-cutab="${k}">${label}</button>`).join('');
      const tab = state.cuTab;
      let html = `<div class="pol-grid">
        <div class="pol-meter"><div class="pm-head"><span>🏅 Prestígio cultural ${infoBtn('cult_prestige')}</span><strong>${cu.culturalPrestige}</strong></div></div>
        <div class="pol-meter"><div class="pm-head"><span>✨ Prestígio religioso</span><strong>${cu.religiousPrestige}</strong></div></div>
        <div class="pol-meter"><div class="pm-head"><span>🧳 Renda de turismo/dia</span><strong>💰 ${cu.tourismIncome}</strong></div></div>
      </div>`;

      if (tab === 'visao') {
        html += `<div class="ficha-section-title">Contadores</div>
          <div class="bc-stats">
            <span class="bc-stat">🎉 ${cu.counters.festivalsHeld} festival(is) · ${cu.counters.festivalsFailed} fracassado(s)</span>
            <span class="bc-stat">🗿 ${cu.counters.monumentsDedicated} monumento(s)</span><span class="bc-stat">✨ ${cu.counters.relicsEnshrined} relíquia(s) consagrada(s)</span>
          </div>
          ${cu.religion ? `<div class="ficha-section-title">${cu.religion.icon} ${escapeHtml(cu.religion.name)}</div><p class="hint">Venerando ${escapeHtml(cu.religion.deity)} — ${escapeHtml(cu.religion.stance)}.</p>` : '<p class="hint">Seu reino ainda não fundou uma religião (aba Religião).</p>'}
          <div class="ficha-section-title">Efeitos Ativos</div>
          <div class="bc-stats">${Object.entries(cu.modifiers).filter(([, v]) => Math.abs(v) > 0.01).map(([k, v]) => `<span class="bc-stat ${v >= 0 ? 'prod' : 'cons'}">${TECH_EFFECT_LABELS[k] || k} ${v > 0 ? '+' : ''}${Math.round(v * 100) / 100}</span>`).join('') || '<span class="hint">Nenhum ainda.</span>'}</div>`;
      }

      if (tab === 'religiao') {
        if (!cu.religion) {
          html += `<p class="hint">Escolha uma religião para o reino (não pode ser trocada depois). ${infoBtn('religion')}</p>
            <div class="characters-grid">${cu.religionCatalog.map(r => `<div class="character-card" style="cursor:default;">
              <span class="ch-icon">${r.icon}</span><span class="ch-name">${escapeHtml(r.name)}</span><span class="ch-role">Divindade: ${escapeHtml(r.deity)}</span>
              <div class="hint">Domínios: ${r.domains.join(', ')}</div><div class="hint">${escapeHtml(r.stance)}</div>
              <input type="text" placeholder="Nome da divindade (opcional)" data-deityname="${r.key}" style="width:100%;margin:6px 0;padding:6px;border-radius:4px;border:1px solid var(--wood-light);">
              <button class="btn btn-primary" data-found-religion="${r.key}">Fundar</button>
            </div>`).join('')}</div>`;
        } else {
          html += `<div class="ficha-head"><span class="ficha-icon">${cu.religion.icon}</span><div><div class="ficha-name">${escapeHtml(cu.religion.name)}</div><div class="ficha-role">Divindade: ${escapeHtml(cu.religion.deity)}</div></div></div>
            <div class="pol-meter"><div class="pm-head"><span>🙏 Fé da população</span><strong>${cu.faithPct}%</strong></div>${polBar(cu.faithPct)}</div>
            <div class="bc-stats">${cu.religion.domains.map(d => `<span class="bc-stat prod">${d.icon} ${escapeHtml(d.name)}</span>`).join('')}</div>
            <div class="ficha-section-title">Política de Tolerância ${infoBtn('tolerance')}</div>
            <div class="tech-controls">${cu.toleranceCatalog.map(t => `<button class="category-chip ${cu.tolerance === t.key ? 'active' : ''}" data-tolerance="${t.key}">${t.icon} ${escapeHtml(t.name)}</button>`).join('')}</div>`;
        }
      }

      if (tab === 'sacerdotes') {
        html += `<div class="tech-controls"><button class="btn btn-primary" id="hirePriestBtn">🙏 Formar Sacerdote (110💰)</button><span class="hint">${cu.priests.length}/${cu.maxPriests}</span></div>
          <div class="characters-grid">${cu.priests.map(p => `<div class="character-card" style="cursor:default;">
            <span class="ch-icon">${p.rankIcon}</span><span class="ch-name">${escapeHtml(p.name)}</span><span class="ch-role">${escapeHtml(p.rankName)} · ${p.age} anos</span>
            <div class="ch-stats"><span>🙏 Fé ${p.faith}</span><span>💬 Carisma ${p.charisma}</span></div></div>`).join('') || '<p class="hint">Nenhum sacerdote ainda.</p>'}</div>`;
      }

      if (tab === 'artistas') {
        html += `<div class="tech-controls"><select id="artistSpecialty">${cu.artistSpecialties.map(s => `<option value="${s.key}">${s.icon} ${escapeHtml(s.name)}</option>`).join('')}</select>
          <button class="btn btn-primary" id="hireArtistBtn">🎨 Patrocinar (120💰)</button><span class="hint">${cu.artists.length}/${cu.maxArtists}</span></div>
          <div class="characters-grid">${cu.artists.map(a => `<div class="character-card" style="cursor:default;">
            <span class="ch-icon">${a.icon}</span><span class="ch-name">${escapeHtml(a.name)}</span><span class="ch-role">${escapeHtml(a.specialtyName)} · ${a.age} anos</span>
            <div class="ch-stats"><span>🧠 Habilidade ${a.skill}</span><span>🖼️ ${a.worksCount} obra(s)</span></div>
            <button class="btn btn-secondary" data-commission="${a.id}" style="margin-top:6px;">Encomendar Obra (80💰)</button></div>`).join('') || '<p class="hint">Nenhum artista ainda.</p>'}</div>`;
      }

      if (tab === 'museu') {
        html += `<p class="hint">A galeria reúne obras de arte e relíquias consagradas — o acervo cultural do reino. ${infoBtn('museum')}</p>`;
        html += cu.museum.length ? `<div class="bestiary-grid">${cu.museum.map(m => `<div class="beast-card"><span class="bc-icon-big">${m.icon}</span><strong>${escapeHtml(m.name)}</strong><div class="hint">${m.kind === 'obra' ? 'Obra de arte' : 'Relíquia consagrada'} · ${escapeHtml(m.detail)}</div></div>`).join('')}</div>` : '<p class="hint">O museu ainda está vazio.</p>';
        if (cu.regionalCultures.length) html += `<div class="ficha-section-title">Culturas Regionais das Cidades ${infoBtn('regional_culture')}</div>
          <div class="characters-grid">${cu.regionalCultures.map(r => `<div class="character-card" style="cursor:default;"><span class="ch-icon">${r.icon}</span><span class="ch-name">${escapeHtml(r.settlementName)}</span><span class="ch-role">${escapeHtml(r.name)}</span><div class="hint">${escapeHtml(r.trait)}</div></div>`).join('')}</div>`;
      }

      if (tab === 'obras') {
        const Q = { comum: '⚪ Comum', notavel: '🔵 Notável', obra_prima: '⭐ Obra-Prima' };
        html += cu.artworks.length ? `<div class="pol-laws">${cu.artworks.map(w => `<div class="pol-law"><div class="pl-head"><span>🖼️ <strong>${escapeHtml(w.name)}</strong></span><span class="bc-level">${Q[w.quality]}</span></div><div class="hint">Valor cultural: ${w.value}</div></div>`).join('')}</div>` : '<p class="hint">Nenhuma obra encomendada ainda.</p>';
      }

      if (tab === 'idiomas') {
        html += `<p class="hint">Seu idioma se espalha por embaixadas (nível 2+) com o tempo, sem ação manual. Conhecer o idioma de um reino reduz tarifas comerciais com ele. ${infoBtn('languages')}</p>
          <div class="ficha-section-title">Seu Idioma</div><div class="bc-stats"><span class="bc-stat prod">${cu.myLanguage.icon} ${escapeHtml(cu.myLanguage.name)} (${escapeHtml(cu.myLanguage.origin)})</span></div>
          <div class="ficha-section-title">Idiomas Aprendidos</div>
          <div class="bc-stats">${cu.knownLanguages.map(l => `<span class="bc-stat prod">${l.icon} ${escapeHtml(l.name)}</span>`).join('') || '<span class="hint">Nenhum ainda.</span>'}</div>`;
      }

      if (tab === 'missoes') {
        html += `<div class="ficha-section-title">⛪ Enviar Missionário ${infoBtn('missionary')}</div>
          <div class="tech-controls"><select id="missPriest">${(cu.priestsAvailableForMission || []).map(p => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('') || '<option value="">Nenhum sacerdote disponível</option>'}</select>
          <select id="missAi">${(state.diplomacy ? state.diplomacy.relations : []).map(r => `<option value="${r.id}">${r.symbol} ${escapeHtml(r.name)}</option>`).join('')}</select>
          <button class="btn btn-primary" id="sendMissionaryBtn">Enviar</button></div>
          <div class="ficha-section-title">🚶 Peregrinação ${infoBtn('pilgrimage')}</div>
          ${cu.pilgrimageActive ? `<p class="hint">Peregrinos a caminho — retornam por volta do dia ${cu.pilgrimageActive.dayComplete}.</p>` : `<button class="btn btn-primary" id="pilgrimageBtn">🚶 Organizar Peregrinação (💰${100})</button>`}`;
      }

      if (tab === 'espionagem_cult') {
        html += `<p class="hint">Missões de espionagem cultural contra qualquer reino conhecido. ${infoBtn('cultspy')}</p>
          <div class="tech-controls"><select id="cultSpyAi">${(state.diplomacy ? state.diplomacy.relations : []).map(r => `<option value="${r.id}">${r.symbol} ${escapeHtml(r.name)}</option>`).join('')}</select></div>
          <div class="pol-laws">${cu.culturalSpyMissions.map(m => `<div class="pol-law"><div class="pl-head"><span>${m.icon} <strong>${escapeHtml(m.name)}</strong></span><span class="bc-level">💰${m.cost}</span></div>
            <div class="hint">${escapeHtml(m.desc)}</div><button class="btn btn-primary" data-cultspy="${m.key}">Executar</button></div>`).join('')}</div>`;
      }

      if (tab === 'reliquias') {
        html += `<p class="hint">Relíquias vêm da exploração (aba Exploração → Artefatos). Consagre-as num templo para prestígio religioso. ${infoBtn('relics')}</p>
          <div class="pol-laws">${cu.relicsAvailable.map(r => `<div class="pol-law"><div class="pl-head"><span>${r.icon} <strong>${escapeHtml(r.name)}</strong></span></div><button class="btn btn-primary" data-enshrine="${r.id}">✨ Consagrar</button></div>`).join('') || '<p class="hint">Nenhuma relíquia disponível para consagrar.</p>'}</div>`;
      }

      if (tab === 'festivais') {
        html += `<p class="hint">Cada festival tem um sorteio de resultado — pode ser um sucesso estrondoso ou até ser sabotado. ${infoBtn('festivals')}</p>
          <div class="pol-laws">${cu.festivalCatalog.map(f => `<div class="pol-law"><div class="pl-head"><span>${f.icon} <strong>${escapeHtml(f.name)}</strong></span><span class="bc-level">💰${f.cost}</span></div>
            <button class="btn btn-primary" data-festival="${f.key}">Realizar</button></div>`).join('')}</div>`;
      }

      if (tab === 'monumentos') {
        html += `<p class="hint">Requer um Monumento ou Estátua Heroica ativo. Escolha um feito do reino para comemorar. ${infoBtn('monuments')}</p>
          <div class="tech-controls">${cu.achievementOptions.map(o => `<button class="category-chip" data-monument="${o.key}">${o.icon} ${escapeHtml(o.label)}</button>`).join('')}</div>
          <div class="ficha-section-title">Monumentos Dedicados</div>
          <div class="bc-stats">${cu.monuments.map(m => `<span class="bc-stat">${escapeHtml(m.label)} (ano ${m.day})</span>`).join('') || '<span class="hint">Nenhum ainda.</span>'}</div>`;
      }

      if (tab === 'historia') {
        html += cu.history.length ? `<ul class="history-list">${cu.history.map(h => `<li><span class="h-icon">${h.icon}</span><div><span class="h-year">ANO ${h.year}</span><span class="h-title">${escapeHtml(h.title)}</span></div></li>`).join('')}</ul>` : '<p class="hint">Nenhum acontecimento cultural ainda.</p>';
      }
      el('cuBody').innerHTML = html;
    }

    async function cuAction(fn, prefix) {
      try { const r = await fn(); showToast(`${prefix} ${r.message || ''}`); await refreshAll(true); }
      catch (err) { showToast(`⚠️ ${err.message}`); }
    }
    el('cuTabs').addEventListener('click', (e) => { const b = e.target.closest('[data-cutab]'); if (!b) return; state.cuTab = b.dataset.cutab; renderCulture(); });
    el('cuBody').addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.foundReligion) { const inp = document.querySelector(`[data-deityname="${b.dataset.foundReligion}"]`); cuAction(() => Api.foundReligion(b.dataset.foundReligion, inp ? inp.value : ''), '⛪'); }
      else if (b.dataset.tolerance) cuAction(() => Api.setTolerance(b.dataset.tolerance), '🕊️');
      else if (b.id === 'hirePriestBtn') cuAction(() => Api.hirePriest(), '🙏');
      else if (b.id === 'hireArtistBtn') cuAction(() => Api.hireArtist(el('artistSpecialty').value), '🎨');
      else if (b.dataset.commission) cuAction(() => Api.commissionArtwork(b.dataset.commission), '🎨');
      else if (b.dataset.enshrine) cuAction(() => Api.enshrineRelic(b.dataset.enshrine), '✨');
      else if (b.dataset.festival) cuAction(() => Api.holdFestival(b.dataset.festival), '🎉');
      else if (b.dataset.monument) cuAction(() => Api.dedicateMonument(b.dataset.monument), '🗿');
      else if (b.id === 'sendMissionaryBtn') {
        const priestId = el('missPriest').value, aiId = el('missAi').value;
        if (!priestId || !aiId) { showToast('⚠️ Escolha um sacerdote e um reino.'); return; }
        cuAction(() => Api.sendMissionary(priestId, Number(aiId)), '⛪');
      }
      else if (b.id === 'pilgrimageBtn') cuAction(() => Api.sendPilgrimage(), '🚶');
      else if (b.dataset.cultspy) {
        const aiId = el('cultSpyAi').value;
        if (!aiId) { showToast('⚠️ Escolha um reino.'); return; }
        cuAction(() => Api.culturalSpy(Number(aiId), b.dataset.cultspy), '🕵️');
      }
    });

    // ==============================================================
    // SEGURANÇA E JUSTIÇA (Etapa 18)
    // ==============================================================
    const SC_TABS = [
      ['visao', '👮 Visão Geral'], ['pessoal', '🕵️ Pessoal'], ['casos', '🔍 Casos'], ['prisao', '🔒 Prisão'],
      ['organizacoes', '🏴 Organizações'], ['procurados', '🎯 Procurados'], ['mercadonegro', '📦 Mercado Negro'],
      ['cidades', '🗺️ Cidades'], ['governante', '👑 Governante'], ['operacoes', '🚓 Operações'], ['historia', '📖 História'],
    ];
    const CASE_STATUS_LABEL = { aberto: '🟡 Aberto', investigacao: '🔎 Em Investigação', julgamento: '⚖️ Julgamento', solucionado: '✅ Solucionado', inconclusivo: '❓ Inconclusivo', arquivado: '🗄️ Arquivado' };

    function renderSecurity() {
      const sc = state.security;
      if (!sc) return;
      el('scTabs').innerHTML = SC_TABS.map(([k, label]) => `<button class="category-chip ${state.scTab === k ? 'active' : ''}" data-sctab="${k}">${label}</button>`).join('');
      const tab = state.scTab;
      let html = `<div class="pol-grid">
        <div class="pol-meter"><div class="pm-head"><span>${sc.safety.icon} Segurança ${infoBtn('safety')}</span><strong>${sc.safety.safety}%</strong></div>${polBar(sc.safety.safety)}</div>
        <div class="pol-meter"><div class="pm-head"><span>🚨 Criminalidade</span><strong>${sc.crimeRate}%</strong></div>${polBar(sc.crimeRate, 'bad')}</div>
        <div class="pol-meter"><div class="pm-head"><span>👮 Cobertura policial</span><strong>${sc.guardCoverage}%</strong></div></div>
      </div><p class="hint">Status: <strong>${escapeHtml(sc.safety.name)}</strong></p>`;

      if (tab === 'visao') {
        html += `<div class="ficha-section-title">Fatores de Risco ${infoBtn('crimefactors')}</div>
          <div class="bc-stats">
            <span class="bc-stat cons">Pobreza: ${Math.round(sc.factors.poverty)}%</span><span class="bc-stat cons">Desemprego: ${Math.round(sc.factors.unemployment)}%</span>
            <span class="bc-stat cons">Corrupção: ${Math.round(sc.factors.corruption)}%</span><span class="bc-stat cons">Instabilidade: ${Math.round(sc.factors.instability)}%</span>
          </div>
          <div class="ficha-section-title">Contadores</div>
          <div class="bc-stats">
            <span class="bc-stat">🔍 ${sc.counters.casesOpened} casos abertos</span><span class="bc-stat prod">✅ ${sc.counters.casesSolved} solucionados</span><span class="bc-stat cons">❓ ${sc.counters.casesUnsolved} sem solução</span>
            <span class="bc-stat">🚓 ${sc.counters.operationsRun} operações</span><span class="bc-stat prod">💥 ${sc.counters.orgsDismantled} organizações desmontadas</span>
            <span class="bc-stat cons">🏃 ${sc.counters.escapes} fugas</span><span class="bc-stat cons">🔥 ${sc.counters.riots} motins</span><span class="bc-stat">🕵️ ${sc.counters.corruptionInvestigations} investigações anticorrupção</span>
            <span class="bc-stat">🎙️ ${sc.counters.interrogations} interrogatórios</span><span class="bc-stat">🛂 ${sc.counters.extraditions} extradições</span><span class="bc-stat prod">📦 ${sc.counters.stolenRecovered} itens recuperados</span>
            <span class="bc-stat prod">🎓 ${sc.counters.reformedCount} reabilitado(s)</span><span class="bc-stat cons">🔁 ${sc.counters.recidivistCount} reincidente(s)</span>
          </div>`;
      }

      if (tab === 'pessoal') {
        html += `<div class="tech-controls"><select id="scRole">${sc.personnelTypes.map(t => `<option value="${t.key}">${t.icon} ${escapeHtml(t.name)}</option>`).join('')}</select>
          <button class="btn btn-primary" id="hireScBtn">Contratar (130💰)</button><span class="hint">${sc.personnel.length}/${sc.maxPersonnel}</span></div>
          <div class="characters-grid">${sc.personnel.map(p => `<div class="character-card" style="cursor:default;">
            <span class="ch-icon">${p.icon}</span><span class="ch-name">${escapeHtml(p.name)}</span><span class="ch-role">${escapeHtml(p.roleName)} · ${p.age} anos${p.status === 'ocupado' ? ' · 🔎 em um caso' : ''}</span>
            <div class="ch-stats"><span>🧠 Habilidade ${p.skill}</span><span>⭐ Exp. ${p.experience}</span></div>
            <div class="hint">${p.casesClosed} caso(s) encerrado(s)</div></div>`).join('') || '<p class="hint">Nenhum funcionário de segurança ainda.</p>'}</div>`;
      }

      if (tab === 'casos') {
        html += `<p class="hint">Designe detetives para acelerar a investigação, ou interrogue suspeitos diretamente. ${infoBtn('cases')}</p>
          <div class="pol-laws">${sc.cases.map(c => `<div class="pol-law"><div class="pl-head"><span>${c.icon} <strong>${escapeHtml(c.crimeName)}</strong>${c.hasOrg ? ' 🏴' : ''}</span><span class="bc-level">${CASE_STATUS_LABEL[c.status] || c.status}</span></div>
            ${['aberto', 'investigacao'].includes(c.status) ? `${polBar(c.progress)}<div class="hint">Progresso: ${c.progress}% · Força do caso: ${c.strength}%${c.detective ? ` · Detetive: ${escapeHtml(c.detective)}` : ' · sem detetive designado'}</div>
              ${!c.detective ? `<select data-detsel="${c.id}">${sc.personnel.filter(p => p.role === 'detetive' && p.status === 'ativo').map(p => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('') || '<option value="">Nenhum detetive livre</option>'}</select><button class="btn btn-secondary" data-assign="${c.id}">Designar</button>` : ''}
              ${c.evidence.length || c.witnesses.length ? `<div class="bc-stats" style="margin-top:6px;">${c.evidence.map(e => `<span class="bc-stat">${e.icon} ${escapeHtml(e.name)} (${e.reliability}%)</span>`).join('')}${c.witnesses.map(w => `<span class="bc-stat">🗣️ ${escapeHtml(w.name)} (cred. ${w.credibility}%)</span>`).join('')}</div>` : ''}
              ${c.suspects.length ? `<div class="ficha-section-title" style="margin-top:6px;">Suspeitos</div><div class="bc-stats">${c.suspects.map(s => `<span class="bc-stat ${s.status !== 'suspeito' ? 'prod' : ''}">${escapeHtml(s.name)} ${s.status !== 'suspeito' ? `(${s.status})` : ''}${s.status === 'suspeito' ? ` <button class="btn btn-ghost" data-interrogate="${c.id}:${s.id}" style="padding:2px 8px;font-size:11px;">🎙️ Interrogar</button>` : ''}</span>`).join('')}</div>` : ''}`
              : `<div class="hint">Gravidade ${'⚠️'.repeat(c.severity)}</div>`}
          </div>`).join('') || '<p class="hint">Nenhum caso registrado ainda.</p>'}</div>`;
      }

      if (tab === 'prisao') {
        html += `<p class="hint">${infoBtn('prison')} ${infoBtn('rehab')}</p>
          <div class="pol-grid"><div class="pol-meter"><div class="pm-head"><span>🔒 Ocupação</span><strong>${sc.prison.occupied}/${sc.prison.capacity}</strong></div>${polBar(sc.prison.capacity ? (sc.prison.occupied / sc.prison.capacity) * 100 : 0, sc.prison.overcrowded ? 'bad' : '')}</div></div>
          ${sc.prison.overcrowded ? '<p class="hint pop-alert">⚠️ Prisão superlotada — risco de fugas e motins aumentado!</p>' : ''}
          <div class="pol-laws">${sc.convicts.map(c => `<div class="pol-law"><div class="pl-head"><span>⛓️ <strong>${escapeHtml(c.name)}</strong></span><span class="bc-level">${c.daysRemaining}d restantes</span></div><div class="hint">${escapeHtml(c.crimeName)} · ${escapeHtml(c.sentenceName)}</div>
            ${c.rehabProgram ? `<div class="hint">📚 Em reabilitação: ${escapeHtml(c.rehabProgramName)} (${c.rehabDays} dias)</div>` : `<div class="tech-controls"><select data-rehabsel="${c.id}">${sc.rehabPrograms.map(r => `<option value="${r.key}">${r.icon} ${escapeHtml(r.name)} (${r.cost}💰)</option>`).join('')}</select><button class="btn btn-secondary" data-rehab="${c.id}">Matricular</button></div>`}
          </div>`).join('') || '<p class="hint">Nenhum preso no momento.</p>'}</div>`;
      }

      if (tab === 'organizacoes') {
        html += `<p class="hint">${infoBtn('orgs')}</p>
          <div class="pol-laws">${sc.orgs.map(o => `<div class="pol-law"><div class="pl-head"><span>🏴 <strong>${escapeHtml(o.name)}</strong></span><span class="bc-level">${o.status === 'ativa' ? '🟡 Ativa' : '💥 Desmontada'}</span></div>
            ${o.status === 'ativa' ? `${polBar(o.strength, 'bad')}<div class="hint">Força: ${o.strength}%</div><button class="btn btn-primary" data-orgop="${o.id}">💣 Lançar Operação (400💰)</button>` : ''}</div>`).join('') || '<p class="hint">Nenhuma organização criminosa surgiu ainda.</p>'}</div>`;
      }

      if (tab === 'procurados') {
        const active = sc.wanted.filter(w => w.status === 'procurado');
        html += `<p class="hint">${infoBtn('extradition')}</p>`;
        html += active.length ? `<div class="pol-laws">${active.map(w => `<div class="pol-law"><div class="pl-head"><span>🎯 <strong>${escapeHtml(w.name)}</strong></span><span class="bc-level">💰${w.reward}</span></div>
          <div class="hint">${escapeHtml(w.crimeName)}${w.fledTo ? ` · 🛂 Fugiu para ${escapeHtml(w.fledTo)}` : ''}</div>
          ${w.fledTo ? `<button class="btn btn-primary" data-extradite="${w.id}">🛂 Pedir Extradição</button>` : `<button class="btn btn-primary" data-huntop="${w.id}">🎯 Caçar (150💰)</button>`}</div>`).join('')}</div>` : '<p class="hint">Nenhum procurado no momento.</p>';
      }

      if (tab === 'mercadonegro') {
        html += `<p class="hint">Itens roubados de crimes recentes. Recupere-os por um preço, ou dê como perdidos. ${infoBtn('stolengoods')}</p>
          <div class="pol-laws">${sc.stolenGoods.map(g => `<div class="pol-law"><div class="pl-head"><span>📦 <strong>${escapeHtml(g.name)}</strong></span><span class="bc-level">💰${g.price}</span></div>
            <div class="tech-controls"><button class="btn btn-primary" data-recoverstolen="${g.id}">Recuperar</button><button class="btn btn-ghost" data-ignorestolen="${g.id}">Dar como Perdido</button></div></div>`).join('') || '<p class="hint">Nenhum item roubado disponível no momento.</p>'}</div>`;
      }

      if (tab === 'cidades') {
        html += `<p class="hint">Cada cidade do reino tem sua própria taxa de criminalidade, calculada a partir do desemprego e policiamento LOCAIS. ${infoBtn('citiescrime')}</p>
          <div class="characters-grid">${sc.citiesCrime.map(c => `<div class="character-card" style="cursor:default;">
            <span class="ch-icon">${c.isCapital ? '👑' : '🏘️'}</span><span class="ch-name">${escapeHtml(c.name)}</span><span class="ch-role">${c.safety.icon} ${escapeHtml(c.safety.name)}</span>
            <div class="ch-stats"><span>🚨 Criminalidade: ${c.crimeRate}%</span></div>${c.territory ? `<div class="hint">Território (${c.territory.row + 1},${c.territory.col + 1})</div>` : ''}</div>`).join('')}</div>`;
      }

      if (tab === 'governante') {
        html += `<p class="hint">${infoBtn('rulersecurity')}</p>
          <div class="ficha-section-title">Nível de Proteção</div>
          <div class="category-filter">${sc.protectionLevels.map(p => `<button class="category-chip ${sc.protectionLevel === p.key ? 'active' : ''}" data-protection="${p.key}">${p.icon} ${escapeHtml(p.name)}</button>`).join('')}</div>
          <div class="bc-stats" style="margin-top:10px;"><span class="bc-stat prod">🛡️ ${sc.counters.assassinationAttempts} tentativa(s) de assassinato</span><span class="bc-stat prod">🛡️ ${sc.counters.kidnapAttempts} tentativa(s) de sequestro</span></div>`;
      }

      if (tab === 'operacoes') {
        html += `<p class="hint">${infoBtn('operations')}</p>
          <div class="pol-laws">${sc.operations.filter(o => !['operacao_org', 'cacar_procurado'].includes(o.key)).map(o => `<div class="pol-law"><div class="pl-head"><span>${o.icon} <strong>${escapeHtml(o.name)}</strong></span><span class="bc-level">💰${o.cost}</span></div>
            <div class="hint">${escapeHtml(o.desc)}</div><button class="btn btn-primary" data-op="${o.key}">Executar</button></div>`).join('')}</div>`;
      }

      if (tab === 'historia') {
        html += sc.history.length ? `<ul class="history-list">${sc.history.map(h => `<li><span class="h-icon">${h.icon}</span><div><span class="h-year">ANO ${h.year}</span><span class="h-title">${escapeHtml(h.title)}</span></div></li>`).join('')}</ul>` : '<p class="hint">Nenhum acontecimento registrado ainda.</p>';
      }
      el('scBody').innerHTML = html;
    }

    async function scAction(fn, prefix) {
      try { const r = await fn(); showToast(`${prefix} ${r.message || ''}`); await refreshAll(true); }
      catch (err) { showToast(`⚠️ ${err.message}`); }
    }
    el('scTabs').addEventListener('click', (e) => { const b = e.target.closest('[data-sctab]'); if (!b) return; state.scTab = b.dataset.sctab; renderSecurity(); });
    el('scBody').addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.id === 'hireScBtn') scAction(() => Api.hireSecurityPersonnel(el('scRole').value), '👮');
      else if (b.dataset.assign) { const sel = el('scBody').querySelector(`[data-detsel="${b.dataset.assign}"]`); const detId = sel ? sel.value : ''; if (!detId) { showToast('⚠️ Nenhum detetive disponível.'); return; } scAction(() => Api.assignDetective(b.dataset.assign, detId), '🕵️'); }
      else if (b.dataset.orgop) scAction(() => Api.launchSecurityOperation('operacao_org', b.dataset.orgop), '💣');
      else if (b.dataset.huntop) scAction(() => Api.launchSecurityOperation('cacar_procurado', b.dataset.huntop), '🎯');
      else if (b.dataset.op) scAction(() => Api.launchSecurityOperation(b.dataset.op, null), '🚓');
      else if (b.dataset.interrogate) { const [caseId, suspectId] = b.dataset.interrogate.split(':'); scAction(() => Api.interrogateSuspect(caseId, suspectId), '🎙️'); }
      else if (b.dataset.rehab) { const sel = el('scBody').querySelector(`[data-rehabsel="${b.dataset.rehab}"]`); scAction(() => Api.enrollRehab(b.dataset.rehab, sel.value), '📚'); }
      else if (b.dataset.protection) scAction(() => Api.setProtection(b.dataset.protection), '👑');
      else if (b.dataset.recoverstolen) scAction(() => Api.recoverStolenGood(b.dataset.recoverstolen), '📦');
      else if (b.dataset.ignorestolen) { if (confirm('Dar este item como perdido para sempre?')) scAction(() => Api.ignoreStolenGood(b.dataset.ignorestolen), '📦'); }
      else if (b.dataset.extradite) scAction(() => Api.requestExtradition(b.dataset.extradite), '🛂');
    });

    // ==============================================================
    // MAGIA E ARCANO (Etapa 21)
    // ==============================================================
    const MG_TABS = [
      ['visao', '🔮 Visão Geral'], ['magos', '🧙 Magos'], ['feiticos', '✨ Feitiços'], ['rituais', '🏺 Rituais e Artefatos'],
      ['criaturas', '🐉 Criaturas'], ['portal', '🌀 Portais'], ['guilda', '🏛️ Guilda'], ['historia', '📖 História'],
    ];
    function renderMagic() {
      const mg = state.magic;
      if (!mg) return;
      el('mgTabs').innerHTML = MG_TABS.map(([k, label]) => `<button class="category-chip ${state.mgTab === k ? 'active' : ''}" data-mgtab="${k}">${label}</button>`).join('');
      const tab = state.mgTab;
      let html = `<div class="pol-grid">
        <div class="pol-meter"><div class="pm-head"><span>🔷 Mana ${infoBtn('mana')}</span><strong>${fmt(mg.mana)}</strong></div></div>
        <div class="pol-meter"><div class="pm-head"><span>🌀 Desenvolvimento Arcano</span><strong>${mg.arcaneDevelopment}</strong></div></div>
        <div class="pol-meter"><div class="pm-head"><span>📚 Tecnologias Mágicas Concluídas</span><strong>${mg.magicTechDone}</strong></div></div>
      </div>`;

      if (tab === 'visao') {
        html += `<div class="ficha-section-title">Contadores</div>
          <div class="bc-stats">
            <span class="bc-stat prod">✨ ${mg.counters.spellsCast} feitiço(s) lançado(s)</span><span class="bc-stat prod">🏺 ${mg.counters.artifactsFound} artefato(s)</span>
            <span class="bc-stat prod">🐉 ${mg.counters.creaturesSummoned} criatura(s)</span><span class="bc-stat prod">🌀 ${mg.counters.portalsOpened} portal(is)</span>
            <span class="bc-stat cons">💨 ${mg.counters.ritualsFailed} ritual(is) sem sucesso</span>
          </div>
          ${mg.guildName ? `<div class="ficha-section-title">🏛️ ${escapeHtml(mg.guildName)}</div>` : '<p class="hint">Seu reino ainda não fundou uma guilda mágica (aba Guilda).</p>'}
          <div class="ficha-section-title">Efeitos Ativos (por escolas conhecidas pelos magos)</div>
          <div class="bc-stats">${Object.entries(mg.modifiers).filter(([, v]) => Math.abs(v) > 0.01).map(([k, v]) => `<span class="bc-stat prod">${k}: +${Math.round(v * 100) / 100}</span>`).join('') || '<span class="hint">Nenhum ainda — contrate magos de diferentes escolas.</span>'}</div>`;
      }

      if (tab === 'magos') {
        html += `<div class="tech-controls"><select id="mgSchool">${mg.schools.map(s => `<option value="${s.key}">${s.icon} ${escapeHtml(s.name)}</option>`).join('')}</select>
          <button class="btn btn-primary" id="hireMageBtn">🧙 Formar Mago (140💰)</button><span class="hint">${mg.mages.length}/${mg.maxMages}</span></div>
          <div class="characters-grid">${mg.mages.map(m => `<div class="character-card" style="cursor:default;">
            <span class="ch-icon">${m.rankIcon}</span><span class="ch-name">${escapeHtml(m.name)}</span><span class="ch-role">${escapeHtml(m.rankName)} · ${m.schoolIcon} ${escapeHtml(m.schoolName)}</span>
            <div class="ch-stats"><span>💪 Poder ${m.power}</span><span>🎯 Controle ${m.control}</span></div></div>`).join('') || '<p class="hint">Nenhum mago ainda.</p>'}</div>`;
      }

      if (tab === 'feiticos') {
        html += `<p class="hint">Cada feitiço só pode ser lançado por um mago da escola correspondente. ${infoBtn('spells')}</p>
          <div class="pol-laws">${mg.spells.map(s => `<div class="pol-law"><div class="pl-head"><span>${s.icon} <strong>${escapeHtml(s.name)}</strong></span><span class="bc-level">🔷${s.manaCost}</span></div>
            <div class="hint">${s.schoolIcon} ${escapeHtml(s.schoolName)} · ${escapeHtml(s.desc)}</div>
            <div class="tech-controls"><select data-spellmage="${s.key}">${mg.mages.filter(m => m.school === s.school).map(m => `<option value="${m.id}">${escapeHtml(m.name)}</option>`).join('') || '<option value="">Nenhum mago desta escola</option>'}</select>
            <button class="btn btn-primary" data-castspell="${s.key}">Lançar</button></div></div>`).join('')}</div>`;
      }

      if (tab === 'rituais') {
        html += `<p class="hint">Rituais de descoberta custam ouro e têm sorteio de sucesso, com raridades diferentes. ${infoBtn('artifacts')}</p>
          <div class="tech-controls"><select id="ritualMage">${mg.mages.map(m => `<option value="${m.id}">${m.schoolIcon} ${escapeHtml(m.name)}</option>`).join('') || '<option value="">Nenhum mago</option>'}</select>
          <button class="btn btn-primary" id="ritualBtn">🏺 Realizar Ritual (💰${mg.ritualCost})</button></div>
          <div class="ficha-section-title">Artefatos Descobertos</div>
          <div class="pol-laws">${mg.artifacts.map(a => `<div class="pol-law"><div class="pl-head"><span>🏺 <strong>${escapeHtml(a.name)}</strong></span><span class="bc-level">${escapeHtml(a.rarity)}</span></div><div class="hint">Poder: ${a.power}</div></div>`).join('') || '<p class="hint">Nenhum artefato ainda.</p>'}</div>`;
      }

      if (tab === 'criaturas') {
        html += `<p class="hint">Convocar criaturas poderosas tem mais risco de sair do controle. ${infoBtn('creatures')}</p>
          <div class="tech-controls"><select id="summonMage">${mg.mages.map(m => `<option value="${m.id}">${escapeHtml(m.name)}</option>`).join('') || '<option value="">Nenhum mago</option>'}</select></div>
          <div class="pol-laws">${mg.creatureCatalog.map(c => `<div class="pol-law"><div class="pl-head"><span>${c.icon} <strong>${escapeHtml(c.name)}</strong></span><span class="bc-level">💰${mg.summonCost}</span></div>
            <div class="hint">Poder: ${c.power} · Risco: ${Math.round(c.risk * 100)}%</div><button class="btn btn-primary" data-summon="${c.key}">Convocar</button></div>`).join('')}</div>
          <div class="ficha-section-title">Criaturas Domesticadas</div>
          <div class="bc-stats">${mg.creatures.map(c => `<span class="bc-stat prod">${c.icon} ${escapeHtml(c.name)} (poder ${c.power})</span>`).join('') || '<span class="hint">Nenhuma ainda.</span>'}</div>`;
      }

      if (tab === 'portal') {
        html += `<p class="hint">Portais dimensionais têm 6 resultados possíveis, do muito bom ao desastroso. ${infoBtn('portals')}</p>
          <div class="tech-controls"><select id="portalMage">${mg.mages.map(m => `<option value="${m.id}">${escapeHtml(m.name)}</option>`).join('') || '<option value="">Nenhum mago</option>'}</select>
          <button class="btn btn-primary" id="portalBtn">🌀 Abrir Portal (💰${mg.portalCost})</button></div>`;
      }

      if (tab === 'guilda') {
        html += mg.guildName
          ? `<div class="ficha-head"><span class="ficha-icon">🏛️</span><div><div class="ficha-name">${escapeHtml(mg.guildName)}</div><div class="ficha-role">Fundada no dia ${mg.guildFoundedDay}</div></div></div>`
          : `<p class="hint">Requer ao menos 2 magos ativos. ${infoBtn('guild')}</p>
            <input type="text" id="guildNameInput" placeholder="Nome da guilda (opcional)" style="width:100%;margin:8px 0;padding:8px;border-radius:4px;border:1px solid var(--wood-light);">
            <button class="btn btn-primary" id="foundGuildBtn">🏛️ Fundar Guilda</button>`;
      }

      if (tab === 'historia') {
        html += mg.history.length ? `<ul class="history-list">${mg.history.map(h => `<li><span class="h-icon">${h.icon}</span><div><span class="h-year">ANO ${h.year}</span><span class="h-title">${escapeHtml(h.title)}</span></div></li>`).join('')}</ul>` : '<p class="hint">Nenhum acontecimento mágico ainda.</p>';
      }
      el('mgBody').innerHTML = html;
    }

    async function mgAction(fn, prefix) {
      try { const r = await fn(); showToast(`${prefix} ${r.message || ''}`); await refreshAll(true); }
      catch (err) { showToast(`⚠️ ${err.message}`); }
    }
    el('mgTabs').addEventListener('click', (e) => { const b = e.target.closest('[data-mgtab]'); if (!b) return; state.mgTab = b.dataset.mgtab; renderMagic(); });
    el('mgBody').addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.id === 'hireMageBtn') mgAction(() => Api.hireMage(el('mgSchool').value), '🧙');
      else if (b.dataset.castspell) {
        const sel = el('mgBody').querySelector(`[data-spellmage="${b.dataset.castspell}"]`);
        if (!sel || !sel.value) { showToast('⚠️ Nenhum mago dessa escola disponível.'); return; }
        mgAction(() => Api.castSpell(sel.value, b.dataset.castspell), '✨');
      }
      else if (b.id === 'ritualBtn') { const mid = el('ritualMage').value; if (!mid) { showToast('⚠️ Nenhum mago disponível.'); return; } mgAction(() => Api.discoverArtifact(mid), '🏺'); }
      else if (b.dataset.summon) { const mid = el('summonMage').value; if (!mid) { showToast('⚠️ Nenhum mago disponível.'); return; } mgAction(() => Api.summonCreature(mid, b.dataset.summon), '🐉'); }
      else if (b.id === 'portalBtn') { const mid = el('portalMage').value; if (!mid) { showToast('⚠️ Nenhum mago disponível.'); return; } mgAction(() => Api.openPortal(mid), '🌀'); }
      else if (b.id === 'foundGuildBtn') mgAction(() => Api.foundMagicGuild(el('guildNameInput').value), '🏛️');
    });

    // ==============================================================
    // DINASTIA E FAMÍLIAS (Etapa 25)
    // ==============================================================
    const DY_TABS = [
      ['visao', '👑 Visão Geral'], ['arvore', '🌳 Árvore Genealógica'], ['sucessao', '📜 Sucessão e Herdeiros'], ['casamentos', '💍 Casamentos'],
      ['nobreza', '🏰 Nobreza e Títulos'], ['familias', '👪 Famílias'], ['escandalos', '😱 Escândalos e Pretendentes'], ['estrangeiros', '🌍 Dinastias Estrangeiras'], ['historia', '📖 História Familiar'],
    ];
    const dyStatBars = (stats) => !stats ? '' : Object.entries(stats).map(([k, v]) => `<div class="pol-meter" style="margin:2px 0;"><div class="pm-head"><span>${(state.dynasty.statLabels || {})[k] || k}</span><strong>${v}</strong></div><div class="pm-bar"><div class="pm-fill" style="width:${v}%"></div></div></div>`).join('');
    const dySexIcon = (m) => m.status === 'falecido' ? '🕯️' : m.sex === 'F' ? '👩' : '👨';
    function dyChip(m) {
      const cls = m.status === 'falecido' ? 'cons' : m.designated ? 'prod' : '';
      return `<button class="bc-stat ${cls} dy-chip" data-dymember="${m.id}" style="cursor:pointer;">${dySexIcon(m)} ${m.title ? escapeHtml(m.title) + ' ' : ''}${escapeHtml(m.name)} (${m.status === 'falecido' ? '✝' : m.age})${m.designated ? ' 👑' : ''}${m.pretender ? ' ⚠️' : ''}${m.legit === 0 ? ' 🍃' : ''}${m.adopted ? ' 🤝' : ''}</button>`;
    }
    function renderDynasty() {
      const dy = state.dynasty;
      if (!dy || !el('dyBody')) return;
      el('dyTabs').innerHTML = DY_TABS.map(([k, label]) => `<button class="category-chip ${state.dyTab === k ? 'active' : ''}" data-dytab="${k}">${label}${k === 'escandalos' && dy.decisions.some(d => d.status === 'pendente') ? ` (${dy.decisions.filter(d => d.status === 'pendente').length})` : ''}</button>`).join('');
      const tab = state.dyTab; let html = '';
      const dayMods = Object.entries(dy.modifiers).filter(([, v]) => Math.abs(v) >= 0.05).map(([k, v]) => `<span class="bc-stat ${v >= 0 ? 'prod' : 'cons'}">${k}: ${v > 0 ? '+' : ''}${v}</span>`).join('') || '<span class="hint">Sem efeitos relevantes.</span>';

      if (tab === 'visao') {
        const r = dy.ruler, c = dy.consort;
        html = `${dy.regency.active ? `<div class="pop-alert">🧒 REGÊNCIA: o governante é menor de idade. ${dy.regency.regent ? `Regente: <strong>${escapeHtml(dy.regency.regent.name)}</strong>` : 'Não há regente adequado!'} ${infoBtn('regency')}</div>` : ''}
          <div class="ficha-head"><span class="ficha-icon">${r.personality ? r.personality.icon : '👑'}</span><div><div class="ficha-name">${escapeHtml(r.name)}</div>
            <div class="ficha-role">Governante · ${r.age} anos · ${r.stage} · Casa ${escapeHtml(r.familyName || '')}${r.personality ? ` · ${r.personality.name}` : ''}</div></div></div>
          <div class="bc-stats"><span class="bc-stat">❤️ Saúde ${r.health}</span>${r.disease ? `<span class="bc-stat cons">🤒 ${escapeHtml(r.disease)}</span>` : ''}${c ? `<span class="bc-stat">💍 ${escapeHtml(c.name)} (${c.age})</span>` : '<span class="bc-stat">Sem consorte</span>'}
            <span class="bc-stat">⚖️ Lei: ${escapeHtml(dy.law.name)} ${infoBtn('succession_law')}</span><span class="bc-stat">🌳 ${dy.livingGenerations} geração(ões) viva(s)</span></div>
          <div class="ficha-section-title">Habilidades do Governante</div>${dyStatBars(r.stats)}
          <div class="ficha-section-title">Efeitos no Reino (governante + famílias leais)</div><div class="bc-stats">${dayMods}</div>
          <div class="ficha-section-title">Contadores</div><div class="bc-stats">
            <span class="bc-stat">👶 ${dy.counters.births} nascimentos</span><span class="bc-stat">🕯️ ${dy.counters.deaths} mortes</span><span class="bc-stat">💍 ${dy.counters.marriages} casamentos</span>
            <span class="bc-stat">🌍 ${dy.counters.foreignMarriages} entre reinos</span><span class="bc-stat">🏰 ${dy.counters.titlesGranted} títulos</span><span class="bc-stat">😱 ${dy.counters.scandals} escândalos</span>
            <span class="bc-stat">🥀 ${dy.counters.extinctions} extinções</span><span class="bc-stat">📈 ${dy.counters.ascensions} ascensões</span><span class="bc-stat">🔥 ${dy.counters.nobleRevolts} revoltas nobres</span></div>`;
      }

      if (tab === 'arvore') {
        const famId = state.dyFamily || (dy.royalFamily && dy.royalFamily.id);
        html = `<p class="hint">Clique em qualquer pessoa para abrir a ficha completa. 🕯️ = falecido · 👑 = herdeiro designado · 🍃 = ilegítimo · 🤝 = adotado · ⚠️ = pretendente ${infoBtn('genealogy')}</p>
          <div class="tech-controls"><select id="dyFamSelect">${dy.families.map(f => `<option value="${f.id}" ${f.id === famId ? 'selected' : ''}>${f.symbol} ${escapeHtml(f.kindName)} ${escapeHtml(f.name)}${f.status !== 'ativa' ? ' (extinta)' : ''}</option>`).join('')}</select></div>
          <div id="dyTree"><p class="hint">Desenhando a árvore…</p></div>`;
      }

      if (tab === 'sucessao') {
        html = `<div class="ficha-section-title">⚖️ ${escapeHtml(dy.law.name)} ${infoBtn('succession_law')}</div><p class="hint">${escapeHtml(dy.law.desc)}</p>
          ${dy.succession.length ? `<div class="pol-laws">${dy.succession.map(s => `<div class="pol-law"><div class="pl-head"><span><strong>${s.position}º</strong> ${dyChip(s)}</span><span class="bc-level">Reivindicação ${s.claim.total} ${infoBtn('claims')}</span></div>
            <div class="hint">${s.claim.parts.map(p => `${escapeHtml(p.label)} ${p.value > 0 ? '+' : ''}${p.value}`).join(' · ')}</div>
            <div class="tech-controls">${s.designated ? '<span class="bc-stat prod">👑 Herdeiro designado</span>' : `<button class="btn btn-secondary" data-dydesignate="${s.id}">Designar herdeiro</button>`}</div></div>`).join('')}</div>`
            : `<p class="hint">${dy.law.key === 'eleicao' ? 'Neste governo o líder é eleito: a família não tem direito automático ao poder.' : '⚠️ A linha de sucessão está VAZIA. Adote uma criança ou espere novos nascimentos.'}</p>`}
          <div class="ficha-section-title">Educação dos Jovens ${infoBtn('education')}</div>
          <div class="tech-controls"><select id="dyEduMember">${dy.educationCandidates.map(m => `<option value="${m.id}">${escapeHtml(m.name)} (${m.age}a, Casa ${escapeHtml(m.familyName || '')})${m.education ? ' · ' + m.education.name : ''}</option>`).join('') || '<option value="">Ninguém em idade de estudar</option>'}</select>
          <select id="dyEduArea">${dy.educationAreas.map(a => `<option value="${a.key}">${a.icon} ${escapeHtml(a.name)}</option>`).join('')}</select>
          <button class="btn btn-primary" id="dyEduBtn">Educar (💰${dy.educationCost})</button></div>
          <div class="ficha-section-title">Pretendentes ao Trono</div>
          <div class="bc-stats">${dy.pretenders.map(m => dyChip(m)).join('') || '<span class="hint">Nenhum pretendente no momento.</span>'}</div>`;
      }

      if (tab === 'casamentos') {
        const males = dy.marriageCandidates, partners = dy.marriageCandidates;
        html = `<p class="hint">Casamentos fortalecem alianças entre famílias, geram herdeiros e, quando são entre reinos, ligam a diplomacia (Fase 23). ${infoBtn('marriage_dyn')}</p>
          <div class="tech-controls"><select id="dyMarrMember">${males.map(m => `<option value="${m.id}" data-sex="${m.sex}" data-fam="${m.familyId}">${dySexIcon(m)} ${escapeHtml(m.name)} (${m.age}a)</option>`).join('') || '<option value="">Ninguém disponível</option>'}</select>
          <select id="dyMarrType"><option value="noble">Com outra família do reino (💰100)</option><option value="foreign">Com a corte de outro reino (💰400)</option></select></div>
          <div class="tech-controls" id="dyMarrNobleRow"><select id="dyMarrPartner">${partners.map(m => `<option value="${m.id}" data-sex="${m.sex}" data-fam="${m.familyId}">${dySexIcon(m)} ${escapeHtml(m.name)} (${m.age}a, Casa ${escapeHtml(m.familyName || '')})</option>`).join('')}</select></div>
          <div class="tech-controls" id="dyMarrAiRow" style="display:none;"><select id="dyMarrAi">${dy.ai.map(a => `<option value="${a.id}">${a.symbol} ${escapeHtml(a.name)} (confiança ${a.trust})</option>`).join('')}</select></div>
          <button class="btn btn-primary" id="dyMarryBtn">💍 Arranjar Casamento</button>
          <div class="ficha-section-title">Adoção ${infoBtn('adoption')}</div><p class="hint">Uma criança adotada entra na linha de sucessão (com pequeno desconto de legitimidade).</p>
          <button class="btn btn-secondary" id="dyAdoptBtn">🧒 Adotar uma criança (💰200)</button>`;
      }

      if (tab === 'nobreza') {
        html = `<p class="hint">Títulos aumentam lealdade e prestígio; casas leais pagam tributo. Lealdade baixa em casas poderosas pode causar revoltas nobres. ${infoBtn('nobility')}</p>
          <div class="ficha-section-title">Conceder Título ${infoBtn('titles')}</div>
          <div class="tech-controls"><select id="dyTitleMember">${dy.titleCandidates.map(m => `<option value="${m.id}">${escapeHtml(m.name)} (${m.age}a, Casa ${escapeHtml(m.familyName || '')})${m.title ? ' · ' + m.title : ''}</option>`).join('')}</select>
          <select id="dyTitleKey">${dy.titleCatalog.map(t => `<option value="${t.key}">${t.icon} ${escapeHtml(t.name)}/${escapeHtml(t.nameF)} (💰${t.cost}, tributo ${t.tribute})</option>`).join('')}</select>
          <button class="btn btn-primary" id="dyTitleBtn">Conceder</button></div>
          <div class="ficha-section-title">Fundar Família ${infoBtn('family_kinds')}</div>
          <div class="tech-controls"><select id="dyFoundKind">${dy.familyKinds.map(k => `<option value="${k.key}">${k.icon} ${escapeHtml(k.name)}</option>`).join('')}</select><button class="btn btn-secondary" id="dyFoundBtn">Fundar (💰${dy.foundFamilyCost})</button></div>
          <div class="ficha-section-title">Casas Nobres</div>
          <div class="pol-laws">${dy.families.filter(f => f.status === 'ativa' && (f.titleLevel > 0 || f.isRoyal)).map(f => `<div class="pol-law"><div class="pl-head"><span>${f.symbol} <strong>${f.isRoyal ? 'Casa Real' : 'Casa'} ${escapeHtml(f.name)}</strong></span><span class="bc-level">${f.titleName || (f.isRoyal ? 'Trono' : '')}</span></div>
            <div class="bc-stats"><span class="bc-stat">⭐ Prestígio ${f.prestige}</span><span class="bc-stat">💰 ${f.wealth}</span><span class="bc-stat ${f.loyalty < 40 ? 'cons' : 'prod'}">🤝 Lealdade ${f.loyalty}</span><span class="bc-stat">👥 ${f.aliveCount} vivos</span></div></div>`).join('') || '<p class="hint">Nenhuma casa titulada ainda.</p>'}</div>`;
      }

      if (tab === 'familias') {
        html = `<div class="tech-controls"><input type="text" id="dyFamSearch" class="search-input" placeholder="🔎 Pesquisar família..." value="${escapeHtml(state.dySearch || '')}" style="flex:1;min-width:160px;">
          <select id="dyFamKind"><option value="">Todos os tipos</option>${Object.entries(Object.fromEntries(dy.families.map(f => [f.kind, f.kindName]))).map(([k, n]) => `<option value="${k}" ${state.dyKind === k ? 'selected' : ''}>${escapeHtml(n)}</option>`).join('')}</select>
          <select id="dyFamSort"><option value="prestige">Prestígio</option><option value="wealth">Riqueza</option><option value="name">Nome</option><option value="alive">Membros vivos</option></select></div><div id="dyFamList"></div>`;
      }

      if (tab === 'escandalos') {
        html = `<p class="hint">Decisões pendentes têm prazo: ignorar um pretendente aumenta o apoio dele. ${infoBtn('scandals')}</p>
          <div class="pol-laws">${dy.decisions.map(d => `<div class="pol-law"><div class="pl-head"><span>${d.kind === 'bastardo' ? '😱 Filho(a) ilegítimo(a)' : '👑 Pretendente ao trono'} ${d.member ? dyChip(d.member) : ''}</span><span class="bc-level">${d.status === 'pendente' ? `⏳ ${d.daysLeft}d` : d.status === 'resolvida' ? '✅' : '⌛ Expirada'}</span></div>
            ${d.status === 'pendente' ? (d.kind === 'bastardo'
              ? `<div class="tech-controls"><button class="btn btn-secondary" data-dydec="${d.id}:reconhecer">Reconhecer</button><button class="btn btn-primary" data-dydec="${d.id}:legitimar">Legitimar (💰100)</button><button class="btn btn-ghost" data-dydec="${d.id}:ignorar">Ignorar</button></div>`
              : `<div class="tech-controls"><button class="btn btn-primary" data-dydec="${d.id}:negociar">Negociar (💰150)</button><button class="btn btn-secondary" data-dydec="${d.id}:exilar">Exilar</button><button class="btn btn-ghost" data-dydec="${d.id}:prender">Prender</button></div>`)
              : `<div class="hint">${escapeHtml(d.outcome || '')}</div>`}</div>`).join('') || '<p class="hint">Nenhum escândalo ou pretendente por enquanto.</p>'}</div>`;
      }

      if (tab === 'estrangeiros') {
        html = `<p class="hint">Você só conhece os governantes dos reinos onde mantém uma embaixada. ${infoBtn('foreign_dyn')}</p>
          <div class="pol-laws">${dy.foreignRulers.map(f => `<div class="pol-law"><div class="pl-head"><span>${f.symbol} <strong>${escapeHtml(f.aiName)}</strong></span><span class="bc-level">${f.marriageTie ? '💍 Laço familiar' : ''}</span></div>
            ${f.known ? `<div class="hint">👑 ${escapeHtml(f.ruler)} · Casa ${escapeHtml(f.dynasty)} · ${f.age} anos · ${escapeHtml(f.personality || '')} · ${f.generation}ª geração</div>` : '<div class="hint">Governante desconhecido — construa uma embaixada para saber mais.</div>'}</div>`).join('')}</div>`;
      }

      if (tab === 'historia') {
        html = dy.history.length ? `<ul class="history-list">${dy.history.map(h => `<li><span class="h-icon">${h.icon}</span><div><span class="h-year">ANO ${h.year}</span><span class="h-title">${escapeHtml(h.title)}</span></div></li>`).join('')}</ul>` : '<p class="hint">A história da dinastia ainda está sendo escrita.</p>';
      }
      el('dyBody').innerHTML = html;
      if (tab === 'arvore') loadDynastyTree();
      if (tab === 'familias') renderFamiliesList();
      if (tab === 'casamentos') dyFilterPartners();
    }
    function dyFilterPartners() {
      const ms = el('dyMarrMember'), ps = el('dyMarrPartner'); if (!ms || !ps || !ms.selectedOptions[0]) return;
      const sex = ms.selectedOptions[0].dataset.sex, fam = ms.selectedOptions[0].dataset.fam, me = ms.value;
      let first = null;
      [...ps.options].forEach(o => { const ok = o.dataset.sex !== sex && o.dataset.fam !== fam && o.value !== me; o.hidden = !ok; o.disabled = !ok; if (ok && !first) first = o; });
      if (first) ps.value = first.value; else { ps.value = ''; }
    }

    return { dyChip, dyFilterPartners, dySexIcon, dyStatBars, renderCulture, renderDynasty, renderMagic, renderSecurity, renderWar };
  };
})();
