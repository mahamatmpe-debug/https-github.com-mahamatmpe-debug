const CART_KEY = 'cnffd_cart_v1';

const DELIVERY_FEES = {
  "N'Djamena": 1000,
  'Moundou': 2000,
  'Sarh': 2500,
  'Abeche': 3000,
  'Bongor': 2500,
  'Doba': 2500,
  'Kelo': 2500,
  'Am Timan': 3500,
  'Faya': 5000,
  'Autres': 4000
};

function feeFor(city) {
  return DELIVERY_FEES[city] || DELIVERY_FEES['Autres'];
}

function getCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); } catch (e) { return []; }
}
function saveCart(c) {
  localStorage.setItem(CART_KEY, JSON.stringify(c));
  updateCartCount();
}
function updateCartCount() {
  const el = document.getElementById('cart-count');
  if (el) el.textContent = getCart().reduce((s, i) => s + i.qty, 0);
}

function addToCart(item) {
  const cart = getCart();
  const ex = cart.find((x) => x.id === item.id);
  if (ex) ex.qty += (item.qty || 1);
  else cart.push(Object.assign({}, item, { qty: item.qty || 1 }));
  saveCart(cart);
  alert('Ajoute au panier');
}

function quickView(card) {
  const qv = document.getElementById('quickview');
  const body = document.getElementById('qv-body');
  if (!qv || !body) return;
  const file = card.dataset.file;
  if (card.dataset.type === 'image') {
    const img = document.createElement('img');
    img.src = file;
    img.alt = card.dataset.name;
    body.replaceChildren(img);
  } else {
    const v = document.createElement('video');
    v.src = file;
    v.controls = true;
    v.style.width = '100%';
    body.replaceChildren(v);
  }
  qv.hidden = false;
}
function closeQV() {
  const qv = document.getElementById('quickview');
  if (qv) qv.hidden = true;
}

function renderCart() {
  const list = document.getElementById('cart-list');
  if (!list) return;
  const cart = getCart();
  if (cart.length === 0) {
    const p = document.createElement('p');
    p.innerHTML = "Panier vide. <a href='/'>Retour au catalogue</a>";
    list.replaceChildren(p);
    updateTotals();
    return;
  }
  list.replaceChildren();
  cart.forEach((it, i) => {
    const row = document.createElement('div');
    row.className = 'cart-row';
    row.style.cssText = 'display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #eee;padding:8px 0;gap:10px;flex-wrap:wrap';

    const left = document.createElement('div');
    left.style.cssText = 'display:flex;align-items:center;gap:10px';
    if (it.type === 'image') {
      const img = document.createElement('img');
      img.src = it.file; img.style.cssText = 'height:60px;border-radius:6px'; img.alt = it.name;
      left.appendChild(img);
    } else {
      const v = document.createElement('video');
      v.src = it.file; v.style.height = '60px';
      left.appendChild(v);
    }
    const info = document.createElement('div');
    info.innerHTML = '<strong></strong><br><span></span>';
    info.querySelector('strong').textContent = it.name;
    info.querySelector('span').textContent = it.price + ' FCFA';
    left.appendChild(info);

    const right = document.createElement('div');
    right.style.cssText = 'display:flex;align-items:center;gap:8px';

    const qty = document.createElement('input');
    qty.type = 'number'; qty.min = '1'; qty.value = it.qty;
    qty.style.width = '70px';
    qty.dataset.index = i; qty.className = 'js-qty';
    right.appendChild(qty);

    const del = document.createElement('button');
    del.className = 'btn small js-remove';
    del.dataset.index = i;
    del.textContent = 'Supprimer';
    right.appendChild(del);

    const sub = document.createElement('div');
    const b = document.createElement('strong');
    b.textContent = (it.price * it.qty) + ' FCFA';
    sub.appendChild(b);
    right.appendChild(sub);

    row.appendChild(left);
    row.appendChild(right);
    list.appendChild(row);
  });
  updateTotals();
}

