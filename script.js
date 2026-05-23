// Mia Duck - Cart & Site Script
// This script provides a lightweight cart implementation using
// `localStorage` so users can add items from any page and see
// them on the cart page. It also contains helpers for the
// cart UI (quantity, remove, promo, delivery options).

// Key used to persist the cart in the browser's localStorage
const CART_KEY = 'miaCart';

// Runtime state for promos and delivery fee
let promoDiscount = 0;
let deliveryFee = 150;

// Retrieve the cart array from localStorage. Returns [] on errors.
function getCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch (e) { return []; }
}

// Persist the cart array to localStorage.
function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

// Add an item object to the cart. The `item` object may contain:
// { id, name, price, origPrice, qty, emoji }
// If the same item (by id or name) already exists, we increment qty.
function addToCart(item) {
  const cart = getCart();
  const existing = cart.find(c => c.id === item.id || c.name === item.name);
  if (existing) existing.qty = (existing.qty || 0) + (item.qty || 1);
  else cart.push({ id: item.id || ('i'+Date.now()), name: item.name || 'Item', price: item.price || 1000, origPrice: item.origPrice || Math.round((item.price||1000)*1.5), qty: item.qty || 1, emoji: item.emoji || '📦' });
  saveCart(cart);
  showToast('Added "' + (item.name || 'Item') + '" to cart');
  // update mini-cart UI (if present) and show drawer
  updateMiniCart();
  showMiniCart();
}

// Mini-cart drawer helpers
function ensureMiniCart() {
  let mc = document.getElementById('miniCart');
  if (mc) return mc;
  mc = document.createElement('aside');
  mc.id = 'miniCart';
  mc.className = 'mini-cart';
  mc.innerHTML = `
    <div class="mini-cart-panel">
      <header class="mini-cart-header">
        <strong>Your Cart</strong>
        <button class="mini-cart-close" aria-label="Close">✕</button>
      </header>
      <div class="mini-cart-list" id="miniCartList"></div>
      <footer class="mini-cart-footer">
        <div class="mini-cart-summary">
          <span id="miniCartCount">0 items</span>
          <strong id="miniCartTotal">KES 0</strong>
        </div>
        <div class="mini-cart-actions">
          <button id="miniContinue" class="mini-cart-btn">Continue</button>
          <button id="miniViewCart" class="mini-cart-btn primary">View Cart</button>
        </div>
      </footer>
    </div>
  `;
  document.body.appendChild(mc);
  // wire close and view cart
  mc.querySelector('.mini-cart-close').addEventListener('click', closeMiniCart);
  mc.querySelector('#miniContinue').addEventListener('click', closeMiniCart);
  mc.querySelector('#miniViewCart').addEventListener('click', () => { window.location.href = 'cart.html#cart'; });
  return mc;
}

function updateMiniCart() {
  const mc = ensureMiniCart();
  const list = mc.querySelector('#miniCartList');
  const cart = getCart();
  list.innerHTML = '';
  let total = 0, count = 0;
  cart.slice(0,6).forEach(item => {
    const itemEl = document.createElement('div');
    itemEl.className = 'mini-cart-item';
    itemEl.innerHTML = `<div class="mini-item-name">${item.name}</div><div class="mini-item-meta"><span class="mini-item-qty">x${item.qty}</span><span class="mini-item-price">KES ${item.price.toLocaleString()}</span></div>`;
    list.appendChild(itemEl);
    total += (item.price || 0) * (item.qty || 1);
    count += item.qty || 0;
  });
  if (cart.length > 6) {
    const more = document.createElement('div');
    more.className = 'mini-cart-more';
    more.textContent = `+ ${cart.length - 6} more items`;
    list.appendChild(more);
  }
  mc.querySelector('#miniCartCount').textContent = count + ' item' + (count !== 1 ? 's' : '');
  mc.querySelector('#miniCartTotal').textContent = 'KES ' + total.toLocaleString();
}

function showMiniCart() {
  const mc = ensureMiniCart();
  requestAnimationFrame(() => mc.classList.add('open'));
}

function closeMiniCart() {
  const mc = document.getElementById('miniCart');
  if (!mc) return;
  mc.classList.remove('open');
}

