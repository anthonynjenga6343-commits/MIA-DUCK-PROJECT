  // Mia Duck - Cart Page Script
  // ── State ──
  const items = {
    item1: { price: 1200, origPrice: 2000 },
    item2: { price: 3500, origPrice: 5500 },
    item3: { price: 800,  origPrice: 1500 }
  };
  let promoDiscount = 0;
  let deliveryFee = 150;

  // Set min date for booking
  const today = new Date();
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  document.getElementById('deliveryDate').min = tomorrow.toISOString().split('T')[0];

  function changeQty(id, delta) {
    const input = document.getElementById(id);
    let v = parseInt(input.value) + delta;
    if (v < 1) v = 1;
    if (v > 99) v = 99;
    input.value = v;
    updateSummary();
  }

  function removeItem(id) {
    const el = document.getElementById(id);
    el.style.transition = 'opacity 0.3s, transform 0.3s';
    el.style.opacity = '0';
    el.style.transform = 'translateX(30px)';
    setTimeout(() => {
      el.style.display = 'none';
      updateSummary();
      checkEmpty();
    }, 300);
    showToast('Item removed from cart');
  }

  function toggleAll(cb) {
    document.querySelectorAll('.item-checkbox').forEach(c => c.checked = cb.checked);
    updateSummary();
  }

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
  }

  function checkEmpty() {
    const visible = [...document.querySelectorAll('.cart-item')].filter(i => i.style.display !== 'none');
    document.getElementById('emptyCart').style.display = visible.length === 0 ? 'block' : 'none';
  }

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
    const visibleItems = [...document.querySelectorAll('.cart-item')].filter(i => i.style.display !== 'none').length;
    document.getElementById('headerCartCount').textContent = visibleItems + ' Item' + (visibleItems !== 1 ? 's' : '');
    document.getElementById('itemCountBadge').textContent = visibleItems + ' Items';
  }

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

  function proceedCheckout() {
    const name = document.getElementById('addrName').value.trim();
    const phone = document.getElementById('addrPhone').value.trim();
    if (!name || !phone) {
      showToast('⚠️ Please fill in your name and phone number');
      return;
    }
    showToast('✅ Redirecting to payment… M-Pesa / Card');
  }

  function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
  }

  // Init
  updateSummary();
  selectOption('express');


  