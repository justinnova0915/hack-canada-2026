
# Pocket Pilot

Pocket Pilot is a mobile expense tracker built with Expo + React Native.  
It helps users centralize spending by turning receipt photos into structured transactions with AI.

## Why Pocket Pilot

Most spending data is fragmented across cards, Apple Wallet, and bank apps. Pocket Pilot creates one place to:

- Capture expenses quickly
- Categorize spending automatically
- Review history and trends
- Compare spending against income

## Core Features

- Camera/gallery receipt upload
- AI extraction of merchant, items, totals, category, and payment details
- Verify and edit transaction details before saving
- History page with searchable transaction logs
- Stats dashboard with spending breakdowns
- Map view with pins for transactions that include valid coordinates
- Profile page with monthly income input and spending progress

## Tech Stack


- **Frontend:** Expo, React Native, Expo Router
- **Backend:** Node.js, Express
- **Database/Auth:** Firebase Auth + Firestore
- **Services:** Custom API layer and receipt/stat aggregation services

## Project Structure

- `app/(tabs)/index.tsx` — Home flow (capture, analyze, verify, log)
- `app/(tabs)/history.tsx` — Searchable transaction ledger
- `app/(tabs)/stats.tsx` — Expense analytics and charts
- `app/(tabs)/map.tsx` — Transaction location pins
- `app/(tabs)/profile.tsx` — Account + budgeting UI
- `services/` — API calls, receipt logging, spend stats
- `backend/` — AI pipeline and API endpoints

## Environment Setup

Create two env files.

### 1) Frontend `.env` (project root)

```env
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
EXPO_PUBLIC_WEB_CLIENT_ID=
EXPO_PUBLIC_API_BASE_URL=
```

### 2) Backend `backend/.env`

Add your backend/API secrets and pipeline configuration values.

## Getting Started

Install frontend dependencies:

```bash
npm install
```

Start the frontend:

```bash
npx expo start
```

Start the backend:

```bash
cd backend
npm install
npm run dev
```

## Running on Devices

Run on the same local network:

```bash
npx expo start --lan
```

Use tunnel mode if the local network does not work:

```bash
npx expo start --tunnel
```

Clear Metro cache if the bundler behaves unexpectedly:

```bash
npx expo start -c
```

## Demo Flow (Quick)

```
1. Open the Home tab
2. Take a receipt photo or select one from the gallery
3. The AI analyzes and extracts transaction data
4. Review and edit the extracted details
5. Tap Verify & Log
6. Confirm the transaction in the History tab
7. View spending insights in Stats and location pins in Map
```

## Current State

Pocket Pilot is a working prototype with end-to-end receipt capture, AI parsing, transaction storage, and multi-tab analysis views. The current build focuses on fast receipt logging and centralized spending visibility.

## Future Improvements

```
- Better recurring and subcategory detection (subscriptions, debt, essentials)
- Stronger AI budgeting advice engine
- Improved geolocation capture for map insights
- Export and share monthly spending reports
```
```
