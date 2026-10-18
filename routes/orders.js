const express = require('express');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const config = require('../config');
const { sendOrderEmail } = require('../utils/mailer');

const router = express.Router();
const receivedDir = process.env.RECEIVED_DIR || path.join(__dirname, '..', 'received');
if (!fs.existsSync(receivedDir)) fs.mkdirSync(receivedDir, { recursive: true });

router.get('/', (req, res) => {
  res.render('order', { title: 'Commander' });
});

router.post('/submit', express.json({ limit: '10mb' }), async (req, res) => {
  try {
    const { cart, customer, delivery } = req.body;
    if (!cart || !cart.length || !customer) return res.status(400).json({ error: 'Donnees manquantes' });
    const id = uuidv4().slice(0, 8);
    const subtotal = cart.reduce((s, it) => s + it.price * it.qty, 0);
    const fee = (delivery && delivery.fee) ? delivery.fee : 0;
    const total = subtotal + fee;
    const data = { id, cart, customer, delivery, subtotal, deliveryFee: fee, total, date: new Date().toISOString() };
    try {
      fs.writeFileSync(path.join(receivedDir, 'commande_' + id + '.json'), JSON.stringify(data, null, 2));
    } catch (e) {
      console.warn('[orders] stockage local impossible: ' + e.message);
    }
    const pdf = await generatePdf(data);
    let emailed = false;
    try {
      fs.writeFileSync(path.join(receivedDir, 'commande_' + id + '.pdf'), pdf);
    } catch (e) {
      console.warn('[orders] sauvegarde PDF locale impossible: ' + e.message);
    }
    try {
      const r = await sendOrderEmail(data, pdf);
      emailed = !!r.sent;
    } catch (err) {
      console.warn('[orders] envoi email echoue: ' + err.message);
    }
    res.json({ success: true, id, pdf: '/orders/' + id + '/pdf', emailed });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/:id/pdf', (req, res) => {
  const file = path.join(receivedDir, 'commande_' + req.params.id + '.pdf');
  if (!fs.existsSync(file)) return res.status(404).send('PDF introuvable');
  res.download(file, 'commande_' + req.params.id + '.pdf');
});

async function generatePdf(data) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([600, 800]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  let y = 760;

  page.drawText('BON DE COMMANDE - CNFFD 2026', { x: 40, y: y, size: 16, font: bold, color: rgb(0, 0, 0.5) });
  y -= 30;
  page.drawText('ID: ' + data.id + '  |  Date: ' + new Date(data.date).toLocaleString('fr-FR'), { x: 40, y: y, size: 10, font });

  y -= 25;
  page.drawText('CLIENT', { x: 40, y: y, size: 12, font: bold });
  y -= 15;
  page.drawText('Nom: ' + (data.customer.name || ''), { x: 50, y: y, size: 10, font });
  page.drawText('Tel: ' + (data.customer.phone || ''), { x: 50, y: y - 15, size: 10, font });
  page.drawText('Ville: ' + (data.customer.city || ''), { x: 50, y: y - 30, size: 10, font });
  page.drawText('Adresse: ' + (data.customer.address || ''), { x: 50, y: y - 45, size: 10, font });
  if (data.customer.email) page.drawText('Email: ' + data.customer.email, { x: 50, y: y - 60, size: 10, font });

  y -= 85;
  page.drawText('LIVRAISON / RETRAIT', { x: 40, y: y, size: 12, font: bold });
  y -= 15;
  page.drawText('Type: ' + (data.delivery.type === 'delivery' ? 'Livraison a domicile' : 'Retrait sur place'), { x: 50, y: y, size: 10, font });
  if (data.delivery.type === 'delivery') {
    page.drawText('Ville livraison: ' + (data.delivery.city || ''), { x: 50, y: y - 15, size: 10, font });
    page.drawText('Frais de livraison: ' + (data.delivery.fee || 0) + ' ' + config.currency, { x: 50, y: y - 30, size: 10, font });
  }

  y -= 55;
  page.drawText('COMPOSANTS', { x: 40, y: y, size: 12, font: bold });
  y -= 16;
  data.cart.forEach((it) => {
    const line = it.name + '  x' + it.qty + '   ' + it.price + ' ' + config.currency + '  =  ' + (it.price * it.qty) + ' ' + config.currency;
    page.drawText(line, { x: 50, y: y, size: 9, font });
    y -= 13;
  });

  y -= 12;
  page.drawText('Sous-total: ' + data.subtotal + ' ' + config.currency, { x: 40, y: y, size: 11, font });
  y -= 16;
  page.drawText('Livraison: ' + data.deliveryFee + ' ' + config.currency, { x: 40, y: y, size: 11, font });
  y -= 20;
  page.drawText('TOTAL GENERAL: ' + data.total + ' ' + config.currency, { x: 40, y: y, size: 13, font: bold, color: rgb(0.2, 0.2, 0.8) });

  const pdfBytes = await pdf.save();
  return Buffer.from(pdfBytes);
}

module.exports = router;
