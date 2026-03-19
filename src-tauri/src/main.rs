#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::process::Command;
use walkdir::WalkDir;

// Structure pour un jeu
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Game {
    pub id: String,
    pub title: String,
    pub title_id: String,
    pub file_path: String,
    pub file_name: String,
    pub file_size: u64,
    pub file_type: String,
    pub cover_url: Option<String>,
    pub local_cover: Option<String>,
    pub region: String,
    pub version: String,
    pub favorite: bool,
    pub play_count: u32,
    pub last_played: Option<String>,
    pub date_added: String,
}

// Structure pour les paramètres
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Settings {
    pub rom_folders: Vec<String>,
    pub emulator_path: String,
    pub emulator_type: String, // yuzu, ryujinx, suyu
    pub theme: String,
    pub grid_size: String,
    pub auto_scan: bool,
}

impl Default for Settings {
    fn default() -> Self {
        Settings {
            rom_folders: vec![],
            emulator_path: String::new(),
            emulator_type: "yuzu".to_string(),
            theme: "dark".to_string(),
            grid_size: "medium".to_string(),
            auto_scan: true,
        }
    }
}

// Structure pour la bibliothèque
#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Library {
    pub games: Vec<Game>,
    pub settings: Settings,
}

// Obtenir le chemin du fichier de données
fn get_data_path() -> PathBuf {
    let mut path = dirs::data_local_dir().unwrap_or_else(|| PathBuf::from("."));
    path.push("SwitchRomManager");
    fs::create_dir_all(&path).ok();
    path.push("library.json");
    path
}

// Charger la bibliothèque
#[tauri::command]
fn load_library() -> Library {
    let path = get_data_path();
    if path.exists() {
        let content = fs::read_to_string(&path).unwrap_or_default();
        serde_json::from_str(&content).unwrap_or_default()
    } else {
        Library::default()
    }
}

// Sauvegarder la bibliothèque
#[tauri::command]
fn save_library(library: Library) -> Result<(), String> {
    let path = get_data_path();
    let content = serde_json::to_string_pretty(&library).map_err(|e| e.to_string())?;
    fs::write(&path, content).map_err(|e| e.to_string())?;
    Ok(())
}

// Scanner un dossier pour trouver des ROMs
#[tauri::command]
fn scan_folder(folder_path: String) -> Vec<Game> {
    let mut games = Vec::new();
    let valid_extensions = ["nsp", "xci", "nsz", "xcz"];

    for entry in WalkDir::new(&folder_path)
        .follow_links(true)
        .into_iter()
        .filter_map(|e| e.ok())
    {
        let path = entry.path();
        if let Some(ext) = path.extension() {
            let ext_str = ext.to_string_lossy().to_lowercase();
            if valid_extensions.contains(&ext_str.as_str()) {
                if let Some(file_name) = path.file_name() {
                    let file_name_str = file_name.to_string_lossy().to_string();
                    let title = extract_title_from_filename(&file_name_str);
                    let title_id = extract_title_id_from_filename(&file_name_str);
                    
                    let metadata = fs::metadata(path).ok();
                    let file_size = metadata.map(|m| m.len()).unwrap_or(0);

                    let game = Game {
                        id: uuid::Uuid::new_v4().to_string(),
                        title: title.clone(),
                        title_id: title_id.clone(),
                        file_path: path.to_string_lossy().to_string(),
                        file_name: file_name_str.clone(),
                        file_size,
                        file_type: ext_str.to_uppercase(),
                        cover_url: get_cover_url(&title_id),
                        local_cover: None,
                        region: detect_region(&file_name_str),
                        version: extract_version(&file_name_str),
                        favorite: false,
                        play_count: 0,
                        last_played: None,
                        date_added: chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string(),
                    };
                    games.push(game);
                }
            }
        }
    }
    games
}

