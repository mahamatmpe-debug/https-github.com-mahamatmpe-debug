const express = require('express');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { sendInquiryEmail } = require('../utils/mailer');

const router = express.Router();
const receivedDir = process.env.RECEIVED_DIR || path.join(__dirname, '..', 'received');
if (!fs.existsSync(receivedDir)) fs.mkdirSync(receivedDir, { recursive: true });

router.get('/', (req, res) => {
  res.render('inquiry', { title: 'Demander une info' });
});

router.post('/submit', express.json({ limit: '5mb' }), async (req, res) => {
  try {
    const { name, phone, email, subject, message } = req.body;
    if (!name || !phone || !subject || !message) {
      return res.status(400).json({ error: 'Champs obligatoires manquants' });
    }
    const id = uuidv4().slice(0, 8);
    const data = { id, name, phone, email: email || '', subject, message, date: new Date().toISOString() };
    try {
      fs.writeFileSync(path.join(receivedDir, 'question_' + id + '.json'), JSON.stringify(data, null, 2));
    } catch (e) {
      console.warn('[inquiries] stockage local impossible: ' + e.message);
    }
    let emailed = false;
    try {
      const r = await sendInquiryEmail(data);
      emailed = !!r.sent;
    } catch (err) {
      console.warn('[inquiries] envoi email echoue: ' + err.message);
    }
    res.json({ success: true, id, emailed });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
