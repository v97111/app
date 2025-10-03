import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RUNTIME_DIR = path.join(__dirname, ".runtime");
const URL_FILE = path.join(RUNTIME_DIR, "expo-url.json");
fs.mkdirSync(RUNTIME_DIR, { recursive: true });

const URL_REGEX = /(exp(?:s)?:\/\/[^\s]+|https?:\/\/(?:u\.expo\.dev|expo\.dev)[^\s]*)/i;

function parseArgs(value) {
  if (!value) return [];
  return (
    value
      .match(/(?:[^\s"]+|"[^"]*")+/g)
      ?.map((token) => token.replace(/^"|"$/g, ""))
      .filter(Boolean) ?? []
  );
}

function resolveStartArgs() {
  const explicitArgs = parseArgs(process.env.EXPO_START_ARGS);
  if (explicitArgs.length) {
    return { args: explicitArgs, label: explicitArgs.join(" ") };
  }

  const mode = (process.env.EXPO_LAUNCH_MODE || "").trim().toLowerCase();
  if (mode === "tunnel") {
    return { args: ["--tunnel"], label: "tunnel" };
  }
  if (mode === "localhost") {
    return { args: ["--localhost"], label: "localhost" };
  }
  if (mode === "lan" || mode === "lan-only") {
    return { args: ["--lan"], label: "LAN" };
  }

  return { args: ["--lan"], label: "LAN" };
}

function writeUrl(url) {
  try { fs.writeFileSync(URL_FILE, JSON.stringify({ url, ts: Date.now() }), "utf8"); } catch {}
}

function startExpo() {
  const { args: startArgs, label } = resolveStartArgs();
  console.log(
    `[launcher] Starting Expo dev server (mode: ${label || "custom"})...`
  );
  const child = spawn(
    "npx",
    ["expo", "start", ...startArgs],
    {
      cwd: path.join(__dirname, ".."), // project root (one level up)
      env: {
        ...process.env,
        CI: "1",
        EXPO_NO_TELEMETRY: "1",
        EXPO_USE_DEV_SERVER: "1"
      },
      stdio: ["ignore", "pipe", "pipe"]
    }
  );

  child.stdout.on("data", (buf) => {
    const line = buf.toString();
    process.stdout.write(line);
    const m = line.match(URL_REGEX);
    if (m) { const url = m[1]; console.log("[launcher] Detected Expo URL:", url); writeUrl(url); }
  });

  child.stderr.on("data", (buf) => {
    const line = buf.toString();
    process.stderr.write(line);
    const m = line.match(URL_REGEX);
    if (m) { const url = m[1]; console.log("[launcher] Detected Expo URL (stderr):", url); writeUrl(url); }
  });

  child.on("exit", (code) => {
    console.error("[launcher] Expo process exited with code", code, "- restarting in 5s");
    setTimeout(startExpo, 5000);
  });
}

startExpo();
