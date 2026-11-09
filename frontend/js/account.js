// js/account.js — Etapa 39: cartão "Segurança da conta" na aba Configurações.
(function () {
  const K = window.KOT; const API = (typeof Api !== 'undefined' ? Api : window.Api); if (!K || !API) return;
  const esc = K.escapeHtml; const toast = (m) => K.showToast(m);
  let busy = false;
  function fmt(at) { try { const d = new Date(at.replace(' ', 'T') + 'Z'); return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }); } catch { return at; } }
  async function render() {
    const panel = document.querySelector('.dash-panel[data-panel="config"]'); if (!panel || busy) return; busy = true;
    try {
      let card = document.getElementById('securityCard'); if (!card) { card = document.createElement('div'); card.id = 'securityCard'; card.className = 'parchment-panel'; card.innerHTML = '<span class="panel-corner tl"></span><span class="panel-corner tr"></span><span class="panel-corner bl"></span><span class="panel-corner br"></span><div id="securityBody"></div>'; panel.appendChild(card); }
      const [me, act] = await Promise.all([API.me(), API.getAuthActivity()]); const u = me.user; const suspicious = act.events.filter(e => e.suspicious).length;
      document.getElementById('securityBody').innerHTML = `
        <h3>🔐 Segurança da conta</h3>
        <p class="hint">Conta: <strong>${esc(u.username)}</strong> (${esc(u.email)}) · última entrada: ${u.last_login_at ? esc(fmt(u.last_login_at)) : '—'} · senha alterada em: ${u.password_changed_at ? esc(fmt(u.password_changed_at)) : '—'}</p>
        <div class="w-card"><h5>🔑 Trocar senha</h5>
          <div class="field"><label for="acCur">Senha atual</label><input type="password" id="acCur" autocomplete="current-password"></div>
          <div class="field"><label for="acNew">Nova senha (8+ caracteres, com letra e número)</label><input type="password" id="acNew" autocomplete="new-password"></div>
          <div class="field"><label for="acNew2">Repita a nova senha</label><input type="password" id="acNew2" autocomplete="new-password"></div>
          <button class="btn btn-secondary btn-sm" id="acChange" type="button">Trocar senha</button> <span class="hint">Os outros dispositivos serão desconectados.</span></div>
        <div class="w-card"><h5>🚪 Sessões</h5><p class="hint">A sessão fica em um cookie protegido (o JavaScript do navegador não consegue lê-lo) e vale por 7 dias.</p><button class="btn btn-ghost btn-sm" id="acLogoutAll" type="button">Sair de todos os dispositivos</button></div>
        <div class="w-card"><h5>📜 Atividade recente ${suspicious ? `<span class="pop-alert" style="display:inline-block;padding:2px 8px;margin-left:6px">⚠️ ${suspicious} evento(s) suspeito(s)</span>` : ''}</h5>
          <ul class="w-muted" style="margin:4px 0 0 16px;padding:0">${act.events.slice(0, 12).map(e => `<li style="${e.suspicious ? 'color:#9c2a38;font-weight:700' : ''}">${esc(fmt(e.at))} — ${esc(e.label)}${e.ip ? ' · ' + esc(e.ip) : ''}</li>`).join('') || '<li>Sem registros.</li>'}</ul></div>
        <div class="w-card" style="border-color:#9c2a38"><h5>🗑️ Excluir conta e reino</h5><p class="hint">Apaga definitivamente a conta e todo o reino. Não há como desfazer.</p>
          <div class="field"><label for="acDelPw">Sua senha</label><input type="password" id="acDelPw" autocomplete="current-password"></div>
          <div class="field"><label for="acDelUser">Digite seu usuário (<strong>${esc(u.username)}</strong>) para confirmar</label><input type="text" id="acDelUser" autocomplete="off"></div>
          <button class="btn btn-secondary btn-sm" id="acDelete" type="button" style="background:#7a1f2b">Excluir definitivamente</button></div>`;
      const $ = (id) => document.getElementById(id);
      $('acChange').addEventListener('click', async () => { const n = $('acNew').value; if (n !== $('acNew2').value) return toast('⚠️ As novas senhas não conferem.'); try { const r = await API.changePassword({ currentPassword: $('acCur').value, newPassword: n }); toast('🔑 ' + r.message); busy = false; render(); } catch (e) { toast('⚠️ ' + e.message); } });
      $('acLogoutAll').addEventListener('click', async () => { try { await API.logout(true); } catch { /* noop */ } API.clearSession(); window.location.href = 'login.html'; });
      $('acDelete').addEventListener('click', async () => { if (!window.confirm('Excluir DEFINITIVAMENTE sua conta e todo o reino? Isso não pode ser desfeito.')) return; try { const r = await API.deleteAccount({ password: $('acDelPw').value, confirm: $('acDelUser').value }); toast('🗑️ ' + r.message); API.clearSession(); setTimeout(() => { window.location.href = 'index.html'; }, 1200); } catch (e) { toast('⚠️ ' + e.message); } });
      if (K.i18n) K.i18n.apply();
    } catch (e) { /* sem sessão: a própria interface redireciona */ } finally { busy = false; }
  }
  document.addEventListener('kot:panel', (e) => { if (e.detail === 'config') setTimeout(render, 30); });
})();
