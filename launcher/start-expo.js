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

let latestUrl = "";

function writeUrl(url) {
  try {
    latestUrl = url;
    fs.writeFileSync(URL_FILE, JSON.stringify({ url, ts: Date.now() }), "utf8");
  } catch (err) {
    console.error("[launcher] Failed to write Expo URL", err);
  }
}

function startExpo() {
  console.log("[launcher] Starting Expo dev server in CI tunnel mode...");
  const child = spawn(
    "npx",
    ["expo", "start", "--tunnel", "--non-interactive"],
    {
      cwd: path.join(__dirname, ".."),
      env: {
        ...process.env,
        CI: "false",
        EXPO_NO_TELEMETRY: "1",
        EXPO_USE_DEV_SERVER: "1"
      },
      stdio: ["ignore", "pipe", "pipe"]
    }
  );

  if (latestUrl) {
    writeUrl(latestUrl);
  }

  child.stdout.on("data", (buf) => {
    const line = buf.toString();
    process.stdout.write(line);
    const m = line.match(URL_REGEX);
    if (m) {
      const url = m[1];
      console.log("[launcher] Detected Expo URL:", url);
      writeUrl(url);
    }
  });

  child.stderr.on("data", (buf) => {
    const line = buf.toString();
    process.stderr.write(line);
    const m = line.match(URL_REGEX);
    if (m) {
      const url = m[1];
      console.log("[launcher] Detected Expo URL (stderr):", url);
      writeUrl(url);
    }
  });

  child.on("exit", (code) => {
    console.error("[launcher] Expo process exited with code", code, "- restarting in 5s");
    setTimeout(startExpo, 5000);
  });

  child.on("error", (error) => {
    console.error("[launcher] Failed to start Expo process:", error);
  });
}

startExpo();
