@echo off
title Work Us - Build de production
color 0B

echo.
echo  ╔═══════════════════════════════════════════════════════════╗
echo  ║              WORK US - Build de production                ║
echo  ╚═══════════════════════════════════════════════════════════╝
echo.

:: Verifier si Node.js est installe
where node >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo  [ERREUR] Node.js n'est pas installe.
    pause
    exit /b 1
)

:: Verifier les dependances
if not exist "node_modules\" (
    echo  [INFO] Installation des dependances...
    call npm install
    if %errorlevel% neq 0 (
        color 0C
        echo  [ERREUR] Installation echouee.
        pause
        exit /b 1
    )
)

echo  [INFO] Construction de la version de production...
echo.

call npm run build

if %errorlevel% neq 0 (
    color 0C
    echo.
    echo  [ERREUR] La construction a echoue.
    pause
    exit /b 1
)

echo.
echo  ╔═══════════════════════════════════════════════════════════╗
echo  ║                                                           ║
echo  ║   [OK] Build termine avec succes!                         ║
echo  ║                                                           ║
echo  ║   Les fichiers sont dans le dossier: dist/                ║
echo  ║                                                           ║
echo  ║   Pour tester localement:                                 ║
echo  ║   → npm run preview                                       ║
echo  ║                                                           ║
echo  ╚═══════════════════════════════════════════════════════════╝
echo.
pause

