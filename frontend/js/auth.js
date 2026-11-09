// js/auth.js
// Logica das telas de login e cadastro.

(function () {
  // Se ja estiver logado, nao faz sentido ver a tela de login/cadastro.
  if (Api.isLoggedIn()) {
    window.location.href = 'index.html';
    return;
  }

  const alertBox = document.getElementById('alert');

  function showError(message) {
    alertBox.textContent = message;
    alertBox.className = 'alert alert-error show';
  }

  function hideAlert() {
    alertBox.className = 'alert';
  }

  function setLoading(loading, submitBtn, submitLabel, idleText, loadingText) {
    submitBtn.disabled = loading;
    submitLabel.innerHTML = loading
      ? `<span class="spinner"></span> ${loadingText}`
      : idleText;
  }

  async function afterAuth(result) {
    Api.setSession(result.token, result.user);
    const hasKingdom = typeof result.hasKingdom === 'boolean'
      ? result.hasKingdom
      : (await Api.me()).hasKingdom;
    window.location.href = hasKingdom ? 'kingdom.html' : 'create-kingdom.html';
  }

  // ---------------- LOGIN ----------------
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideAlert();
      const submitBtn = document.getElementById('submitBtn');
      const submitLabel = document.getElementById('submitLabel');

      const identifier = document.getElementById('identifier').value.trim();
      const password = document.getElementById('password').value;

      if (!identifier || !password) {
        showError('Preencha e-mail/usuário e senha.');
        return;
      }

      setLoading(true, submitBtn, submitLabel, 'Entrar no reino', 'Verificando…');
      try {
        const result = await Api.login({ identifier, password });
        await afterAuth(result);
      } catch (err) {
        showError(err.message);
        setLoading(false, submitBtn, submitLabel, 'Entrar no reino', '');
      }
    });
  }

  // ---------------- REGISTER ----------------
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideAlert();
      const submitBtn = document.getElementById('submitBtn');
      const submitLabel = document.getElementById('submitLabel');

      const username = document.getElementById('username').value.trim();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirmPassword').value;

      if (!/^[A-Za-z0-9_.-]{3,24}$/.test(username)) return showError('Usuário: 3 a 24 caracteres, apenas letras, números, ponto, hífen e sublinhado.');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showError('Informe um e-mail válido.');
      if (password.length < 8) return showError('A senha precisa ter pelo menos 8 caracteres.');
      if (!/[A-Za-z\u00C0-\u024F]/.test(password) || !/\d/.test(password)) return showError('A senha precisa ter pelo menos uma letra e um número.');
      if (password !== confirmPassword) return showError('As senhas não conferem.');

      setLoading(true, submitBtn, submitLabel, 'Criar minha conta', 'Fundando sua linhagem…');
      try {
        const result = await Api.register({ username, email, password, confirmPassword });
        await afterAuth(result);
      } catch (err) {
        showError(err.message);
        setLoading(false, submitBtn, submitLabel, 'Criar minha conta', '');
      }
    });
  }
})();
