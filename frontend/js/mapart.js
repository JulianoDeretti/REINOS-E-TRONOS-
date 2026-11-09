// js/mapart.js — Etapa 43: MAPA ILUSTRADO. Azulejos desenhados por terreno (SVG, sem arquivos), cidades que crescem por nível, capital com bandeira,
// marcadores clicáveis (decisões pendentes, festa, batalha). Só muda a APARÊNCIA: toda a interação do mapa (clique, zoom, camadas, fronteiras) continua a mesma.
(function () {
  const K = window.KOT; if (!K) return;
  const uri = (inner) => 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' preserveAspectRatio='none'>${inner}</svg>`);
  const base = (c1, c2, f) => `<defs><linearGradient id='g' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='${c1}'/><stop offset='1' stop-color='${c2}'/></linearGradient></defs><rect width='32' height='32' fill='url(#g)'/>${f}`;
  const tree = (x, y, s, c1, c2) => `<path d='M${x} ${y + 9 * s}l${4.5 * s} ${-9 * s} ${4.5 * s} ${9 * s}z' fill='${c1}'/><path d='M${x + 0.8 * s} ${y + 4 * s}l${3.7 * s} ${-8 * s} ${3.7 * s} ${8 * s}z' fill='${c2}'/><rect x='${x + 4 * s}' y='${y + 9 * s}' width='${s}' height='${2 * s}' fill='#5a3a1a'/>`;
  const star = (x, y, c) => `<path d='M${x} ${y - 3}l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z' fill='${c}'/>`;
  const TILES = {
    planicie: ['#dccb74', '#c3af5c', `<g stroke='#a39440' stroke-width='1.3' stroke-linecap='round' fill='none'><path d='M6 22l1-4M9 24l1-4M22 10l1-4M25 12l1-4M14 15l1-3M24 25l1-4'/></g><circle cx='12' cy='8' r='1' fill='#f6ecb0'/><circle cx='27' cy='19' r='1' fill='#f6ecb0'/>`],
    floresta: ['#4f8a46', '#37692f', tree(3, 14, 1, '#25501f', '#2f6b27') + tree(15, 6, 1.1, '#25501f', '#37802f') + tree(20, 17, 0.9, '#1f4a1b', '#2f6b27')],
    montanha: ['#9a948a', '#756f64', `<path d='M1 29L12 7l7 13 4-6 9 15z' fill='#6c675c'/><path d='M12 7l-3.8 7.2 3.2-1.6 2.2 2.4 2-3.8z' fill='#f4f4ef'/><path d='M23 14l-2.6 5 2.2-1 2 2z' fill='#eee'/>`],
    colina: ['#b2bd68', '#98a655', `<path d='M-2 27Q8 9 19 27z' fill='#8d9c4a'/><path d='M11 29Q23 11 35 29z' fill='#a9b85c'/><path d='M4 22q2-2 4 0' stroke='#cfd98a' fill='none'/>`],
    pantano: ['#6a8456', '#4f6642', `<ellipse cx='10' cy='21' rx='8' ry='3' fill='#38502f' opacity='.75'/><ellipse cx='23' cy='11' rx='6' ry='2.4' fill='#38502f' opacity='.7'/><g stroke='#8fae6a' stroke-width='1.2'><path d='M5 20v-7M8 21v-6M24 10V4M27 11V6'/></g>`],
    vulcanica: ['#5a4040', '#3a2626', `<path d='M2 30L13 10h7l11 20z' fill='#2c1c1c'/><path d='M13 10h7l-1.2 3.4h-4.6z' fill='#ff7a2f'/><path d='M16 13l-3 17M17 13l4 17' stroke='#d6531c' stroke-width='1.4'/><circle cx='8' cy='6' r='2' fill='#7a6a6a' opacity='.6'/>`],
    congelada: ['#e2f0f7', '#bcd7e6', `<g stroke='#fff' stroke-width='1.5' stroke-linecap='round'><path d='M16 5v22M5 16h22M8.5 8.5l15 15M23.5 8.5l-15 15'/></g><g stroke='#8fb6cf' stroke-width='.8'><path d='M16 9v14M9 16h14'/></g>`],
    selva: ['#3f8a3c', '#276a2a', `<g stroke='#5a3a1a' stroke-width='2'><path d='M9 29V15M22 27V12'/></g><g stroke='#1f8a30' stroke-width='2.2' fill='none' stroke-linecap='round'><path d='M9 15q-6-1-8 3M9 15q6-1 8 3M9 15q-3-5-7-3M9 15q3-5 7-3M22 12q-6-1-8 3M22 12q6-1 8 3M22 12q-3-5-7-3M22 12q3-5 7-3'/></g>`],
    tundra: ['#cfd8d3', '#aab7b1', `<ellipse cx='9' cy='20' rx='7' ry='3' fill='#f4f8f6'/><ellipse cx='23' cy='9' rx='6' ry='2.5' fill='#f4f8f6'/><g stroke='#7d8c63' stroke-width='1.2' fill='none'><path d='M20 24l1-3M23 25l1-3M5 10l1-3'/></g>`],
    ruinas: ['#9a8a74', '#7c6c58', `<rect x='6' y='14' width='5' height='13' fill='#b5a893'/><rect x='5' y='12' width='7' height='3' fill='#c8bda8'/><rect x='17' y='19' width='5' height='8' fill='#a69a86'/><path d='M22 19l3-3 2 2-2 3z' fill='#b5a893'/><rect x='13' y='24' width='3' height='3' fill='#a69a86'/>`],
    antigas: ['#97997a', '#787a5c', `<path d='M5 28V15q11-14 22 0v13h-4V16q-7-8-14 0v12z' fill='#b9bb9a'/><path d='M9 28V17M23 28V17' stroke='#8a8c6c'/><circle cx='16' cy='8' r='1.4' fill='#e0c860'/>`],
    deserto: ['#ecd397', '#d8bd7c', `<path d='M0 21q8-6 16 0t16 0' stroke='#c2a15a' stroke-width='1.6' fill='none'/><path d='M0 28q8-5 16 0t16 0' stroke='#c9ad6a' stroke-width='1.4' fill='none'/><g fill='#5f8a3f'><rect x='22' y='8' width='2.6' height='9' rx='1.2'/><rect x='19.5' y='11' width='2.4' height='1.8' rx='.9'/><rect x='24.6' y='9.5' width='2.4' height='1.8' rx='.9'/></g>`],
    vale: ['#8cbb62', '#6f9f4f', `<path d='M-1 27Q10 15 20 21T34 9' stroke='#5ea3c9' stroke-width='3.4' fill='none' stroke-linecap='round'/><path d='M-1 27Q10 15 20 21T34 9' stroke='#a6d5ea' stroke-width='1' fill='none'/><circle cx='6' cy='8' r='1.1' fill='#f1e68a'/><circle cx='26' cy='26' r='1.1' fill='#f1a8c4'/>`],
    costa: ['#efe2b0', '#d9c78a', `<path d='M0 7q4-3 8 0t8 0t8 0t8 0V0H0z' fill='#8fcbe8'/><path d='M0 8q4-3 8 0t8 0t8 0t8 0' stroke='#fff' stroke-width='1.4' fill='none'/><ellipse cx='10' cy='22' rx='2.2' ry='1.4' fill='#f3b8a8'/><circle cx='24' cy='17' r='1' fill='#cdb77a'/>`],
    magico: ['#7a5aa8', '#523a82', `${star(9, 9, '#f2e6ff')}${star(23, 14, '#ffe27a')}${star(13, 24, '#9fe8ff')}<circle cx='16' cy='16' r='9' stroke='#b894f2' stroke-width='.9' fill='none' opacity='.7'/>`],
    oceano: ['#3f87b0', '#285f86', `<g stroke='#a7d6ee' stroke-width='1.3' fill='none' stroke-linecap='round' opacity='.85'><path d='M3 11q3-3 6 0t6 0M16 20q3-3 6 0t6 0M2 27q3-3 6 0'/></g>`],
    desconhecido: ['#33333d', '#24242c', `<g stroke='#444452' stroke-width='1' opacity='.6'><path d='M0 8h32M0 16h32M0 24h32M8 0v32M16 0v32M24 0v32'/></g>`],
  };
  const hut = (x, y, w, h, roof) => `<rect x='${x}' y='${y}' width='${w}' height='${h}' fill='#f1e6c8' stroke='#8a7a58' stroke-width='.5'/><path d='M${x - 1.2} ${y}L${x + w / 2} ${y - 5}L${x + w + 1.2} ${y}Z' fill='${roof}'/><rect x='${x + w / 2 - 1}' y='${y + h - 3.6}' width='2' height='3.6' fill='#6b4a2a'/>`;
  const tower = (x, y, w, h) => `<rect x='${x}' y='${y}' width='${w}' height='${h}' fill='#cfc7b3' stroke='#7a735f' stroke-width='.5'/><path d='M${x - 1} ${y}h${w + 2}v-2h-1.4v1.2h-1.4v-1.2h-1.4v1.2h-1.4v-1.2h-1.4v1.2h-1.4v-1.2h-1z' fill='#b9b09a'/>`;
  const CITY = {
    1: `<path d='M5 27l7-10 7 10z' fill='#d9a86a' stroke='#7a5a2a' stroke-width='.6'/><rect x='11' y='22' width='2' height='5' fill='#6b4a2a'/>${hut(19, 20, 8, 7, '#a0522d')}`,
    2: `${hut(3, 20, 8, 7, '#a0522d')}${hut(12, 17, 8, 10, '#8a3b2a')}${hut(21, 21, 7, 6, '#b5651d')}`,
    3: `${hut(2, 21, 7, 6, '#a0522d')}${tower(11, 11, 8, 16)}<path d='M10 11L15 4l5 7z' fill='#7a2f2a'/>${hut(21, 20, 8, 7, '#8a3b2a')}`,
    4: `${tower(2, 14, 7, 13)}${tower(23, 14, 7, 13)}<rect x='9' y='19' width='14' height='8' fill='#c7bfa9' stroke='#7a735f' stroke-width='.5'/>${hut(12, 13, 8, 6, '#8a3b2a')}<path d='M14 27v-5h4v5z' fill='#4a3a2a'/>`,
    5: `${tower(1, 12, 7, 15)}${tower(24, 12, 7, 15)}${tower(11, 6, 10, 21)}<path d='M10 6L16 -1l6 7z' fill='#7a2f2a'/><rect x='8' y='20' width='16' height='7' fill='#c7bfa9' stroke='#7a735f' stroke-width='.5'/><path d='M14 27v-5h4v5z' fill='#4a3a2a'/>`,
  };
  const CAPITAL = `${tower(2, 13, 7, 14)}${tower(23, 13, 7, 14)}${tower(11, 7, 10, 20)}<path d='M10 7L16 0l6 7z' fill='#b3262f'/><rect x='8' y='20' width='16' height='7' fill='#e0d3a8' stroke='#8a7a3a' stroke-width='.5'/><path d='M14 27v-6h4v6z' fill='#5a3a1a'/><path d='M16 0v-2' stroke='#6b4a2a'/><path d='M16 -1l6 2-6 2z' fill='#f2c94c'/><circle cx='16' cy='13' r='1.6' fill='#f2c94c'/>`;
  const cityUri = (inner) => uri(`<g transform='translate(0 2)'>${inner}</g>`).replace(/viewBox='0 0 32 32'/, "viewBox='0 0 32 32' overflow='visible'");
  const css = [];
  css.push(`.mapview-grid{position:relative}.mapview-grid .territory-cell{position:relative;background-size:140% 140%;background-position:0 0;box-shadow:inset 0 0 0 1px rgba(0,0,0,.1),inset 0 -5px 7px rgba(0,0,0,.14);border-radius:3px}.mapview-grid .territory-cell:nth-child(3n+1){background-position:0 0}.mapview-grid .territory-cell:nth-child(3n+2){background-position:100% 30%}.mapview-grid .territory-cell:nth-child(3n){background-position:40% 100%}`);
  for (const [k, [c1, c2, f]] of Object.entries(TILES)) css.push(`.mapview-grid .territory-cell.terrain-${k}{--tile:url("${uri(base(c1, c2, f))}");background-color:${c2};background-image:var(--tile)}`);
  css.push(`.mapview-grid .territory-cell[data-own]{background-image:linear-gradient(var(--own-tint),var(--own-tint)),var(--tile)}.mapview-grid .territory-cell.fog{background-size:100% 100%}`);
  css.push(`.mapview-grid .territory-cell[data-art]{font-size:0}.mapview-grid .territory-cell[data-art="site"]{font-size:inherit;filter:drop-shadow(0 1px 2px rgba(0,0,0,.6))}.mapview-grid .territory-cell[data-art="city"]::after,.mapview-grid .territory-cell[data-art="capital"]::after{content:'';position:absolute;inset:-12% -8% 0;background:var(--art) center bottom/100% 100% no-repeat;filter:drop-shadow(0 2px 2px rgba(0,0,0,.55));pointer-events:none}`);
  for (const l of [1, 2, 3, 4, 5]) css.push(`.mapview-grid .territory-cell[data-lvl="${l}"]{--art:url("${cityUri(CITY[l])}")}`);
  css.push(`.mapview-grid .territory-cell[data-art="capital"]{--art:url("${cityUri(CAPITAL)}")}`);
  css.push(`.map-pin{position:absolute;transform:translate(-50%,-110%);z-index:5;display:inline-flex;align-items:center;gap:3px;padding:2px 7px;border-radius:14px;border:2px solid #fff;background:#9a1f2e;color:#fff;font:700 12px/1.2 var(--font-display,serif);cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,.55);animation:pinBob 1.6s ease-in-out infinite}.map-pin.festa{background:#8a5a00}.map-pin.guerra{background:#5a1a6e}.map-pin:hover,.map-pin:focus-visible{outline:3px solid #ffe27a;transform:translate(-50%,-118%) scale(1.08)}@keyframes pinBob{0%,100%{margin-top:0}50%{margin-top:-3px}}html.a11y-rm .map-pin,html.a11y-hc .map-pin{animation:none}@media (prefers-reduced-motion:reduce){.map-pin{animation:none}}`);
  try { const sheet = new CSSStyleSheet(); sheet.replaceSync(css.join('\n')); document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet]; /* Etapa 51: folha construída por script — não precisa de 'unsafe-inline' em style-src */ } catch { const st = document.createElement('style'); st.id = 'mapart-style'; st.textContent = css.join('\n'); document.head.appendChild(st); }

  // ---- decora as células com os atributos que o CSS usa (cidade/capital/sítio/terreno) e posiciona os marcadores ----
  let timer = null;
  function decorate() {
    const S = K.state || {}; const cells = S.mapCells; if (!cells || !cells.length) return; let capCell = null;
    for (const c of cells) { const t = c.t; if (!t || !c.cell) continue; const cell = c.cell; const fog = t.terrain === 'desconhecido'; let art = 'terrain'; if (!fog && t.city) { art = t.city.capital ? 'capital' : 'city'; if (cell.dataset.lvl !== String(Math.min(5, Math.max(1, t.city.level || 1)))) cell.dataset.lvl = String(Math.min(5, Math.max(1, t.city.level || 1))); if (t.city.capital) capCell = cell; } else if (!fog && t.site) art = 'site'; else if (fog) art = 'fog'; if (cell.dataset.art !== art) cell.dataset.art = art; }
    pins(capCell);
  }
  function pins(capCell) {
    const grid = document.querySelector('.dash-panel[data-panel="mapa"] .mapview-grid'); if (!grid) return; if (!grid._pinObs) { grid._pinObs = new MutationObserver(later); grid._pinObs.observe(grid, { attributes: true, attributeFilter: ['style'] }); } // zoom muda --cell na PRÓPRIA grade: reposiciona (só observa a grade, nunca os marcadores)
    grid.querySelectorAll('.map-pin').forEach((p) => p.remove()); if (!capCell || !capCell.isConnected) return;
    const S = K.state || {}; const ev = (S.events && S.events.pending) || []; const fest = ev.filter((e) => e.festival).length; const normal = ev.length - fest; const x = capCell.offsetLeft + capCell.offsetWidth / 2, y = capCell.offsetTop + capCell.offsetHeight * 0.15; const add = (cls, icon, n, label, tab, dx) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'map-pin ' + cls; b.style.left = (x + dx) + 'px'; b.style.top = y + 'px'; b.dataset.goto = tab; b.setAttribute('aria-label', label); b.title = label; b.innerHTML = `${icon}${n > 1 ? `<b>${n}</b>` : ''}`; b.addEventListener('click', (e) => { e.stopPropagation(); K.goToPanel(tab); }); grid.appendChild(b); };
    let dx = 0; if (normal > 0) { add('', '📜', normal, `${normal} decisão(ões) esperando o trono`, 'eventos', dx); dx += 34; } if (fest > 0) { add('festa', '🎪', fest, 'Uma festa espera o seu comando', 'eventos', dx); dx += 34; }
  }
  const later = () => { clearTimeout(timer); timer = setTimeout(decorate, 120); };
  document.addEventListener('kot:refreshed', later); document.addEventListener('kot:panel', (e) => { if (e.detail === 'mapa' || e.detail === 'painel') { later(); setTimeout(later, 700); } });
  window.KOT.mapart = { decorate, tiles: Object.keys(TILES), tileUri: (t) => { const x = TILES[t] || TILES.desconhecido; return uri(base(x[0], x[1], x[2])); }, cityUri: (lvl, capital) => cityUri(capital ? CAPITAL : CITY[Math.min(5, Math.max(1, lvl || 1))]) };
})();
