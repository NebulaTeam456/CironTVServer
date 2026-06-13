const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();

app.use(cors());

/* 🔥 ENDPOINT PRINCIPAL */
app.get("/channels", async (req, res) => {

try {

// IPTV-ORG base M3U
const url = "https://iptv-org.github.io/iptv/index.m3u";

const response = await fetch(url);
const text = await response.text();

let channels = [];
let current = null;

const lines = text.split("\n");

for (let line of lines) {

if (line.startsWith("#EXTINF")) {
current = {
name: line.split(",")[1] || "Canal sin nombre",
url: ""
};
}

else if (line.startsWith("http")) {
if (current) {
current.url = line.trim();
channels.push(current);
current = null;
}
}

}

/* limpieza básica */
channels = channels.filter(c => c.url.includes("http"));

res.json({
ok: true,
total: channels.length,
channels: channels.slice(0, 200)
});

} catch (err) {

res.json({
ok: false,
error: "Error cargando IPTV",
channels: []
});

}

});

/* 🔥 HEALTH CHECK */
app.get("/", (req, res) => {
res.send("SironTV Server activo 🚀");
});

/* 🚀 START */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
console.log("Servidor SironTV en puerto " + PORT);
});