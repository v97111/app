import { spawn } from "child_process";
import { EventEmitter } from "events";
import fs from "fs";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const expoEvents = new EventEmitter();
let expoProcess = null;
let latestExpoUrl = process.env.EXPO_URL || "";

const EXPO_PORT = Number(process.env.EXPO_PORT || 8081);
const PID_FILE = path.join(__dirname, ".expo-process.json");

function requestExpoStatus() {
  return new Promise((resolve) => {
    const request = http.get(
      {
        hostname: "127.0.0.1",
        port: EXPO_PORT,
        path: "/status",
        timeout: 2000,
      },
      (res) => {
        let raw = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          raw += chunk;
        });
        res.on("end", () => {
          if (!raw) {
            resolve({ ok: res.statusCode === 200, data: null });
            return;
          }
          try {
            const parsed = JSON.parse(raw);
            resolve({ ok: res.statusCode === 200, data: parsed });
          } catch (error) {
            resolve({ ok: res.statusCode === 200, data: null });
          }
        });
      }
    );

    request.on("error", () => resolve({ ok: false, data: null }));
    request.on("timeout", () => {
      request.destroy();
      resolve({ ok: false, data: null });
    });
  });
}

function parseExpoUrl(text) {
  const matches = text.match(/(exp:\/\/[^\s]+|https?:\/\/[^\s]+expo\.[^\s]+)/i);
  if (!matches) {
    return;
  }
  const [match] = matches;
  if (match && match !== latestExpoUrl) {
    latestExpoUrl = match.trim();
    expoEvents.emit("url", latestExpoUrl);
    console.log(`[launcher] Expo tunnel URL detected: ${latestExpoUrl}`);
  }
}

function logStream(stream, prefix) {
  if (!stream) return;
  stream.on("data", (chunk) => {
    const text = chunk.toString();
    text.split(/\r?\n/).forEach((line, index, arr) => {
      if (!line && index === arr.length - 1) return;
      console.log(`${prefix}${line}`);
    });
    parseExpoUrl(text);
  });
}

function logErrorStream(stream, prefix) {
  if (!stream) return;
  stream.on("data", (chunk) => {
    const text = chunk.toString();
    text.split(/\r?\n/).forEach((line, index, arr) => {
      if (!line && index === arr.length - 1) return;
      console.error(`${prefix}${line}`);
    });
  });
}

function processExists(pid) {
  if (!pid) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return false;
  }
}

export function getRecordedExpoProcess() {
  try {
    const raw = fs.readFileSync(PID_FILE, "utf8");
    const data = JSON.parse(raw);
    if (data?.pid && processExists(data.pid)) {
      return data.pid;
    }
  } catch (error) {
    // ignore read errors
  }
  return null;
}

function recordExpoProcess(pid) {
  if (!pid) return;
  try {
    fs.writeFileSync(PID_FILE, JSON.stringify({ pid }), "utf8");
  } catch (error) {
    console.error("[launcher] Failed to persist Expo process PID:", error);
  }
}

function clearRecordedProcess() {
  try {
    if (fs.existsSync(PID_FILE)) {
      fs.unlinkSync(PID_FILE);
    }
  } catch (error) {
    console.error("[launcher] Failed to remove Expo process record:", error);
  }
}

export function startExpo(options = {}) {
  const { detached = false, force = false } = options;

  if (!force && expoProcess && !expoProcess.killed) {
    return expoProcess;
  }

  if (!force) {
    const recordedPid = getRecordedExpoProcess();
    if (recordedPid) {
      console.log(
        `[launcher] Detected running Expo process with PID ${recordedPid}. Skipping new spawn.`
      );
      return expoProcess;
    }
  }

  const projectRoot = path.resolve(__dirname, "..", "");

  const child = spawn("npx", ["expo", "start", "--tunnel"], {
    cwd: projectRoot,
    env: { ...process.env },
    stdio: detached ? "inherit" : ["ignore", "pipe", "pipe"],
    shell: false,
    detached,
  });

  recordExpoProcess(child.pid);

  child.on("error", (error) => {
    console.error("[launcher] Expo process error:", error);
  });

  child.on("exit", (code, signal) => {
    expoProcess = null;
    clearRecordedProcess();
    if (code === 0) {
      console.log("[launcher] Expo process exited cleanly.");
    } else {
      console.error(
        `[launcher] Expo process exited with code ${code}${signal ? ` (signal ${signal})` : ""}.`
      );
    }
  });

  if (detached) {
    try {
      child.unref();
    } catch (error) {
      console.error("[launcher] Failed to detach Expo process:", error);
    }
  } else {
    logStream(child.stdout, "[expo] ");
    logErrorStream(child.stderr, "[expo] ");
  }

  expoProcess = child;
  return child;
}

export function getExpoUrl() {
  return latestExpoUrl;
}

export function onExpoUrlUpdate(listener) {
  expoEvents.on("url", listener);
  if (latestExpoUrl) {
    listener(latestExpoUrl);
  }
  return () => expoEvents.off("url", listener);
}

export async function isExpoRunning() {
  if (getRecordedExpoProcess()) {
    return true;
  }

  const status = await requestExpoStatus();
  return status.ok;
}

export async function getExpoStatus() {
  const status = await requestExpoStatus();
  return status.data || null;
}

if (process.argv[1] === __filename) {
  const runningCheck = await isExpoRunning();
  if (runningCheck) {
    console.log("[launcher] Expo dev server already running. Skipping new spawn.");
  } else {
    console.log("[launcher] Starting Expo dev server in detached mode...");
    startExpo({ detached: true, force: true });
  }
}
