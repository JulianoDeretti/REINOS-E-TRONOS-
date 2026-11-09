// js/mapview.js
// Visualizador de mapa reutilizavel: arrastar para mover, zoom (botoes e
// Ctrl+roda), "ajustar a tela" e centralizar em uma posicao. Usado no
// assistente de fundacao e na aba Mapa do painel.
const MapView = (() => {
  function attach(scrollEl, gridEl, opts = {}) {
    let cell = opts.cell || 32;
    let cols = opts.cols || 1;
    const MIN = 8, MAX = 80;

    const toolbar = document.createElement('div');
    toolbar.className = 'map-toolbar';
    toolbar.innerHTML = `
      <button type="button" data-z="out" title="Diminuir zoom">−</button>
      <span class="zoom-label"></span>
      <button type="button" data-z="in" title="Aumentar zoom">+</button>
      <button type="button" data-z="fit" title="Mostrar o mapa inteiro na tela">⤢ Ajustar à tela</button>
      <button type="button" data-z="big" title="Tamanho grande">🔍 Grande</button>
      <span class="map-tip">Arraste o mapa com o mouse · Ctrl + roda do mouse = zoom</span>`;
    scrollEl.parentNode.insertBefore(toolbar, scrollEl);

    gridEl.classList.add('mapview-grid');
    scrollEl.classList.add('mapview-scroll');

    function apply() {
      gridEl.style.setProperty('--cell', cell + 'px');
      gridEl.style.gridTemplateColumns = `repeat(${cols}, var(--cell))`;
      gridEl.classList.toggle('tiny', cell < 18);
      toolbar.querySelector('.zoom-label').textContent = `${Math.round((cell / 32) * 100)}%`;
    }
    function setCell(v) {
      const centerX = (scrollEl.scrollLeft + scrollEl.clientWidth / 2) / (cell + 1);
      const centerY = (scrollEl.scrollTop + scrollEl.clientHeight / 2) / (cell + 1);
      cell = Math.max(MIN, Math.min(MAX, Math.round(v)));
      apply();
      scrollEl.scrollLeft = centerX * (cell + 1) - scrollEl.clientWidth / 2;
      scrollEl.scrollTop = centerY * (cell + 1) - scrollEl.clientHeight / 2;
    }
    function fit() { setCell(Math.max(10, Math.floor((scrollEl.clientWidth - 24) / cols) - 1)); }
    function centerOn(row, col) {
      scrollEl.scrollLeft = col * (cell + 1) - scrollEl.clientWidth / 2;
      scrollEl.scrollTop = row * (cell + 1) - scrollEl.clientHeight / 2;
    }

    toolbar.addEventListener('click', (e) => {
      const b = e.target.closest('[data-z]');
      if (!b) return;
      if (b.dataset.z === 'in') setCell(cell * 1.25);
      if (b.dataset.z === 'out') setCell(cell / 1.25);
      if (b.dataset.z === 'fit') fit();
      if (b.dataset.z === 'big') setCell(44);
    });

    // arrastar
    let down = false, moved = false, sx = 0, sy = 0, sl = 0, st = 0;
    scrollEl.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      down = true; moved = false; sx = e.clientX; sy = e.clientY; sl = scrollEl.scrollLeft; st = scrollEl.scrollTop;
    });
    window.addEventListener('mousemove', (e) => {
      if (!down) return;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (Math.abs(dx) + Math.abs(dy) > 5) moved = true;
      if (moved) { scrollEl.scrollLeft = sl - dx; scrollEl.scrollTop = st - dy; }
    });
    window.addEventListener('mouseup', () => { down = false; setTimeout(() => { moved = false; }, 0); });
    scrollEl.addEventListener('click', (e) => { if (moved) { e.stopPropagation(); e.preventDefault(); } }, true);
    scrollEl.addEventListener('wheel', (e) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      setCell(cell * (e.deltaY < 0 ? 1.12 : 1 / 1.12));
    }, { passive: false });

    apply();
    return { setCols(c) { cols = c; apply(); }, setCell, fit, centerOn };
  }
  return { attach };
})();
