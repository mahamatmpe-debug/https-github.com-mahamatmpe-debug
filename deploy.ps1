param(
  [string]$RepoUrl = ""
)

$ErrorActionPreference = "Stop"
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $here

Write-Host "== Deploiement CNFFD 2026 (Netlify) ==" -ForegroundColor Green

if (-not (Test-Path ".git")) {
  Write-Host "Initialisation du depot git..."
  git init | Out-Null
  git branch -M main
}

Write-Host "Generation des pages du site..."
node build.js

if ($RepoUrl -ne "") {
  git remote remove origin 2>$null | Out-Null
  git remote add origin $RepoUrl
}

git add .
$msg = "Mise a jour du site - " + (Get-Date -Format "yyyy-MM-dd HH:mm")
git commit -m $msg

Write-Host "Envoi vers GitHub..."
git push -u origin main

Write-Host "Termine. Render va reconstruire et remplacer automatiquement l'ancien site." -ForegroundColor Green
