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

  /* ---------- 1. RÉCUPÉRATION DES DONNÉES BRUTES ---------- */
  const playlistsSheet = doc.sheetsByTitle["Playlists"];
  const playlistsRows = await playlistsSheet.getRows();

  const episodesSheet = doc.sheetsByTitle["Episodes"];
  const episodesRows = await episodesSheet.getRows();

  /* ---------- 2. TRAITEMENT DES ÉPISODES ---------- */
  // On traite les épisodes en premier pour pouvoir piocher dedans plus tard
  const episodes = episodesRows.map(r => ({
    episodeId: r.get("EpisodeID"),
    playlistId: r.get("PlaylistID"),
    title: r.get("Title"),
    audio: r.get("AudioURL") || "",
    order: Number(r.get("Order")) || 0,
    guid: r.get("Guid"),
    // On peut garder ou enlever la description ici selon tes besoins
    // description: r.get("Description") || "", 
    image: r.get("Image") || ""
  }));

  /* ---------- 3. TRAITEMENT DES PLAYLISTS (Recherche croisée) ---------- */
  const playlists = playlistsRows.map(r => {
    const pId = r.get("PlaylistID");

    // MAGIE : On cherche le premier épisode correspondant à cette playlist 
    // pour récupérer sa description (Colonne G de l'onglet Episodes)
    const firstEpMatch = episodesRows.find(epRow => epRow.get("PlaylistID") === pId);
    const descriptionFromEpisode = firstEpMatch ? firstEpMatch.get("Description") : "";

    return {
      id: pId,
      name: r.get("TitreAffichage"),
      // On utilise la description trouvée dans l'onglet Episodes
      description: descriptionFromEpisode || r.get("Description") || "",
      public: r.get("Public") === "TRUE" || r.get("Public") === true,
      season: r.get("Saison") || "Saison inconnue",
      image: r.get("Image") || (firstEpMatch ? firstEpMatch.get("Image") : "")
    };
  });

  /* ---------- 4. ÉCRITURE DES FICHIERS ---------- */
  if (!fs.existsSync("data")) fs.mkdirSync("data", { recursive: true });
  
  fs.writeFileSync("data/playlists.json", JSON.stringify(playlists, null, 2));
  fs.writeFileSync("data/episodes.json", JSON.stringify(episodes, null, 2));
  
  console.log("Les fichiers JSON ont été mis à jour avec succès ! La description a été transférée vers playlists.json.");
}

run().catch(err => {
  console.error("Erreur lors de l'exportation :", err);
  process.exit(1);
});
