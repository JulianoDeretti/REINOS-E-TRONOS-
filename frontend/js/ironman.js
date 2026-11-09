// js/ironman.js — Etapa 65: modo IRONMAN. Cartão na Campanha (ativar com confirmação / estado), selo ☠️ no menu e "Liberar tudo" escondido.
(function () {
  const K = window.KOT || (window.KOT = {}); const API = () => (typeof Api !== 'undefined' ? Api : window.Api); /* Api é const de escopo global, não propriedade de window */ const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  K.ironmanCard = function (c) {
    const i = c && c.ironman; if (!i) return '';
    if (i.on) return `<div class="im-card on" role="note"><strong>☠️ Ironman ativo</strong> desde o dia ${i.since || '?'} <span class="hint">· dificuldade travada · sem modo livre depois do fim · pontuação final ×${String(i.scoreMult).replace('.', ',')}</span></div>`;
    if (i.can) return `<div class="im-card"><strong>☠️ Ironman</strong> <span class="hint">Sem volta: a dificuldade fica travada, o fim (vitória ou derrota) é definitivo — não há modo livre — e a pontuação final vale ×${String(i.scoreMult).replace('.', ',')}. Só pode ser ativado nos primeiros ${i.windowDays} dias (restam ${i.daysLeft}).</span> <button class="btn btn-ghost btn-sm" id="imEnable" type="button">☠️ Ativar Ironman</button></div>`;
    return `<div class="im-card off"><strong>☠️ Ironman</strong> <span class="hint">${esc(i.why || 'Indisponível.')}</span></div>`;
  };
  K.ironmanBind = function (refreshAll, showToast) {
    const b = document.getElementById('imEnable'); if (!b || b.dataset.bound) return; b.dataset.bound = '1';
    b.addEventListener('click', async () => { if (!window.confirm('Ativar o modo Ironman?\n\nIsto é IRREVERSÍVEL:\n• a dificuldade fica travada;\n• o fim da campanha (vitória ou derrota) é definitivo, sem modo livre;\n• a pontuação final vale ×1,25.')) return; try { const r = await API().enableIronman(); showToast(r.message); K.ironmanBadge(true); await refreshAll(true); } catch (err) { showToast(`⚠️ ${err.message}`); } });
  };
  K.ironmanBadge = function (on) { document.body.classList.toggle('ironman', !!on); const nav = document.querySelector('.dash-nav'); if (!nav) return; let b = nav.querySelector(':scope > .ironman-badge'); if (on && !b) { b = document.createElement('div'); b.className = 'ironman-badge'; b.setAttribute('role', 'status'); b.textContent = '☠️ Ironman'; b.title = 'Modo Ironman: dificuldade travada, sem modo livre, pontuação ×1,25'; nav.insertBefore(b, nav.firstChild); } else if (!on && b) b.remove(); };
  let last = 0, known = false; async function check() { if (known) { K.ironmanBadge(true); return; } if (Date.now() - last < 20000) return; last = Date.now(); try { const t = await API().raw('/time'); if (t && t.ironman) { known = true; K.ironmanBadge(true); } } catch { /* sem selo */ } }
  document.addEventListener('kot:refreshed', check); setTimeout(check, 1500);
})();