// Helper: find product info from a clicked anchor by scanning ancestors
// Infer a product's minimal info from the DOM when a Buy Now anchor
// is clicked. This is a convenience fallback when there are no
// explicit data attributes (data-id, data-price) on the anchor.
// Returns an object with { id, name, price } suitable for addToCart().
function inferProductInfo(anchor) {
  const container = anchor.closest('.product-card, .categories-card, .category-card, .categories-interactive, .location-card, .category-content, .categories-card-content, .premium-card') || document.body;
  const nameEl = container.querySelector('h3, h2, .category-title, .categories-card-title, .categories-card-title');
  const name = nameEl ? nameEl.textContent.trim() : document.title;
  const priceEl = container.querySelector('.price-amount, [data-price], .item-price, .price, .premium-price');
  let price = 1000; // fallback price
  if (priceEl) {
    const val = priceEl.getAttribute('data-price') || priceEl.textContent;
    price = parseInt(String(val).replace(/[^0-9]/g,'')) || price;
  }
  return { id: name.toLowerCase().replace(/[^a-z0-9]+/g,'_'), name, price };
}

function injectNavSearch() {
  const nav = document.querySelector('nav');
  if (!nav || nav.querySelector('.nav-search')) return;

  const wrapper = document.createElement('div');
  wrapper.className = 'nav-search';
  wrapper.innerHTML = `
    <button class="nav-search-toggle" type="button" aria-label="Open search">🔍</button>
    <form class="nav-search-form" action="#" role="search">
      <input type="search" class="nav-search-input" placeholder="Search products…" aria-label="Search products">
      <button type="submit" class="nav-search-button">Search</button>
    </form>
  `;

  const logo = nav.querySelector('.logo');
  if (logo && logo.parentNode === nav) {
    nav.insertBefore(wrapper, logo.nextSibling);
  } else {
    nav.prepend(wrapper);
  }

  const toggle = wrapper.querySelector('.nav-search-toggle');
  const form = wrapper.querySelector('.nav-search-form');
  const input = wrapper.querySelector('.nav-search-input');

  toggle.addEventListener('click', () => {
    wrapper.classList.toggle('open');
    if (wrapper.classList.contains('open')) input.focus();
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const query = input.value.trim();
    if (!query) {
      input.focus();
      return;
    }
    searchPage(query);
    wrapper.classList.remove('open');
  });

  document.addEventListener('click', (event) => {
    if (!wrapper.contains(event.target) && wrapper.classList.contains('open')) {
      wrapper.classList.remove('open');
    }
  });
}

