# CNFFD 2026 - Site & Application

Site web installable (application PWA) pour consulter et commander des composants,
avec livraison au Tchad, réception des commandes par email (PDF joint), et un
espace "réseaux sociaux" (Facebook + publications quotidiennes).

## Lancer en local
```
npm install
npm start
```
Ouvrir http://localhost:3000

## Mise en ligne (GitHub + Render) - deploiement automatique

1. Creez un depot vide sur GitHub (ex: cnffd-2026).
2. Dans ce dossier, lancez (remplacez l'URL par la votre) :
   ```powershell
   .\deploy.ps1 -RepoUrl "https://github.com/VOTRE_COMPTE/cnffd-2026.git"
   ```
3. Sur https://render.com : New > Blueprint -> choisis ton depot GitHub.
   Render lit `render.yaml` et cree le site automatiquement.
2. Render demande les valeurs secretes : `ORDER_EMAIL`, `SMTP_HOST`,
   `SMTP_USER`, `SMTP_PASS` (voir la section Email ci-dessous).

Ensuite, **a chaque `git push`**, Render reconstruit et remplace automatiquement
l'ancien site. Pas besoin de renvoyer manuellement le nouveau deploiement.

## Email des commandes (SMTP)
Pour recevoir les commandes et questions par email avec le PDF en piece jointe,
configure sur Render les variables :
- `ORDER_EMAIL` : ton adresse email de reception
- `SMTP_HOST` : ex. smtp.gmail.com
- `SMTP_PORT` : 587
- `SMTP_USER` : ton email
- `SMTP_PASS` : mot de passe d'application (Gmail: "mot de passe d'application")
- `MAIL_FROM` : nom affiche

## Application installable (PWA)
Le site est une PWA : sur telephone, "Ajouter a l'ecran d'accueil" installe
l'application. Elle se met a jour toute seule a chaque nouveau deploiement.

## Reseaux sociaux / publications quotidiennes
Voir le dossier `reseau sociaux/`. Modifie `publications.json` puis `git push`
pour publier une nouveaute du jour.
