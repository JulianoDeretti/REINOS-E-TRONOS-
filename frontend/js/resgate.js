// js/resgate.js — Etapa 76: cartão "Regiões perdidas" no painel de guerra. Só aparece quando uma incursão tomou uma região de fronteira; permite RESGATÁ-LA por ouro (3× o custo de reivindicar; ×1,5 em guerra com quem a tomou).
(function () {
  const K = window.KOT, API = (typeof Api !== 'undefined' ? Api : window.Api); if (!K || !API) return; const esc = K.escapeHtml; const fmt = K.fmt || ((n) => String(n)); const HOSTS = ['exercito', 'guerra']; let busy = false;
  async function render(panel) {
    if (!HOSTS.includes(panel) || busy) return; const host = document.querySelector(`.dash-panel[data-panel="${panel}"]`); if (!host) return; busy = true; let d; try { d = await API.lostTerritories(); } catch { busy = false; return; } busy = false;
    let box = host.querySelector(':scope > .rs-box'); const lost = (d && d.lost) || []; if (!lost.length) { if (box) box.remove(); return; }
    if (!box) { box = document.createElement('div'); box.className = 'rs-box'; const ref = host.querySelector(':scope > .pilar-banner'); if (ref) ref.after(box); else host.insertBefore(box, host.firstChild); }
    box.innerHTML = `<div class="rs-card" role="alert"><h3>🏴 Regiões perdidas <small>(você pode resgatá-las por ouro, sem guerra)</small></h3><p class="hint">Uma incursão tomou ${lost.length === 1 ? 'esta região' : 'estas regiões'} da sua fronteira. O resgate custa <b>3× o custo de reivindicar</b> (<b>×1,5</b> enquanto estiver em guerra com quem a tomou). Reconquistar pela guerra continua possível.</p>${lost.map((x) => `<div class="rs-row"><span><b>(${x.row + 1},${x.col + 1})</b> ${esc(x.terrain)} · tomada por ${esc(x.aiName)} no dia ${x.lostDay}</span><button type="button" class="btn btn-primary btn-sm" data-rs="${x.territoryId}" ${d.gold < x.cost ? 'disabled title="Ouro insuficiente"' : ''}>Resgatar por 💰 ${fmt(x.cost)}</button></div>`).join('')}</div>`;
    box.querySelectorAll('[data-rs]').forEach((b) => b.addEventListener('click', async () => { b.disabled = true; try { const r = await API.ransomTerritory(Number(b.dataset.rs)); if (K.showToast) K.showToast('🏴 ' + ((r && r.message) || 'Região resgatada.')); if (K.refreshAll) await K.refreshAll(true); await render(panel); } catch (err) { if (K.showToast) K.showToast('⚠️ ' + err.message); b.disabled = false; } }));
  }
  document.addEventListener('kot:panel', (e) => render(e.detail)); document.addEventListener('kot:refreshed', () => { const a = document.querySelector('.dash-panel.active'); if (a) render(a.dataset.panel); });
  window.KOT.resgate = { render };
})();