function searchPage(query) {
  const searchTerm = query.toLowerCase();
  const cardSelectors = [
    '.product-card',
    '.premium-card',
    '.decor-card',
    '.categories-card',
    '.category-card',
    '.location-card',
    '.home-decor-grid .product-card',
    '.beauty-grid .product-card'
  ];
  const cards = Array.from(document.querySelectorAll(cardSelectors.join(',')));
  let matches = 0;
  let firstMatch = null;

  cards.forEach(card => {
    card.classList.remove('search-match');
    const text = card.textContent.toLowerCase();
    if (text.includes(searchTerm)) {
      card.classList.add('search-match');
      matches += 1;
      if (!firstMatch) firstMatch = card;
    }
  });

  if (firstMatch) {
    firstMatch.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  if (matches > 0) {
    showToast(`Found ${matches} result${matches === 1 ? '' : 's'} for "${query}"`);
  } else {
    showToast(`No results for "${query}"`);
  }
}

function injectNavSearchStyles() {
  if (document.getElementById('navSearchStyles')) return;
  const style = document.createElement('style');
  style.id = 'navSearchStyles';
  style.textContent = `
    .nav-search {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-left: auto;
    }

    .nav-search-form {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .nav-search-input {
      min-width: 200px;
      width: 220px;
      padding: 9px 14px;
      border-radius: 999px;
      border: 1px solid rgba(0,0,0,0.12);
      transition: width 0.22s ease, box-shadow 0.22s ease;
      font-size: 0.95rem;
      background: rgba(255,255,255,0.96);
      color: #1a1a1a;
    }

    .nav-search-input:focus {
      outline: none;
      box-shadow: 0 0 0 4px rgba(255, 215, 0, 0.18);
    }

    .nav-search-button,
    .nav-search-toggle {
      border: none;
      cursor: pointer;
      background: var(--primary-yellow);
      color: var(--dark-bg);
      border-radius: 999px;
      padding: 9px 14px;
      font-weight: 700;
      transition: transform 0.2s ease, background 0.2s ease;
    }

    .nav-search-toggle {
      display: none;
      background: transparent;
      color: var(--text-primary);
      padding: 0 8px;
    }

    .nav-search-button:hover,
    .nav-search-toggle:hover {
      transform: translateY(-1px);
    }

    .nav-search.open .nav-search-form {
      display: flex;
    }

    .search-match {
      box-shadow: 0 0 0 3px rgba(255, 215, 0, 0.35);
      border-radius: 18px;
    }

    @media (max-width: 900px) {
      .nav-search {
        order: 3;
        width: 100%;
        justify-content: flex-end;
      }
      .nav-search-input {
        min-width: 160px;
        width: 100%;
      }
    }

    @media (max-width: 720px) {
      .nav-search {
        position: relative;
        justify-content: flex-end;
        gap: 4px;
      }

      .nav-search-form {
        position: absolute;
        top: 100%;
        right: 0;
        left: 0;
        display: none;
        flex-direction: column;
        padding: 14px 16px;
        background: rgba(255,255,255,0.98);
        box-shadow: 0 20px 40px rgba(0,0,0,0.12);
        gap: 10px;
        border-radius: 16px;
        z-index: 1000;
      }

      .nav-search.open .nav-search-form {
        display: flex;
      }

      .nav-search-input {
        width: 100%;
        min-width: 0;
      }

      .nav-search-button {
        width: 100%;
      }

      .nav-search-toggle {
        display: inline-flex;
      }
    }
  `;
  document.head.appendChild(style);
}

// Set min date for booking if field exists (cart page only)
// If the cart page's date input exists, set a sensible min date (tomorrow).
if (document.getElementById('deliveryDate')) {
  const today = new Date();
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  document.getElementById('deliveryDate').min = tomorrow.toISOString().split('T')[0];
}

  // changeQty: increment/decrement a qty input and persist to cart
  function changeQty(id, delta) {
    const input = document.getElementById(id);
    let v = parseInt(input.value) + delta;
    if (v < 1) v = 1;
    if (v > 99) v = 99;
    input.value = v;
    updateSummary();
    // persist change to cart storage when qty input uses our generated ids
    const itemEl = input.closest('.cart-item');
    if (itemEl && itemEl.dataset.cartId) {
      const cart = getCart();
      const c = cart.find(x => x.id === itemEl.dataset.cartId);
      if (c) { c.qty = v; saveCart(cart); }
    }
  }

  // removeItem: animate out and remove both from DOM and localStorage
  function removeItem(id) {
    const el = document.getElementById(id);
    el.style.transition = 'opacity 0.3s, transform 0.3s';
    el.style.opacity = '0';
    el.style.transform = 'translateX(30px)';
    setTimeout(() => {
      // remove from DOM
      const cartId = el.dataset.cartId;
      el.style.display = 'none';
      // remove from storage
      if (cartId) {
        const cart = getCart().filter(x => x.id !== cartId);
        saveCart(cart);
      }
      updateSummary();
      checkEmpty();
    }, 300);
    showToast('Item removed from cart');
  }

  function toggleAll(cb) {
    document.querySelectorAll('.item-checkbox').forEach(c => c.checked = cb.checked);
    updateSummary();
  }

  // clearSelected: hides selected items and removes them from storage
  function clearSelected() {
    document.querySelectorAll('.cart-item').forEach(item => {
      const cb = item.querySelector('.item-checkbox');
      if (cb && cb.checked) {
        item.style.transition = 'opacity 0.3s';
        item.style.opacity = '0';
        setTimeout(() => { item.style.display = 'none'; updateSummary(); checkEmpty(); }, 300);
      }
    });
    showToast('Selected items removed');
    // also remove selected from storage
    const cart = getCart().filter(item => {
      const el = document.querySelector('.cart-item[data-cart-id="'+item.id+'"]');
      return el && el.querySelector('.item-checkbox') && !el.querySelector('.item-checkbox').checked;
    });
    saveCart(cart);
  }

  // checkEmpty: toggle the empty-cart UI when there are no visible items
  function checkEmpty() {
    const visible = [...document.querySelectorAll('.cart-item')].filter(i => i.style.display !== 'none');
    document.getElementById('emptyCart').style.display = visible.length === 0 ? 'block' : 'none';
  }

  // selectOption: choose delivery option and update delivery fee
  function selectOption(opt) {
    ['express','standard','later'].forEach(o => {
      document.getElementById('opt-'+o).classList.toggle('active', o === opt);
    });
    const dateRow = document.getElementById('datePickerRow');
    const addrRow = document.getElementById('addressRow');
    dateRow.classList.toggle('visible', opt === 'later');
    addrRow.classList.toggle('visible', opt !== 'pickup');

    if (opt === 'express') deliveryFee = 150;
    else if (opt === 'standard') deliveryFee = 0;
    else if (opt === 'later') deliveryFee = 100;
    updateSummary();
  }

  // updateSummary: recalculate subtotal, discounts, total and refresh UI
  function updateSummary() {
    let subtotal = 0, origTotal = 0, count = 0;
    document.querySelectorAll('.cart-item').forEach(item => {
      if (item.style.display === 'none') return;
      const cb = item.querySelector('.item-checkbox');
      if (!cb || !cb.checked) return;
      const priceEl = item.querySelector('[data-price]');
      const qtyEl = item.querySelector('.qty-num');
      if (!priceEl || !qtyEl) return;
      const price = parseInt(priceEl.getAttribute('data-price'));
      const origText = item.querySelector('.item-original-price');
      const orig = origText ? parseInt(origText.textContent.replace(/[^0-9]/g,'')) : price;
      const qty = parseInt(qtyEl.value);
      subtotal += price * qty;
      origTotal += orig * qty;
      count += qty;
    });

    const discount = origTotal - subtotal;
    const total = subtotal + deliveryFee - promoDiscount;

    document.getElementById('subtotalVal').textContent = 'KES ' + origTotal.toLocaleString();
    document.getElementById('discountVal').textContent = '− KES ' + discount.toLocaleString();
    document.getElementById('deliveryFeeVal').textContent = deliveryFee === 0 ? 'FREE' : 'KES ' + deliveryFee.toLocaleString();
    document.getElementById('totalVal').textContent = 'KES ' + Math.max(0, total).toLocaleString();
    document.getElementById('savingsNote').textContent = discount > 0 ? '🎉 You\'re saving KES ' + discount.toLocaleString() + ' on this order!' : '';
    document.getElementById('summaryItemsText').textContent = count + ' item' + (count !== 1 ? 's' : '') + ' selected';

    // header + badge
    // update header/badge counts if those elements are present
    const visibleItems = [...document.querySelectorAll('.cart-item')].filter(i => i.style.display !== 'none').length;
    if (document.getElementById('headerCartCount')) document.getElementById('headerCartCount').textContent = visibleItems + ' Item' + (visibleItems !== 1 ? 's' : '');
    if (document.getElementById('itemCountBadge')) document.getElementById('itemCountBadge').textContent = visibleItems + ' Items';
  }

  // applyPromo: simple promo-code lookup and apply discount
  function applyPromo() {
    const code = document.getElementById('promoInput').value.trim().toUpperCase();
    const promos = { 'MIADUCK100': 100, 'SAVE200': 200, 'WELCOME50': 50 };
    if (promos[code]) {
      promoDiscount = promos[code];
      document.getElementById('promoRow').style.display = 'flex';
      document.getElementById('promoVal').textContent = '− KES ' + promoDiscount;
      updateSummary();
      showToast('🎉 Promo code applied! Saving KES ' + promoDiscount);
    } else {
      showToast('❌ Invalid promo code. Try: MIADUCK100');
    }
  }

  // proceedCheckout: validate minimal address info before checkout
  function proceedCheckout() {
    const name = document.getElementById('addrName').value.trim();
    const phone = document.getElementById('addrPhone').value.trim();
    if (!name || !phone) {
      showToast('⚠️ Please fill in your name and phone number');
      return;
    }
    showToast('✅ Redirecting to payment… M-Pesa / Card');
  }

  // showToast: small notification helper (created dynamically if missing)
  function showToast(msg) {
    let t = document.getElementById('toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'toast';
      t.style.position = 'fixed';
      t.style.bottom = '20px';
      t.style.left = '50%';
      t.style.transform = 'translateX(-50%)';
      t.style.background = 'rgba(0,0,0,0.8)';
      t.style.color = '#fff';
      t.style.padding = '10px 14px';
      t.style.borderRadius = '8px';
      t.style.zIndex = 9999;
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.opacity = '1';
    setTimeout(() => { if (t) t.style.opacity = '0'; }, 2500);
  }

  // On DOM ready: wire site-wide Buy Now anchors and render cart page
  document.addEventListener('DOMContentLoaded', () => {
    injectNavSearchStyles();
    injectNavSearch();

    // Attach buy-now click handlers across pages: when a link's text
    // includes "Buy Now" we infer a product and add it to cart.
    // Attach handlers for Buy Now links (keep navigation) and Add-to-Cart buttons (stay on page)
    document.querySelectorAll('a').forEach(a => {
      const isBuyNow = a.textContent && a.textContent.trim().toLowerCase().includes('buy now');
      const isCartLink = a.classList.contains('add-to-cart-btn');

      if (isBuyNow) {
        a.addEventListener('click', (e) => {
          const info = inferProductInfo(a);
          addToCart(info);
          // allow navigation to proceed
        });
      }

      if (isCartLink) {
        a.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const btn = a;
          const info = inferProductInfo(a);
          addToCart(info);
          // visual feedback: temporary state
          const original = btn.textContent;
          btn.textContent = 'Added ✓';
          btn.classList.add('added');
          setTimeout(() => { btn.textContent = original; btn.classList.remove('added'); }, 1200);
        });
      }
    });

    // If on cart page, render items from storage so the UI reflects persisted cart
    if (document.getElementById('cart')) renderCart();
    // select a sensible default delivery option if present
    if (document.getElementById('opt-express')) selectOption('express');
    // populate mini-cart if items exist
    if (getCart().length > 0) updateMiniCart();
  });

  // renderCart: build cart DOM from the persisted cart array
  // This function creates `.cart-item` nodes that match the structure
  // expected by the rest of the cart helpers (updateSummary, removeItem)
  function renderCart() {
    const cart = getCart();
    const cartCard = document.querySelector('#cart .card');
    if (!cartCard) return;
    // find area to inject items: reuse the existing card body by replacing cart-item elements
    // remove existing cart-item nodes (keep promo and other cards intact)
    cartCard.querySelectorAll('.cart-item').forEach(n => n.remove());
    const cardBody = cartCard;
    // insert items before the empty state
    const emptyEl = document.getElementById('emptyCart');
    cart.forEach((c, idx) => {
      const itemId = 'item_' + idx + '_' + c.id;
      const qtyId = 'qty_' + idx + '_' + c.id;
      const div = document.createElement('div');
      div.className = 'cart-item';
      div.id = itemId;
      div.dataset.cartId = c.id;
      div.innerHTML = `
        <div class="item-check"><input type="checkbox" class="item-checkbox" checked onchange="updateSummary()"/></div>
        <div class="item-img">${c.emoji || '📦'}</div>
        <div class="item-details">
          <div class="item-name">${c.name}</div>
          <div class="item-variant">Quantity: ${c.qty}</div>
          <div class="in-stock-badge">In Stock</div>
          <div style="margin-top:6px;">
            <span class="item-price" data-price="${c.price}">KES ${c.price.toLocaleString()}</span>
            <span class="item-original-price">KES ${ (c.origPrice||Math.round(c.price*1.5)).toLocaleString() }</span>
          </div>
          <div class="item-actions">
            <div class="qty-stepper">
              <button class="qty-btn" onclick="changeQty('${qtyId}',-1)">−</button>
              <input class="qty-num" id="${qtyId}" type="text" value="${c.qty}" readonly/>
              <button class="qty-btn" onclick="changeQty('${qtyId}',1)">+</button>
            </div>
            <button class="item-remove" onclick="removeItem('${itemId}')">Remove</button>
          </div>
        </div>
      `;
      // Insert new item before the empty-state block (if present)
      if (emptyEl) cardBody.insertBefore(div, emptyEl);
      else cardBody.appendChild(div);
    });
    // show/hide empty state
    const visible = cart.length > 0;
    if (document.getElementById('emptyCart')) document.getElementById('emptyCart').style.display = visible ? 'none' : 'block';
    updateSummary();
  }

