const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();
app.use(cors());

/* =========================
   🧠 PARSER M3U → JSON
========================= */
function parseM3U(text) {

  const lines = text.split("\n");

  const channels = [];

  let current = null;

  for (let line of lines) {

    line = line.trim();

    // nombre del canal
    if (line.startsWith("#EXTINF")) {

      const nameMatch = line.split(",")[1];

      current = {
        name: nameMatch || "Sin nombre",
        url: ""
      };
    }

    // URL del stream
    else if (line.startsWith("http")) {

      if (current) {
        current.url = line;

        channels.push(current);
        current = null;
      }
    }
  }

  return channels;
}

/* =========================
   📡 CARGAR IPTV-ORG (ARGENTINA)
========================= */
async function loadArgentinaChannels() {

  const url = "https://iptv-org.github.io/iptv/countries/ar.m3u";

  const res = await fetch(url);
  const text = await res.text();

  let channels = parseM3U(text);

  // limpieza básica
  channels = channels.filter(c =>
    c.name &&
    c.url &&
    c.url.startsWith("http")
  );

  return channels;
}

/* =========================
   🚀 ENDPOINT PRINCIPAL
========================= */
app.get("/channel", async (req, res) => {

  try {

    const country = req.query.country;

    let channels = await loadArgentinaChannels();

    // 🇦🇷 filtro (por si quieres mantenerlo flexible)
    if (country) {

      if (country.toLowerCase() === "ar") {
        // ya viene filtrado desde IPTV-org
        channels = channels;
      } else {
        channels = [];
      }
    }

    res.json(channels);

  } catch (err) {
    console.error("ERROR IPTV:", err);
    res.json([]);
  }
});

/* =========================
   HEALTH CHECK
========================= */
app.get("/", (req, res) => {
  res.send("SironTV Server OK 🚀");
});

/* =========================
   START
========================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
