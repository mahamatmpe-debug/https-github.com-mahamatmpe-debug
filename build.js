const fs = require('fs');
const path = require('path');
const { loadComponents } = require('./data/components');
const config = require('./config');

const OUT = path.join(__dirname, 'public');
const CURRENCY = config.currency || 'FCFA';

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function loadPublications() {
  try {
    const raw = fs.readFileSync(path.join(__dirname, 'reseau sociaux', 'publications.json'), 'utf8');
    const data = JSON.parse(raw);
    const list = Array.isArray(data.publications) ? data.publications : [];
    list.sort((a, b) => new Date(b.date) - new Date(a.date));
    return list;
  } catch (e) {
    return [];
  }
}

function layout(title, body, opts) {
  opts = opts || {};
  const scripts = (opts.scripts || []).map((s) => '<script src="' + s + '"></script>').join('\n  ');
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="theme-color" content="#00bb55">
  <meta name="description" content="${esc(config.siteName)} - consultez et commandez vos composants en ligne">
  <title>${esc(title)} | ${esc(config.siteName)}</title>
  <link rel="stylesheet" href="/css/style.css">
  <link rel="icon" href="/img/icon-192.png">
  <link rel="apple-touch-icon" href="/img/icon-192.png">
  <link rel="manifest" href="/manifest.webmanifest">
</head>
<body>
  <header class="header">
    <div class="container header-inner">
      <a class="logo" href="/"><img src="${esc(config.logo)}" alt="logo"><span>${esc(config.siteName)}</span></a>
      <nav class="nav">
        <a href="/">Accueil</a>
        <a href="/social">Réseaux sociaux</a>
        <a href="/about">À propos</a>
        <a href="/inquiries">Demander info</a>
      </nav>
      <div class="actions">
        <button id="install-btn" class="btn primary" hidden>Installer l'application</button>
        <a class="btn" href="/orders">Panier (<span id="cart-count">0</span>)</a>
      </div>
    </div>
  </header>
  <main class="main container">${body}</main>
  <footer class="footer">
    <div class="container">
      <p>&copy; ${new Date().getFullYear()} ${esc(config.siteName)}. Tous droits réservés.</p>
      <p>Contact Tchad : ${esc(config.phoneChad)} | <a href="${esc(config.facebookUrl)}" target="_blank" rel="noopener">Facebook</a></p>
    </div>
  </footer>
  <script src="/js/store.js"></script>
  <script src="/js/pwa.js"></script>
  ${scripts}
</body>
</html>
`;
}

function productCards(components) {
  if (!components.length) return '<p>Aucun composant pour le moment.</p>';
  return components.map((c) => {
    const pretty = c.name.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
    const media = c.type === 'image'
      ? `<img src="${esc(c.file)}" alt="${esc(pretty)}" loading="lazy">`
      : `<video src="${esc(c.file)}" controls preload="metadata"></video>`;
    return `<article class="card" data-id="${esc(c.id)}" data-name="${esc(pretty)}" data-price="${c.price}" data-file="${esc(c.file)}" data-type="${c.type}">
      <div class="card-media">${media}</div>
      <div class="card-body">
        <h2 class="card-title">${esc(pretty)}</h2>
        <div class="card-meta"><span class="price">${c.price} ${CURRENCY}</span></div>
        <div class="card-actions">
          <button type="button" class="btn small js-quickview">Aperçu</button>
          <button type="button" class="btn small primary js-add-cart">Ajouter au panier</button>
        </div>
        <div class="card-share">
          <a class="share-fb" target="_blank" rel="noopener" href="https://www.facebook.com/sharer/sharer.php?u=">Partager sur Facebook</a>
        </div>
      </div>
    </article>`;
  }).join('\n');
}

function buildHome(components) {
  const body = `<div class="hero">
  <h1>${esc(config.siteName)}</h1>
  <p>Catalogue de composants - consultez, commandez ou demandez des informations</p>
  <div class="hero-actions">
    <a class="btn primary" href="/orders">Passer commande</a>
    <a class="btn" href="/inquiries">Poser une question</a>
  </div>
</div>
<div class="grid" id="product-grid">
${productCards(components)}
</div>
<div id="quickview" class="modal" hidden>
  <div class="modal-content">
    <button type="button" class="modal-close js-close-qv">&times;</button>
    <div id="qv-body"></div>
  </div>
</div>`;
  fs.writeFileSync(path.join(OUT, 'index.html'), layout('Accueil', body));
}

function cityOptions() {
  return Object.keys(config.deliveryFeesByCity).map((c) => `<option value="${esc(c)}">${esc(c)}</option>`).join('\n          ');
}

function buildOrders() {
  const body = `<h1>Commander</h1>
<form id="order-form">
  <section class="section">
    <h2>1) Vos informations</h2>
    <div class="grid2">
      <label>Nom complet <input name="name" required></label>
      <label>Téléphone <input name="phone" required></label>
      <label>Ville <input name="city" required></label>
      <label>Adresse précise <input name="address" required></label>
      <label>Email (optionnel) <input name="email" type="email"></label>
    </div>
  </section>
  <section class="section">
    <h2>2) Retrait ou Livraison</h2>
    <div class="radio-group">
      <label><input type="radio" name="dtype" value="pickup" checked> Retrait sur place</label>
      <label><input type="radio" name="dtype" value="delivery"> Livraison</label>
    </div>
    <div id="delivery-block" style="display:none;margin-top:12px">
      <label>Ville de livraison
        <select name="dcity">
          ${cityOptions()}
        </select>
      </label>
    </div>
  </section>
  <section class="section">
    <h2>3) Composants sélectionnés</h2>
    <div id="cart-list"></div>
    <div class="totals">
      <div>Sous-total : <span id="st">0</span> ${CURRENCY}</div>
      <div>Livraison : <span id="df">0</span> ${CURRENCY}</div>
      <div class="total">TOTAL : <span id="tt">0</span> ${CURRENCY}</div>
    </div>
  </section>
  <button class="btn primary" type="submit">Valider la commande</button>
  <p id="order-msg"></p>
