@echo off
title NovaRun Switch Emulator - Installation
color 0B

echo ========================================
echo   NovaRun Switch Emulator - Setup
echo ========================================
echo.

:: Check for Admin rights
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERREUR] Lancez ce fichier en tant qu'Administrateur!
    echo Clic droit sur INSTALL.bat puis "Executer en tant qu'administrateur"
    pause
    exit /b
)

:: Install Chocolatey
echo [1/6] Verification de Chocolatey...
where choco >nul 2>&1
if %errorLevel% neq 0 (
    echo Installation de Chocolatey...
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))"
    call refreshenv
) else (
    echo Chocolatey OK
)

:: Install Node.js
echo.
echo [2/6] Verification de Node.js...
where node >nul 2>&1
if %errorLevel% neq 0 (
    echo Installation de Node.js...
    choco install nodejs-lts -y
    call refreshenv
) else (
    echo Node.js OK
)

:: Install Rust
echo.
echo [3/6] Verification de Rust...
where rustc >nul 2>&1
if %errorLevel% neq 0 (
    echo Installation de Rust...
    choco install rustup.install -y
    call refreshenv
    rustup default stable
) else (
    echo Rust OK
)

:: Install VS Build Tools
echo.
echo [4/6] Installation de Visual Studio Build Tools...
choco install visualstudio2022buildtools -y --no-progress
choco install visualstudio2022-workload-vctools -y --no-progress

:: Install WebView2
echo.
echo [5/6] Installation de WebView2...
choco install webview2-runtime -y --no-progress

:: Install npm dependencies
echo.
echo [6/6] Installation des dependances npm...
call npm install

echo.
echo ========================================
echo   Installation terminee!
echo ========================================
echo.
echo Fermez cette fenetre, ouvrez un nouveau terminal
echo et executez: npm run tauri dev
echo.
pause