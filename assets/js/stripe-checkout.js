// assets/js/stripe-checkout.js
// Stripe Checkout integration for Zyntriax
(function(){
  // Replace with your Stripe publishable key
  var STRIPE_KEY = 'pk_test_XXXXXXXXXXXXXXXXXXXXXXXX';

  function getCartTotal(){
    var totalEl = document.getElementById('cart-total');
    if (!totalEl) return 0;
    var value = totalEl.textContent.replace(/[^\d.]/g, '');
    return parseFloat(value) || 0;
  }

  function getCartItems(){
    try {
      var raw = localStorage.getItem('zyn_cart_items');
      return raw ? JSON.parse(raw) : [];
    } catch(e){ return []; }
  }

  function handleCheckout(){
    var items = getCartItems();
    if (items.length === 0) return;
    var total = getCartTotal();
    // For demo: one price, one quantity
    // In production, use Stripe Price IDs and quantities
    var stripe = Stripe(STRIPE_KEY);
    stripe.redirectToCheckout({
      lineItems: [{ price: 'price_XXXXXXXXXXXX', quantity: 1 }], // Replace with your Stripe Price ID
      mode: 'payment',
      successUrl: window.location.origin + '/checkout-success.html',
      cancelUrl: window.location.origin + '/checkout-cancel.html'
    });
  }

  document.addEventListener('DOMContentLoaded', function(){
    var btn = document.getElementById('checkout-btn');
    if (btn) {
      btn.addEventListener('click', function(e){
        e.preventDefault();
        handleCheckout();
      });
    }
  });
})();
