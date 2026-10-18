const express = require('express');
const fs = require('fs');
const path = require('path');
const config = require('../config');

const router = express.Router();
const pubFile = path.join(__dirname, '..', 'reseau sociaux', 'publications.json');

function loadPublications() {
  try {
    const raw = fs.readFileSync(pubFile, 'utf8');
    const data = JSON.parse(raw);
    const list = Array.isArray(data.publications) ? data.publications : [];
    list.sort((a, b) => new Date(b.date) - new Date(a.date));
    return { page: data.page || {}, publications: list };
  } catch (e) {
    return { page: {}, publications: [] };
  }
}

router.get('/', (req, res) => {
  const { page, publications } = loadPublications();
  res.render('social', {
    title: 'Réseaux sociaux',
    facebookPageUrl: page.facebook || config.facebookUrl,
    publications,
    baseUrl: req.protocol + '://' + req.get('host')
  });
});

module.exports = router;
