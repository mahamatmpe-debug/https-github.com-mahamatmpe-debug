const express = require('express');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const config = require('./config');
const { loadComponents } = require('./data/components');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', 1);
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      mediaSrc: ["'self'", 'https:'],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      frameSrc: ["'self'", 'https://www.facebook.com', 'https://web.facebook.com'],
      connectSrc: ["'self'"]
    }
  }
}));

const formLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de requetes, reessayez plus tard.' }
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '2mb' }));

app.use(['/orders/submit', '/inquiries/submit'], formLimiter);

app.use((req, res, next) => {
  res.locals.siteName = config.siteName;
  res.locals.logo = config.logo;
  res.locals.facebookUrl = config.facebookUrl;
  res.locals.phoneChad = config.phoneChad;
  res.locals.currency = config.currency;
  res.locals.deliveryFeesByCity = config.deliveryFeesByCity;
  res.locals.baseUrl = req.protocol + '://' + req.get('host');
  next();
});

const about = require('./routes/about');
const orders = require('./routes/orders');
const inquiries = require('./routes/inquiries');
const social = require('./routes/social');

app.get('/', (req, res) => {
  const components = loadComponents();
  res.render('layout2', { title: 'Accueil', bodyView: 'home', components });
});

app.get('/offline', (req, res) => {
  res.render('offline', { title: 'Hors ligne' });
});

app.use('/about', about);
app.use('/orders', orders);
app.use('/inquiries', inquiries);
app.use('/social', social);
app.use('/reseau-sociaux', social);

app.get('/health', (req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log('Site CNFFD 2026 lance sur http://localhost:' + PORT);
});
