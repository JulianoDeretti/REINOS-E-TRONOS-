// js/index.js — decide entre landing e redirecionamento (antes inline; movido para permitir CSP sem 'unsafe-inline')
(async function boot() {
  const loading = document.getElementById('loading');
  const landing = document.getElementById('landing');

  if (!Api.isLoggedIn()) {
    loading.classList.add('hidden');
    landing.classList.remove('hidden');
    return;
  }

  try {
    const { hasKingdom } = await Api.me();
    window.location.href = hasKingdom ? 'kingdom.html' : 'create-kingdom.html';
  } catch (err) {
    Api.clearSession();
    loading.classList.add('hidden');
    landing.classList.remove('hidden');
  }
})();