</form>

<form name="commande" data-netlify="true" netlify-honeypot="bot-field" hidden>
  <input type="text" name="bot-field">
  <input type="text" name="nom">
  <input type="text" name="telephone">
  <input type="text" name="ville">
  <input type="text" name="adresse">
  <input type="text" name="email">
  <input type="text" name="mode">
  <input type="text" name="ville_livraison">
  <input type="text" name="composants">
  <input type="text" name="sous_total">
  <input type="text" name="frais_livraison">
  <input type="text" name="total">
</form>`;
  fs.writeFileSync(path.join(OUT, 'orders.html'), layout('Commander', body));
}

function buildInquiries() {
  const body = `<h1>Demander des informations</h1>
<form id="inq-form">
  <div class="grid2">
    <label>Nom complet <input name="name" required></label>
    <label>Téléphone <input name="phone" required></label>
    <label>Email (optionnel) <input name="email" type="email"></label>
    <label>Sujet <input name="subject" required></label>
  </div>
  <label>Message <textarea name="message" rows="6" required></textarea></label>
  <button class="btn primary" type="submit">Envoyer</button>
  <p id="inq-msg"></p>
</form>

<form name="question" data-netlify="true" netlify-honeypot="bot-field" hidden>
  <input type="text" name="bot-field">
  <input type="text" name="nom">
  <input type="text" name="telephone">
  <input type="text" name="email">
  <input type="text" name="sujet">
  <textarea name="message"></textarea>
</form>`;
  fs.writeFileSync(path.join(OUT, 'inquiries.html'), layout('Demander info', body));
}

function buildAbout() {
  const body = `<h1>À propos</h1>
<p>${esc(config.siteName)} - Plateforme de consultation et commande de composants.</p>
<ul>
  <li>Logo : <img src="${esc(config.logo)}" style="height:40px;vertical-align:middle" alt="logo"></li>
  <li>Contact Tchad : ${esc(config.phoneChad)}</li>
  <li>Facebook : <a href="${esc(config.facebookUrl)}" target="_blank" rel="noopener">${esc(config.facebookUrl)}</a></li>
</ul>`;
  fs.writeFileSync(path.join(OUT, 'about.html'), layout('À propos', body));
}

function buildSocial() {
  const pubs = loadPublications();
  const pubCards = pubs.map((p) => `<article class="card">
      ${p.image ? `<div class="card-media"><img src="${esc(p.image)}" alt="${esc(p.title)}" loading="lazy"></div>` : ''}
      <div class="card-body">
        <div class="pub-date">${esc(p.date)}</div>
        <h3 class="card-title">${esc(p.title)}</h3>
        <p>${esc(p.text)}</p>
        <div class="card-actions">
          ${p.link ? `<a class="btn small" href="${esc(p.link)}">Voir</a>` : ''}
          <a class="btn small primary" target="_blank" rel="noopener" href="https://www.facebook.com/sharer/sharer.php?u=">Partager</a>
        </div>
      </div>
    </article>`).join('\n');

  const body = `<div class="hero">
  <h1>Réseaux sociaux</h1>
  <p>Suivez nos publications et partagez notre page</p>
  <div class="hero-actions">
    <a class="btn primary" href="${esc(config.facebookUrl)}" target="_blank" rel="noopener">Voir notre Facebook</a>
  </div>
</div>
<section class="section">
  <h2>Publications</h2>
  <div class="grid">
    ${pubCards || '<p>Aucune publication pour le moment.</p>'}
  </div>
</section>`;
  fs.writeFileSync(path.join(OUT, 'social.html'), layout('Réseaux sociaux', body));
}

function buildOffline() {
  const body = `<div class="hero">
  <h1>Mode hors ligne</h1>
  <p>Vous n'êtes pas connecté à Internet. Réessayez quand la connexion revient.</p>
  <div class="hero-actions"><a class="btn primary" href="/">Réessayer</a></div>
</div>`;
  fs.writeFileSync(path.join(OUT, 'offline.html'), layout('Hors ligne', body));
}

function main() {
  const components = loadComponents();
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
  buildHome(components);
  buildOrders();
  buildInquiries();
  buildAbout();
  buildSocial();
  buildOffline();
  console.log('Pages generees dans public/ : ' + components.length + ' composants.');
}

main();
