const express = require("express");
const fetch = require("node-fetch");

const app = express();
const PORT = process.env.PORT || 3000;

/* =========================
   🧠 URL BASE IPTV
========================= */
const M3U_URL = "https://iptv-org.github.io/iptv/countries/ar.m3u";
// ⚠️ reemplazá por tu URL real si cambia

/* =========================
   🧹 LIMPIAR NOMBRES
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
   🌍 FILTRO ARGENTINA
========================= */
function isArgentinaChannel(text = "", url = "") {

  const t = (text + url).toLowerCase();

  return (
    t.includes("argentina") ||
    t.includes("arg") ||
    t.includes("latam") ||
    t.includes("esp") ||
    t.includes("español")
  );
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

    if (line.startsWith("#EXTINF")) {

      const rawName = line.split(",")[1] || "";

      current = {
        name: cleanName(rawName),
        url: ""
      };
    }

    else if (line.startsWith("http")) {

      if (current) {
        current.url = line;

        // 🔥 filtro Argentina
        if (isArgentinaChannel(current.name, current.url)) {
          channels.push(current);
        }

        current = null;
      }
    }
  }

  return channels;
}

/* =========================
   🚀 ENDPOINT PRINCIPAL
========================= */
app.get("/channel", async (req, res) => {

  try {

    console.log("📡 Descargando M3U...");

    const response = await fetch(M3U_URL);
    const text = await response.text();

    console.log("🧠 Parseando...");

    const channels = parseM3U(text);

    console.log("✔ Canales:", channels.length);

    res.json(channels);

  } catch (err) {

    console.log("❌ ERROR:", err);

    res.status(500).json({
      error: "No se pudo cargar playlist"
    });
  }
});

/* =========================
   🟢 START SERVER
========================= */
app.listen(PORT, () => {
  console.log("🚀 Server corriendo en puerto", PORT);
});
