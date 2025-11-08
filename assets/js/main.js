// Minimal site JS: hamburger toggle, cookie consent, and a simple cart counter
(function(){
  // Hamburger toggle for small screens
  function initHamburger(){
    var btn = document.querySelector('.hamburger');
    var nav = document.querySelector('.nav');
    if(!btn || !nav) return;
    btn.addEventListener('click', function(){
      var isHidden = nav.style.display === 'none' || getComputedStyle(nav).display === 'none';
      nav.style.display = isHidden ? 'flex' : 'none';
    });
    // ensure correct initial state based on viewport
    function onResize(){
      if(window.innerWidth > 900){ nav.style.display = 'flex'; }
      else if(!nav.style.display){ nav.style.display = 'none'; }
    }
    window.addEventListener('resize', onResize);
    onResize();
  }

  // Cookie banner: simple consent stored in localStorage
  function initCookieBanner(){
    var banner = document.querySelector('.cookie-banner');
    if(!banner) return;
    var accepted = localStorage.getItem('zyn_cookie_accepted');
    if(!accepted){ banner.style.display = 'block'; }
    var accept = document.getElementById('cookie-accept');
    var decline = document.getElementById('cookie-decline');
    if(accept) accept.addEventListener('click', function(){ localStorage.setItem('zyn_cookie_accepted', '1'); banner.style.display = 'none'; });
    if(decline) decline.addEventListener('click', function(){ localStorage.setItem('zyn_cookie_accepted', '0'); banner.style.display = 'none'; });
  }

  // Minimal cart: store count in localStorage and update Cart link text
  function initCart(){
    var KEY = 'zyn_cart_count';
    function getCount(){
      var raw = localStorage.getItem(KEY);
      var parsed = parseInt(raw || '0', 10);
      return isNaN(parsed) ? 0 : parsed;
    }
    function setCount(n){
      var next = parseInt(n, 10);
      if (isNaN(next) || next < 0) next = 0;
      localStorage.setItem(KEY, String(next));
      updateCartUI(next);
    }
    function updateCartUI(count){
      var value = typeof count === 'number' ? count : getCount();
      if (isNaN(value) || value < 0) value = 0;
      document.querySelectorAll('.cart').forEach(function(el){
        var label = el.querySelector('.cart-label');
        if (!label) return;
        label.textContent = value > 0 ? 'Cart (' + value + ')' : 'Cart';
      });
    }
    // Add-to-cart buttons inside price cards
    document.addEventListener('click', function(e){
      var btn = e.target.closest('button');
      if (!btn) return;
      var text = (btn.textContent || '').trim().toLowerCase();
      if (text.indexOf('add to cart') !== -1){
        var packageId = btn.getAttribute('data-package');
        if (!packageId) return;
        
        // Add to cart items
        var CART_ITEMS_KEY = 'zyn_cart_items';
        try {
          var items = JSON.parse(localStorage.getItem(CART_ITEMS_KEY) || '[]');
          items.push({ id: packageId, addedAt: new Date().toISOString() });
          localStorage.setItem(CART_ITEMS_KEY, JSON.stringify(items));
        } catch(e){
          console.error('Failed to add item to cart:', e);
        }
        
        // Update counter
        var c = getCount();
        setCount(c + 1);
        
        // Visual feedback
        var original = btn.textContent;
        btn.textContent = 'Added!';
        setTimeout(function(){ btn.textContent = original; }, 1200);
      }
    });

    updateCartUI(getCount());
  }

  document.addEventListener('DOMContentLoaded', function(){
    initHamburger();
    initCookieBanner();
    initCart();
  });
})();
