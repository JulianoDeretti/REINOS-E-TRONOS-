// js/icones.js — Etapa 58: ÍCONES SVG próprios (estilo único, medieval chapado) no lugar dos emojis onde a troca é segura:
// chips de recurso (pela CHAVE do recurso, não pelo emoji), pilares do menu e "Hoje". O resto da interface mantém os emojis (cobertura parcial, assumida). Sem ícone = o emoji continua.
(function () {
  const K = window.KOT; if (!K) return;
  const sv = (inner) => `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${inner}</svg>`;
  const st = (c, w = 1.7) => `fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`;
  const ICONS = {
    // ---- recursos (coloridos, para reconhecer de longe)
    gold: sv('<circle cx="12" cy="12" r="9.5" fill="#e8b923" stroke="#8a6a10" stroke-width="1.6"/><circle cx="12" cy="12" r="6.2" fill="none" stroke="#b8860b" stroke-width="1.3"/><path d="M12 7.8v8.4M9.8 10c0-1.2 4.4-1.2 4.4 0s-4.4 1.2-4.4 2.4 4.4 1.2 4.4 0" ' + st('#8a6a10', 1.3) + '/>'),
    food: sv('<path d="M12 21V8" ' + st('#8a6a1c', 1.6) + '/><ellipse cx="12" cy="5.2" rx="2" ry="3.2" fill="#e3b341" stroke="#9a7416" stroke-width=".9"/><ellipse cx="8.8" cy="9.6" rx="2" ry="3.2" transform="rotate(-30 8.8 9.6)" fill="#e3b341" stroke="#9a7416" stroke-width=".9"/><ellipse cx="15.2" cy="9.6" rx="2" ry="3.2" transform="rotate(30 15.2 9.6)" fill="#e3b341" stroke="#9a7416" stroke-width=".9"/><ellipse cx="8.8" cy="14.6" rx="2" ry="3.2" transform="rotate(-30 8.8 14.6)" fill="#e3b341" stroke="#9a7416" stroke-width=".9"/><ellipse cx="15.2" cy="14.6" rx="2" ry="3.2" transform="rotate(30 15.2 14.6)" fill="#e3b341" stroke="#9a7416" stroke-width=".9"/>'),
    wood: sv('<path d="M12 2.5l6.5 8h-3.2l4 5.5H4.7l4-5.5H5.5z" fill="#3f8f3f" stroke="#1f5a22" stroke-width="1.2" stroke-linejoin="round"/><rect x="10.6" y="16" width="2.8" height="5.5" fill="#7a4a1c" stroke="#4a2c0e" stroke-width="1"/>'),
    stone: sv('<rect x="3" y="5" width="18" height="14" rx="1.5" fill="#b9b4a6" stroke="#6b665a" stroke-width="1.4"/><path d="M3 9.7h18M3 14.3h18M9 5v4.7M15 9.7v4.6M9 14.3V19" ' + st('#6b665a', 1.2) + '/>'),
    iron: sv('<path d="M4 8c3-4 13-4 16 0" ' + st('#5d6770', 2.6) + '/><path d="M12 6.3V21" ' + st('#7a4a1c', 2.4) + '/>'),
    coal: sv('<path d="M5 15l2-7 6-3 6 4 1 7-5 4-8-1z" fill="#3a3a40" stroke="#16161a" stroke-width="1.3" stroke-linejoin="round"/><path d="M9 11l3-1.5M13 15l3-2" ' + st('#8a8a96', 1.1) + '/>'),
    copper: sv('<path d="M3.5 17l2.5-8h12l2.5 8z" fill="#c8793a" stroke="#7a4218" stroke-width="1.4" stroke-linejoin="round"/><path d="M7.5 12.5h9" ' + st('#e8a566', 1.3) + '/>'),
    silver: sv('<path d="M3.5 17l2.5-8h12l2.5 8z" fill="#cfd6df" stroke="#6d7783" stroke-width="1.4" stroke-linejoin="round"/><path d="M7.5 12.5h9" ' + st('#f2f5f8', 1.3) + '/>'),
    marble: sv('<rect x="5" y="3.5" width="14" height="3" rx=".8" fill="#e9e4da" stroke="#8a857a" stroke-width="1.2"/><rect x="7.2" y="6.5" width="9.6" height="11" fill="#f4f0e8" stroke="#8a857a" stroke-width="1.2"/><path d="M10 7v10M14 7v10" ' + st('#c9c3b6', 1) + '/><rect x="5" y="17.5" width="14" height="3" rx=".8" fill="#e9e4da" stroke="#8a857a" stroke-width="1.2"/>'),
    crystals: sv('<path d="M12 2.8l6.5 5.2-6.5 13-6.5-13z" fill="#5ec8e8" stroke="#1d7ea0" stroke-width="1.4" stroke-linejoin="round"/><path d="M5.5 8h13M9 8l3 13 3-13M9 8l3-5.2L15 8" ' + st('#1d7ea0', 1) + '/>'),
    mana: sv('<circle cx="12" cy="12" r="8.5" fill="#8a5cf0" stroke="#4a2a9a" stroke-width="1.4"/><path d="M12 6.5l1.2 3.3 3.3 1.2-3.3 1.2L12 15.5l-1.2-3.3-3.3-1.2 3.3-1.2z" fill="#f4eaff"/>'),
    // ---- menu (traço com a cor do texto)
    hoje: sv('<path d="M6 4h11a2 2 0 012 2v12a2 2 0 01-2 2H8a3 3 0 01-3-3V5a1 1 0 011-1z" ' + st('currentColor') + '/><path d="M9 9h7M9 12.5h7M9 16h4" ' + st('currentColor', 1.6) + '/>'),
    reino: sv('<path d="M4 21V8h3v2h2V8h2v2h2V8h3v2h2V8h2v13z" ' + st('currentColor') + '/><path d="M10.5 21v-5a1.5 1.5 0 013 0v5" ' + st('currentColor', 1.6) + '/>'),
    corte: sv('<path d="M3.5 18.5l-1-10 5.2 4.3L12 5l4.3 7.8 5.2-4.3-1 10z" ' + st('currentColor') + '/><path d="M5 21h14" ' + st('currentColor') + '/>'),
    fe: sv('<path d="M4 5.5C7 4.2 10 4.4 12 6c2-1.6 5-1.8 8-.5V19c-3-1.3-6-1.1-8 .5-2-1.6-5-1.8-8-.5z" ' + st('currentColor') + '/><path d="M12 6v13.5" ' + st('currentColor', 1.5) + '/>'),
    guerra: sv('<path d="M5 4l9.5 9.5M19 4l-9.5 9.5" ' + st('currentColor', 1.9) + '/><path d="M13 12l4 4M11 12l-4 4M15.5 17.5l2 2M8.5 17.5l-2 2" ' + st('currentColor', 1.8) + '/>'),
    mundo: sv('<circle cx="12" cy="12" r="8.5" ' + st('currentColor') + '/><path d="M3.5 12h17M12 3.5c3 3 3 14 0 17M12 3.5c-3 3-3 14 0 17" ' + st('currentColor', 1.4) + '/>'),

    // ---- Etapa 74: os demais itens do menu (traço com a cor do texto)
    painel: sv('<path d="M5 21V10l7-5 7 5v11z" ' + st('currentColor') + '/><path d="M12 5V2.5l4 1.2-4 1.3M9.5 21v-5h5v5" ' + st('currentColor', 1.5) + '/>'),
    trofeu: sv('<path d="M7 4h10v5a5 5 0 01-10 0z" ' + st('currentColor') + '/><path d="M7 6H4.5v1.5A3 3 0 007.5 10.5M17 6h2.5v1.5a3 3 0 01-3 3M12 14v4M8.5 20h7" ' + st('currentColor', 1.6) + '/>'),
    governo: sv('<path d="M3.5 9.5L12 4l8.5 5.5z" ' + st('currentColor') + '/><path d="M6 11v7M10 11v7M14 11v7M18 11v7M4 20h16" ' + st('currentColor', 1.6) + '/>'),
    festas: sv('<path d="M3 6c4 4 14 4 18 0" ' + st('currentColor', 1.6) + '/><path d="M6 8.3l1.5 4 1.5-3.3M11 9.4l1.5 4 1.5-4M16 8.6l1.5 4 1.5-3.7" ' + st('currentColor', 1.5) + '/><path d="M12 15.5v2.2M9.5 18.5h5" ' + st('currentColor', 1.4) + '/>'),
    construcoes: sv('<path d="M14.5 6.5l3-3 3 3-3 3z" ' + st('currentColor') + '/><path d="M15.5 8.5L5 19l-1.5 1.5" ' + st('currentColor', 2) + '/><path d="M5 19l2-2" ' + st('currentColor', 1.6) + '/>'),
    populacao: sv('<circle cx="9" cy="8" r="3" ' + st('currentColor') + '/><path d="M3.5 19c0-3.2 2.4-5.5 5.5-5.5s5.5 2.3 5.5 5.5" ' + st('currentColor') + '/><circle cx="17" cy="9" r="2.4" ' + st('currentColor', 1.5) + '/><path d="M16 14c3 0 5 1.8 5 5" ' + st('currentColor', 1.5) + '/>'),
    exercito: sv('<path d="M12 3l7 2.5v5.5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V5.5z" ' + st('currentColor') + '/><path d="M12 8v7M9 11h6" ' + st('currentColor', 1.6) + '/>'),
    cidades: sv('<path d="M3 20V12l4-3 4 3v8M11 20v-9l5-3.5 5 3.5v9z" ' + st('currentColor') + '/><path d="M6 15h2M14 14h2M14 17h2" ' + st('currentColor', 1.5) + '/>'),
    politica: sv('<path d="M12 4v16M5 20h14M12 7L6 9l-3 6a3.2 3.2 0 006 0L6 9M12 7l6 2 3 6a3.2 3.2 0 01-6 0l3-6" ' + st('currentColor', 1.6) + '/>'),
    tecnologia: sv('<path d="M9 3h6M10 3v6l-5 9a2 2 0 001.8 3h10.4a2 2 0 001.8-3l-5-9V3" ' + st('currentColor') + '/><path d="M8 15h8" ' + st('currentColor', 1.5) + '/>'),
    exploracao: sv('<circle cx="12" cy="12" r="8.5" ' + st('currentColor') + '/><path d="M15.5 8.5l-2 5-5 2 2-5z" ' + st('currentColor', 1.6) + '/>'),
    comerciointl: sv('<path d="M4 15l2 4h12l2-4zM12 15V4l6 8h-6" ' + st('currentColor') + '/><path d="M12 6L7 13h5" ' + st('currentColor', 1.5) + '/>'),
    diplomacia: sv('<rect x="3.5" y="6" width="17" height="12" rx="1.5" ' + st('currentColor') + '/><path d="M3.5 7.5l8.5 6 8.5-6" ' + st('currentColor', 1.6) + '/>'),
    cultura: sv('<path d="M9 17V6l9-2v11" ' + st('currentColor') + '/><circle cx="7" cy="17.5" r="2.5" ' + st('currentColor', 1.6) + '/><circle cx="16" cy="15.5" r="2.5" ' + st('currentColor', 1.6) + '/>'),
    seguranca: sv('<path d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z" ' + st('currentColor') + '/><path d="M9 12l2.2 2.2L15.5 10" ' + st('currentColor', 1.7) + '/>'),
    magia: sv('<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" ' + st('currentColor') + '/><path d="M18.5 15.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" ' + st('currentColor', 1.3) + '/>'),
    dinastia: sv('<circle cx="12" cy="5" r="2.2" ' + st('currentColor') + '/><circle cx="6" cy="18" r="2.2" ' + st('currentColor') + '/><circle cx="18" cy="18" r="2.2" ' + st('currentColor') + '/><path d="M12 7.2V12M12 12L6 15.8M12 12l6 3.8" ' + st('currentColor', 1.6) + '/>'),
    religiao: sv('<path d="M12 3v18M7 8h10" ' + st('currentColor', 2) + '/><circle cx="12" cy="8" r="7.5" ' + st('currentColor', 1.2) + '/>'),
    infra: sv('<path d="M2.5 17c0-5 4-9 9.5-9s9.5 4 9.5 9" ' + st('currentColor') + '/><path d="M2.5 17h19M7.5 17v-5.5M12 17V8M16.5 17v-5.5" ' + st('currentColor', 1.5) + '/>'),
    economia: sv('<ellipse cx="12" cy="7" rx="7" ry="3" ' + st('currentColor') + '/><path d="M5 7v5c0 1.7 3.1 3 7 3s7-1.3 7-3V7M5 12v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5" ' + st('currentColor') + '/>'),
    mapa: sv('<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z" ' + st('currentColor') + '/><path d="M9 4v14M15 6v14" ' + st('currentColor', 1.4) + '/>'),
    eventos: sv('<path d="M6 17V11a6 6 0 0112 0v6l1.5 2h-15z" ' + st('currentColor') + '/><path d="M10 21a2 2 0 004 0" ' + st('currentColor', 1.6) + '/>'),
    objetivos: sv('<circle cx="12" cy="12" r="8.5" ' + st('currentColor') + '/><circle cx="12" cy="12" r="4.8" ' + st('currentColor', 1.5) + '/><circle cx="12" cy="12" r="1.4" fill="currentColor"/>'),
    personagens: sv('<circle cx="12" cy="8" r="3.8" ' + st('currentColor') + '/><path d="M4.5 20.5c0-4.2 3.2-7 7.5-7s7.5 2.8 7.5 7" ' + st('currentColor') + '/>'),
    historico: sv('<path d="M6 3h12M6 21h12M7 3c0 5 3 6 5 9-2 3-5 4-5 9M17 3c0 5-3 6-5 9 2 3 5 4 5 9" ' + st('currentColor', 1.6) + '/>'),
    menu: sv('<path d="M4 7h16M4 12h16M4 17h16" ' + st('currentColor', 2) + '/>'),
    config: sv('<circle cx="12" cy="12" r="3" ' + st('currentColor') + '/><path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7" ' + st('currentColor', 1.8) + '/>'),
  };
  const MBAR = { hoje: 'hoje', painel: 'painel', construcoes: 'construcoes', governo: 'governo', more: 'menu' }; const PILLAR = { reino: 'reino', corte: 'corte', fe: 'fe', guerra: 'guerra', mundo: 'mundo' }; const NAV = { hoje: 'hoje', painel: 'painel', campanha: 'trofeu', governo: 'governo', mundo: 'mundo', festas: 'festas', construcoes: 'construcoes', populacao: 'populacao', exercito: 'exercito', cidades: 'cidades', politica: 'politica', tecnologia: 'tecnologia', exploracao: 'exploracao', comerciointl: 'comerciointl', diplomacia: 'diplomacia', guerra: 'guerra', cultura: 'cultura', seguranca: 'seguranca', magia: 'magia', dinastia: 'dinastia', religiao: 'religiao', infra: 'infra', economia: 'economia', mapa: 'mapa', eventos: 'eventos', objetivos: 'objetivos', personagens: 'personagens', historico: 'historico', config: 'config' }; /* Etapa 74: todos os 29 itens do menu */
  const html = (key) => ICONS[key] || null;
  function chip(c) { if (c.querySelector(':scope > svg.ico')) return; const ico = html(c.dataset.resource); if (!ico) return; const tn = [...c.childNodes].find((n) => n.nodeType === 3 && n.nodeValue.trim()); if (!tn) return; const rest = tn.nodeValue.replace(/^\s*\S+\s?/, ''); const w = document.createElement('span'); w.className = 'ico-wrap'; w.innerHTML = ico; w.dataset.emoji = tn.nodeValue.trim().split(/\s/)[0]; c.insertBefore(w, tn); if (rest.trim()) tn.nodeValue = rest; else tn.remove(); }
  function apply(root) {
    const r = root && root.querySelectorAll ? root : document;
    r.querySelectorAll('#resourceStrip .resource-chip[data-resource]').forEach(chip);
    r.querySelectorAll('.pilar .ph-ico').forEach((e) => { if (e.querySelector('svg')) return; const k = PILLAR[e.closest('.pilar').dataset.pilar]; const ico = html(k); if (ico) { e.dataset.emoji = e.textContent.trim(); e.innerHTML = ico; } });
    r.querySelectorAll('.nav-item[data-panel] > span:first-child').forEach((e) => { if (e.querySelector('svg') || e.classList.contains('nav-count')) return; const ico = html(NAV[e.parentNode.dataset.panel]); if (ico) { e.dataset.emoji = e.textContent.trim(); e.innerHTML = ico; } });
    r.querySelectorAll('#mBottom button[data-m] > span:first-child').forEach((e) => { if (e.querySelector('svg')) return; const ico = html(MBAR[e.parentNode.dataset.m]); if (ico) { e.dataset.emoji = e.textContent.trim(); e.innerHTML = ico; } }); /* Etapa 82: barra inferior do celular */
  }
  let raf = 0; const later = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; apply(document); }); };
  const strip = document.getElementById('resourceStrip'); if (strip) new MutationObserver(later).observe(strip, { childList: true, subtree: false });
  document.addEventListener('kot:refreshed', later); document.addEventListener('kot:panel', later); apply(document);
  window.KOT.icons = { apply, ICONS, has: (k) => !!ICONS[k] };
})();
