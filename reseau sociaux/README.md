# Réseaux sociaux - CNFFD 2026

Ce dossier regroupe tout ce qui concerne la presence en ligne et les publications
quotidiennes du site CNFFD 2026.

## 1. Facebook
- Page / compte : configure `facebookUrl` et `facebookPage` dans `site/config.js`
  (ou via variables d'environnement `FACEBOOK_URL`, `FACEBOOK_PAGE` sur Render).
- La page `/social` du site affiche un fil Facebook integre + un bouton de partage.
- Chaque composant a un bouton "Partager sur Facebook".

## 2. Publications quotidiennes
- Le fichier `publications.json` contient les publications du jour.
- Pour publier une nouveaute quotidienne, ajoutez un objet en tete du tableau
  `publications` avec la date du jour, un titre, un texte, une image et un lien.
- Apres modification : `git add .` puis `git commit -m "publication du jour"` puis
  `git push`. Le site se met a jour automatiquement (deploiement continu Render).

### Modele d'une publication
```json
{
  "date": "AAAA-MM-JJ",
  "title": "Titre du jour",
  "text": "Description de la publication...",
  "image": "/components/pub1.jpeg",
  "link": "/orders"
}
```

## 3. Partage automatique
- Pour publier automatiquement sur Facebook, vous pouvez utiliser un webhook
  (Zapier / Make / IFTTT) qui lit ce fichier et poste la derniere entree.
