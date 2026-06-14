const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

const M3U_URL = "https://iptv-org.github.io/iptv/countries/ar.m3u";

app.use(cors({
   origin: "*",
   methods: ["GET"]
}));

/* ======================
   🧹 LIMPIAR NOMBRE
========================= */
function cleanName(raw) {

  if (!raw) return null;

  let name = raw
    .replace(/\[.*?\]/g, "")
    .replace(/\(.*?\)/g, "")
    .replace(/group-title=.*?,/gi, "")
    .replace(/tvg-id=".*?"/gi, "")
    .replace(/tvg-name=".*?"/gi, "")
    .replace(/tvg-logo=".*?"/gi, "")
    .replace(/Mozilla|Chrome|Safari|Gecko|VLC/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  return name;
}

/* =========================
   🚫 DETECTAR BASURA
========================= */
function isTrashChannel(name) {

  if (!name) return true;

  const badWords = [
    "group",
    "title",
    "test",
    "demo",
    "mobile",
    "móviles",
    "112",
    "playlist",
    "proxy",
    "user-agent",
    "gecko",
    "chrome",
    "safari"
  ];

  const lower = name.toLowerCase();

  return badWords.some(w => lower.includes(w));
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
      const name = cleanName(rawName);

      current = {
        name,
        url: ""
      };
    }

    else if (line.startsWith("http")) {

      if (current) {

        current.url = line;

        // 🔥 SOLO agrega si NO es basura
        if (!isTrashChannel(current.name)) {
          channels.push(current);
        }

        current = null;
      }
    }
  }

  return channels;
}

/* =========================
   🚀 API
========================= */
app.get("/channel", async (req, res) => {

  try {

    console.log("📡 Cargando M3U...");

    const response = await fetch(M3U_URL);
    const text = await response.text();

    const channels = parseM3U(text);

    console.log("✔ Canales limpios:", channels.length);

    res.json(channels);

  } catch (err) {

    console.log("❌ ERROR:", err);

    res.status(500).json({ error: "Error cargando IPTV" });
  }
});

/* =========================
   🟢 START
========================= */
app.listen(PORT, () => {
  console.log("🚀 Server corriendo en puerto", PORT);
});
