// js/painel-campanha.js — extraído de kingdom.js (Etapa 66) por backend/tools/extractPanel.js (linhas 4599-4659 da versão anterior).
// O contexto (ctx) lista o que o trecho usa do fechamento do kingdom.js; o teste de contrato (tests/painel-contrato.test.js) falha se algo ficar sem dono.
(function () {
  const K = window.KOT || (window.KOT = {}); K.panels = K.panels || {};
  K.panels.campanha = function (ctx) {
    const { el, escapeHtml, infoBtn, refreshAll, showToast, state } = ctx;
    function campBar(pct, color) { return `<div class="pm-bar" style="height:7px;margin:2px 0;"><div class="pm-fill" style="width:${Math.max(0, Math.min(100, pct))}%;${color ? 'background:' + color + ';' : ''}"></div></div>`; }
    function renderCampaign() {
      const c = state.campaign; const box = el('campBody'); if (!c || !box) return;
      const numf = (n) => Number(n).toLocaleString('pt-BR');
      const reqRow = (r) => `<div class="hint" style="display:flex;justify-content:space-between;gap:8px;"><span>${r.ok ? '✅' : '⬜'} ${escapeHtml(r.label)}</span><span>${numf(r.value)} / ${r.op === 'lte' ? '≤ ' : ''}${numf(r.target)}</span></div>${campBar(r.pct, r.ok ? '#4a8f3f' : '')}`;
      const crisisHtml = c.crises.filter(x => x.status === 'aviso' || x.status === 'ativa').map(x => `
        <div class="pol-law" style="border-left:4px solid ${x.status === 'ativa' ? '#c0392b' : '#e0a030'};">
          <div class="pl-head"><span>${x.icon} <strong>${escapeHtml(x.name)}</strong> · severidade ${'●'.repeat(x.sev)}</span><span class="bc-level">${x.status === 'aviso' ? `⚠️ chega em ${x.daysToStart}d` : `🔥 ativa · ${x.daysLeft}d restantes`}</span></div>
          <div class="hint">${escapeHtml(x.desc)}</div>
          ${x.effects && x.effects.length ? `<div class="hint"><b>Enquanto durar:</b> ${x.effects.map(escapeHtml).join(' · ')}.</div>` : ''}
          ${x.options.length ? `<div class="tech-controls">${x.options.map(o => `<button class="btn btn-secondary btn-sm" data-crisis="${x.id}:${o.key}">${escapeHtml(o.label)}${o.cost ? ' (💰' + numf(o.cost) + ')' : ''}${o.chance < 100 ? ' · ' + o.chance + '%' : ''}</button>`).join('')}</div><div class="cr-explain">${x.options.map(o => `<div class="hint"><b>${escapeHtml(o.label)}:</b> ${escapeHtml(o.explain || '')}</div>`).join('')}</div>` : (x.answered ? '<div class="hint">✔️ Resposta desta fase já dada.</div>' : '')}
        </div>`).join('') || '<p class="hint">🌤️ Nenhuma crise em curso. Elas chegam em ondas maiores a cada era — use a calmaria para se fortalecer.</p>';
      const pastCrises = c.crises.filter(x => x.status === 'encerrada').slice(0, 4).map(x => `<span class="bc-stat prod">${x.icon} ${escapeHtml(x.name)} superada</span>`).join('');
      const hotCrisis = c.crises.some(x => x.status === 'aviso' || x.status === 'ativa'); /* Etapa 74: com uma crise em aviso/ativa o bloco sobe para o topo (antes ficava abaixo da Era, da dificuldade e das diretrizes, e o botão Abrir de Hoje levava a uma tela onde a crise não aparecia) */
      const crisisBlock = `<div class="ficha-section-title">Crises ${infoBtn('campanha_crises')}</div>
        <div class="pol-laws">${crisisHtml}</div>${pastCrises ? `<div class="bc-stats">${pastCrises}</div>` : ''}`;
      const eraMs = c.milestones.filter(x => x.era === c.era.n), lateMs = c.milestones.filter(x => x.era < c.era.n && !x.done);
      const msRow = (x) => `<div class="pol-law" style="${x.done ? 'opacity:.7;' : ''}"><div class="pl-head"><span>${x.done ? '✅' : '🎯'} ${escapeHtml(x.label)}</span><span class="bc-level">${x.done ? 'cumprido' : numf(x.value) + ' / ' + numf(x.target)}</span></div>${x.done ? '' : campBar(x.pct)}</div>`;
      box.innerHTML = `
        ${hotCrisis ? crisisBlock : ''}
        <div class="pol-law" style="background:linear-gradient(90deg,rgba(236,200,95,.18),transparent);">
          ${window.KOT && window.KOT.art ? window.KOT.art.era(c.era.n, c.era.name) : ''}
          <div class="pl-head"><span style="font-size:1.15em;">${c.era.icon} <strong>${escapeHtml(c.era.name)}</strong> <span class="hint">(Era ${c.era.n} de 6 · ano ${c.years + 1})</span></span><span class="bc-level">🏅 Pontuação ${numf(c.score)} · ⭐ Prestígio ${numf(c.prestige)}</span></div>
          <div class="hint">${escapeHtml(c.era.desc)}</div>
          ${c.era.next ? `<div class="hint">Próxima era: <strong>${escapeHtml(c.era.next.name)}</strong> em ${c.era.next.inYears} ano(s) — cada era traz crises maiores.</div>${campBar(c.era.progressPct)}` : '<div class="hint">🗿 Era final: consolide seu legado.</div>'}
          <div class="tech-controls"><label class="hint">Dificuldade ${infoBtn('campanha_dificuldade')}</label><select id="campDiff" ${c.ironman && c.ironman.on ? 'disabled' : ''}>${c.difficulties.map(d => `<option value="${d.key}" ${d.key === c.difficulty ? 'selected' : ''}>${d.icon} ${escapeHtml(d.label)}</option>`).join('')}</select><span class="hint">${escapeHtml(c.difficultyInfo.desc)}</span></div>
          ${(window.KOT.ironmanCard || (() => ''))(c)}
          ${c.status !== 'ativa' ? `<div class="pop-alert">${c.end.icon} ${c.status === 'vitoria' ? 'VITÓRIA' : 'DERROTA'}: ${escapeHtml(c.end.name)} — ${c.freeMode ? '♾️ você está em modo livre.' : '<button class="btn btn-primary btn-sm" id="campEndOpen">Ver epílogo</button>'}</div>` : ''}
        </div>
        <div class="ficha-section-title">Diretrizes agora ${infoBtn('campanha_diretrizes')}</div>
        <div class="pol-laws">${c.directives.map(d => `<div class="pol-law"><span>${d.icon} ${escapeHtml(d.text)}</span></div>`).join('')}</div>
        ${hotCrisis ? '' : crisisBlock}
        <div class="ficha-section-title">Grandes Obras ${infoBtn('campanha_obras')}</div>
        <div class="pol-laws">${c.projects.filter(p => p.available || p.built).map(p => `<div class="pol-law" style="${p.built ? 'opacity:.75;' : ''}"><div class="pl-head"><span>${p.icon} <strong>${escapeHtml(p.name)}</strong> <span class="hint">(Era ${p.era})</span></span><span class="bc-level">${p.built ? '✅ erguida' : Object.entries(p.cost).map(([r, n]) => `${({ gold: '💰', stone: '🧱', wood: '🌳', marble: '🏛️' })[r] || r} ${numf(n)}`).join(' ')}</span></div><div class="hint">${escapeHtml(p.desc)} Efeitos: ${[p.effects.stability ? '🛡️ estabilidade +' + p.effects.stability : '', p.effects.happiness ? '😊 felicidade +' + p.effects.happiness : '', p.effects.goldPct ? '💰 renda +' + p.effects.goldPct + '%' : '', p.effects.foodPct ? '🌾 comida +' + p.effects.foodPct + '%' : '', p.effects.knowledge ? '📚 +' + p.effects.knowledge + ' conhecimento' : '', p.effects.prestige ? '⭐ +' + p.effects.prestige + ' prestígio' : ''].filter(Boolean).join(' · ')}</div>${p.built ? '' : `<div class="tech-controls"><button class="btn btn-secondary btn-sm" data-project="${p.key}" ${p.affordable ? '' : 'disabled'}>🏗️ Erguer${p.affordable ? '' : ' (faltam recursos)'}</button></div>`}</div>`).join('') || '<p class="hint">Nenhuma obra disponível ainda.</p>'}</div>
        <div class="ficha-section-title">Marcos da era ${infoBtn('campanha_marcos')}</div>
        <div class="pol-laws">${eraMs.map(msRow).join('')}${lateMs.length ? `<div class="hint">Marcos atrasados de eras anteriores (ainda valem prestígio):</div>${lateMs.map(msRow).join('')}` : ''}</div>
        <div class="ficha-section-title">Caminhos de vitória ${infoBtn('campanha_vitoria')}</div>
        <div class="pol-laws">${c.victories.map(v => `<div class="pol-law"><div class="pl-head"><span>${v.icon} <strong>${escapeHtml(v.name)}</strong></span><span class="bc-level">${v.pct}%${v.met ? ` · mantendo ${v.held}/${v.holdDays} dias` : ''}</span></div><div class="hint">${escapeHtml(v.desc)} (cumpra todos por ${v.holdDays} dias seguidos)</div>${v.reqs.map(reqRow).join('')}</div>`).join('')}</div>
        <div class="ficha-section-title">Riscos de derrota ${infoBtn('campanha_derrota')}</div>
        <div class="pol-laws">${c.defeats.map(d => `<div class="pol-law" style="${d.danger ? 'border-left:4px solid #c0392b;' : ''}"><div class="pl-head"><span>${d.icon} <strong>${escapeHtml(d.name)}</strong></span><span class="bc-level ${d.risk > 40 ? 'pop-alert' : ''}">risco ${d.risk}%</span></div><div class="hint">${escapeHtml(d.desc)}${d.holdDays ? ` (acontece após ${d.holdDays} dias seguidos nesta situação)` : ''}</div>${d.reqs.map(reqRow).join('')}</div>`).join('')}</div>
        <div class="ficha-section-title">Crônica da campanha</div>
        <ul class="ficha-history-list">${c.log.map(l => `<li><span>${l.icon}</span><div><span class="fh-day">DIA ${l.day}</span>${escapeHtml(l.title)}</div></li>`).join('') || '<li>Nada ainda: o reino acaba de começar.</li>'}</ul>`;
      box.querySelectorAll('[data-crisis]').forEach(b => b.addEventListener('click', async () => { const [id, opt] = b.dataset.crisis.split(':'); try { const r = await Api.crisisDecision(Number(id), opt); showToast(r.message); await refreshAll(true); } catch (err) { showToast(`⚠️ ${err.message}`); } }));
      box.querySelectorAll('[data-project]').forEach(b => b.addEventListener('click', async () => { try { const r = await Api.buildProject(b.dataset.project); showToast(r.message); await refreshAll(true); } catch (err) { showToast(`⚠️ ${err.message}`); } }));
      if (window.KOT.ironmanBind) window.KOT.ironmanBind(refreshAll, showToast); const sel = el('campDiff'); if (sel) sel.addEventListener('change', async () => { try { const r = await Api.setDifficulty(sel.value); showToast(r.message); await refreshAll(true); } catch (err) { showToast(`⚠️ ${err.message}`); } });
      const eo = el('campEndOpen'); if (eo) eo.addEventListener('click', () => showEndScreen(true));
      // chip da era no cabecalho + tela de fim
      let chip = el('eraChip'); const timeEl = document.querySelector('.time-display, #timeDisplay'); if (!chip && timeEl) { chip = document.createElement('span'); chip.id = 'eraChip'; chip.className = 'resource-chip'; chip.style.cursor = 'pointer'; timeEl.parentNode.insertBefore(chip, timeEl.nextSibling); chip.addEventListener('click', () => { const b = document.querySelector('.nav-item[data-panel="campanha"]'); if (b) b.click(); }); }
      if (chip) { const hot = c.crises.find(x => x.status === 'ativa') || c.crises.find(x => x.status === 'aviso'); chip.textContent = `${c.era.icon} Era ${c.era.n}${hot ? ' · ' + hot.icon + (hot.status === 'ativa' ? ' CRISE' : ' ⚠️') : ''}`; chip.title = `${c.era.name}${hot ? ' — ' + hot.name : ''}`; }
      showEndScreen(false);
    }
    function showEndScreen(force) {
      const c = state.campaign; if (!c || c.status === 'ativa') return;
      const key = `kot_end_seen_${c.end.day}_${c.end.type}`; if (!force && (c.freeMode || localStorage.getItem(key))) return;
      localStorage.setItem(key, '1');
      el('endBody').innerHTML = `<div style="text-align:center;"><div style="font-size:3.2em;">${c.end.icon}</div><h2>${c.status === 'vitoria' ? 'VITÓRIA' : 'DERROTA'}: ${escapeHtml(c.end.name)}</h2><div class="hint">Dia ${c.end.day} · ${escapeHtml(c.era.name)} · dificuldade ${escapeHtml(c.difficultyInfo.label)}</div></div>
        <div class="ficha-bio" style="white-space:pre-line;margin:12px 0;">${escapeHtml(c.end.epilogue || '')}</div>
        <div class="bc-stats" style="justify-content:center;"><span class="bc-stat prod">🏅 Pontuação final: ${Number(c.end.score).toLocaleString('pt-BR')}</span><span class="bc-stat">👥 ${Number(c.metrics.pop).toLocaleString('pt-BR')} habitantes</span><span class="bc-stat">🗺️ ${c.metrics.territories} regiões</span><span class="bc-stat">🔬 ${c.metrics.techs} tecnologias</span></div>
        <div class="tech-controls" style="justify-content:center;">${c.ironman && c.ironman.on ? '' : '<button class="btn btn-primary" id="endFree">♾️ Continuar em modo livre</button>'}<button class="btn btn-ghost" id="endClose">Fechar</button></div>
        <p class="hint" style="text-align:center;">${c.ironman && c.ironman.on ? '☠️ Ironman: este fim é definitivo. O reino fica registrado no Livro do Reinado.' : 'No modo livre o jogo segue sem vitória nem derrota; as crises continuam.'}</p>`;
      el('endOverlay').classList.remove('hidden');
      el('endClose').addEventListener('click', () => el('endOverlay').classList.add('hidden'));
      if (el('endFree')) el('endFree').addEventListener('click', async () => { try { const r = await Api.continueFree(); showToast(r.message); el('endOverlay').classList.add('hidden'); await refreshAll(true); } catch (err) { showToast(`⚠️ ${err.message}`); } });
    }

    return { renderCampaign };
  };
})();
