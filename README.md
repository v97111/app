# app

[Edit in StackBlitz next generation editor ⚡️](https://stackblitz.com/~/github.com/v97111/app)

### 🚀 Railway Launcher (Expo Go)
This repo includes a minimal web launcher you can deploy to Railway. It shows a QR code and an "Open in Expo Go" button.

**Deploy**
- Click "New Project" on Railway and connect this repo.
- After deploy, set the environment variable **EXPO_URL** to your Expo deep link or project page URL (examples below).
- Redeploy; visit the Railway URL to see the QR and button.

**Where do I get EXPO_URL?**
- Development (tunnel): run `npx expo start --tunnel` locally → copy the "Expo Go" link shown in the CLI/DevTools and paste it into Railway as EXPO_URL.
- Published (EAS Update or classic publish): use your project page, e.g. `https://expo.dev/@ACCOUNT/SLUG?service=expo-go`.
- Direct deep link format also works (exp:// or exps://) if provided by Expo.

**Notes**
- Railway serves only the launcher page; it does not run Metro. Your device connects to Expo’s servers or your tunnel via EXPO_URL.
- Make sure your phone has **Expo Go** installed.

