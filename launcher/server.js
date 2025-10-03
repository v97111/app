import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static assets (index.html and client js)
app.use(express.static(path.join(__dirname, "public")));

app.get("/health", (_req, res) => res.json({ ok: true }));

// Inject EXPO_URL into the page at runtime if needed
app.get("/config.js", (_req, res) => {
  res.setHeader("Content-Type", "application/javascript");
  const EXPO_URL = process.env.EXPO_URL || "";
  res.end(`window.__EXPO_URL__ = ${JSON.stringify(EXPO_URL)};`);
});

app.listen(PORT, () => {
  console.log("Launcher listening on port", PORT);
});