// Extraire le titre du nom de fichier
fn extract_title_from_filename(filename: &str) -> String {
    // Pattern: "Game Title [titleID][v0].nsp"
    let name = filename
        .split('[')
        .next()
        .unwrap_or(filename)
        .trim()
        .to_string();
    
    // Nettoyer le nom
    name.replace("_", " ")
        .replace("  ", " ")
        .trim_end_matches(|c: char| c == '.' || c.is_whitespace())
        .to_string()
}

// Extraire le Title ID
fn extract_title_id_from_filename(filename: &str) -> String {
    // Chercher un pattern comme [0100XXX...] (16 caractères hex)
    let re = regex::Regex::new(r"\[([0-9A-Fa-f]{16})\]").ok();
    if let Some(regex) = re {
        if let Some(caps) = regex.captures(filename) {
            return caps.get(1).map(|m| m.as_str().to_uppercase()).unwrap_or_default();
        }
    }
    String::new()
}

// Extraire la version
fn extract_version(filename: &str) -> String {
    let re = regex::Regex::new(r"\[v(\d+)\]").ok();
    if let Some(regex) = re {
        if let Some(caps) = regex.captures(filename) {
            return format!("v{}", caps.get(1).map(|m| m.as_str()).unwrap_or("0"));
        }
    }
    "v0".to_string()
}

// Détecter la région
fn detect_region(filename: &str) -> String {
    let lower = filename.to_lowercase();
    if lower.contains("usa") || lower.contains("(u)") || lower.contains("[us]") {
        "USA".to_string()
    } else if lower.contains("eur") || lower.contains("(e)") || lower.contains("[eu]") {
        "EUR".to_string()
    } else if lower.contains("jpn") || lower.contains("(j)") || lower.contains("[jp]") {
        "JPN".to_string()
    } else {
        "World".to_string()
    }
}

// Obtenir l'URL de la cover (utilise une API de covers)
fn get_cover_url(title_id: &str) -> Option<String> {
    if title_id.is_empty() {
        return None;
    }
    // URL vers une source de covers (vous pouvez changer cette source)
    Some(format!(
        "https://api.nlib.cc/nx/{}/cover",
        title_id.to_lowercase()
    ))
}

// Lancer un jeu avec l'émulateur
#[tauri::command]
fn launch_game(game_path: String, emulator_path: String, emulator_type: String) -> Result<(), String> {
    let mut cmd = Command::new(&emulator_path);
    
    match emulator_type.as_str() {
        "yuzu" => {
            cmd.arg(&game_path);
        }
        "ryujinx" => {
            cmd.arg(&game_path);
        }
        "suyu" => {
            cmd.arg(&game_path);
        }
        _ => {
            cmd.arg(&game_path);
        }
    }

    cmd.spawn().map_err(|e| format!("Failed to launch emulator: {}", e))?;
    Ok(())
}

// Ouvrir le dossier contenant le fichier
#[tauri::command]
fn open_file_location(file_path: String) -> Result<(), String> {
    let path = PathBuf::from(&file_path);
    if let Some(parent) = path.parent() {
        #[cfg(target_os = "windows")]
        {
            Command::new("explorer")
                .arg(parent)
                .spawn()
                .map_err(|e| e.to_string())?;
        }
        #[cfg(target_os = "macos")]
        {
            Command::new("open")
                .arg(parent)
                .spawn()
                .map_err(|e| e.to_string())?;
        }
        #[cfg(target_os = "linux")]
        {
            Command::new("xdg-open")
                .arg(parent)
                .spawn()
                .map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}

// Formater la taille du fichier
#[tauri::command]
fn format_file_size(size: u64) -> String {
    const KB: u64 = 1024;
    const MB: u64 = KB * 1024;
    const GB: u64 = MB * 1024;

    if size >= GB {
        format!("{:.2} GB", size as f64 / GB as f64)
    } else if size >= MB {
        format!("{:.2} MB", size as f64 / MB as f64)
    } else if size >= KB {
        format!("{:.2} KB", size as f64 / KB as f64)
    } else {
        format!("{} B", size)
    }
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            load_library,
            save_library,
            scan_folder,
            launch_game,
            open_file_location,
            format_file_size,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}