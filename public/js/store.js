const CART_KEY = 'cnffd_cart';

var DELIVERY_FEES = {
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
var CURRENCY = 'FCFA';

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
  var el = document.getElementById('cart-count');
  if (el) el.textContent = getCart().reduce(function (s, i) { return s + i.qty; }, 0);
}

function addToCart(item) {
  var cart = getCart();
  var ex = cart.find(function (x) { return x.id === item.id; });
  if (ex) ex.qty += (item.qty || 1);
  else cart.push(Object.assign({}, item, { qty: item.qty || 1 }));
  saveCart(cart);
  alert('Ajoute au panier');
}

function quickView(card) {
  var qv = document.getElementById('quickview');
  var body = document.getElementById('qv-body');
  if (!qv || !body) return;
  var file = card.dataset.file;
  if (card.dataset.type === 'image') {
    var img = document.createElement('img');
    img.src = file; img.alt = card.dataset.name;
    body.replaceChildren(img);
  } else {
    var v = document.createElement('video');
    v.src = file; v.controls = true; v.style.width = '100%';
    body.replaceChildren(v);
  }
  qv.hidden = false;
}
function closeQV() {
  var qv = document.getElementById('quickview');
  if (qv) qv.hidden = true;
}

function renderCart() {
  var list = document.getElementById('cart-list');
  if (!list) return;
  var cart = getCart();
  if (cart.length === 0) {
    var p = document.createElement('p');
    p.innerHTML = "Panier vide. <a href='/'>Retour au catalogue</a>";
    list.replaceChildren(p);
    updateTotals();
    return;
  }
  list.replaceChildren();
  cart.forEach(function (it, i) {
    var row = document.createElement('div');
    row.className = 'cart-row';
    row.style.cssText = 'display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #eee;padding:8px 0;gap:10px;flex-wrap:wrap';

    var left = document.createElement('div');
    left.style.cssText = 'display:flex;align-items:center;gap:10px';
    if (it.type === 'image') {
      var img = document.createElement('img');
      img.src = it.file; img.style.cssText = 'height:60px;border-radius:6px'; img.alt = it.name;
      left.appendChild(img);
    }
    var info = document.createElement('div');
    info.innerHTML = '<strong></strong><br><span></span>';
    info.querySelector('strong').textContent = it.name;
    info.querySelector('span').textContent = it.price + ' ' + CURRENCY;
    left.appendChild(info);

    var right = document.createElement('div');
    right.style.cssText = 'display:flex;align-items:center;gap:8px';

    var qty = document.createElement('input');
    qty.type = 'number'; qty.min = '1'; qty.value = it.qty;
    qty.style.width = '70px'; qty.dataset.index = i; qty.className = 'js-qty';
    right.appendChild(qty);

    var del = document.createElement('button');
    del.type = 'button';
    del.className = 'btn small js-remove';
    del.dataset.index = i;
    del.textContent = 'Supprimer';
    right.appendChild(del);

    var sub = document.createElement('div');
    var b = document.createElement('strong');
    b.textContent = (it.price * it.qty) + ' ' + CURRENCY;
    sub.appendChild(b);
    right.appendChild(sub);

    row.appendChild(left);
    row.appendChild(right);
    list.appendChild(row);
  });
  updateTotals();
}

function currentFee() {
  var dtype = document.querySelector('input[name=dtype]:checked');
  if (dtype && dtype.value === 'delivery') {
    var city = document.querySelector('select[name=dcity]');
    return feeFor(city ? city.value : "N'Djamena");
  }
  return 0;
}

function updateTotals() {
  var stEl = document.getElementById('st');
  var dfEl = document.getElementById('df');
  var ttEl = document.getElementById('tt');
  var st = getCart().reduce(function (s, it) { return s + it.price * it.qty; }, 0);
  var df = currentFee();
  if (stEl) stEl.textContent = st;
  if (dfEl) dfEl.textContent = df;
  if (ttEl) ttEl.textContent = st + df;
}

async function makePdf(order) {
  var L = window.PDFLib;
  var doc = await L.PDFDocument.create();
  var page = doc.addPage([595, 842]);
  var font = await doc.embedFont(L.StandardFonts.Helvetica);
  var bold = await doc.embedFont(L.StandardFonts.HelveticaBold);
  var y = 800;
  function line(text, isBold, size) {
    page.drawText(String(text), { x: 50, y: y, size: size || 11, font: isBold ? bold : font, color: L.rgb(0, 0, 0) });
    y -= (size || 11) + 6;
  }
  line('BON DE COMMANDE', true, 20);
  line('ID: ' + order.id, false, 11);
  line('Date: ' + order.date, false, 11);
  line('Client: ' + order.customer.name, true, 12);
  line('Telephone: ' + order.customer.phone);
  line('Ville: ' + order.customer.city);
  line('Adresse: ' + order.customer.address);
  if (order.customer.email) line('Email: ' + order.customer.email);
  line(order.delivery.type === 'delivery' ? 'Mode: Livraison a ' + order.delivery.city : 'Mode: Retrait sur place', true, 12);
  y -= 6;
  line('COMPOSANTS', true, 12);
  order.cart.forEach(function (it) {
    line('- ' + it.name + '  x' + it.qty + '  = ' + (it.price * it.qty) + ' ' + CURRENCY);
  });
  y -= 6;
  line('Sous-total: ' + order.subtotal + ' ' + CURRENCY, true);
  line('Livraison: ' + order.delivery.fee + ' ' + CURRENCY, true);
  line('TOTAL: ' + order.total + ' ' + CURRENCY, true, 14);
  var bytes = await doc.save();
  return new Blob([bytes], { type: 'application/pdf' });
}

