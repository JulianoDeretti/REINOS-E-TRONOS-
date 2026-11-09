// js/fx.js — Etapa 39: efeitos visuais e easter eggs (cena do castelo, partículas por estação, brilho nos recursos, segredos).
(function () {
  const LS = { get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* noop */ } } };
  const K = window.KOT || (window.KOT = {}); const H = document.documentElement; const rnd = (a, b) => a + Math.random() * (b - a);
  const calm = () => H.classList.contains('a11y-rm') || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const audio = (n) => { try { K.audio && K.audio.play(n); } catch { /* noop */ } };
  if (LS.get('kot_cursor', true)) H.classList.add('cursor-theme'); if (LS.get('kot_gold', false)) H.classList.add('theme-gold');

  // ================================================================ CENA DO CASTELO (páginas de entrada)
  const WIN = (x, y) => `<rect class="win" x="${x}" y="${y}" width="9" height="15" rx="4" fill="#ffcf6a"/>`;
  const CASTLE = `<svg class="layer castle" viewBox="0 0 760 400" preserveAspectRatio="xMidYMax meet" aria-hidden="true"><g fill="#0a0f20"><rect x="40" y="300" width="680" height="100"/>${[...Array(30)].map((_, i) => `<rect x="${44 + i * 22.6}" y="288" width="14" height="14"/>`).join('')}<rect x="300" y="170" width="160" height="230"/>${[...Array(8)].map((_, i) => `<rect x="${300 + i * 22.6}" y="156" width="14" height="16"/>`).join('')}<rect x="196" y="124" width="76" height="276"/><polygon points="188,124 234,44 280,124"/><rect x="488" y="124" width="76" height="276"/><polygon points="480,124 526,44 572,124"/><rect x="96" y="214" width="52" height="186"/><polygon points="90,214 122,150 154,214"/><rect x="612" y="214" width="52" height="186"/><polygon points="606,214 638,150 670,214"/><rect x="340" y="104" width="80" height="70"/><polygon points="332,104 380,36 428,104"/></g><g stroke="#0a0f20" stroke-width="2.5"><line x1="234" y1="44" x2="234" y2="14"/><line x1="526" y1="44" x2="526" y2="14"/><line x1="380" y1="36" x2="380" y2="6"/></g><polygon class="flag" points="234,14 262,22 234,30" fill="#c23b4c"/><polygon class="flag" points="526,14 554,22 526,30" fill="#c23b4c"/><polygon class="flag" points="380,6 408,14 380,22" fill="#f4d16e"/><path d="M350 400 V330 Q380 296 410 330 V400Z" fill="#02040a"/><path d="M356 400 V334 Q380 304 404 334 V400Z" fill="#ffb347" opacity=".35"/>${[[318, 190], [348, 190], [388, 190], [418, 190], [334, 236], [404, 236], [225, 150], [225, 200], [225, 250], [517, 150], [517, 200], [517, 250], [110, 250], [626, 250], [372, 130], [150, 330], [560, 330]].map(([x, y]) => WIN(x, y)).join('')}</svg>`;
  const MTN = (cls, d, col) => `<svg class="layer ${cls}" viewBox="0 0 1200 300" preserveAspectRatio="none" aria-hidden="true"><path d="${d}" fill="${col}"/></svg>`;
  const BIRD = '<svg class="bird" viewBox="0 0 40 20" aria-hidden="true"><path d="M2 14 Q10 0 20 12 Q30 0 38 14 Q30 8 20 16 Q10 8 2 14Z" fill="#0a0f1c"/></svg>';
  function buildScene() {
    if (!document.body.dataset.scene || document.querySelector('.scene')) return; const s = document.createElement('div'); s.className = 'scene'; s.setAttribute('aria-hidden', 'true');
    s.innerHTML = `<div class="stars"></div><div class="moon"></div>${MTN('mtn-far', 'M0 300 L0 190 L90 120 L170 180 L260 90 L360 170 L450 110 L560 200 L660 100 L770 180 L880 120 L990 190 L1090 130 L1200 200 L1200 300Z', '#16203a')}${MTN('mtn-near', 'M0 300 L0 220 L120 150 L230 210 L340 140 L470 220 L600 160 L720 230 L860 150 L980 220 L1100 170 L1200 230 L1200 300Z', '#0c1226')}${BIRD}${BIRD}${CASTLE}<div class="torch l"></div><div class="torch r"></div>`;
    document.body.insertBefore(s, document.body.firstChild);
  }

  // ================================================================ PARTÍCULAS (estação / brasas)
  let canvas = null, ctx = null, parts = [], mode = '', raf = 0, last = 0;
  const KINDS = { primavera: { n: 26, col: ['#ffc2d1', '#fff0f5', '#ffd6e0'], vy: [14, 30], vx: [-10, 14], size: [3, 6], shape: 'petal' }, verão: { n: 24, col: ['#fff3a0', '#ffe066'], vy: [-6, 6], vx: [-8, 8], size: [1.6, 3.2], shape: 'fly' }, outono: { n: 26, col: ['#e0883a', '#c0562a', '#d9a441', '#a8431f'], vy: [20, 42], vx: [-22, 18], size: [4, 7], shape: 'leaf' }, inverno: { n: 46, col: ['#ffffff', '#dff1ff'], vy: [16, 34], vx: [-8, 8], size: [1.4, 3.4], shape: 'snow' }, brasas: { n: 34, col: ['#ffb347', '#ff7a1a', '#ffd27a'], vy: [-34, -14], vx: [-10, 10], size: [1.2, 3], shape: 'ember' } };
  const seasonOf = (day) => ['primavera', 'verão', 'outono', 'inverno'][Math.floor((((day || 1) - 1) % 80) / 20)];
  function seed(kind, w, h, init) { const k = KINDS[kind]; const p = { x: rnd(0, w), y: init ? rnd(0, h) : (k.vy[0] < 0 ? h + 10 : -10), vx: rnd(...k.vx), vy: rnd(...k.vy), s: rnd(...k.size), c: k.col[Math.floor(Math.random() * k.col.length)], r: rnd(0, 6.28), vr: rnd(-1.5, 1.5), ph: rnd(0, 6.28), a: rnd(.35, .75) }; return p; }
  function startParticles(kind) {
    if (calm() || !KINDS[kind]) { stopParticles(); return; } if (mode === kind && raf) return; mode = kind;
    if (!canvas) { canvas = document.createElement('canvas'); canvas.id = 'fxCanvas'; canvas.setAttribute('aria-hidden', 'true'); document.body.appendChild(canvas); ctx = canvas.getContext('2d'); window.addEventListener('resize', fit); }
    fit(); parts = [...Array(KINDS[kind].n)].map(() => seed(kind, canvas.width, canvas.height, true)); if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); }
  }
  function stopParticles() { if (raf) cancelAnimationFrame(raf); raf = 0; mode = ''; if (canvas) { ctx.clearRect(0, 0, canvas.width, canvas.height); canvas.remove(); canvas = null; } }
  function fit() { if (!canvas) return; canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
  function tick(t) {
    raf = requestAnimationFrame(tick); if (document.hidden) return; const dt = (t - last) / 1000; if (dt < 0.033) return; last = t; if (calm()) { stopParticles(); return; }
    const k = KINDS[mode]; ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < parts.length; i++) { const p = parts[i]; p.ph += dt * 1.6; p.x += (p.vx + Math.sin(p.ph) * (k.shape === 'fly' ? 18 : 12)) * dt; p.y += (p.vy + (k.shape === 'fly' ? Math.cos(p.ph * .8) * 14 : 0)) * dt; p.r += p.vr * dt;
      if (p.y > canvas.height + 12 || p.y < -14 || p.x < -14 || p.x > canvas.width + 14) { parts[i] = seed(mode, canvas.width, canvas.height, false); if (k.shape !== 'ember' && k.vy[0] >= 0) parts[i].x = rnd(0, canvas.width); continue; }
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.globalAlpha = p.a; ctx.fillStyle = p.c;
      if (k.shape === 'petal') { ctx.beginPath(); ctx.ellipse(0, 0, p.s, p.s * .55, 0, 0, 6.28); ctx.fill(); }
      else if (k.shape === 'leaf') { ctx.beginPath(); ctx.moveTo(0, -p.s); ctx.quadraticCurveTo(p.s, 0, 0, p.s); ctx.quadraticCurveTo(-p.s, 0, 0, -p.s); ctx.fill(); }
      else if (k.shape === 'fly') { const g = ctx.createRadialGradient(0, 0, 0, 0, 0, p.s * 5); const pulse = .5 + .5 * Math.sin(p.ph * 2.2); g.addColorStop(0, `rgba(255,240,150,${.9 * pulse})`); g.addColorStop(1, 'rgba(255,240,150,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, p.s * 5, 0, 6.28); ctx.fill(); }
      else { ctx.beginPath(); ctx.arc(0, 0, p.s, 0, 6.28); ctx.fill(); }
      ctx.restore(); }
  }
  function syncSeason() { const k = K.state && K.state.kingdom; if (!k) return; const s = seasonOf(k.day || 1); if (document.body.dataset.season !== s) document.body.dataset.season = s; const dark = H.getAttribute('data-theme') === 'dark'; startParticles(dark && s === 'primavera' ? 'verão' : s); }

  // ================================================================ BRILHO NOS RECURSOS QUANDO MUDAM + ANO NOVO
  let prevAmt = [], prevYear = null, flashT = 0;
  function flashResources() {
    clearTimeout(flashT); flashT = setTimeout(() => { const els = [...document.querySelectorAll('.resource-chip .amt')]; const cur = els.map(e => Number(String(e.textContent).replace(/[^\d-]/g, '')) || 0);
      if (prevAmt.length === cur.length && !calm()) els.forEach((e, i) => { if (cur[i] > prevAmt[i]) { e.classList.add('flash-up'); setTimeout(() => e.classList.remove('flash-up'), 950); } else if (cur[i] < prevAmt[i]) { e.classList.add('flash-down'); setTimeout(() => e.classList.remove('flash-down'), 950); } }); prevAmt = cur; }, 60);
  }

  // ================================================================ SEGREDOS (easter eggs)
  const SECRETS = [
    { id: 'konami', icon: '🐉', name: 'O Dragão Adormecido', hint: 'Um código antigo, de 8 setas e duas letras…' }, { id: 'excalibur', icon: '🗡️', name: 'A Espada na Pedra', hint: 'Digite o nome da lendária espada do rei Artur.' },
    { id: 'bobo', icon: '🃏', name: 'O Bobo da Corte', hint: 'Chame por quem faz o rei rir (4 letras).' }, { id: 'coroa', icon: '👑', name: 'A Coroa Pesa', hint: 'Clique 7 vezes na coroa do cabeçalho.' },
    { id: 'ouro', icon: '🪙', name: 'Chuva de Ouro', hint: 'Cutuque o cofre (o recurso Ouro) 5 vezes.' }, { id: 'coruja', icon: '🦉', name: 'A Coruja Vigia', hint: 'Jogue de madrugada (entre meia-noite e 5h).' },
    { id: 'castelo', icon: '🏰', name: 'Fogos do Castelo', hint: 'Na tela de entrada, clique 3 vezes no castelo.' }, { id: 'anonovo', icon: '🎆', name: 'Ano Novo Real', hint: 'Veja um ano do reino virar, de dentro do jogo.' },
  ];
  const found = () => new Set(LS.get('kot_secrets', []));
  function unlock(id, silent) {
    const s = SECRETS.find(x => x.id === id); if (!s) return; const f = found(); if (f.has(id)) return false; f.add(id); LS.set('kot_secrets', [...f]); try { if (K.secretClaim) K.secretClaim(id); } catch (e) { /* o prêmio é cobrado pelo servidor; nunca quebra o segredo */ }
    if (!silent) { toast(`🗝️ Segredo descoberto: ${s.icon} ${s.name} (${f.size}/${SECRETS.length})`); audio('fanfare'); }
    if (f.size >= 5 && !LS.get('kot_gold_seen', false)) { LS.set('kot_gold_seen', true); LS.set('kot_gold', true); H.classList.add('theme-gold'); setTimeout(() => toast('✨ 5 segredos! O Brilho Dourado foi liberado (veja em ⚙️ Preferências).'), 2200); }
    if (f.size === SECRETS.length) setTimeout(() => toast('🃏 Todos os segredos! Você é o Mestre dos Segredos do reino.'), 4200); return true;
  }
  function toast(msg) { if (K.showToast) { K.showToast(msg); return; } let t = document.getElementById('fxToast'); if (!t) { t = document.createElement('div'); t.id = 'fxToast'; t.className = 'tick-toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); } t.textContent = msg; t.style.display = ''; clearTimeout(t._t); t._t = setTimeout(() => { t.style.display = 'none'; }, 4200); }
  const layer = () => { let l = document.querySelector('.fx-layer'); if (!l) { l = document.createElement('div'); l.className = 'fx-layer'; l.setAttribute('aria-hidden', 'true'); document.body.appendChild(l); } return l; };
  const drop = (el, ms) => setTimeout(() => { el.remove(); const l = document.querySelector('.fx-layer'); if (l && !l.children.length) l.remove(); }, ms);

  function dragon() {
    unlock('konami'); audio('battle'); if (calm()) return; const d = document.createElement('div'); d.className = 'fx-dragon';
    d.innerHTML = `<svg viewBox="0 0 240 140" xmlns="http://www.w3.org/2000/svg"><g class="wing"><path d="M120 66 Q92 6 40 14 Q70 34 66 58Z" fill="#7a1f2b" stroke="#3a0a12" stroke-width="2"/><path d="M120 70 Q80 20 28 40 Q64 52 70 70Z" fill="#9c2a38" opacity=".9"/></g><path d="M40 98 Q8 88 6 112 Q34 104 52 112Z" fill="#7a1f2b"/><ellipse cx="116" cy="88" rx="58" ry="26" fill="#9c2a38" stroke="#3a0a12" stroke-width="2.5"/><path d="M158 80 Q190 54 206 60 L226 52 L222 70 L206 74 Q186 90 160 100Z" fill="#9c2a38" stroke="#3a0a12" stroke-width="2.5"/><circle cx="208" cy="62" r="3.2" fill="#ffe27a"/><path d="M226 62 Q244 56 252 70 Q238 66 228 72Z" fill="#ffb347"/><path d="M226 62 Q236 52 232 44 Q222 56 224 62Z" fill="#ff7a1a" opacity=".85"/><g class="wing" style="animation-delay:-.27s"><path d="M110 74 Q76 0 20 6 Q58 30 62 62Z" fill="#b8333f" stroke="#3a0a12" stroke-width="2"/></g></svg>`;
    layer().appendChild(d); drop(d, 7200); toast('🐉 O Dragão Adormecido despertou! (Fique tranquilo: não queima nada.)');
  }
  function sword() {
    unlock('excalibur'); if (calm()) return; const s = document.createElement('div'); s.className = 'fx-sword';
    s.innerHTML = `<svg viewBox="0 0 150 230" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="bl" x1="0" x2="1"><stop offset="0" stop-color="#dfefff"/><stop offset=".5" stop-color="#ffffff"/><stop offset="1" stop-color="#9fbad6"/></linearGradient></defs><polygon points="75,0 86,92 64,92" fill="url(#bl)" stroke="#6b84a0" stroke-width="1.5"/><rect x="40" y="92" width="70" height="9" rx="4" fill="#d4a827" stroke="#7a5c10"/><rect x="70" y="101" width="10" height="34" fill="#6b4318"/><circle cx="75" cy="140" r="8" fill="#d4a827" stroke="#7a5c10"/><path d="M14 230 L24 160 Q40 128 75 134 Q112 128 128 162 L138 230Z" fill="#7d7f86" stroke="#44464d" stroke-width="2.5"/><path d="M40 190 Q60 176 84 186" stroke="#5d5f66" stroke-width="2" fill="none"/></svg>`;
    layer().appendChild(s); drop(s, 5400); toast('🗡️ "Só o verdadeiro soberano retira a espada da pedra…"');
  }
  const JOKES = ['Por que o cavaleiro levou uma escada ao torneio? Para subir no conceito!', 'O rei pediu silêncio no banquete. O bobo obedeceu... e todos ouviram o estômago dele.', 'Dizem que o dragão não gosta de música. Ele só quer um bis... de assados.', 'Como o mago paga a conta? Com um feitiço de troco.', 'O castelo não tem Wi-Fi, mas a gente se conecta pelas paredes grossas.', 'Qual o animal preferido do arqueiro? O alvo-ratão.', 'O ferreiro foi promovido: agora ele só tem que bater o ponto.', 'O que o fantasma pede na taverna? Uma cerveja... bem gelada, é claro.', 'O imposto é como o dragão: todo mundo reclama, mas é ele quem guarda o tesouro.', 'O conselheiro disse "sim" a tudo. Foi demitido por falta de opinião... e, depois, readmitido pelo mesmo motivo.', 'Quando o rei cai do cavalo, é queda de reino ou só de cavaleiro?', 'O mensageiro chegou tão rápido que a notícia ainda não tinha acontecido.', 'Na masmorra a vista é ruim, mas o silêncio compensa.', 'O bobo não precisa de coroa: já usa um chapéu com guizos de ouro, mas de mentirinha.', 'Aquele pergaminho de promessas do rei? Ainda está na fila de impressão.', 'O alquimista transformou chumbo em ouro e esqueceu de contar ao tesoureiro. O tesoureiro surtou.', 'Meu cavalo é tão lento que a lenda dele ainda está em fase de rascunho.', 'A muralha é tão alta que as nuvens pedem licença.', 'O bardo cantou tão mal que até o eco pediu para sair.', 'Quem ri por último, ri na ata do conselho.', 'A princesa pediu uma torre. O arquiteto entregou três... e um elevador de corda.', 'O cozinheiro real jura que o guisado é segredo de estado. Concordo: ninguém ousa contar o que tem nele.', 'O soberano decretou: "amanhã é feriado". O historiador anotou: "e ontem também".', 'O dragão procurou emprego em um banco. Disse que já tinha experiência em guardar ouro.', 'O espião me contou um segredo. Já esqueci qual era.', 'O aldeão perguntou ao rei: "o senhor manda?" O rei: "só em casa... e olhe lá".', 'A espada era tão afiada que cortou o assunto ao meio.', 'O arauto anunciou "paz!" tão alto que foi o que declarou a guerra aos ouvidos.', 'No reino do nunca-falta-nada, falta só o troco.', 'O oráculo previu tudo, menos o preço da cerveja.', 'O bobo da corte pediu aumento. O rei riu. O bobo disse: "bom, então já está pago".'];
  function jester() {
    unlock('bobo'); audio('success'); const msg = JOKES[Math.floor(Math.random() * JOKES.length)]; if (calm()) { toast('🃏 ' + msg); return; } const j = document.createElement('div'); j.className = 'fx-jester';
    j.innerHTML = `<svg viewBox="0 0 120 190" xmlns="http://www.w3.org/2000/svg"><path d="M60 78 L30 140 L90 140Z" fill="#6b4a8a" stroke="#2b1744" stroke-width="2.5"/><path d="M60 78 L45 109 L75 109Z" fill="#c23b4c"/><path d="M30 140 L40 186 M90 140 L80 186" stroke="#2b1744" stroke-width="7" stroke-linecap="round"/><circle cx="60" cy="56" r="26" fill="#f3d2b3" stroke="#6b4a2a" stroke-width="2.5"/><path d="M34 44 Q18 6 40 14 Q50 -2 60 20 Q72 -2 82 14 Q104 6 86 44Z" fill="#c23b4c" stroke="#5e1520" stroke-width="2.5"/><circle cx="40" cy="12" r="6" fill="#f4d16e" stroke="#9c7a1f"/><circle cx="82" cy="12" r="6" fill="#f4d16e" stroke="#9c7a1f"/><circle cx="51" cy="54" r="3" fill="#2b1d0f"/><circle cx="69" cy="54" r="3" fill="#2b1d0f"/><path d="M48 66 Q60 78 72 66" stroke="#7a1f2b" stroke-width="3" fill="none" stroke-linecap="round"/></svg>`;
    const b = document.createElement('div'); b.className = 'fx-bubble'; b.textContent = msg; const l = layer(); l.appendChild(j); l.appendChild(b); drop(j, 7200); drop(b, 7200);
  }
  function coins() { unlock('ouro'); audio('coin'); if (calm()) return; const l = layer(); for (let i = 0; i < 46; i++) { const c = document.createElement('span'); c.textContent = '🪙'; c.style.cssText = `position:absolute;top:-40px;left:${rnd(0, 100)}vw;font-size:${rnd(18, 34)}px;animation:coinFall ${rnd(1.6, 3.2)}s ${rnd(0, 1.2)}s ease-in forwards;filter:drop-shadow(0 0 6px rgba(244,209,110,.8))`; l.appendChild(c); drop(c, 5200); } setTimeout(() => audio('coin'), 700); setTimeout(() => audio('coin'), 1500); }
  function fireworks(secret) {
    if (secret) unlock(secret); audio('fanfare'); if (calm()) return; const c = document.createElement('canvas'); c.width = innerWidth; c.height = innerHeight; c.style.cssText = 'position:fixed;inset:0;z-index:8600;pointer-events:none'; c.setAttribute('aria-hidden', 'true'); document.body.appendChild(c); const g = c.getContext('2d'); let sparks = [];
    const burst = () => { const x = rnd(.15, .85) * c.width, y = rnd(.12, .5) * c.height, col = ['#ffd54a', '#ff6b81', '#7bdcff', '#b28dff', '#9fe3a0'][Math.floor(Math.random() * 5)]; for (let i = 0; i < 64; i++) { const a = (i / 64) * 6.28, v = rnd(80, 230); sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1, col }); } };
    burst(); setTimeout(burst, 500); setTimeout(burst, 1100); setTimeout(burst, 1700); let t0 = performance.now(), lt = t0;
    (function f(t) { const dt = (t - lt) / 1000; lt = t; g.clearRect(0, 0, c.width, c.height); sparks = sparks.filter(s => s.life > 0); for (const s of sparks) { s.vy += 160 * dt; s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt * .55; g.globalAlpha = Math.max(0, s.life); g.fillStyle = s.col; g.beginPath(); g.arc(s.x, s.y, 2.4, 0, 6.28); g.fill(); } if (t - t0 < 3600) requestAnimationFrame(f); else c.remove(); })(t0);
  }
  function brandSpin() { unlock('coroa'); audio('fanfare'); const b = document.querySelector('.dash-brand'); if (b && !calm()) { b.classList.add('logo-spin'); setTimeout(() => b.classList.remove('logo-spin'), 1200); } toast('👑 "A coroa pesa, Majestade… mas fica bem em você."'); }
  function owl() { if (!document.getElementById('dash') || document.querySelector('.fx-owl')) return; const h = new Date().getHours(); if (h >= 5) return; const b = document.createElement('button'); b.className = 'fx-owl'; b.type = 'button'; b.setAttribute('aria-label', 'Coruja da madrugada (clique)'); b.textContent = '🦉'; b.addEventListener('click', () => { unlock('coruja'); audio('notify'); toast('🦉 "Uuuh! Quem governa de madrugada vê coisas que a corte não vê."'); b.remove(); }); document.body.appendChild(b); }

  // teclado: buffer das últimas teclas + engole as teclas que seriam atalhos enquanto uma palavra secreta está sendo digitada
  const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  let buf = []; let bufT = 0; const WORDS = { excalibur: sword, bobo: jester };
  window.addEventListener('keydown', (e) => {
    const t = e.target; if (t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable) || e.ctrlKey || e.metaKey || e.altKey) return;
    const now = Date.now(); if (now - bufT > 2500) buf = []; bufT = now; const key = e.key.length === 1 ? e.key.toLowerCase() : e.key; buf.push(key); if (buf.length > 14) buf.shift();
    const kn = KONAMI.length; const tail = buf.slice(-kn); let kPrefix = 0; for (let n = Math.min(buf.length, kn); n >= 1; n--) { if (buf.slice(-n).every((k, i) => k === KONAMI[i])) { kPrefix = n; break; } }
    if (tail.length === kn && tail.every((k, i) => k === KONAMI[i])) { e.stopImmediatePropagation(); e.preventDefault(); buf = []; dragon(); return; }
    if (kPrefix >= 9) { e.stopImmediatePropagation(); e.preventDefault(); return; } // 'b' já digitado: o 'a' final não pode avançar o dia
    const str = buf.filter(k => k.length === 1).join(''); for (const [w, fn] of Object.entries(WORDS)) { if (str.endsWith(w)) { e.stopImmediatePropagation(); e.preventDefault(); buf = []; fn(); return; } const pre = w.slice(0, Math.min(w.length - 1, str.length)); for (let n = Math.min(w.length - 1, str.length); n >= 3; n--) { if (str.endsWith(w.slice(0, n)) && n >= 3 && key === w[n - 1]) { e.stopImmediatePropagation(); e.preventDefault(); return; } } void pre; }
  }, true);
  // cliques secretos
  let brandClicks = [], goldClicks = [], castleClicks = [];
  document.addEventListener('click', (e) => {
    const n = Date.now(); const brand = e.target.closest && e.target.closest('.dash-brand'); const chip = e.target.closest && e.target.closest('.resource-chip'); const castle = e.target.closest && e.target.closest('.tile.castle');
    if (brand) { brandClicks = brandClicks.filter(x => n - x < 4000).concat(n); if (brandClicks.length >= 7) { brandClicks = []; brandSpin(); } }
    // o clique no recurso já abre um painel que passa a cobrir o chip: contamos pelas COORDENADAS do clique sobre o chip de Ouro
    const goldEl = document.querySelector('#resourceStrip .resource-chip[data-resource="gold"]') || [...document.querySelectorAll('.resource-chip')].find(c => /\u{1F4B0}/u.test(c.textContent)); /* Etapa 58: o chip agora tem um ícone SVG no lugar do emoji; a chave do recurso é estável */ if (goldEl && e.clientX !== undefined) { const r = goldEl.getBoundingClientRect(); if (r.width && e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) { goldClicks = goldClicks.filter(x => n - x < 3500).concat(n); if (goldClicks.length >= 5) { goldClicks = []; coins(); } } } void chip;
    if (castle) { castleClicks = castleClicks.filter(x => n - x < 3000).concat(n); if (castleClicks.length >= 3) { castleClicks = []; fireworks('castelo'); toast('🏰 "Longa vida ao reino!"'); } }
  });

  // ================================================================ preferências (usado por a11y.js)
  K.fx = {
    secrets: SECRETS, found: () => [...found()], unlock, fireworks,
    prefsHtml() { const f = found(); const gold = LS.get('kot_gold', false); const unlocked = f.size >= 5 || gold; return `<h4 style="margin:10px 0 4px">Ambientação</h4><div class="pref-row"><input type="checkbox" id="prCursor" ${H.classList.contains('cursor-theme') ? 'checked' : ''}><label for="prCursor">Cursor temático (seta dourada)</label></div><div class="pref-row"><input type="checkbox" id="prGold" ${H.classList.contains('theme-gold') ? 'checked' : ''} ${unlocked ? '' : 'disabled'}><label for="prGold">Brilho dourado ${unlocked ? '' : '(libera com 5 segredos)'}</label></div><h4 style="margin:10px 0 4px">🗝️ Segredos do reino (${f.size}/${SECRETS.length})</h4><ul class="secret-list" style="list-style:none;margin:0;padding:0">${SECRETS.map(s => `<li style="padding:3px 0">${f.has(s.id) ? `${s.icon} <strong>${s.name}</strong>` : `❔ <em>${s.hint}</em>`}</li>`).join('')}</ul>${f.size === SECRETS.length ? '<p class="hint">🃏 Mestre dos Segredos!</p>' : ''}`; },
    bindPrefs(root) { const on = (id, fn) => { const e = root.querySelector('#' + id); if (e) e.addEventListener('change', fn); }; on('prCursor', (e) => { H.classList.toggle('cursor-theme', e.target.checked); LS.set('kot_cursor', e.target.checked); }); on('prGold', (e) => { H.classList.toggle('theme-gold', e.target.checked); LS.set('kot_gold', e.target.checked); }); },
  };

  // ================================================================ ligação com o ciclo do jogo
  document.addEventListener('kot:refreshed', () => { syncSeason(); flashResources(); const k = K.state && K.state.kingdom; if (k) { if (prevYear !== null && k.year > prevYear) { fireworks('anonovo'); toast(`🎆 Feliz Ano ${k.year}, Majestade! O reino completa mais um ciclo.`); } prevYear = k.year; owl(); } });
  document.addEventListener('kot:lang', () => { /* ícones não mudam */ });
  new MutationObserver(() => { syncSeason(); }).observe(H, { attributes: true, attributeFilter: ['data-theme', 'class'] });
  function boot() { buildScene(); if (document.body.dataset.scene && !calm()) startParticles('brasas'); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
