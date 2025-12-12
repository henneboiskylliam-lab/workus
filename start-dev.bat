@echo off
title Work Us - Serveur de developpement
color 0A

echo.
echo  ╔═══════════════════════════════════════════════════════════╗
echo  ║                                                           ║
echo  ║   ██╗    ██╗ ██████╗ ██████╗ ██╗  ██╗    ██╗   ██╗███████╗║
echo  ║   ██║    ██║██╔═══██╗██╔══██╗██║ ██╔╝    ██║   ██║██╔════╝║
echo  ║   ██║ █╗ ██║██║   ██║██████╔╝█████╔╝     ██║   ██║███████╗║
echo  ║   ██║███╗██║██║   ██║██╔══██╗██╔═██╗     ██║   ██║╚════██║║
echo  ║   ╚███╔███╔╝╚██████╔╝██║  ██║██║  ██╗    ╚██████╔╝███████║║
echo  ║    ╚══╝╚══╝  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝     ╚═════╝ ╚══════╝║
echo  ║                                                           ║
echo  ║              Plateforme d'apprentissage                   ║
echo  ╚═══════════════════════════════════════════════════════════╝
echo.

:: Verifier si Node.js est installe
where node >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo  [ERREUR] Node.js n'est pas installe ou n'est pas dans le PATH.
    echo.
    echo  Telechargez Node.js depuis : https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: Afficher la version de Node.js
echo  [INFO] Node.js version:
node --version
echo.

:: Verifier si les dependances sont installees
if not exist "node_modules\" (
    echo  [INFO] Installation des dependances...
    echo.
    call npm install
    if %errorlevel% neq 0 (
        color 0C
        echo.
        echo  [ERREUR] L'installation des dependances a echoue.
        pause
        exit /b 1
    )
    echo.
    echo  [OK] Dependances installees avec succes!
    echo.
)

:: Demarrer le serveur de developpement
echo  [INFO] Demarrage du serveur de developpement...
echo.
echo  ┌─────────────────────────────────────────────────────────────┐
echo  │                                                             │
echo  │   Le site sera accessible a :                               │
echo  │                                                             │
echo  │   → Local:   http://localhost:5173                          │
echo  │   → Reseau:  http://VOTRE_IP:5173                           │
echo  │                                                             │
echo  │   Appuyez sur Ctrl+C pour arreter le serveur                │
echo  │                                                             │
echo  └─────────────────────────────────────────────────────────────┘
echo.

:: Lancer Vite
call npm run dev

:: Si le serveur s'arrete
echo.
echo  [INFO] Serveur arrete.
pause


