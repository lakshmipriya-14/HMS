# Kizuna HMS — Local Development & Environment Setup Guide

Follow this guide to get the Kizuna Multispeciality Hospital Management System running locally from a clean clone.

---

## 1. Prerequisites

- **Node.js** 22 or later
- **Package manager** `pnpm@12.21.0`
- **Database** PostgreSQL 15 or later running locally
- **Mobile Development (Optional)**: Expo Go app on iOS/Android or Android Studio Emulator

---

## 2. Environment and database

Create the local `uyirinai_hms_team` database and configure the root `.env` using the [team database setup guide](DATABASE_SETUP.md#shared-team-database-and-demo-logins). Then run these commands from the repository root:

```powershell
pnpm install --frozen-lockfile
pnpm db:team:setup
pnpm build:packages
```

## 3. Running Applications

### Run Full Stack (Backend API + Web Dashboard concurrently)
```bash
pnpm dev
```
- **Web Application**: `http://localhost:3000`
- **Backend REST API**: `http://localhost:4000/api/v1`
- **Interactive Swagger Docs**: `http://localhost:4000/api/docs`

### Run the Android app

Mobile uses the same API and PostgreSQL database as the web dashboard. Follow the [team database setup](DATABASE_SETUP.md#shared-team-database-and-demo-logins) once. The mobile app connects to the API, so PostgreSQL credentials belong only in the server configuration.

If the API is already running on port 4000, keep it running. Otherwise, start it from the repository root with `pnpm dev:api`. In a separate terminal at the repository root, start Expo with `pnpm dev:mobile`.

- **Android emulator**. Start the emulator in Android Studio, then press `a` in the Expo terminal. The app defaults to `http://10.0.2.2:4000/api/v1`. Use [Expo Go for SDK 52](https://expo.dev/go?sdkVersion=52&platform=android&device=false).
- **Physical Android phone**. Connect your phone and PC to the same Wi-Fi. In the terminal where you start Expo, set `$env:EXPO_PUBLIC_API_URL = "http://YOUR_PC_WIFI_IP:4000/api/v1"` before running `pnpm dev:mobile`. Find the address using `ipconfig` and scan the Expo QR code with [Expo Go for SDK 52 on Android](https://expo.dev/go?sdkVersion=52&platform=android&device=true). The API must be reachable from the phone. Set `API_HOST=0.0.0.0` in the server's local environment for LAN testing.

Use a [team demo login](DATABASE_SETUP.md#shared-team-database-and-demo-logins). The initial password is `UyirinaiTeamDemo!24`.

### Run the web app separately

Run `pnpm dev:web` with the API running, then open `http://localhost:3000`.
