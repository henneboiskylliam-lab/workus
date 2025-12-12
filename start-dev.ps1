# Work Us - Script de demarrage PowerShell
# Executez avec: .\start-dev.ps1

$Host.UI.RawUI.WindowTitle = "Work Us - Serveur de developpement"

Write-Host ""
Write-Host "  ╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "  ║                                                           ║" -ForegroundColor Cyan
Write-Host "  ║   ██╗    ██╗ ██████╗ ██████╗ ██╗  ██╗    ██╗   ██╗███████╗║" -ForegroundColor Cyan
Write-Host "  ║   ██║    ██║██╔═══██╗██╔══██╗██║ ██╔╝    ██║   ██║██╔════╝║" -ForegroundColor Cyan
Write-Host "  ║   ██║ █╗ ██║██║   ██║██████╔╝█████╔╝     ██║   ██║███████╗║" -ForegroundColor Cyan
Write-Host "  ║   ██║███╗██║██║   ██║██╔══██╗██╔═██╗     ██║   ██║╚════██║║" -ForegroundColor Cyan
Write-Host "  ║   ╚███╔███╔╝╚██████╔╝██║  ██║██║  ██╗    ╚██████╔╝███████║║" -ForegroundColor Cyan
Write-Host "  ║    ╚══╝╚══╝  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝     ╚═════╝ ╚══════╝║" -ForegroundColor Cyan
Write-Host "  ║                                                           ║" -ForegroundColor Cyan
Write-Host "  ║              Plateforme d'apprentissage                   ║" -ForegroundColor Cyan
Write-Host "  ╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Verifier Node.js
try {
    $nodeVersion = node --version
    Write-Host "  [INFO] Node.js version: $nodeVersion" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "  [ERREUR] Node.js n'est pas installe ou n'est pas dans le PATH." -ForegroundColor Red
    Write-Host ""
    Write-Host "  Telechargez Node.js depuis : https://nodejs.org/" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "  Appuyez sur Entree pour quitter"
    exit 1
}

# Verifier les dependances
if (-not (Test-Path "node_modules")) {
    Write-Host "  [INFO] Installation des dependances..." -ForegroundColor Yellow
    Write-Host ""
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "  [ERREUR] L'installation des dependances a echoue." -ForegroundColor Red
        Read-Host "  Appuyez sur Entree pour quitter"
        exit 1
    }
    Write-Host ""
    Write-Host "  [OK] Dependances installees avec succes!" -ForegroundColor Green
    Write-Host ""
}

# Afficher les informations de connexion
Write-Host "  [INFO] Demarrage du serveur de developpement..." -ForegroundColor Yellow
Write-Host ""
Write-Host "  ┌─────────────────────────────────────────────────────────────┐" -ForegroundColor Magenta
Write-Host "  │                                                             │" -ForegroundColor Magenta
Write-Host "  │   Le site sera accessible a :                               │" -ForegroundColor Magenta
Write-Host "  │                                                             │" -ForegroundColor Magenta
Write-Host "  │   → Local:   http://localhost:5173                          │" -ForegroundColor White
Write-Host "  │   → Reseau:  http://VOTRE_IP:5173                           │" -ForegroundColor White
Write-Host "  │                                                             │" -ForegroundColor Magenta
Write-Host "  │   Appuyez sur Ctrl+C pour arreter le serveur                │" -ForegroundColor Yellow
Write-Host "  │                                                             │" -ForegroundColor Magenta
Write-Host "  └─────────────────────────────────────────────────────────────┘" -ForegroundColor Magenta
Write-Host ""

# Lancer le serveur
npm run dev

Write-Host ""
Write-Host "  [INFO] Serveur arrete." -ForegroundColor Yellow
Read-Host "  Appuyez sur Entree pour quitter"

