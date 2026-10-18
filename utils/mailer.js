const nodemailer = require('nodemailer');
const config = require('../config');

let transporter = null;
function getTransporter() {
  if (transporter) return transporter;
  if (!config.email.smtpHost || !config.email.smtpUser) return null;
  transporter = nodemailer.createTransport({
    host: config.email.smtpHost,
    port: config.email.smtpPort,
    secure: config.email.smtpSecure,
    auth: { user: config.email.smtpUser, pass: config.email.smtpPass }
  });
  return transporter;
}

async function sendOrderEmail(data, pdfBuffer) {
  const t = getTransporter();
  const to = config.email.to;
  if (!t || !to) {
    console.warn('[mailer] SMTP non configure, email non envoye. Commande ' + data.id);
    return { skipped: true };
  }
  const lines = data.cart
    .map((it) => '  - ' + it.name + ' x' + it.qty + ' = ' + (it.price * it.qty) + ' ' + config.currency)
    .join('\n');
  const body =
    'Nouvelle commande ' + data.id + '\n\n' +
    'Client: ' + data.customer.name + '\n' +
    'Telephone: ' + data.customer.phone + '\n' +
    'Ville: ' + data.customer.city + '\n' +
    'Adresse: ' + data.customer.address + '\n' +
    (data.customer.email ? 'Email: ' + data.customer.email + '\n' : '') +
    '\n' + (data.delivery.type === 'delivery' ? 'LIVRAISON - ' + data.delivery.city + ' (' + data.delivery.fee + ' ' + config.currency + ')' : 'RETRAIT SUR PLACE') + '\n\n' +
    'Composants:\n' + lines + '\n\n' +
    'Sous-total: ' + data.subtotal + ' ' + config.currency + '\n' +
    'Livraison: ' + data.deliveryFee + ' ' + config.currency + '\n' +
    'TOTAL: ' + data.total + ' ' + config.currency + '\n';

  await t.sendMail({
    from: config.email.from,
    to,
    subject: 'Commande CNFFD ' + data.id + ' - ' + data.total + ' ' + config.currency,
    text: body,
    attachments: [{ filename: 'commande_' + data.id + '.pdf', content: pdfBuffer }]
  });
  return { sent: true };
}

async function sendInquiryEmail(data) {
  const t = getTransporter();
  const to = config.email.to;
  if (!t || !to) {
    console.warn('[mailer] SMTP non configure, question non envoyee. Ref ' + data.id);
    return { skipped: true };
  }
  const body =
    'Nouvelle demande d\'information ' + data.id + '\n\n' +
    'Nom: ' + data.name + '\n' +
    'Telephone: ' + data.phone + '\n' +
    (data.email ? 'Email: ' + data.email + '\n' : '') +
    'Sujet: ' + data.subject + '\n\n' +
    'Message:\n' + data.message;
  await t.sendMail({
    from: config.email.from,
    to,
    replyTo: data.email || undefined,
    subject: '[CNFFD] ' + data.subject,
    text: body
  });
  return { sent: true };
}

module.exports = { sendOrderEmail, sendInquiryEmail };
