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

function readRuntimeFile() {
  try {
    if (!fs.existsSync(RUNTIME_URL_FILE)) return null;
    const data = JSON.parse(fs.readFileSync(RUNTIME_URL_FILE, "utf8"));
    const url = typeof data?.url === "string" ? data.url.trim() : "";
    if (!url) return null;
    return { url, source: "runtime", updated: data?.ts ?? null };
  } catch (err) {
    console.warn("Failed to read Expo runtime URL", err);
    return null;
  }
}

function resolveExpoUrl() {
  const runtime = readRuntimeFile();
  if (runtime) return runtime;

  const envUrl = typeof process.env.EXPO_URL === "string" ? process.env.EXPO_URL.trim() : "";
  if (envUrl) {
    return { url: envUrl, source: "env", updated: null };
  }

  return { url: "", source: "none", updated: null };
}

app.use(express.static(PUBLIC_DIR));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/config.js", (_req, res) => {
  const info = resolveExpoUrl();
  res.setHeader("Content-Type", "application/javascript");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.end(
    `window.__EXPO_CONFIG__ = ${JSON.stringify(info)}; window.__EXPO_URL__ = ${JSON.stringify(info.url)};`
  );
});

app.get("/runtime.json", (_req, res) => {
  const info = resolveExpoUrl();
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.json(info);
});

app.listen(PORT, () => {
  console.log("Launcher listening on port", PORT);
});