// -----------------------------
// Payment modal helpers
// -----------------------------
// Show payment modal and populate fields depending on payment method
function showPaymentModal(method) {
  const modal = document.getElementById('paymentModal');
  const title = document.getElementById('paymentTitle');
  const fields = document.getElementById('paymentFields');
  if (!modal || !fields || !title) return;
  title.textContent = 'Pay with ' + (method === 'mpesa' ? 'M-Pesa' : method === 'airtel' ? 'Airtel Money' : (method === 'visa' ? 'Visa' : 'Card'));
  // Build method-specific form fields
  let html = '';
  if (method === 'mpesa' || method === 'airtel') {
    html += '<label style="display:block;margin-top:8px;">Full name</label>';
    html += '<input id="pay_name" name="name" required style="width:100%;padding:8px;margin-top:6px;" />';
    html += '<label style="display:block;margin-top:8px;">Phone number</label>';
    html += '<input id="pay_phone" name="phone" required placeholder="07xx xxx xxx" style="width:100%;padding:8px;margin-top:6px;" />';
  } else {
    // card (visa/mastercard)
    html += '<label style="display:block;margin-top:8px;">Cardholder name</label>';
    html += '<input id="pay_name" name="name" required style="width:100%;padding:8px;margin-top:6px;" />';
    html += '<label style="display:block;margin-top:8px;">Card number</label>';
    html += '<input id="pay_card" name="card" required placeholder="4242 4242 4242 4242" style="width:100%;padding:8px;margin-top:6px;" />';
    html += '<div style="display:flex;gap:8px;margin-top:8px;"><div style="flex:1;"><label>Expiry</label><input id="pay_expiry" name="expiry" required placeholder="MM/YY" style="width:100%;padding:8px;margin-top:6px;" /></div><div style="width:110px;"><label>CVV</label><input id="pay_cvv" name="cvv" required placeholder="123" style="width:100%;padding:8px;margin-top:6px;" /></div></div>';
  }

  fields.innerHTML = html;
  // attach submit handler
  const form = document.getElementById('paymentForm');
  form.onsubmit = function (e) { e.preventDefault(); handlePaymentSubmit(method); };
  modal.style.display = 'block';
}

