const express = require("express");
const fetch = require("node-fetch");

const app = express();
const PORT = process.env.PORT || 3000;

/* =========================
   📡 URL IPTV (TU FUENTE)
========================= */
const M3U_URL = "https://iptv-org.github.io/iptv/countries/ar.m3u";
// 🔥 pon aquí tu URL real si es otra

/* =========================
   🧹 LIMPIAR SOLO NOMBRES
   (NO BORRA CANALES)
========================= */
function cleanName(raw) {

  if (!raw) return "Sin nombre";

  return raw
    .replace(/\[.*?\]/g, "")
    .replace(/\(.*?\)/g, "")
    .replace(/group-title=.*?,/gi, "")
    .replace(/tvg-id=".*?"/gi, "")
    .replace(/tvg-name=".*?"/gi, "")
    .replace(/tvg-logo=".*?"/gi, "")
    .replace(/Mozilla|Chrome|Safari|Gecko|AppleWebKit|VLC/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

/* =========================
   📡 PARSE M3U
========================= */
function parseM3U(m3uText) {

  const lines = m3uText.split("\n");

  const channels = [];
  let current = null;

  for (let line of lines) {

    line = line.trim();

    // 🧠 Detecta info del canal
    if (line.startsWith("#EXTINF")) {

      const rawName = line.split(",")[1] || "";

      current = {
        name: cleanName(rawName),
        url: ""
      };
    }

    // 🌐 URL del stream
    else if (line.startsWith("http")) {

      if (current) {
        current.url = line;

        // ✔ SIEMPRE lo agrega (NO FILTRA NADA)
        channels.push(current);

        current = null;
      }
    }
  }

  return channels;
}

/* =========================
   🚀 API /channel
========================= */
app.get("/channel", async (req, res) => {

  try {

    console.log("📡 Descargando M3U...");

    const response = await fetch(M3U_URL);
    const text = await response.text();

    console.log("🧠 Parseando M3U...");

    const channels = parseM3U(text);

    console.log("✔ Total canales:", channels.length);

    res.json(channels);

  } catch (err) {

    console.log("❌ ERROR SERVER:", err);

    res.status(500).json({
      error: "No se pudo cargar la playlist"
    });
  }
});

/* =========================
   🟢 START SERVER
========================= */
app.listen(PORT, () => {
  console.log("🚀 Server corriendo en puerto", PORT);
});
