import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import "./App.css";

interface Game {
  id: string;
  title: string;
  title_id: string;
  file_path: string;
  file_name: string;
  file_size: number;
  file_type: string;
  cover_url: string | null;
  local_cover: string | null;
  region: string;
  version: string;
  favorite: boolean;
  play_count: number;
  last_played: string | null;
  date_added: string;
}

interface AppSettings {
  rom_folders: string[];
  emulator_path: string;
  emulator_type: string;
  theme: string;
  grid_size: string;
  auto_scan: boolean;
}

interface Library {
  games: Game[];
  settings: AppSettings;
}

function App() {
  const [library, setLibrary] = useState<Library>({ games: [], settings: { rom_folders: [], emulator_path: "", emulator_type: "yuzu", theme: "dark", grid_size: "medium", auto_scan: true } });
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("title");
  const [notification, setNotification] = useState<{ type: string; message: string } | null>(null);

  useEffect(() => { loadLibrary(); }, []);

  const loadLibrary = async () => { try { const lib = await invoke<Library>("load_library"); setLibrary(lib); } catch (e) { console.error(e); } };
  const saveLibrary = async (lib: Library) => { try { await invoke("save_library", { library: lib }); setLibrary(lib); } catch (e) { console.error(e); } };
  const showNotif = (type: string, message: string) => { setNotification({ type, message }); setTimeout(() => setNotification(null), 3000); };
  const formatSize = (bytes: number) => { const gb = bytes / (1024 * 1024 * 1024); return gb >= 1 ? gb.toFixed(2) + " GB" : (bytes / (1024 * 1024)).toFixed(2) + " MB"; };

  const addRomFolder = async () => {
    try {
      const selected = await open({ directory: true, multiple: false, title: "Select ROM Folder" });
      if (selected) {
        const newSettings = { ...library.settings, rom_folders: [...library.settings.rom_folders, selected as string] };
        await saveLibrary({ ...library, settings: newSettings });
        showNotif("success", "Folder added!");
        scanFolder(selected as string);
      }
    } catch (e) { console.error(e); }
  };

  const scanFolder = async (folderPath: string) => {
    setIsScanning(true);
    try {
      const games = await invoke<Game[]>("scan_folder", { folderPath });
      const existingPaths = new Set(library.games.map(g => g.file_path));
      const newGames = games.filter(g => !existingPaths.has(g.file_path));
      await saveLibrary({ ...library, games: [...library.games, ...newGames] });
      showNotif("success", "Found " + newGames.length + " new games!");
    } catch (e) { showNotif("error", "Scan failed"); }
    setIsScanning(false);
  };

  const scanAllFolders = async () => { for (const f of library.settings.rom_folders) await scanFolder(f); };

  const selectEmulator = async () => {
    try {
      const selected = await open({ multiple: false, filters: [{ name: "Executable", extensions: ["exe"] }], title: "Select Emulator" });
      if (selected) { await saveLibrary({ ...library, settings: { ...library.settings, emulator_path: selected as string } }); showNotif("success", "Emulator set!"); }
    } catch (e) { console.error(e); }
  };

  const launchGame = async (game: Game) => {
    if (!library.settings.emulator_path) { showNotif("error", "Set emulator in settings!"); setShowSettings(true); return; }
    try {
      await invoke("launch_game", { gamePath: game.file_path, emulatorPath: library.settings.emulator_path, emulatorType: library.settings.emulator_type });
      const updated = library.games.map(g => g.id === game.id ? { ...g, play_count: g.play_count + 1, last_played: new Date().toISOString() } : g);
      await saveLibrary({ ...library, games: updated });
      showNotif("success", "Launching " + game.title);
    } catch (e) { showNotif("error", "Launch failed"); }
  };

  const toggleFavorite = async (id: string) => { const updated = library.games.map(g => g.id === id ? { ...g, favorite: !g.favorite } : g); await saveLibrary({ ...library, games: updated }); };
  const removeGame = async (id: string) => { await saveLibrary({ ...library, games: library.games.filter(g => g.id !== id) }); setSelectedGame(null); showNotif("success", "Removed"); };
  const openFileLocation = async (path: string) => { try { await invoke("open_file_location", { filePath: path }); } catch (e) { console.error(e); } };

  const filteredGames = library.games
    .filter(g => g.title.toLowerCase().includes(searchQuery.toLowerCase()) && (filterType === "all" || (filterType === "favorites" && g.favorite) || (filterType === "nsp" && g.file_type === "NSP") || (filterType === "xci" && g.file_type === "XCI")))
    .sort((a, b) => sortBy === "title" ? a.title.localeCompare(b.title) : sortBy === "size" ? b.file_size - a.file_size : 0);

  return (
    <div style={{ minHeight: "100vh", background: "#0D1117", color: "#C9D1D9", fontFamily: "system-ui, sans-serif" }}>
      {notification && <div style={{ position: "fixed", top: 16, right: 16, zIndex: 99, padding: "12px 20px", borderRadius: 8, background: notification.type === "success" ? "#22c55e20" : "#ef444420", border: "1px solid " + (notification.type === "success" ? "#22c55e" : "#ef4444"), color: notification.type === "success" ? "#22c55e" : "#ef4444" }}>{notification.message}</div>}
      
      <header style={{ position: "sticky", top: 0, zIndex: 50, background: "#161B22ee", backdropFilter: "blur(8px)", borderBottom: "1px solid #30363D", padding: 16 }}>
        <div style={{ maxWidth: 1600, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg, #FF3C2833, #0AB9E633)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 24 }}>🎮</span>
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Switch ROM Manager</h1>
              <p style={{ margin: 0, fontSize: 13, color: "#8B949E" }}>{library.games.length} games</p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <input placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #30363D", background: "#0D1117", color: "#C9D1D9", width: 200 }} />
            <button onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #30363D", background: "#21262D", color: "#C9D1D9", cursor: "pointer" }}>{viewMode === "grid" ? "📋 List" : "📦 Grid"}</button>
            <button onClick={scanAllFolders} disabled={isScanning || !library.settings.rom_folders.length} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #30363D", background: "#21262D", color: "#C9D1D9", cursor: "pointer", opacity: isScanning ? 0.5 : 1 }}>{isScanning ? "⏳ Scanning..." : "🔄 Scan"}</button>
            <button onClick={addRomFolder} style={{ padding: "8px 14px", borderRadius: 8, border: "none", background: "#238636", color: "#fff", cursor: "pointer", fontWeight: 500 }}>➕ Add Folder</button>
            <button onClick={() => setShowSettings(true)} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #30363D", background: "#21262D", color: "#C9D1D9", cursor: "pointer" }}>⚙️</button>
          </div>
        </div>
        <div style={{ maxWidth: 1600, margin: "12px auto 0", display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["all", "favorites", "nsp", "xci"].map(f => <button key={f} onClick={() => setFilterType(f)} style={{ padding: "4px 12px", borderRadius: 20, border: "none", background: filterType === f ? "#58A6FF" : "#21262D", color: filterType === f ? "#fff" : "#C9D1D9", cursor: "pointer", fontSize: 13 }}>{f === "favorites" ? "⭐ Favorites" : f.toUpperCase()}</button>)}
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ marginLeft: "auto", padding: "4px 10px", borderRadius: 8, border: "1px solid #30363D", background: "#21262D", color: "#C9D1D9" }}>
            <option value="title">Name</option>
            <option value="size">Size</option>
          </select>
        </div>
      </header>

      <main style={{ maxWidth: 1600, margin: "0 auto", padding: 20 }}>
        {!library.games.length ? (
          <div style={{ textAlign: "center", padding: "80px 20px" }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>📁</div>
            <h2 style={{ marginBottom: 8 }}>No games yet</h2>
            <p style={{ color: "#8B949E", marginBottom: 20 }}>Add a folder with Switch ROMs</p>
            <button onClick={addRomFolder} style={{ padding: "12px 24px", borderRadius: 8, border: "none", background: "linear-gradient(135deg, #FF3C28, #0AB9E6)", color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 16 }}>➕ Add ROM Folder</button>
          </div>
        ) : viewMode === "grid" ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 16 }}>
            {filteredGames.map(g => (
              <div key={g.id} onClick={() => setSelectedGame(g)} style={{ borderRadius: 10, overflow: "hidden", background: "#161B22", border: "1px solid #30363D", cursor: "pointer", transition: "transform 0.2s", position: "relative" }}>
                <div style={{ aspectRatio: "3/4", background: "#21262D", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, position: "relative" }}>
                  {g.cover_url ? <img src={g.cover_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => (e.currentTarget.style.display = "none")} /> : "🎮"}
                  {g.favorite && <span style={{ position: "absolute", top: 6, right: 6, background: "#eab308", borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10 }}>⭐</span>}
                </div>
                <div style={{ padding: 10 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{g.title}</div>
                  <div style={{ display: "flex", gap: 6, marginTop: 4, fontSize: 11, color: "#8B949E" }}>
                    <span style={{ background: "#30363D", padding: "2px 6px", borderRadius: 4 }}>{g.file_type}</span>
                    <span>{formatSize(g.file_size)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filteredGames.map(g => (
              <div key={g.id} onClick={() => setSelectedGame(g)} style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, borderRadius: 8, background: "#161B22", border: "1px solid #30363D", cursor: "pointer" }}>
                <div style={{ width: 50, height: 50, borderRadius: 8, background: "#21262D", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>{g.cover_url ? <img src={g.cover_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8 }} /> : "🎮"}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{g.title}</div>
                  <div style={{ fontSize: 13, color: "#8B949E" }}>{g.file_type} • {formatSize(g.file_size)} • {g.region}</div>
                </div>
                <button onClick={e => { e.stopPropagation(); launchGame(g); }} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#238636", color: "#fff", cursor: "pointer" }}>▶ Play</button>
              </div>
            ))}
          </div>
        )}
      </main>

      {selectedGame && (
        <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", justifyContent: "flex-end" }}>
          <div style={{ position: "absolute", inset: 0, background: "#00000080" }} onClick={() => setSelectedGame(null)} />
          <div style={{ position: "relative", width: 360, maxWidth: "100%", background: "#161B22", borderLeft: "1px solid #30363D", overflowY: "auto", padding: 20 }}>
            <button onClick={() => setSelectedGame(null)} style={{ position: "absolute", top: 12, right: 12, background: "none", border: "none", color: "#8B949E", cursor: "pointer", fontSize: 20 }}>✕</button>
            <div style={{ aspectRatio: "3/4", borderRadius: 10, background: "#21262D", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48, overflow: "hidden" }}>{selectedGame.cover_url ? <img src={selectedGame.cover_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "🎮"}</div>
            <h2 style={{ margin: "0 0 16px", fontSize: 18 }}>{selectedGame.title}</h2>
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              <button onClick={() => launchGame(selectedGame)} style={{ flex: 1, padding: 12, borderRadius: 8, border: "none", background: "#238636", color: "#fff", cursor: "pointer", fontWeight: 600 }}>▶ Play</button>
              <button onClick={() => toggleFavorite(selectedGame.id)} style={{ padding: 12, borderRadius: 8, border: "1px solid #30363D", background: selectedGame.favorite ? "#eab30830" : "transparent", color: selectedGame.favorite ? "#eab308" : "#8B949E", cursor: "pointer" }}>{selectedGame.favorite ? "⭐" : "☆"}</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[["Title ID", selectedGame.title_id || "Unknown"], ["Size", formatSize(selectedGame.file_size)], ["Format", selectedGame.file_type], ["Region", selectedGame.region], ["Played", selectedGame.play_count + "x"]].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: 10, borderRadius: 6, background: "#0D1117" }}><span style={{ color: "#8B949E" }}>{k}</span><span>{v}</span></div>
              ))}
            </div>
            <div style={{ marginTop: 16, padding: 10, borderRadius: 6, background: "#0D1117" }}>
              <div style={{ fontSize: 11, color: "#8B949E", marginBottom: 4 }}>Path</div>
              <div style={{ fontSize: 11, wordBreak: "break-all" }}>{selectedGame.file_path}</div>
              <button onClick={() => openFileLocation(selectedGame.file_path)} style={{ marginTop: 8, background: "none", border: "none", color: "#58A6FF", cursor: "pointer", fontSize: 12, padding: 0 }}>📂 Open folder</button>
            </div>
            <button onClick={() => removeGame(selectedGame.id)} style={{ width: "100%", marginTop: 20, padding: 12, borderRadius: 8, border: "1px solid #ef444450", background: "transparent", color: "#ef4444", cursor: "pointer" }}>🗑️ Remove</button>
          </div>
        </div>
      )}

      {showSettings && (
        <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "absolute", inset: 0, background: "#00000080" }} onClick={() => setShowSettings(false)} />
          <div style={{ position: "relative", width: 450, maxWidth: "90%", background: "#161B22", borderRadius: 12, border: "1px solid #30363D", padding: 20 }}>
            <button onClick={() => setShowSettings(false)} style={{ position: "absolute", top: 12, right: 12, background: "none", border: "none", color: "#8B949E", cursor: "pointer", fontSize: 20 }}>✕</button>
            <h2 style={{ margin: "0 0 20px" }}>⚙️ Settings</h2>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Emulator</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input value={library.settings.emulator_path} readOnly placeholder="Select emulator..." style={{ flex: 1, padding: 10, borderRadius: 8, border: "1px solid #30363D", background: "#0D1117", color: "#C9D1D9" }} />
                <button onClick={selectEmulator} style={{ padding: "10px 16px", borderRadius: 8, border: "1px solid #30363D", background: "#21262D", color: "#C9D1D9", cursor: "pointer" }}>Browse</button>
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Type</label>
              <div style={{ display: "flex", gap: 8 }}>
                {["yuzu", "ryujinx", "suyu"].map(e => <button key={e} onClick={() => saveLibrary({ ...library, settings: { ...library.settings, emulator_type: e } })} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: library.settings.emulator_type === e ? "#58A6FF" : "#21262D", color: library.settings.emulator_type === e ? "#fff" : "#C9D1D9", cursor: "pointer", textTransform: "capitalize" }}>{e}</button>)}
              </div>
            </div>
            <div>
              <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>ROM Folders</label>
              {library.settings.rom_folders.map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: 8, marginBottom: 8, borderRadius: 6, background: "#0D1117" }}>
                  <span style={{ flex: 1, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>📁 {f}</span>
                  <button onClick={() => saveLibrary({ ...library, settings: { ...library.settings, rom_folders: library.settings.rom_folders.filter((_, j) => j !== i) } })} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer" }}>🗑️</button>
                </div>
              ))}
              <button onClick={addRomFolder} style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px dashed #30363D", background: "transparent", color: "#8B949E", cursor: "pointer" }}>➕ Add Folder</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;