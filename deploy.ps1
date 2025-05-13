# Script de déploiement pour l'application G_Boul
# Ce script met à jour le dépôt local, fait un build, puis déploie sur le serveur distant

# Configuration des variables
$SERVER_IP = "62.169.16.32"
$SERVER_USER = "root"
$SERVER_PATH = "/var/www/gereboul"
$APP_NAME = "g_boul"

# Fonction pour afficher des messages avec couleur
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    else {
        $input | Write-Output
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

# Affichage du titre
Write-ColorOutput Green "=== Mise à jour et redéploiement de l'application G_Boul ==="
Write-Output ""

# Demander confirmation avant de continuer
Write-Output "Cette opération va:"
Write-Output " 1. Commiter et pousser vos modifications locales vers GitHub"
Write-Output " 2. Se connecter au serveur $SERVER_IP en tant que $SERVER_USER"
Write-Output " 3. Mettre à jour et redéployer l'application sur le serveur"
Write-Output ""

$confirm = Read-Host "Voulez-vous continuer? (O/N)"
if ($confirm -ne "O" -and $confirm -ne "o") {
    Write-ColorOutput Yellow "Opération annulée."
    exit
}

# Partie 1: Mise à jour locale et push vers GitHub
Write-Output ""
Write-ColorOutput Cyan "1. Mise à jour locale et push vers GitHub..."

# Vérifier s'il y a des modifications à commiter
$gitStatus = git status --porcelain
if ([string]::IsNullOrEmpty($gitStatus)) {
    Write-Output "Aucune modification locale à commiter."
} 
else {
    git add .
    $commitMsg = Read-Host "Entrez un message de commit (ou appuyez sur Entrée pour utiliser le message par défaut)"
    
    if ([string]::IsNullOrEmpty($commitMsg)) {
        $commitMsg = "Mise à jour automatique via script de déploiement"
    }
    
    git commit -m $commitMsg
    
    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput Red "Erreur lors du commit. Vérifiez votre configuration git."
        exit
    }
}

# Push vers GitHub
Write-Output "Envoi des modifications vers le dépôt distant..."
git push origin main

if ($LASTEXITCODE -ne 0) {
    Write-ColorOutput Red "Erreur lors du push vers GitHub. Vérifiez votre connexion et vos droits d'accès."
    exit
}

# Partie 2: Connexion au serveur distant et déploiement
Write-Output ""
Write-ColorOutput Cyan "2. Connexion au serveur distant et déploiement..."

# Vérifier si ssh est disponible
try {
    ssh -V 2>&1 | Out-Null
}
catch {
    Write-ColorOutput Red "ERREUR: La commande SSH n'est pas disponible sur votre système."
    Write-Output "Veuillez installer OpenSSH pour Windows ou Git Bash qui inclut SSH."
    exit
}

Write-Output "Connexion au serveur $SERVER_IP en tant que $SERVER_USER..."
Write-Output "Exécution des commandes de déploiement sur le serveur..."

# Commande SSH pour exécuter le déploiement sur le serveur
ssh "$SERVER_USER@$SERVER_IP" "cd $SERVER_PATH && git pull && npm install && npm run build && pm2 restart $APP_NAME"

if ($LASTEXITCODE -ne 0) {
    Write-ColorOutput Red "ERREUR: Problème lors de la connexion au serveur ou de l'exécution des commandes."
    Write-Output "Vérifiez vos identifiants, l'adresse IP et que le serveur est accessible."
    exit
}
else {
    Write-ColorOutput Green "Déploiement sur le serveur réussi!"
    Write-Output "L'application est maintenant à jour sur http://$SERVER_IP:3000"
}

# Fin du script
Write-ColorOutput Green "=== Déploiement terminé ==="
Write-Output ""
Write-Output "Si vous souhaitez lancer l'application en local:"
Write-Output " - Pour lancer en production: npm run start"
Write-Output " - Pour lancer en développement: npm run dev"
Write-Output ""
Write-Output "Pour personnaliser ce script, modifiez les variables en haut du fichier."

# Pause pour voir les résultats
Write-Output ""
Read-Host "Appuyez sur Entrée pour fermer cette fenêtre"
