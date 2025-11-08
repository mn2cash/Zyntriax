// Auth UI and page protection. Requires window.supabase (initialized via supabase-client.js)
(function(){
  function qs(sel){ return document.querySelector(sel); }
  function qsa(sel){ return Array.prototype.slice.call(document.querySelectorAll(sel)); }

  async function getUser(){
    try {
      var res = await window.supabase.auth.getUser();
      return res && res.data ? res.data.user : null;
    } catch(e){
      console.error('getUser error', e);
      return null;
    }
  }

  function setRedirectAfterLogin(){
    try { localStorage.setItem('redirectAfterLogin', window.location.pathname); } catch(_){}
  }
  function consumeRedirectAfterLogin(){
    try {
      var p = localStorage.getItem('redirectAfterLogin');
      if (p) { localStorage.removeItem('redirectAfterLogin'); return p; }
    } catch(_){}
    return null;
  }

  async function renderAuthUI(){
    var container = qs('.lang-cart');
    if (!container) return;
    var user = await getUser();
    // Preserve only non-auth elements (lang and cart links)
    var existingLinks = Array.from(container.children).filter(function(child){
      return child.classList && (child.classList.contains('lang') || child.classList.contains('cart'));
    });
    container.innerHTML = '';
    existingLinks.forEach(link => container.appendChild(link));
    if (user) {
      var email = user.email || 'Account';
      var emailSpan = document.createElement('span');
      emailSpan.className = 'auth-email';
      emailSpan.textContent = email;
      container.appendChild(emailSpan);
      var signOutBtn = document.createElement('a');
      signOutBtn.href = '#';
      signOutBtn.id = 'signout-btn';
      signOutBtn.className = 'btn btn-ghost';
      signOutBtn.textContent = 'Sign out';
      signOutBtn.addEventListener('click', async function(e){
        e.preventDefault();
        try { await window.supabase.auth.signOut(); } catch(e){ console.error(e); }
        window.location.reload();
      });
      container.appendChild(signOutBtn);
    } else {
      var signInBtn = document.createElement('a');
      signInBtn.href = 'login.html';
      signInBtn.className = 'btn btn-ghost';
      signInBtn.textContent = 'Sign in';
      container.appendChild(signInBtn);
    }
  }

  async function protectIfNeeded(){
    if (!document.body.classList.contains('protected')) return;
    var user = await getUser();
    if (!user) {
      setRedirectAfterLogin();
      window.location.href = 'login.html';
    }
  }

  function init(){
    if (!window.supabase) return;
    // keep UI in sync with auth events
    window.supabase.auth.onAuthStateChange(function(){ renderAuthUI(); });
    renderAuthUI();
    protectIfNeeded();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
