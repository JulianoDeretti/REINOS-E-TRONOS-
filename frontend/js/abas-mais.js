// js/abas-mais.js — Etapa 77: CONSOLIDAÇÃO DAS ABAS. 24 barras de abas/filtros (`.category-filter`, 239 botões no total) e 12 delas com 9 a 27 botões (Objetivos 27, Tecnologia 26, Construções 18, Diplomacia 16…).
// Barras com 9 ou mais botões mostram os 6 primeiros MAIS o ativo e agrupam o resto em "Mais (N) ▾". Nada é removido: é só um agrupamento reversível; o estado "expandida" é lembrado por painel e barra.
(function () {
  const LIMIT = 9, SHOW = 6, aberta = new Map(); let agendado = false; const bots = (bar) => [...bar.children].filter((c) => c.tagName === 'BUTTON' && !c.classList.contains('aba-mais-btn'));
  const chave = (bar) => { const p = bar.closest('.dash-panel'); return (p ? p.dataset.panel : '?') + '|' + [...(p || document).querySelectorAll('.category-filter')].indexOf(bar); };
  function atualizar(bar) {
    const bs = bots(bar); const extras = bs.filter((b, i) => i >= SHOW && !b.classList.contains('active')); bs.forEach((b, i) => b.classList.toggle('aba-extra', i >= SHOW && !b.classList.contains('active')));
    const t = bar.querySelector(':scope > .aba-mais-btn'); if (t) { const ab = bar.classList.contains('aba-aberta'); const tx = ab ? 'Menos ▴' : `Mais (${extras.length}) ▾`; const ocultar = extras.length === 0 && !ab;
      /* SÓ escreve quando muda: gravar textContent toda vez é uma mutação que o próprio observador vê, e o ciclo nunca termina (nas versões das Etapas 77 a 80 corria a cada quadro; com a aplicação imediata travava a página) */
      if (t.textContent !== tx) t.textContent = tx; if (t.getAttribute('aria-expanded') !== String(ab)) t.setAttribute('aria-expanded', String(ab)); if (t.hidden !== ocultar) t.hidden = ocultar; }
  }
  function aplicar(bar) {
    /* o painel pode redesenhar a barra com innerHTML NO MESMO elemento (ex.: #dpTabs), o que apaga o botão "Mais": por isso a condição é a AUSÊNCIA do botão, não uma marca no elemento */
    if (bar.querySelector(':scope > .aba-mais-btn')) return; const bs = bots(bar); if (bs.length < LIMIT) return; bar.dataset.mais = '1'; const k = chave(bar);
    const t = document.createElement('button'); t.type = 'button'; t.className = 'category-chip aba-mais-btn'; t.addEventListener('click', (e) => { e.stopPropagation(); e.preventDefault(); const ab = bar.classList.toggle('aba-aberta'); aberta.set(k, ab); atualizar(bar); });
    bar.appendChild(t); if (aberta.get(k)) bar.classList.add('aba-aberta'); atualizar(bar);
  }
  let passadas = 0, janela = { t0: 0, n: 0 }, desligado = false, mo = null;
  function varrer() { if (desligado) return; passadas++; const agora = Date.now(); if (agora - janela.t0 > 1000) janela = { t0: agora, n: 0 }; if (++janela.n > 200) { desligado = true; if (mo) mo.disconnect(); console.warn('abas-mais: mais de 200 passadas em 1 s; módulo desligado por segurança'); return; } agendado = false; document.querySelectorAll('.category-filter').forEach((bar) => { if (bar.querySelector(':scope > .aba-mais-btn')) atualizar(bar); else aplicar(bar); }); }
  /* Etapa 81: aplica NA HORA (o callback do MutationObserver roda antes da pintura). Antes agendava com requestAnimationFrame: a cada redesenho da barra havia um quadro com TODAS as abas (um piscar) e uma janela sem o botão "Mais". As mudanças do módulo só são gravadas quando mudam, então a 2ª passada não altera nada e o ciclo termina; há um disjuntor de 200 passadas por segundo. */
  mo = new MutationObserver(() => varrer()); mo.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] }); varrer();
  window.KOT = window.KOT || {}; window.KOT.abasMais = { varrer, LIMIT, SHOW, passadas: () => passadas, desligado: () => desligado };
})();