function closePaymentModal() {
  const modal = document.getElementById('paymentModal');
  if (!modal) return;
  modal.style.display = 'none';
}

function setupMobileNav() {
  document.querySelectorAll('.nav-toggle').forEach(button => {
    const nav = button.closest('nav');
    if (!nav) return;
    const links = nav.querySelector('.nav-links');
    if (!links) return;

    button.addEventListener('click', () => {
      const open = links.classList.toggle('mobile-active');
      button.classList.toggle('open', open);
    });

    links.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        if (links.classList.contains('mobile-active')) {
          links.classList.remove('mobile-active');
          button.classList.remove('open');
        }
      });
    });
  });
}

document.addEventListener('DOMContentLoaded', setupMobileNav);

// Validate minimal fields and show confirmation toast
function handlePaymentSubmit(method) {
  const name = (document.getElementById('pay_name') || {}).value || '';
  const phone = (document.getElementById('pay_phone') || {}).value || '';
  const card = (document.getElementById('pay_card') || {}).value || '';
  const expiry = (document.getElementById('pay_expiry') || {}).value || '';
  const cvv = (document.getElementById('pay_cvv') || {}).value || '';
  if (!name) { showToast('Please enter your name'); return; }
  if (method === 'mpesa' || method === 'airtel') {
    if (!phone) { showToast('Please enter a phone number'); return; }
    // In a real app you'd call an API here to initiate payment.
    showToast('Thanks ' + name + '. We will send payment instructions to ' + phone + '.');
  } else {
    if (!card || !expiry || !cvv) { showToast('Please enter complete card details'); return; }
    showToast('Card details received — processing (demo)');
  }
  closePaymentModal();
}

// Attach click handlers for payment buttons when DOM loads
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.pay-chip').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const method = btn.dataset.method || btn.textContent.trim().toLowerCase();
      showPaymentModal(method);
    });
  });
});


  