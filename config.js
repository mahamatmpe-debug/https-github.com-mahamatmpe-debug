function env(key, fallback) {
  const v = process.env[key];
  return (v === undefined || v === '') ? fallback : v;
}

module.exports = {
  siteName: env('SITE_NAME', 'CNFFD 2026'),
  logo: '/img/logo.jpeg',
  facebookUrl: env('FACEBOOK_URL', 'https://www.facebook.com/share/1E682wpX91/'),
  facebookPage: env('FACEBOOK_PAGE', 'CNFFD2026'),
  phoneChad: env('PHONE_CHAD', '+235 62 72 93 93'),
  whatsapp: env('WHATSAPP', ''),
  currency: 'FCFA',

  deliveryFeesByCity: {
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
  },

  email: {
    to: env('ORDER_EMAIL', ''),          // ou recevoir les commandes
    from: env('MAIL_FROM', 'CNFFD 2026 <no-reply@cnffd.com>'),
    smtpHost: env('SMTP_HOST', ''),
    smtpPort: parseInt(env('SMTP_PORT', '587'), 10),
    smtpUser: env('SMTP_USER', ''),
    smtpPass: env('SMTP_PASS', ''),
    smtpSecure: env('SMTP_SECURE', 'false') === 'true'
  }
};
