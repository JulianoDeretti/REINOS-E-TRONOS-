// js/a11y.js — Etapa 38: acessibilidade (ARIA, teclado, foco, leitores de tela) e painel de preferências (idioma, som, aparência).
(function () {
  const K = window.KOT || (window.KOT = {}); const LS = { get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* noop */ } } };
  const $ = (id) => document.getElementById(id); const t = (s) => (K.i18n ? K.i18n.t(s) : s); const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const DEF = { hc: false, rm: window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches, dys: false, fs: 1, live: true };
  const P = Object.assign({}, DEF, LS.get('kot_a11y', {}));
  function applyPrefs() {
    const h = document.documentElement; h.classList.toggle('a11y-hc', !!P.hc); h.classList.toggle('a11y-rm', !!P.rm); h.classList.toggle('a11y-dys', !!P.dys); h.style.setProperty('--fs', String(P.fs)); h.classList.toggle('a11y-fs', P.fs !== 1);
    if (P.rm && K.mapAnim) { K.mapAnim.on = false; LS.set('kot_mapanim', false); } LS.set('kot_a11y', P);
  }
  applyPrefs();

  // ---------------------------------------------------------------- estrutura (landmarks, link de pular, região ao vivo)
  function structure() {
    if (!document.querySelector('.skip-link')) { const a = document.createElement('a'); a.className = 'skip-link'; a.href = '#mainContent'; a.textContent = 'Pular para o conteúdo'; a.addEventListener('click', (e) => { e.preventDefault(); const m = $('mainContent'); if (m) { m.focus(); m.scrollIntoView(); } }); document.body.insertBefore(a, document.body.firstChild); }
    const top = document.querySelector('.dash-topbar'); if (top) top.setAttribute('role', 'banner'); const nav = document.querySelector('.dash-nav'); if (nav) { nav.setAttribute('role', 'navigation'); nav.setAttribute('aria-label', 'Seções do jogo'); }
    const main = document.querySelector('.dash-main'); if (main) { main.setAttribute('role', 'main'); main.id = 'mainContent'; main.setAttribute('tabindex', '-1'); }
    const toast = $('tickToast'); if (toast) { toast.setAttribute('role', 'status'); toast.setAttribute('aria-live', 'polite'); toast.setAttribute('aria-atomic', 'true'); }
    if (!document.querySelector('h1.sr-only')) { const h = document.createElement('h1'); h.className = 'sr-only'; h.textContent = 'Kings or Thrones'; const tb = document.querySelector('.dash-topbar'); (tb || document.body).insertBefore(h, (tb || document.body).firstChild); }
    if (!$('a11yLive')) { const l = document.createElement('div'); l.id = 'a11yLive'; l.className = 'sr-only'; l.setAttribute('role', 'status'); l.setAttribute('aria-live', 'polite'); document.body.appendChild(l); }
    document.querySelectorAll('.dash-panel').forEach((p) => { const nm = document.querySelector(`.nav-item[data-panel="${p.dataset.panel}"]`); if (nm) { p.setAttribute('role', 'region'); p.setAttribute('aria-label', nm.textContent.replace(/\d+\s*$/, '').trim()); } });
  }
  const announce = (msg) => { if (!P.live) return; const l = $('a11yLive'); if (!l) return; l.textContent = ''; setTimeout(() => { l.textContent = msg; }, 60); };

  // ---------------------------------------------------------------- melhorias por elemento (idempotentes)
  const CLICKABLE = '[data-character],[data-dynasty-extra],.notif-clickable,.settlement-clickable,.hoje-item,[data-hgo],.pal-item,[data-notifpanel]';
  function enhance(root) {
    const q = (sel) => (root.querySelectorAll ? root.querySelectorAll(sel) : []);
    q('.nav-item > span:first-child, .n-icon, .hi-icon, .ev-icon, .ch-icon, .bc-level > span, .m-bottombar button > span').forEach((e) => e.setAttribute('aria-hidden', 'true'));
    q('.info-btn').forEach((b) => { if (!b.getAttribute('aria-label')) { const head = b.closest('h3, h4, .pl-head, .ficha-section-title, .pol-meter, label, div'); const ctx = head ? (head.textContent || '').replace(/ⓘ/g, '').trim().slice(0, 40) : ''; b.setAttribute('aria-label', 'Explicação' + (ctx ? ': ' + ctx : '')); b.setAttribute('type', 'button'); } });
    [['.res-scroll-btn', 'Rolar recursos'], ['.day-step-btn', 'Ajustar quantidade de dias']].forEach(([sel, lab]) => q(sel).forEach((b) => { if (!b.getAttribute('aria-label')) b.setAttribute('aria-label', lab); }));
    q('.dash-panel h1').forEach((h) => h.setAttribute('aria-level', '2')); q('.dash-panel h3').forEach((h) => h.setAttribute('aria-level', '2')); q('.dash-panel h4').forEach((h) => h.setAttribute('aria-level', '3')); q('.dash-panel h5').forEach((h) => h.setAttribute('aria-level', '4'));
    q('.tech-scroll').forEach((e, i) => { e.setAttribute('aria-label', 'Linha de tecnologias ' + (i + 1)); });
    q('.economy-log, .pal-list, .help-grid, .notif-list, .tac-log, .tech-scroll, .resource-strip, .log-box').forEach((e) => { if (!e.hasAttribute('tabindex')) { e.setAttribute('tabindex', '0'); if (!e.getAttribute('role')) e.setAttribute('role', 'region'); if (!e.getAttribute('aria-label')) e.setAttribute('aria-label', e.id === 'economyLog' ? 'Registro da economia' : e.classList.contains('notif-list') ? 'Lista de notificações' : e.classList.contains('tac-log') ? 'Registro da batalha' : e.classList.contains('pal-list') ? 'Resultados da busca' : 'Conteúdo rolável'); } });
    q('.notif-bell').forEach((b) => { if (b.querySelector('.sr-only')) return; b.removeAttribute('aria-label'); const tn = [...b.childNodes].find((n) => n.nodeType === 3 && n.nodeValue.includes('🔔')); if (tn) { const ic = document.createElement('span'); ic.setAttribute('aria-hidden', 'true'); ic.textContent = '🔔'; b.replaceChild(ic, tn); } const sr = document.createElement('span'); sr.className = 'sr-only'; sr.textContent = 'Notificações'; b.insertBefore(sr, b.firstChild); });
    q('#daysInput').forEach((i) => i.setAttribute('aria-label', 'Quantidade de dias a avançar'));
    q('.ficha-attr-track, .bar, .pm-bar, .prog-track, .bc-bar').forEach((b) => { if (b.getAttribute('role')) return; const fill = b.firstElementChild; const w = fill && /([\d.]+)%/.exec(fill.getAttribute('style') || ''); b.setAttribute('role', 'progressbar'); b.setAttribute('aria-valuemin', '0'); b.setAttribute('aria-valuemax', '100'); b.setAttribute('aria-valuenow', w ? String(Math.round(parseFloat(w[1]))) : '0'); const lab = b.previousElementSibling && b.previousElementSibling.textContent ? b.previousElementSibling.textContent.trim().slice(0, 40) : ''; b.setAttribute('aria-label', lab || 'Progresso'); });
    q(CLICKABLE).forEach((e) => { if (e.matches('.pal-item') || e.querySelector('button, a[href], input, select, textarea')) return; // cartao que ja contem controles proprios nao vira botao (evita controles aninhados)
       if (!e.hasAttribute('tabindex')) e.setAttribute('tabindex', '0'); if (!e.getAttribute('role')) e.setAttribute('role', 'button'); });
    q('input:not([type=hidden]):not([aria-label]):not([id]), select:not([aria-label]):not([id]), textarea:not([aria-label]):not([id])').forEach((i) => { const lab = i.closest('label'); i.setAttribute('aria-label', (lab && lab.textContent.trim().slice(0, 50)) || i.getAttribute('placeholder') || i.getAttribute('title') || 'Campo'); });
    q('input[id]:not([aria-label]), select[id]:not([aria-label])').forEach((i) => { if (document.querySelector(`label[for="${i.id}"]`) || i.closest('label')) return; i.setAttribute('aria-label', i.getAttribute('placeholder') || i.getAttribute('title') || (i.previousElementSibling && i.previousElementSibling.textContent.trim().slice(0, 40)) || 'Campo'); });
    q('table th:not([scope])').forEach((th) => th.setAttribute('scope', 'col'));
    q('button:not([aria-label]):not([title])').forEach((b) => { if (!b.textContent.trim().replace(/[^\p{L}\p{N}]/gu, '')) b.setAttribute('aria-label', b.getAttribute('data-act') || 'Botão'); });
  }
  document.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target && e.target.matches && e.target.matches(CLICKABLE) && !e.target.matches('.pal-item')) { if (e.key === ' ') e.preventDefault(); e.target.click(); } });
  let pend = 0; const mo = new MutationObserver((muts) => { for (const m of muts) if (m.addedNodes) m.addedNodes.forEach((n) => { if (n.classList && n.classList.contains('ux-overlay')) dialogs(); }); /* diálogo recém-criado: registra o foco ANTES do primeiro uso */ /* Etapa 77: sincroniza o aria-current ANTES do retorno antecipado: com um temporizador pendente (qualquer mutação nos 120 ms anteriores) a mudança de classe do menu era IGNORADA e o aria-current ficava velho (defeito latente; mais mutações o expuseram) */ for (const m of muts) if (m.type === 'attributes' && m.target.classList && m.target.classList.contains('nav-item')) syncCurrent(); if (pend) return; pend = setTimeout(() => { pend = 0; enhance(document.body); }, 120); });
  function syncCurrent() { document.querySelectorAll('.nav-item').forEach((b) => { if (b.classList.contains('active')) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); }); }

  // ---------------------------------------------------------------- diálogos: papel, foco inicial, armadilha de Tab, retorno do foco
  const opener = new WeakMap(); const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
  function dialogs() {
    document.querySelectorAll('.ux-overlay').forEach((o) => {
      if (!o.dataset.a11y) { o.dataset.a11y = '1'; o.setAttribute('role', 'dialog'); o.setAttribute('aria-modal', 'true'); o.setAttribute('aria-label', o.id === 'uxPalette' ? 'Busca global' : o.id === 'uxHelp' ? 'Atalhos de teclado' : o.id === 'tacModal' ? 'Batalha tática' : o.id === 'prefsDlg' ? 'Preferências' : 'Diálogo'); new MutationObserver(() => onToggle(o)).observe(o, { attributes: true, attributeFilter: ['class'] }); }
      onToggle(o, true);
    });
  }
  function onToggle(o, initial) { const open = !o.classList.contains('hidden'); if (open && !o.__open) { o.__open = true; opener.set(o, document.activeElement); setTimeout(() => { const f = o.querySelector('input, select, button, [tabindex]'); if (f) f.focus(); }, 30); } else if (!open && o.__open) { o.__open = false; const prev = opener.get(o); if (prev && prev.focus && document.contains(prev)) prev.focus(); } void initial; }
  document.addEventListener('keydown', (e) => { if (e.key !== 'Tab') return; const o = [...document.querySelectorAll('.ux-overlay')].find((x) => !x.classList.contains('hidden')); if (!o) return; const f = [...o.querySelectorAll(FOCUSABLE)].filter((x) => x.offsetParent !== null); if (!f.length) return; const first = f[0], last = f[f.length - 1]; if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); } else if (!o.contains(document.activeElement)) { e.preventDefault(); first.focus(); } });

  // ---------------------------------------------------------------- painel de preferências
  function buildPrefs() {
    let dlg = $('prefsDlg'); if (dlg) return dlg; dlg = document.createElement('div'); dlg.id = 'prefsDlg'; dlg.className = 'ux-overlay hidden'; dlg.addEventListener('mousedown', (e) => { if (e.target === dlg) closePrefs(); }); document.body.appendChild(dlg); return dlg;
  }
  function renderPrefs() {
    const dlg = buildPrefs(); const au = K.audio ? K.audio.state().prefs : { master: 0.7, music: 0.35, sfx: 0.6, muted: false, musicOn: false }; const lang = K.i18n ? K.i18n.lang() : 'pt'; const dark = document.documentElement.getAttribute('data-theme') === 'dark';
    const row = (id, label, ctl) => `<div class="pref-row"><label for="${id}">${label}</label>${ctl}</div>`; const chk = (id, label, on) => `<div class="pref-row"><input type="checkbox" id="${id}" ${on ? 'checked' : ''}><label for="${id}">${label}</label></div>`;
    dlg.innerHTML = `<div class="ux-modal" style="max-width:560px"><div class="pal-group">⚙️ Preferências</div><div class="help-grid" style="display:block;max-height:68vh;overflow:auto">
      <h4 style="margin:4px 0">Idioma</h4>${row('prLang', 'Idioma', `<select id="prLang">${Object.entries(K.i18n ? K.i18n.langs : { pt: 'Português (Brasil)' }).map(([k, n]) => `<option value="${k}" ${k === lang ? 'selected' : ''}>${n}</option>`).join('')}</select>`)}
      <p class="hint" data-notranslate>Interface traduzida: menus, painel Hoje, busca, atalhos, tutorial, preferências. O conteúdo narrado do jogo (eventos, objetivos) está em português. / Interface translated; narrated game content is in Portuguese.</p>
      <h4 style="margin:10px 0 4px">Som e música</h4>${row('prMusicStyle', 'Estilo da música', `<select id="prMusicStyle"><option value="rpg" ${au.style !== 'ambiente' ? 'selected' : ''}>Taverna medieval (RPG)</option><option value="ambiente" ${au.style === 'ambiente' ? 'selected' : ''}>Ambiente sintetizado (antigo)</option></select>`)}${row('prMaster', 'Volume geral', `<input type="range" id="prMaster" min="0" max="100" value="${Math.round(au.master * 100)}">`)}${row('prSfx', 'Efeitos sonoros', `<input type="range" id="prSfx" min="0" max="100" value="${Math.round(au.sfx * 100)}">`)}${row('prMusic', 'Música ambiente', `<input type="range" id="prMusic" min="0" max="100" value="${Math.round(au.music * 100)}">`)}${chk('prMusicOn', 'Tocar música ambiente (gerada ao vivo)', au.musicOn)}${chk('prMute', 'Silenciar tudo (M)', au.muted)}
      <h4 style="margin:10px 0 4px">Aparência e acessibilidade</h4>${chk('prDark', 'Modo escuro', dark)}${chk('prHc', 'Alto contraste', P.hc)}${chk('prRm', 'Reduzir movimento e animações', P.rm)}${chk('prDys', 'Fonte legível (espaçada)', P.dys)}${row('prFs', 'Tamanho do texto', `<input type="range" id="prFs" min="90" max="150" step="10" value="${Math.round(P.fs * 100)}" aria-valuetext="${Math.round(P.fs * 100)}%">`)}${chk('prLive', 'Anunciar novidades ao leitor de tela', P.live)}
      ${K.fx ? K.fx.prefsHtml() : ''}
    </div><div class="pal-foot"><button class="btn btn-ghost btn-sm" id="prReset" type="button">Restaurar padrões</button> <button class="btn btn-secondary btn-sm" id="prClose" type="button">Fechar</button></div></div>`;
    const on = (id, ev, fn) => { const e = $(id); if (e) e.addEventListener(ev, fn); };
    on('prLang', 'change', (e) => { K.i18n && K.i18n.setLang(e.target.value); renderPrefs(); }); on('prMaster', 'input', (e) => K.audio && K.audio.set('master', e.target.value / 100)); on('prSfx', 'input', (e) => { K.audio && K.audio.set('sfx', e.target.value / 100); }); on('prSfx', 'change', () => K.audio && K.audio.play('success')); on('prMusic', 'input', (e) => K.audio && K.audio.set('music', e.target.value / 100));
    on('prMusicOn', 'change', (e) => K.audio && K.audio.set('musicOn', e.target.checked)); on('prMusicStyle', 'change', (e) => K.audio && K.audio.set('style', e.target.value)); on('prMute', 'change', (e) => K.audio && K.audio.set('muted', e.target.checked)); on('prDark', 'change', (e) => K.ux && K.ux.applyTheme(e.target.checked ? 'dark' : 'light'));
    on('prHc', 'change', (e) => { P.hc = e.target.checked; applyPrefs(); }); on('prRm', 'change', (e) => { P.rm = e.target.checked; applyPrefs(); }); on('prDys', 'change', (e) => { P.dys = e.target.checked; applyPrefs(); }); on('prFs', 'input', (e) => { P.fs = e.target.value / 100; e.target.setAttribute('aria-valuetext', e.target.value + '%'); applyPrefs(); }); on('prLive', 'change', (e) => { P.live = e.target.checked; applyPrefs(); });
    on('prReset', 'click', () => { Object.assign(P, DEF, { rm: false }); applyPrefs(); if (K.audio) { ['master', 'music', 'sfx'].forEach((k, i) => K.audio.set(k, [0.7, 0.35, 0.6][i])); K.audio.set('muted', false); K.audio.set('musicOn', false); } K.ux && K.ux.applyTheme('light'); renderPrefs(); }); on('prClose', 'click', closePrefs);
    if (K.fx) K.fx.bindPrefs(dlg);
    if (K.i18n) K.i18n.apply(); return dlg;
  }
  function openPrefs() { const d = renderPrefs(); d.classList.remove('hidden'); dialogs(); }
  function closePrefs() { const d = $('prefsDlg'); if (d) d.classList.add('hidden'); }
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closePrefs(); });
  function addButton() { const tools = document.querySelector('.ux-tools'); if (!tools || $('uxPrefsBtn')) return; const b = document.createElement('button'); b.className = 'ux-btn'; b.id = 'uxPrefsBtn'; b.type = 'button'; b.title = 'Preferências: idioma, som e acessibilidade'; b.setAttribute('aria-label', 'Preferências: idioma, som e acessibilidade'); b.textContent = '⚙️'; b.addEventListener('click', openPrefs); tools.appendChild(b); ({ uxSearchBtn: 'Buscar (Ctrl+K)', uxHojeBtn: 'Hoje: o que exige atenção', uxThemeBtn: 'Alternar modo escuro', uxHelpBtn: 'Ajuda e atalhos' }); Object.entries({ uxSearchBtn: 'Buscar (Ctrl+K)', uxHojeBtn: 'Hoje: o que exige atenção', uxThemeBtn: 'Alternar modo escuro', uxHelpBtn: 'Ajuda e atalhos' }).forEach(([id, lab]) => { const x = $(id); if (x && !x.getAttribute('aria-label')) x.setAttribute('aria-label', lab); }); }

  // ---------------------------------------------------------------- ligação
  document.addEventListener('kot:attention', (e) => { const s = e.detail; if (s && s.urgente > (announce.last || 0)) announce(`${s.urgente} ${t('urgente(s)')}`); announce.last = s ? s.urgente : 0; });
  document.addEventListener('kot:lang', () => announce(K.i18n ? K.i18n.langs[K.i18n.lang()] : ''));
  function boot() { structure(); addButton(); syncCurrent(); enhance(document.body); dialogs(); mo.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] }); setInterval(() => { addButton(); dialogs(); }, 1500); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  K.a11y = { openPrefs, closePrefs, prefs: () => ({ ...P }), enhance: () => enhance(document.body), announce };
})();