function downloadPdf(blob, name) {
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
}

function postNetlify(formName, fields) {
  var data = new URLSearchParams();
  data.append('form-name', formName);
  Object.keys(fields).forEach(function (k) { data.append(k, fields[k] == null ? '' : fields[k]); });
  return fetch('/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: data.toString()
  });
}

document.addEventListener('DOMContentLoaded', function () {
  updateCartCount();
  renderCart();

  document.addEventListener('click', function (e) {
    var card = e.target.closest('.card');
    if (e.target.closest('.js-quickview') && card) { quickView(card); return; }
    if (e.target.closest('.js-add-cart') && card) {
      addToCart({ id: card.dataset.id, name: card.dataset.name, price: +card.dataset.price, file: card.dataset.file, type: card.dataset.type, qty: 1 });
      return;
    }
    if (e.target.closest('.js-close-qv')) { closeQV(); return; }
    var rm = e.target.closest('.js-remove');
    if (rm) {
      var c = getCart(); c.splice(+rm.dataset.index, 1); saveCart(c); renderCart(); return;
    }
  });

  document.addEventListener('change', function (e) {
    var q = e.target.closest('.js-qty');
    if (q) {
      var c = getCart();
      c[+q.dataset.index].qty = Math.max(1, +q.value || 1);
      saveCart(c); renderCart();
    }
  });

  document.querySelectorAll('input[name=dtype]').forEach(function (r) {
    r.addEventListener('change', function () {
      var blk = document.getElementById('delivery-block');
      if (blk) blk.style.display = r.value === 'delivery' ? 'block' : 'none';
      updateTotals();
    });
  });
  var dcity = document.querySelector('select[name=dcity]');
  if (dcity) dcity.addEventListener('change', updateTotals);

  var of = document.getElementById('order-form');
  if (of) of.addEventListener('submit', async function (e) {
    e.preventDefault();
    var fd = new FormData(of);
    var cart = getCart();
    var msg = document.getElementById('order-msg');
    if (cart.length === 0) { msg.textContent = 'Panier vide'; return; }
    var dtype = fd.get('dtype');
    var fee = 0, dcityv = '';
    if (dtype === 'delivery') { dcityv = fd.get('dcity'); fee = feeFor(dcityv); }
    var subtotal = cart.reduce(function (s, it) { return s + it.price * it.qty; }, 0);
    var total = subtotal + fee;
    var id = 'CMD-' + Date.now();
    var order = {
      id: id,
      date: new Date().toLocaleString('fr-FR'),
      cart: cart,
      customer: { name: fd.get('name'), phone: fd.get('phone'), city: fd.get('city'), address: fd.get('address'), email: fd.get('email') || '' },
      delivery: { type: dtype, city: dcityv, fee: fee },
      subtotal: subtotal,
      total: total
    };
    msg.textContent = 'Envoi en cours...';
    try {
      var blob = await makePdf(order);
      downloadPdf(blob, 'commande-' + id + '.pdf');
      var composants = cart.map(function (it) { return it.name + ' x' + it.qty + ' = ' + (it.price * it.qty) + ' ' + CURRENCY; }).join(' | ');
      await postNetlify('commande', {
        nom: order.customer.name,
        telephone: order.customer.phone,
        ville: order.customer.city,
        adresse: order.customer.address,
        email: order.customer.email,
        mode: dtype === 'delivery' ? 'Livraison' : 'Retrait sur place',
        ville_livraison: dcityv,
        composants: composants,
        sous_total: subtotal + ' ' + CURRENCY,
        frais_livraison: fee + ' ' + CURRENCY,
        total: total + ' ' + CURRENCY
      });
      msg.innerHTML = 'Commande envoyee (ID: ' + id + '). Le bon de commande PDF a ete telecharge.';
      localStorage.removeItem(CART_KEY); updateCartCount(); renderCart();
    } catch (err) {
      msg.textContent = 'Erreur, reessayez.';
    }
  });

  var iq = document.getElementById('inq-form');
  if (iq) iq.addEventListener('submit', async function (e) {
    e.preventDefault();
    var fd = new FormData(iq);
    var msg = document.getElementById('inq-msg');
    msg.textContent = 'Envoi en cours...';
    try {
      await postNetlify('question', {
        nom: fd.get('name'),
        telephone: fd.get('phone'),
        email: fd.get('email') || '',
        sujet: fd.get('subject'),
        message: fd.get('message')
      });
      msg.textContent = 'Demande envoyee. Merci !';
      iq.reset();
    } catch (err) {
      msg.textContent = 'Erreur reseau, reessayez.';
    }
  });
});

document.addEventListener('DOMContentLoaded', updateCartCount);
