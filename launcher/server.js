import express from "express";
import path from "path";
import { fileURLToPath } from "url";

import {
  getExpoStatus,
  getExpoUrl,
  isExpoRunning,
  onExpoUrlUpdate,
  startExpo,
} from "./start-expo.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

let currentExpoUrl = getExpoUrl() || process.env.EXPO_URL || "";
let statusPollTimer = null;

function normalizeExpoUrl(value) {
  if (typeof value !== "string") {
    return null;
  }
  const match = value.match(/(exp:\/\/[^\s]+|https?:\/\/[^\s]+expo\.[^\s]+)/i);
  return match ? match[0] : null;
}

function searchForExpoUrl(data) {
  if (!data || typeof data !== "object") {
    return null;
  }

  const values = Array.isArray(data) ? data : Object.values(data);
  for (const value of values) {
    if (!value) continue;
    if (typeof value === "string") {
      const url = normalizeExpoUrl(value);
      if (url) return url;
    } else if (typeof value === "object") {
      const nested = searchForExpoUrl(value);
      if (nested) return nested;
    }
  }
  return null;
}

async function refreshExpoUrlFromStatus() {
  try {
    const status = await getExpoStatus();
    if (!status) return;
    const discovered = searchForExpoUrl(status);
    if (discovered && discovered !== currentExpoUrl) {
      currentExpoUrl = discovered;
      console.log(`[launcher] Expo status reported URL: ${discovered}`);
    }
  } catch (error) {
    console.warn("[launcher] Unable to read Expo status:", error);
  }
}

function beginStatusPolling() {
  if (statusPollTimer) return;
  statusPollTimer = setInterval(() => {
    if (currentExpoUrl) return;
    refreshExpoUrlFromStatus();
  }, Number(process.env.EXPO_STATUS_POLL_INTERVAL || 10000));
  if (typeof statusPollTimer.unref === "function") {
    statusPollTimer.unref();
  }
}

onExpoUrlUpdate((url) => {
  currentExpoUrl = url;
});

async function ensureExpoDevServer() {
  try {
    const alreadyRunning = await isExpoRunning();
    if (alreadyRunning) {
      console.log("[launcher] Found existing Expo dev server instance.");
      await refreshExpoUrlFromStatus();
      return;
    }

    console.log("[launcher] Starting Expo dev server (tunnel mode)...");
    startExpo();
    await refreshExpoUrlFromStatus();
  } catch (error) {
    console.error("[launcher] Failed to start Expo dev server:", error);
  }
}

ensureExpoDevServer().catch((error) => {
  console.error("[launcher] Unexpected error while ensuring Expo server:", error);
});

beginStatusPolling();

// Serve static assets (index.html and client js)
app.use(express.static(path.join(__dirname, "public")));

app.get("/health", (_req, res) => res.json({ ok: true }));

// Inject EXPO_URL into the page at runtime if needed
app.get("/config.js", (_req, res) => {
  res.setHeader("Content-Type", "application/javascript");
  const fallbackUrl = process.env.EXPO_URL || "";
  const resolvedUrl = currentExpoUrl || fallbackUrl;
  res.end(`window.__EXPO_URL__ = ${JSON.stringify(resolvedUrl)};`);
});

app.listen(PORT, () => {
  console.log("Launcher listening on port", PORT);
});
