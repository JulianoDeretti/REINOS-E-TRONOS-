// js/auth-ui.js — Etapa 39: ajudas de segurança nos formulários de login/cadastro (mostrar senha, força, regras, Caps Lock).
(function () {
  const COMMON = new Set(['12345678', '123456789', 'password', 'password1', 'senha123', 'senha1234', 'qwerty123', 'abc12345', 'abcd1234', '11111111', 'iloveyou1', 'admin123', 'kingsorthrones1', 'reino123', 'teste123']);
  const rules = [['8 ou mais caracteres', (p) => p.length >= 8], ['uma letra', (p) => /[A-Za-z\u00C0-\u024F]/.test(p)], ['um número', (p) => /\d/.test(p)], ['não é uma senha comum nem sequência', (p) => !COMMON.has(p.toLowerCase()) && !/(01234567|12345678|23456789|87654321|abcdefgh|qwertyui)/i.test(p) && !/^(.)\1{5,}$/.test(p)]];
  document.querySelectorAll('input[type=password]').forEach((input) => {
    const wrap = document.createElement('div'); wrap.className = 'pw-wrap'; input.parentNode.insertBefore(wrap, input); wrap.appendChild(input);
    const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'pw-toggle'; btn.setAttribute('aria-label', 'Mostrar senha'); btn.setAttribute('aria-pressed', 'false'); btn.textContent = '👁️';
    btn.addEventListener('click', () => { const show = input.type === 'password'; input.type = show ? 'text' : 'password'; btn.setAttribute('aria-pressed', String(show)); btn.setAttribute('aria-label', show ? 'Ocultar senha' : 'Mostrar senha'); btn.textContent = show ? '🙈' : '👁️'; }); wrap.appendChild(btn);
    const warn = document.createElement('div'); warn.className = 'caps-warn'; warn.setAttribute('role', 'status'); warn.textContent = '⚠️ Caps Lock está ligado.'; wrap.parentNode.insertBefore(warn, wrap.nextSibling);
    const caps = (e) => { if (e.getModifierState) warn.classList.toggle('on', e.getModifierState('CapsLock')); }; input.addEventListener('keydown', caps); input.addEventListener('keyup', caps); input.addEventListener('blur', () => warn.classList.remove('on'));
  });
  const pw = document.getElementById('password'); const form = document.getElementById('registerForm');
  if (pw && form) {
    const meter = document.createElement('div'); meter.className = 'pw-meter'; meter.setAttribute('role', 'progressbar'); meter.setAttribute('aria-label', 'Força da senha'); meter.setAttribute('aria-valuemin', '0'); meter.setAttribute('aria-valuemax', '4'); meter.innerHTML = '<i></i>';
    const list = document.createElement('ul'); list.className = 'pw-rules'; list.setAttribute('aria-live', 'polite'); list.innerHTML = rules.map(([t]) => `<li>${t}</li>`).join(''); const anchor = document.getElementById('pwHint') || pw.closest('.pw-wrap'); anchor.parentNode.insertBefore(meter, anchor.nextSibling); meter.parentNode.insertBefore(list, meter.nextSibling);
    const upd = () => { const p = pw.value; let score = 0; rules.forEach(([, f], i) => { const ok = f(p); list.children[i].classList.toggle('ok', ok); if (ok) score++; }); if (p.length >= 12 && score === 4) score = 4; else if (score === 4) score = 3; const col = ['#c23b4c', '#e0883a', '#d4a827', '#8fbf5a', '#2f8f46'][score]; const bar = meter.firstChild; bar.style.width = (score / 4 * 100) + '%'; bar.style.background = col; meter.setAttribute('aria-valuenow', String(score)); meter.setAttribute('aria-valuetext', ['muito fraca', 'fraca', 'razoável', 'boa', 'forte'][score]); };
    pw.addEventListener('input', upd); upd();
  }
})();
