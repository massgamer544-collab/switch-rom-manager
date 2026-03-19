# ============================================
# NovaRun Switch Emulator - Setup Script
# Run as Administrator
# ============================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  NovaRun Switch Emulator - Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as admin
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "ATTENTION: Lancez ce script en tant qu'Administrateur!" -ForegroundColor Red
    Write-Host "Clic droit sur PowerShell -> Executer en tant qu'administrateur" -ForegroundColor Yellow
    pause
    exit
}

# Install Chocolatey if not present
if (-not (Get-Command choco -ErrorAction SilentlyContinue)) {
    Write-Host "[1/5] Installation de Chocolatey..." -ForegroundColor Yellow
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
    refreshenv
} else {
    Write-Host "[1/5] Chocolatey deja installe ✓" -ForegroundColor Green
}

# Install Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "[2/5] Installation de Node.js..." -ForegroundColor Yellow
    choco install nodejs-lts -y
    refreshenv
} else {
    $nodeVersion = node --version
    Write-Host "[2/5] Node.js deja installe ($nodeVersion) ✓" -ForegroundColor Green
}

# Install Rust
if (-not (Get-Command rustc -ErrorAction SilentlyContinue)) {
    Write-Host "[3/5] Installation de Rust..." -ForegroundColor Yellow
    choco install rustup.install -y
    refreshenv
    rustup default stable
} else {
    $rustVersion = rustc --version
    Write-Host "[3/5] Rust deja installe ($rustVersion) ✓" -ForegroundColor Green
}

# Install Visual Studio Build Tools
Write-Host "[4/5] Installation de Visual Studio Build Tools..." -ForegroundColor Yellow
choco install visualstudio2022buildtools -y
choco install visualstudio2022-workload-vctools -y

# Install WebView2
Write-Host "[5/5] Installation de WebView2..." -ForegroundColor Yellow
choco install webview2-runtime -y

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Installation terminee!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Prochaines etapes:" -ForegroundColor Cyan
Write-Host "1. Fermez et rouvrez PowerShell" -ForegroundColor White
Write-Host "2. Naviguez vers le dossier du projet" -ForegroundColor White
Write-Host "3. Executez: npm install" -ForegroundColor White
Write-Host "4. Executez: npm run tauri dev" -ForegroundColor White
Write-Host ""
pause