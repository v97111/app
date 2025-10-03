# app

[Edit in StackBlitz next generation editor ⚡️](https://stackblitz.com/~/github.com/v97111/app)

### 🚀 Railway Launcher (Expo Go)
This repo includes a minimal web launcher you can deploy to Railway. It shows a QR code and an "Open in Expo Go" button.

**Deploy**
- Click "New Project" on Railway and connect this repo.
- Railway now boots both the Expo Metro server **and** this launcher page. No separate tunnel step is required.
- After deploy, review the logs to confirm that the Expo tunnel URL is detected (or set the **EXPO_URL** env var manually as a fallback).
- Redeploy; visit the Railway URL to see the QR and button.

**Where do I get EXPO_URL?**
- Development (tunnel): run `npx expo start --tunnel` locally → copy the "Expo Go" link shown in the CLI/DevTools and paste it into Railway as EXPO_URL (only needed if automatic detection fails).
- Published (EAS Update or classic publish): use your project page, e.g. `https://expo.dev/@ACCOUNT/SLUG?service=expo-go`.
- Direct deep link format also works (exp:// or exps://) if provided by Expo.

**Notes**
- Railway now serves the launcher page **and** runs the Expo Metro dev server through `npx expo start --tunnel`. Scan the QR code on the Railway page to open the live tunnel.
- If the Expo CLI cannot emit a tunnel URL automatically (for example, if tunnels are disabled), set the **EXPO_URL** environment variable and the launcher will fall back to it.
- Make sure your phone has **Expo Go** installed.
