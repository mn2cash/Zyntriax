// assets/js/cart.js - Cart page logic
(function(){
  var KEY = 'zyn_cart_items';
  var TAX_RATE = 0.20; // 20% VAT

  // Mock product data (in production, fetch from DB/API)
  var PRODUCTS = {
    'starter': { name: 'Starter Package', price: 499 },
    'professional': { name: 'Professional Package', price: 999 },
    'ecommerce': { name: 'E-commerce Package', price: 1499 }
  };

  function getCartItems(){
    try {
      var raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : [];
    } catch(e){
      console.error('Failed to parse cart items:', e);
      return [];
    }
  }

  function saveCartItems(items){
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch(e){
      console.error('Failed to save cart items:', e);
    }
  }

  function removeItem(index){
    var items = getCartItems();
    items.splice(index, 1);
    saveCartItems(items);
    renderCart();
  }

  function calculateTotals(items){
    var subtotal = items.reduce(function(sum, item){
      var product = PRODUCTS[item.id];
      return sum + (product ? product.price : 0);
    }, 0);
    var tax = subtotal * TAX_RATE;
    var total = subtotal + tax;
    return { subtotal: subtotal, tax: tax, total: total };
  }

  function formatPrice(amount){
    return '£' + amount.toFixed(2);
  }

  function renderCart(){
    var container = document.getElementById('cart-items');
    var subtotalEl = document.getElementById('cart-subtotal');
    var taxEl = document.getElementById('cart-tax');
    var totalEl = document.getElementById('cart-total');
    var checkoutBtn = document.getElementById('checkout-btn');

    if (!container) return;

    var items = getCartItems();
    var totals = calculateTotals(items);

    // Update summary
    if (subtotalEl) subtotalEl.textContent = formatPrice(totals.subtotal);
    if (taxEl) taxEl.textContent = formatPrice(totals.tax);
    if (totalEl) totalEl.textContent = formatPrice(totals.total);

    if (items.length === 0){
      container.innerHTML = '<div class="card"><p style="text-align:center;color:var(--muted);">Your cart is empty.</p></div>';
      if (checkoutBtn) checkoutBtn.disabled = true;
      return;
    }

    if (checkoutBtn) checkoutBtn.disabled = false;

    container.innerHTML = '';
    items.forEach(function(item, index){
      var product = PRODUCTS[item.id];
      if (!product) return;

      var card = document.createElement('div');
      card.className = 'card';
      card.style.display = 'flex';
      card.style.alignItems = 'center';
      card.style.justifyContent = 'space-between';
      card.style.gap = '16px';

      var info = document.createElement('div');
      info.style.flex = '1';
      
      var title = document.createElement('h3');
      title.style.margin = '0 0 8px';
      title.textContent = product.name;
      
      var price = document.createElement('p');
      price.style.margin = '0';
      price.style.color = 'var(--primary)';
      price.style.fontWeight = '600';
      price.textContent = formatPrice(product.price);

      info.appendChild(title);
      info.appendChild(price);

      var removeBtn = document.createElement('button');
      removeBtn.className = 'btn btn-ghost';
      removeBtn.textContent = 'Remove';
      removeBtn.addEventListener('click', function(){
        removeItem(index);
      });

      card.appendChild(info);
      card.appendChild(removeBtn);
      container.appendChild(card);
    });
  }

  function initCheckout(){
    var checkoutBtn = document.getElementById('checkout-btn');
    if (!checkoutBtn) return;

    checkoutBtn.addEventListener('click', function(){
      var items = getCartItems();
      if (items.length === 0) return;

      alert('Checkout functionality coming soon! Your order:\n\n' + 
        items.map(function(item){
          var product = PRODUCTS[item.id];
          return product ? product.name + ' - ' + formatPrice(product.price) : '';
        }).join('\n'));
    });
  }

  document.addEventListener('DOMContentLoaded', function(){
    renderCart();
    initCheckout();
  });
})();
