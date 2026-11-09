// js/world.js — Etapa 37: painel Mundo (cadeias, mercado, reinos e personagens, marcos, capital) e batalhas táticas na aba Guerra.
(function () {
  const K = window.KOT, API = (typeof Api !== 'undefined' ? Api : window.Api); if (!K || !API) return;
  const esc = K.escapeHtml, nf = (n) => Number(n).toLocaleString('pt-BR'); const R = (p, o) => API.raw(p, o); const post = (p, body) => R(p, { method: 'POST', body: body || {} });
  const LS = { get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* noop */ } } };
  const active = (p) => !!document.querySelector(`.dash-panel[data-panel="${p}"].active`);
  const act = async (fn) => { try { const r = await fn(); K.showToast(r.message || 'Feito.'); await K.refreshAll(true); return r; } catch (e) { K.showToast(`⚠️ ${e.message}`); return null; } };
  const bar = (v, cls) => `<div class="bar ${cls || ''}"><i style="width:${Math.max(0, Math.min(100, v))}%"></i></div>`;

  // ======================================================== MUNDO
  const TABS = [['cadeias', '🔗 Cadeias'], ['mercado', '📈 Mercado'], ['reinos', '🏰 Reinos e pessoas'], ['marcos', '🏛️ Marcos'], ['capital', '👑 Capital']];
  let tab = LS.get('kot_world_tab', 'cadeias'); let busy = false;
  async function renderMundo() {
    const box = K.el('mundoBody'); if (!box || busy) return; busy = true;
    try {
      const head = `<div class="w-tabs">${TABS.map(([k, n]) => `<button class="w-tab ${k === tab ? 'on' : ''}" data-wtab="${k}">${n}</button>`).join('')}</div>`;
      let body = '';
      if (tab === 'cadeias') body = renderChains(await R('/world/chains'));
      else if (tab === 'mercado') body = renderMarket(await R('/world/market'));
      else if (tab === 'reinos') body = renderAI(await R('/world/ai'));
      else if (tab === 'marcos') body = renderLandmarks(await R('/world/landmarks'));
      else body = renderCapital(await R('/world/capital'));
      box.innerHTML = head + `<div id="wBody">${body}</div>`;
      box.querySelectorAll('[data-wtab]').forEach(b => b.addEventListener('click', () => { tab = b.dataset.wtab; LS.set('kot_world_tab', tab); renderMundo(); }));
      bindMundo(box);
    } catch (e) { box.innerHTML = `<p class="hint">Não foi possível carregar: ${esc(e.message)}</p>`; } finally { busy = false; }
  }
  function renderChains(c) {
    const card = (x) => `<div class="w-card"><div class="w-row"><span style="font-size:22px">${x.icon}</span><h5>${esc(x.name)}</h5><span class="w-muted">${x.systems.map(esc).join(' × ')}</span><span class="w-muted" style="margin-left:auto">${x.daysLeft ? 'ativa por mais ' + x.daysLeft + 'd' : 'encerrada'}</span></div>
      <div class="w-muted">Causas reais agora: <strong>${x.causes.map(esc).join(' · ')}</strong></div><div>${esc(x.effect)}</div>${bar(x.strength)}</div>`;
    return `<p class="hint">Os sistemas do jogo não vivem isolados: aqui estão as <strong>cadeias de causa e efeito</strong> ativas entre religião, ciência, magia, política, economia, população e guerra. Elas nascem de condições reais do seu reino.</p>
      <h4>Ativas agora (${c.active.length})</h4>${c.active.map(card).join('') || '<p class="hint">Nenhuma cadeia ativa: o reino está em equilíbrio entre os sistemas. 🎉</p>'}
      ${c.past.length ? `<h4>Recentes</h4>${c.past.map(card).join('')}` : ''}
      <details><summary>📖 Todas as cadeias possíveis (${c.catalog.length})</summary>${c.catalog.map(x => `<div class="w-card"><span>${x.icon} <strong>${esc(x.name)}</strong></span> <span class="w-muted">${x.systems.map(esc).join(' × ')}</span><div class="w-muted">${esc(x.text)}</div></div>`).join('')}</details>`;
  }
  function renderMarket(m) {
    return `<p class="hint">Os preços agora têm <strong>oferta e demanda</strong>: os reinos de IA demandam recursos conforme a personalidade, as <em>suas</em> compras e vendas movem o índice e <strong>crises econômicas</strong> (quebra de safra, bolha, estouro bancário, embargo, inflação) causam choques. Este índice multiplica os preços da aba Economia.</p>
      ${m.crises.filter(c => c.status === 'ativa').map(c => `<div class="w-card" style="border-left:5px solid #c0392b"><div class="w-row"><span style="font-size:22px">${c.icon}</span><h5>${esc(c.name)}${c.resource ? ' — ' + esc(c.resource) : ''}</h5><span class="w-muted">fase: ${esc(c.phase)} · ${c.daysLeft}d</span></div><div>${esc(c.text || '')}</div><div class="w-row"><button class="btn btn-secondary btn-sm" data-mcrisis="${c.id}:intervir">🏦 Intervir (💰600)</button><button class="btn btn-ghost btn-sm" data-mcrisis="${c.id}:subsidiar">🍞 Subsidiar o povo (💰500)</button></div></div>`).join('')}
      <table style="width:100%;border-collapse:collapse"><thead><tr><th align="left">Recurso</th><th>Índice</th><th>Crise</th><th>Efetivo</th><th>Tendência</th><th align="left">Demandam</th><th align="left">Por quê</th></tr></thead><tbody>${m.resources.map(r => `<tr style="border-top:1px solid rgba(0,0,0,.12)"><td>${esc(r.label)}</td><td align="center">×${r.idx}</td><td align="center">${r.crisis !== 1 ? '×' + r.crisis : '—'}</td><td align="center"><strong>×${r.effective}</strong></td><td align="center">${r.trend === 'sobe' ? '📈' : r.trend === 'cai' ? '📉' : '➖'} ${esc(r.trend)}</td><td class="w-muted">${r.demand.map(esc).join(', ') || '—'}</td><td class="w-muted">${esc(r.why)}</td></tr>`).join('')}</tbody></table>
      ${m.crises.filter(c => c.status !== 'ativa').length ? `<h4>Crises passadas</h4>${m.crises.filter(c => c.status !== 'ativa').map(c => `<div class="w-muted">${c.icon} ${esc(c.name)} (${esc(c.status)})</div>`).join('')}` : ''}`;
  }
  function renderAI(a) {
    const person = (p) => `<div class="w-card" style="margin:4px 0"><div class="w-row"><strong>${esc(p.roleName)} ${esc(p.name)}</strong><span class="w-muted">${p.age} anos · ${p.traits.map(esc).join(', ')}</span></div><div class="w-muted">opinião de você: ${p.opinion} · lealdade ao próprio reino: ${p.loyalty}</div>${bar(p.opinion)}<div class="w-row">${['presentear:🎁 Presentear (💰300)', 'espionar:🕵️ Espionar (💰600)', 'subornar:💰 Subornar (💰800)', ...(p.role !== 'governante' ? ['recrutar:🎖️ Recrutar (💰2000)'] : [])].map(x => { const [k, l] = x.split(':'); return `<button class="btn btn-ghost btn-sm" data-aiact="${p.id}:${k}" ${p.cooldown ? 'disabled' : ''}>${l}</button>`; }).join('')}${p.cooldown ? `<span class="w-muted">(espere ${p.cooldown}d)</span>` : ''}</div></div>`;
    return `${a.coalition ? '<div class="pop-alert">🤝 Há uma <strong>coalizão estrangeira contra você</strong>: os reinos membros estão ×1,6 mais agressivos.</div>' : ''}<p class="hint">Seu poder: <strong>${a.yourPower}</strong>. Os reinos têm <strong>objetivos de longo prazo</strong>, formam <strong>alianças</strong> e, se você ficar forte demais e desconfiado, uma <strong>coalizão</strong>. Governantes, generais, embaixadores e espiões têm nome, traços e opinião própria: presenteie, espione, suborne ou recrute.</p>
      ${a.kingdoms.map(k => `<div class="w-card"><div class="w-row"><span style="font-size:20px">${k.government.icon}</span><h5>${esc(k.name)}</h5><span class="w-muted">${esc(k.government.name)} · ${esc(k.personality)} · poder ${k.power} · agressividade ×${k.aggression}</span></div>
        <div>${k.goal.hidden ? '🎯 Objetivo: <em>desconhecido — espione para descobrir</em>' : `🎯 Objetivo: <strong>${k.goal.icon} ${esc(k.goal.name)}</strong>${k.goal.target ? ' (contra ' + esc(k.goal.target) + ')' : ''} ${bar(k.goal.progress)}`}</div>
        ${k.pacts.length ? `<div class="w-muted">${k.pacts.map(p => (p.kind === 'coalizao' ? '🤝 coalizão' : '🤝 aliança') + ' com ' + esc(p.with) + (p.targetPlayer ? ' (contra você)' : '')).join(' · ')}</div>` : ''}
        <details><summary>👥 Pessoas (${k.people.length})</summary>${k.people.map(person).join('')}</details></div>`).join('')}`;
  }
  function renderLandmarks(l) {
    return `<p class="hint">Marcos de bairro são edifícios com <strong>nome e história próprios</strong>: ganham fama com o tempo (festivais, lendas, incêndios), sobem de nível e aumentam seus bônus. Capital: até 6 marcos; cada cidade: 2.</p>
      <div class="w-card"><div class="w-row"><label>Cidade: <select id="lmCity">${l.cities.map(c => `<option value="${c.id}">${esc(c.name)}${c.is_capital ? ' (capital)' : ''}</option>`).join('')}</select></label></div>
      <div class="w-row">${l.catalog.map(c => `<button class="btn btn-secondary btn-sm" data-lmbuild="${c.key}" title="${esc(Object.entries(c.effects).map(([k, v]) => k + ' +' + v).join(', '))}">${c.icon} ${esc(c.name)} (💰${nf(c.cost)})</button>`).join('')}</div></div>
      ${l.landmarks.map(x => `<div class="w-card"><div class="w-row"><span style="font-size:22px">${x.icon}</span><h5>${esc(x.name)}</h5><span class="w-muted">${esc(x.city)} · nível ${x.tier} · fama ${x.fame} · ${x.age} dias</span></div>${bar(x.fame / 1.2)}<div class="w-muted">${x.effects.map(([k, v]) => `${esc(k)} +${v}`).join(' · ')}</div><ul class="w-muted" style="margin:4px 0 0 16px">${x.history.map(h => `<li>Ano ${h.year}: ${esc(h.text)}</li>`).join('')}</ul></div>`).join('') || '<p class="hint">Nenhum marco erguido ainda.</p>'}`;
  }
  function renderCapital(c) {
    return `<p class="hint">Decisões <strong>únicas</strong> da capital: raras, com ramificações e consequências permanentes (marcam bandeiras que outros sistemas leem — por exemplo, a Universidade acelera a pesquisa e o Concílio decide o embate entre fé e ciência).</p>
      <div class="w-muted">Marcas ativas: ${Object.keys(c.flags).filter(k => c.flags[k] && typeof c.flags[k] !== 'number').map(esc).join(', ') || 'nenhuma'}</div>
      ${c.decisions.map(d => `<div class="w-card" style="${d.available ? '' : 'opacity:.65'}"><div class="w-row"><span style="font-size:22px">${d.icon}</span><h5>${esc(d.name)}</h5>${d.reason ? `<span class="w-muted">(${esc(d.reason)})</span>` : ''}</div><div>${esc(d.desc)}</div><div class="w-row">${d.options.map(o => `<button class="btn btn-secondary btn-sm" data-decide="${d.key}:${o.key}" ${d.available ? '' : 'disabled'}>${esc(o.label)}${o.chance < 100 ? ' · 🎲' + o.chance + '%' : ''}</button>`).join('')}</div></div>`).join('')}
      ${c.history.length ? `<h4>Histórico</h4>${c.history.map(h => `<div class="w-muted">Dia ${h.day}: ${esc(h.outcome)}</div>`).join('')}` : ''}`;
  }
  function bindMundo(box) {
    box.querySelectorAll('[data-mcrisis]').forEach(b => b.addEventListener('click', () => { const [id, o] = b.dataset.mcrisis.split(':'); act(() => post(`/world/market/crises/${id}/${o}`)); }));
    box.querySelectorAll('[data-aiact]').forEach(b => b.addEventListener('click', () => { const [id, a] = b.dataset.aiact.split(':'); act(() => post(`/world/ai/people/${id}/${a}`)); }));
    box.querySelectorAll('[data-lmbuild]').forEach(b => b.addEventListener('click', () => act(() => post('/world/landmarks', { key: b.dataset.lmbuild, settlementId: Number(box.querySelector('#lmCity').value) }))));
    box.querySelectorAll('[data-decide]').forEach(b => b.addEventListener('click', () => { const [k, o] = b.dataset.decide.split(':'); act(() => post(`/world/capital/${k}`, { option: o })); }));
  }

  // ======================================================== BATALHAS TÁTICAS (aba Guerra)
  let tacLoaded = false;
  function ensureTacBox() { const p = document.querySelector('.dash-panel[data-panel="guerra"] .parchment-panel'); if (!p) return null; let b = document.getElementById('tacBox'); if (!b) { b = document.createElement('div'); b.id = 'tacBox'; b.style.marginTop = '18px'; p.appendChild(b); } return b; }
  async function renderTac() {
    const box = ensureTacBox(); if (!box) return; let o; try { o = await R('/tactical'); } catch { return; }
    const pend = o.battles.filter(b => b.status === 'pendente' || b.status === 'em_curso');
    box.innerHTML = `<h3 style="margin-top:0">🛡️ Comando de campo (batalhas táticas)</h3>
      <p class="hint">Terreno, formação e ordens por ala decidem a batalha. Defenda incursões comandando você mesmo, ou deixe o jogo resolver sozinho.</p>
      <div class="w-row"><label>Defesas contra incursões: <select id="tacMode"><option value="auto" ${o.mode === 'auto' ? 'selected' : ''}>⚙️ Automáticas</option><option value="comandar" ${o.mode === 'comandar' ? 'selected' : ''}>🛡️ Eu comando (5 dias para responder)</option></select></label>
      <label>Ataques e batalhas navais: <select id="tacOffense"><option value="auto" ${o.offense === 'auto' ? 'selected' : ''}>⚙️ Sorteio clássico</option><option value="comandar" ${o.offense === 'comandar' ? 'selected' : ''}>🎮 Eu comando</option></select></label>
      <span class="w-muted">Tropas em casa: ${o.available.map(u => `${u.icon} ${u.n} ${esc(u.name)}`).join(' · ') || 'nenhuma'}</span></div>
      <div class="w-row" style="margin:8px 0"><label>Formação: <select id="tacForm">${o.formations.map(f => `<option value="${f.key}">${f.icon} ${esc(f.name)}</option>`).join('')}</select></label><button class="btn btn-secondary btn-sm" data-tacstart="treino" ${o.total ? '' : 'disabled'}>🎯 Treino (sem baixas reais)</button><button class="btn btn-secondary btn-sm" data-tacstart="escaramuca" ${o.total ? '' : 'disabled'}>⚔️ Escaramuça (baixas e butim reais)</button></div>
      ${pend.map(b => `<div class="w-card" style="border-left:5px solid #c0392b"><strong>${b.status === 'pendente' ? (b.kind === 'ofensiva' ? '🗡️ Campanha aguardando comando' : b.kind === 'naval' ? '⚓ Batalha naval aguardando comando' : '🛡️ Batalha aguardando comando') : '⚔️ Batalha em andamento'}</strong> (${esc(b.kind)}) ${b.deadline_day ? `<span class="w-muted">prazo: dia ${b.deadline_day}</span>` : ''} <button class="btn btn-primary btn-sm" data-tacopen="${b.id}">Comandar</button></div>`).join('')}
      ${o.recent.length ? `<div class="w-muted">Últimas: ${o.recent.map(r => `${r.result && r.result.status === 'vitoria' ? '🏆' : r.result && r.result.status === 'derrota' ? '💀' : '⚖️'} ${esc(r.kind)}`).join(' · ')}</div>` : ''}`;
    box.querySelector('#tacMode').addEventListener('change', (e) => act(() => post('/tactical/mode', { mode: e.target.value })));
    box.querySelector('#tacOffense').addEventListener('change', (e) => act(() => post('/tactical/offense', { mode: e.target.value })));
    box.querySelectorAll('[data-tacstart]').forEach(b => b.addEventListener('click', async () => { const r = await act(() => post('/tactical/start', { kind: b.dataset.tacstart, formation: box.querySelector('#tacForm').value })); if (r && r.id) openBattle(r.id); }));
    box.querySelectorAll('[data-tacopen]').forEach(b => b.addEventListener('click', () => openBattle(Number(b.dataset.tacopen))));
  }
  let orders = ['manter', 'manter', 'manter'];
  async function openBattle(id) {
    let ov = document.getElementById('tacModal'); if (!ov) { ov = document.createElement('div'); ov.id = 'tacModal'; ov.className = 'ux-overlay'; ov.style.alignItems = 'center'; ov.style.paddingTop = '0'; document.body.appendChild(ov); }
    ov.classList.remove('hidden'); let v; try { v = await R('/tactical/' + id); } catch (e) { K.showToast('⚠️ ' + e.message); ov.classList.add('hidden'); return; }
    const done = v.status !== 'em_curso';
    ov.innerHTML = `<div class="tac-modal-box"><div class="w-row"><h3 style="margin:0">${esc(v.title || ('⚔️ Batalha tática: ' + v.aiName))}</h3><span class="w-muted">rodada ${v.round}/${v.maxRounds} · ${esc(v.kind)}</span><button class="btn btn-ghost btn-sm" id="tacClose" style="margin-left:auto">Fechar</button></div>
      ${v.stakes ? `<p class="hint" style="margin:4px 0">🎯 ${esc(v.stakes)}${v.mage ? ' · 🧙 ' + esc(v.mage) + ' apoia o exército.' : ''}</p>` : ''}
      <div class="w-row"><div style="flex:1">Moral dos inimigos ${bar(v.morale.e, 'e')}</div><div style="flex:1">Seu moral ${bar(v.morale.p)}</div></div>
      <div class="w-row"><span>Sua formação: <strong>${esc(v.formation.pName)}</strong></span>${v.canChangeFormation ? `<select id="tacF2">${v.formations.map(f => `<option value="${f.key}" ${f.key === v.formation.p ? 'selected' : ''}>${f.icon} ${esc(f.name)} — ${esc(f.desc)}</option>`).join('')}</select>` : ''}<span class="w-muted">Inimigo: ${esc(v.formation.eName)}</span></div>
      <div class="tac-board ${v.variant === 'naval' ? 'naval' : ''}">${v.wings.map((w, i) => `<div class="tac-wing"><div class="tw-head">${esc(w.name)} — ${w.terrain.icon} ${esc(w.terrain.name)}</div>
        <div class="tac-side enemy">${esc(v.side.enemy)} (${w.e.total}): ${w.e.units.map(u => `${u.icon}${u.n}`).join(' ') || '— derrotado —'}</div>
        <div class="tac-side you">${esc(v.side.you)} (${w.p.total}): ${w.p.units.map(u => `${u.icon}${u.n}`).join(' ') || '— derrotado —'}</div>
        ${done ? '' : `<div class="tac-order">${v.orders.map(o => `<button data-ord="${i}:${o.key}" class="${orders[i] === o.key ? 'on' : ''}">${o.icon} ${esc(o.name)}</button>`).join('')}</div>`}</div>`).join('')}</div>
      ${done ? `<div class="w-card"><strong>${v.status === 'vitoria' ? '🏆 VITÓRIA' : v.status === 'derrota' ? '💀 DERROTA' : v.status === 'cancelada' ? '↩️ CANCELADA' : '⚖️ EMPATE'}</strong>${v.result && v.result.report ? ` <span class="w-muted">${esc(v.result.report.tierIcon || '')} ${esc(v.result.report.tierLabel || '')}${v.result.classic ? ' (sorteio clássico)' : ''}</span>` : ''}<div>${esc(v.result ? v.result.text : '')}</div>${v.result && v.result.report && v.result.report.attackerLosses ? `<div class="w-muted">Baixas: ${v.result.report.attackerLosses.map(l => `${l.icon} −${l.lost} ${esc(l.unit)}`).join(' · ') || 'nenhuma'}${v.result.report.captured ? ' · 🏴 território CONQUISTADO' : ''}${v.result.report.generalNote ? ' ·' + esc(v.result.report.generalNote) : ''}</div>` : ''}</div>` : `<div class="w-row"><label>Tática especial: <select id="tacTactic"><option value="">(nenhuma)</option>${v.tactics.map(t => `<option value="${t.key}" ${t.available ? '' : 'disabled'}>${t.icon} ${esc(t.name)}${t.used ? ' (usada)' : t.available ? '' : ' (indisponível)'} — ${esc(t.text)}</option>`).join('')}</select></label><button class="btn btn-primary" id="tacRound">▶️ Executar rodada</button><button class="btn btn-ghost" id="tacAuto">⏩ Simular a batalha</button>${v.canClassic ? '<button class="btn btn-ghost" id="tacClassic" title="O sorteio clássico do jogo, sem tabuleiro">🎲 Sorteio clássico</button>' : ''}${v.canCancel ? '<button class="btn btn-ghost" id="tacCancel" title="Recuar antes do primeiro combate: sem baixas">↩️ Cancelar ataque</button>' : ''}</div>`}
      <div class="tac-log" id="tacLog">${v.log.map(esc).join('\n')}</div></div>`;
    const lg = ov.querySelector('#tacLog'); if (lg) lg.scrollTop = lg.scrollHeight;
    ov.querySelector('#tacClose').addEventListener('click', () => { ov.classList.add('hidden'); K.refreshAll(true); });
    ov.querySelectorAll('[data-ord]').forEach(b => b.addEventListener('click', () => { const [i, o] = b.dataset.ord.split(':'); orders[Number(i)] = o; ov.querySelectorAll(`[data-ord^="${i}:"]`).forEach(x => x.classList.toggle('on', x === b)); }));
    const f2 = ov.querySelector('#tacF2'); if (f2) f2.addEventListener('change', async () => { try { await post(`/tactical/${id}/formation`, { formation: f2.value }); } catch (e) { K.showToast('⚠️ ' + e.message); } openBattle(id); });
    const rb = ov.querySelector('#tacRound'); if (rb) rb.addEventListener('click', async () => { try { const r = await post(`/tactical/${id}/round`, { orders, tactic: ov.querySelector('#tacTactic').value || undefined }); if (r.result) K.showToast(r.result.text); } catch (e) { K.showToast('⚠️ ' + e.message); } openBattle(id); });
    const cb = ov.querySelector('#tacClassic'); if (cb) cb.addEventListener('click', async () => { try { const r = await post(`/tactical/${id}/classic`); if (r.result) K.showToast(r.result.text); } catch (e) { K.showToast('⚠️ ' + e.message); } openBattle(id); });
    const xb = ov.querySelector('#tacCancel'); if (xb) xb.addEventListener('click', async () => { try { const r = await post(`/tactical/${id}/cancel`); K.showToast(r.message); } catch (e) { K.showToast('⚠️ ' + e.message); } ov.classList.add('hidden'); K.refreshAll(true); });
    const ab = ov.querySelector('#tacAuto'); if (ab) ab.addEventListener('click', async () => { try { const r = await post(`/tactical/${id}/auto`); if (r.result) K.showToast(r.result.text); } catch (e) { K.showToast('⚠️ ' + e.message); } openBattle(id); });
  }

  document.addEventListener('kot:refreshed', () => { if (active('mundo')) renderMundo(); if (active('guerra')) renderTac(); });
  document.addEventListener('kot:panel', (e) => { if (e.detail === 'mundo') setTimeout(renderMundo, 20); if (e.detail === 'guerra') setTimeout(renderTac, 20); });
  window.KOT.world = { renderMundo, renderTac, openBattle };
})();
