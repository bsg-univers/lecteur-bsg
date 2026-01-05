import fs from "fs";
import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";

const serviceAccountAuth = new JWT({
  email: process.env.GSERVICE_EMAIL,
  key: process.env.GSERVICE_KEY.replace(/\\n/g, "\n"),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const doc = new GoogleSpreadsheet(process.env.GSHEET_ID, serviceAccountAuth);

async function run() {
  await doc.loadInfo();

  /* ---------- PLAYLISTS ---------- */
  // Onglet "Playlists"
  const playlistsSheet = doc.sheetsByTitle["Playlists"];
  const playlistsRows = await playlistsSheet.getRows();

  const playlists = playlistsRows.map(r => ({
    // On utilise r.get('Nom Exact') pour éviter les erreurs avec les colonnes vides ou doublées
    id: r.get("PlaylistID"), 
    name: r.get("PlaylistID"), 
    description: r.get("Description") || "",
    public: r.get("Public") === "TRUE" || r.get("Public") === true,
    season: r.get("Saison") || "Saison inconnue", // L'en-tête est bien "Saison"
    image: r.get("Image") || ""
  }));

  /* ---------- EPISODES ---------- */
  // Onglet "Episodes"
  const episodesSheet = doc.sheetsByTitle["Episodes"];
  const episodesRows = await episodesSheet.getRows();

  const episodes = episodesRows.map(r => ({
    episodeId: r.get("EpisodeID"),
    playlistId: r.get("PlaylistID"),
    title: r.get("Title"),
    audio: r.get("AudioURL") || "",
    order: Number(r.get("Order")) || 0,
    guid: r.get("Guid"),
    description: r.get("Description") || "",
    image: r.get("Image") || ""
  }));

  // Création du dossier data si inexistant et écriture des fichiers
  if (!fs.existsSync("data")) fs.mkdirSync("data", { recursive: true });
  fs.writeFileSync("data/playlists.json", JSON.stringify(playlists, null, 2));
  fs.writeFileSync("data/episodes.json", JSON.stringify(episodes, null, 2));
  
  console.log("Les fichiers JSON ont été mis à jour avec succès dans le dossier data/ !");
}

run().catch(err => {
  console.error("Erreur lors de l'exportation :", err);
  process.exit(1);
});
