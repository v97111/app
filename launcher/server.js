import express from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

const PUBLIC_DIR = path.join(__dirname, "public");
const RUNTIME_URL_FILE = path.join(__dirname, ".runtime", "expo-url.json");

app.use(express.static(PUBLIC_DIR));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/config.js", (_req, res) => {
  res.setHeader("Content-Type", "application/javascript");
  let url = process.env.EXPO_URL || "";
  try {
    if (fs.existsSync(RUNTIME_URL_FILE)) {
      const data = JSON.parse(fs.readFileSync(RUNTIME_URL_FILE, "utf8"));
      if (data && data.url) {
        url = data.url;
      }
    }
  } catch (error) {
    console.warn("[launcher] Failed to read Expo runtime URL:", error);
  }
  res.end(`window.__EXPO_URL__ = ${JSON.stringify(url)};`);
});

app.listen(PORT, () => {
  console.log("Launcher listening on port", PORT);
});