function updateTotals() {
  const stEl = document.getElementById('st');
  const dfEl = document.getElementById('df');
  const ttEl = document.getElementById('tt');
  const cart = getCart();
  const st = cart.reduce((s, it) => s + it.price * it.qty, 0);
  let df = 0;
  const dtype = document.querySelector('input[name=dtype]:checked');
  if (dtype && dtype.value === 'delivery') {
    const city = document.querySelector('select[name=dcity]');
    df = feeFor(city ? city.value : "N'Djamena");
  }
  if (stEl) stEl.textContent = st;
  if (dfEl) dfEl.textContent = df;
  if (ttEl) ttEl.textContent = st + df;
}

document.addEventListener('DOMContentLoaded', () => {
  updateCartCount();
  renderCart();

  document.addEventListener('click', (e) => {
    const card = e.target.closest('.card');
    if (e.target.closest('.js-quickview') && card) { quickView(card); return; }
    if (e.target.closest('.js-add-cart') && card) {
      addToCart({ id: card.dataset.id, name: card.dataset.name, price: +card.dataset.price, file: card.dataset.file, type: card.dataset.type, qty: 1 });
      return;
    }
    if (e.target.closest('.js-close-qv')) { closeQV(); return; }
    const rm = e.target.closest('.js-remove');
    if (rm) {
      const c = getCart(); c.splice(+rm.dataset.index, 1); saveCart(c); renderCart(); return;
    }
  });

  document.addEventListener('change', (e) => {
    const q = e.target.closest('.js-qty');
    if (q) {
      const c = getCart();
      c[+q.dataset.index].qty = Math.max(1, +q.value || 1);
      saveCart(c); renderCart();
    }
  });

  document.querySelectorAll('input[name=dtype]').forEach((r) => r.addEventListener('change', () => {
    const blk = document.getElementById('delivery-block');
    if (blk) blk.style.display = r.value === 'delivery' ? 'block' : 'none';
    updateTotals();
  }));
  const dcity = document.querySelector('select[name=dcity]');
  if (dcity) dcity.addEventListener('change', updateTotals);

  const of = document.getElementById('order-form');
  if (of) of.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(of);
    const cart = getCart();
    const msg = document.getElementById('order-msg');
    if (cart.length === 0) { msg.textContent = 'Panier vide'; return; }
    const dtype = fd.get('dtype');
    let fee = 0, dcityv = '';
    if (dtype === 'delivery') { dcityv = fd.get('dcity'); fee = feeFor(dcityv); }
    const payload = {
      cart,
      customer: { name: fd.get('name'), phone: fd.get('phone'), city: fd.get('city'), address: fd.get('address'), email: fd.get('email') || '' },
      delivery: { type: dtype, city: dcityv, fee }
    };
    msg.textContent = 'Envoi en cours...';
    try {
      const r = await fetch('/orders/submit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const j = await r.json();
      if (j.success) {
        msg.innerHTML = 'Commande envoyee (ID: ' + j.id + '). <a href="' + j.pdf + '" target="_blank" rel="noopener">Telecharger le bon de commande PDF</a>';
        localStorage.removeItem(CART_KEY); updateCartCount(); renderCart();
      } else {
        msg.textContent = 'Erreur: ' + (j.error || 'inconnue');
      }
    } catch (err) {
      msg.textContent = 'Erreur reseau, reessayez.';
    }
  });

  const iq = document.getElementById('inq-form');
  if (iq) iq.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(iq);
    const payload = Object.fromEntries(fd.entries());
    const msg = document.getElementById('inq-msg');
    msg.textContent = 'Envoi en cours...';
    try {
      const r = await fetch('/inquiries/submit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const j = await r.json();
      if (j.success) msg.textContent = 'Demande envoyee (ID: ' + j.id + '). Nous vous repondrons.';
      else msg.textContent = 'Erreur: ' + (j.error || 'inconnue');
    } catch (err) {
      msg.textContent = 'Erreur reseau';
    }
  });
});
