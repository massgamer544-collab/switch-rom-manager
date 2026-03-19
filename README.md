# NovaRun Switch Emulator - ROM Manager

## 🚀 Installation Rapide (Windows)

### Méthode 1: Script automatique
1. Ouvrez PowerShell **en tant qu'Administrateur**
2. Exécutez: `.\SETUP.ps1`
3. Redémarrez PowerShell
4. Dans le dossier du projet:
   ```powershell
   npm install
   npm run tauri dev
Méthode 2: Installation manuelle
Prérequis à installer:
Logiciel	Téléchargement
Node.js 18+	https://nodejs.org/
Rust	https://rustup.rs/
Visual Studio Build Tools	https://visualstudio.microsoft.com/visual-cpp-build-tools/
WebView2	https://developer.microsoft.com/en-us/microsoft-edge/webview2/
Commandes:
# Installer les dépendances Node
npm install

# Lancer en mode développement
npm run tauri dev

# Compiler l'application (.exe)
npm run tauri build
📁 Structure du Projet
SwitchEmulatorDesktop/
├── src/                    # Frontend React
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── src-tauri/              # Backend Rust
│   ├── src/main.rs
│   ├── capabilities/
│   └── tauri.conf.json
├── package.json
└── README.md
🎮 Utilisation
Cliquez sur + Add Folder pour ajouter un dossier de ROMs
Cliquez sur Scan pour détecter les jeux (.nsp, .xci)
Cliquez sur ⚙️ pour configurer le chemin de l'émulateur
Double-cliquez sur un jeu pour le lancer
📋 Émulateurs supportés
Yuzu
Ryujinx
Suyu

---

## 📄 3. Créez `REQUIREMENTS.txt` (pour référence)

```text
# ============================================
# NovaRun Switch Emulator - Requirements
# ============================================

# SYSTEM REQUIREMENTS (Windows 10/11)
# ------------------------------------
Node.js >= 18.0.0          # https://nodejs.org/
Rust >= 1.70.0             # https://rustup.rs/
Visual Studio Build Tools  # https://visualstudio.microsoft.com/visual-cpp-build-tools/
WebView2 Runtime           # https://developer.microsoft.com/en-us/microsoft-edge/webview2/

# NODE PACKAGES (installed via npm install)
# -----------------------------------------
# See package.json for full list
@tauri-apps/api
@tauri-apps/cli
react
typescript
vite

# RUST CRATES (installed via cargo)
# ---------------------------------
# See src-tauri/Cargo.toml for full list
tauri
serde
serde_json
tokio
reqwest
