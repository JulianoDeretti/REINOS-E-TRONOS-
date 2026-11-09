// js/telemetria.js — Etapa 71: TELEMETRIA LOCAL E OPCIONAL para teste com pessoas. Desligada por padrão. NADA é enviado: o registro fica no localStorage deste navegador e só sai se a pessoa clicar em "Baixar".
// Registra: abertura de painéis e tempo em cada um, cliques em botões (id/rótulo curto, nunca o conteúdo de campos), decisões pendentes a cada atualização e o ponto de saída (último painel + data do jogo).
(function () {
  const K = window.KOT || (window.KOT = {}); const KEY_ON = 'kot_telemetry_on', KEY_LOG = 'kot_telemetry_log', MAX = 3000, IDLE_MS = 5 * 60 * 1000;
  const ls = { get: (k) => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); return true; } catch { return false; } }, del: (k) => { try { localStorage.removeItem(k); } catch { /* sem armazenamento */ } } };
  const isOn = () => ls.get(KEY_ON) === '1'; const read = () => { try { return JSON.parse(ls.get(KEY_LOG) || '[]'); } catch { return []; } };
  const sid = Math.random().toString(36).slice(2, 8); let cur = null, curAt = 0, lastAct = Date.now();
  const gameTime = () => { const e = document.getElementById('timeText'); return e ? e.textContent.replace(/\s+/g, ' ').trim().slice(0, 60) : ''; };
  const pending = () => { const b = document.getElementById('eventsBadge'); return b && !b.classList.contains('hidden') ? Number(b.textContent) || 0 : 0; };
  function log(k, extra) { if (!isOn()) return; const a = read(); a.push(Object.assign({ t: Date.now(), s: sid, k }, extra || {})); ls.set(KEY_LOG, JSON.stringify(a.slice(-MAX))); }
  function closePanel(why) { if (!cur) return; const ms = Math.min(Date.now() - curAt, IDLE_MS); log('panel_time', { panel: cur, ms, why }); cur = null; }
  function openPanel(p) { if (!isOn()) return; closePanel('troca'); cur = p; curAt = Date.now(); lastAct = Date.now(); log('panel_open', { panel: p, game: gameTime(), pending: pending() }); }
  document.addEventListener('kot:panel', (e) => openPanel(e.detail));
  document.addEventListener('kot:refreshed', () => { if (isOn()) log('refresh', { game: gameTime(), pending: pending(), panel: cur }); });
  document.addEventListener('click', (e) => { if (!isOn()) return; lastAct = Date.now(); const b = e.target && e.target.closest && e.target.closest('button, [role="tab"], .nav-item, .modo-opt'); if (!b) return; const label = (b.id || b.dataset.panel || b.dataset.act || b.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 28); log('click', { el: label, panel: cur }); }, true);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') closePanel('oculto'); });
  window.addEventListener('pagehide', () => { if (isOn()) { closePanel('saida'); log('exit', { panel: cur, game: gameTime(), pending: pending() }); } });
  function summary() {
    const a = read(); const by = {}; let first = a.length ? a[0].t : 0, last = a.length ? a[a.length - 1].t : 0;
    for (const x of a) { if (x.k === 'panel_open') (by[x.panel] = by[x.panel] || { opens: 0, ms: 0 }).opens++; if (x.k === 'panel_time') (by[x.panel] = by[x.panel] || { opens: 0, ms: 0 }).ms += x.ms; }
    const clicks = {}; for (const x of a) if (x.k === 'click') clicks[x.el] = (clicks[x.el] || 0) + 1; const exits = a.filter((x) => x.k === 'exit').map((x) => ({ panel: x.panel, game: x.game, pending: x.pending }));
    const maxPending = a.reduce((m, x) => Math.max(m, x.pending || 0), 0); const panels = Object.entries(by).map(([p, v]) => ({ panel: p, opens: v.opens, seconds: Math.round(v.ms / 1000) })).sort((x, y) => y.seconds - x.seconds);
    return { events: a.length, sessionMinutes: Math.round((last - first) / 60000), panels, topClicks: Object.entries(clicks).sort((x, y) => y[1] - x[1]).slice(0, 10), maxPending, exits };
  }
  function exportJson() { const blob = new Blob([JSON.stringify({ app: 'Kings or Thrones', exportedAt: new Date().toISOString(), summary: summary(), events: read() }, null, 1)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `kot-telemetria-${new Date().toISOString().slice(0, 10)}.json`; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); }
  function setOn(v) { if (v) { ls.set(KEY_ON, '1'); log('start', { game: gameTime(), ua: navigator.userAgent.slice(0, 60), w: window.innerWidth, h: window.innerHeight }); if (!cur) { const act = document.querySelector('.dash-panel.active'); if (act) { cur = act.dataset.panel; curAt = Date.now(); } } } else { closePanel('desligado'); ls.del(KEY_ON); } render(); }
  function render() {
    const box = document.getElementById('telemetryBox'); if (!box) return; const on = isOn(); const s = summary();
    box.innerHTML = `<h4>🧪 Teste com pessoas <small>(opcional)</small></h4><p class="hint">Grava <b>neste navegador</b> o tempo em cada painel, os botões usados, as decisões pendentes e onde a pessoa parou. <b>Nada é enviado</b>: só sai se você clicar em “Baixar”. Desligado por padrão.</p>
      <label class="tl-on"><input type="checkbox" id="tlToggle" ${on ? 'checked' : ''}> Gravar o registro de uso neste navegador</label>
      <div class="tl-sum" aria-live="polite">${s.events ? `<b>${s.events}</b> eventos · <b>${s.sessionMinutes}</b> min · painéis: ${s.panels.slice(0, 5).map((p) => `${p.panel} (${p.seconds}s, ${p.opens}×)`).join(', ') || '—'} · pendências máx.: ${s.maxPending}` : 'Sem registro ainda.'}</div>
      <div class="tl-btns"><button type="button" class="btn btn-ghost btn-sm" id="tlExport" ${s.events ? '' : 'disabled'}>⬇️ Baixar registro (JSON)</button> <button type="button" class="btn btn-ghost btn-sm" id="tlClear" ${s.events ? '' : 'disabled'}>🗑️ Apagar registro</button></div>`;
    document.getElementById('tlToggle').addEventListener('change', (e) => setOn(e.target.checked)); document.getElementById('tlExport').addEventListener('click', exportJson); document.getElementById('tlClear').addEventListener('click', () => { ls.del(KEY_LOG); render(); });
  }
  function mount() { const host = document.querySelector('.dash-panel[data-panel="config"] .config-panel'); if (!host || document.getElementById('telemetryBox')) return; const box = document.createElement('div'); box.id = 'telemetryBox'; box.className = 'tl-card'; host.appendChild(box); render(); }
  document.addEventListener('kot:panel', (e) => { if (e.detail === 'config') { mount(); render(); } }); setTimeout(mount, 1200);
  K.telemetry = { isOn, setOn, summary, read, exportJson, clear: () => { ls.del(KEY_LOG); render(); } };
})();
