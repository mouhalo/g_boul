@echo off
setlocal enabledelayedexpansion

echo === Mise a jour et redeploiement de l'application G_Boul ===

REM Configuration des variables
set SERVER_IP=62.169.16.32
set SERVER_USER=root
set SERVER_PATH=/var/www/gereboul
set APP_NAME=g_boul

REM Demander confirmation avant de continuer
echo.
echo Cette operation va:
echo  1. Commiter et pousser vos modifications locales vers GitHub
echo  2. Se connecter au serveur %SERVER_IP% en tant que %SERVER_USER%
echo  3. Mettre a jour et redeployer l'application sur le serveur
echo.

set /p CONFIRM=Voulez-vous continuer? (O/N): 

if /i "%CONFIRM%" NEQ "O" (
    echo Opération annulée.
    goto :end
)

REM Partie 1: Mise a jour locale et push vers GitHub
echo.
echo 1. Mise a jour locale et push vers GitHub...

REM Verifier s'il y a des modifications a commiter
git status --porcelain > temp.txt
set /p GIT_STATUS=<temp.txt
del temp.txt

if "%GIT_STATUS%"=="" (
    echo Aucune modification locale a commiter.
) else (
    git add .
    set /p COMMIT_MSG=Entrez un message de commit (ou appuyez sur Entree pour utiliser le message par defaut): 
    
    if "!COMMIT_MSG!"=="" (
        set COMMIT_MSG=Mise a jour automatique via script de deploiement
    )
    
    git commit -m "!COMMIT_MSG!"
    
    if %errorlevel% neq 0 (
        echo Erreur lors du commit. Verifiez votre configuration git.
        goto :end
    )
)

REM Push vers GitHub
echo Envoi des modifications vers le depot distant...
git push origin main

if %errorlevel% neq 0 (
    echo Erreur lors du push vers GitHub. Verifiez votre connexion et vos droits d'acces.
    goto :end
)

REM Partie 2: Connexion au serveur distant et deploiement
echo.
echo 2. Connexion au serveur distant et deploiement...

REM Verifier si ssh est disponible
ssh -V >nul 2>&1
if %errorlevel% neq 0 (
    echo ERREUR: La commande SSH n'est pas disponible sur votre systeme.
    echo Veuillez installer OpenSSH pour Windows ou Git Bash qui inclut SSH.
    goto :end
)

echo Connexion au serveur %SERVER_IP% en tant que %SERVER_USER%...
echo Execution des commandes de deploiement sur le serveur...

REM Commande SSH pour executer le deploiement sur le serveur
ssh %SERVER_USER%@%SERVER_IP% "cd %SERVER_PATH% && git pull && npm install && npm run build && pm2 restart %APP_NAME%"

if %errorlevel% neq 0 (
    echo ERREUR: Probleme lors de la connexion au serveur ou de l'execution des commandes.
    echo Verifiez vos identifiants, l'adresse IP et que le serveur est accessible.
    goto :end
) else (
    echo Deploiement sur le serveur reussi!
    echo L'application est maintenant a jour sur http://%SERVER_IP%:3000
)

:end
echo === Deploiement termine ===
echo.
echo Si vous souhaitez lancer l'application en local:
echo - Pour lancer en production: npm run start
echo - Pour lancer en developpement: npm run dev
echo.
echo Pour personnaliser ce script, modifiez les variables en haut du fichier.

pause
