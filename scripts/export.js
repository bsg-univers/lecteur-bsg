import fs from "fs";
import { GoogleSpreadsheet } from "google-spreadsheet";

const doc = new GoogleSpreadsheet(process.env.GSHEET_ID);

await doc.useServiceAccountAuth({
  client_email: process.env.GSERVICE_EMAIL,
  private_key: process.env.GSERVICE_KEY.replace(/\\n/g, "\n"),
});

await doc.loadInfo();

/* ---------- PLAYLISTS ---------- */
const playlistsSheet = doc.sheetsByTitle["Playlists"];
const playlistsRows = await playlistsSheet.getRows();

const playlists = playlistsRows.map(r => ({
  id: r.PlaylistID,
  name: r.PlaylistID,
  description: r.Description || "",
  public: r.Public === "TRUE" || r.Public === true,
  season: r.Saison || "Saison inconnue",
  image: r.Image || ""
}));

/* ---------- EPISODES ---------- */
const episodesSheet = doc.sheetsByTitle["Episodes"];
const episodesRows = await episodesSheet.getRows();

const episodes = episodesRows.map(r => ({
  playlistId: r.PlaylistID,
  order: Number(r.Order),
  title: r.Title,
  guid: r.Guid,
  audio: r.AudioURL || "",
  description: r.Description || "",
  image: r.Image || ""
}));

fs.mkdirSync("data", { recursive: true });
fs.writeFileSync("data/playlists.json", JSON.stringify(playlists, null, 2));
fs.writeFileSync("data/episodes.json", JSON.stringify(episodes, null, 2));
