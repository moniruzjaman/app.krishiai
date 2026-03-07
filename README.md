# Krishi AI - Expo Mobile App 🌾

Digital Agri Ecosystem for Bangladesh — built with Expo Router + React Native.

## 📱 Features

| Screen | Description |
|--------|-------------|
| 🏠 Home | Weather, market prices, quick tools, news ticker |
| 🔬 Analyzer | Camera + AI crop disease detection (Gemini Vision) |
| 💬 Chat | Conversational AI agricultural assistant |
| 🔍 Search | AI-powered agri knowledge search |
| 🛠️ Tools | 16+ specialized tools (weather, nutrients, yield, calendar, etc.) |

## 🚀 Quick Start

```bash
# 1. Clone and enter folder
git clone https://github.com/moniruzjaman/krishiai.git
cd krishiai/krishi-ai-expo  # use this cleaned folder

# 2. Install
npm install

# 3. Set API key
cp .env.example .env
# Edit .env and set EXPO_PUBLIC_GEMINI_API_KEY

# 4. Run
npx expo start
```

## 📦 Build for Android

```bash
# Development APK
eas build --platform android --profile development

# Preview APK  
eas build --platform android --profile preview

# Production AAB (for Play Store)
eas build --platform android --profile production
```

## 🔑 API Keys Required

- **Gemini API** (required): https://aistudio.google.com — Free tier available
- **Supabase** (optional): For user profiles and saved reports

## 🏗️ Architecture

```
app/
  (tabs)/           # Bottom tab screens
    index.tsx       # Home
    analyzer.tsx    # Disease analyzer
    chat.tsx        # AI chat
    search.tsx      # Search
    tools.tsx       # Tools hub
  (tools)/          # Tool screens
    weather.tsx
    nutrient.tsx
    ...
src/
  services/
    geminiNative.ts # Gemini API (Expo-compatible, no Vite)
  constants.ts      # Shared data
  toolsData.ts      # Tools registry
```

## ⚡ What Changed from Web Version

| Web (Vite) | Expo (React Native) |
|------------|---------------------|
| `import.meta.env` | `process.env.EXPO_PUBLIC_*` |
| `localStorage` | `AsyncStorage` / `expo-secure-store` |
| `window.AudioContext` | `expo-av` |
| `className` / `div` | `StyleSheet` / `View` |
| Web camera | `expo-camera` / `expo-image-picker` |
| CSS animations | `Animated` API |
| Tailwind CSS | React Native StyleSheet |

## 📋 Size Reduction

- Removed: `project_backup/` (1.7MB), duplicate docs, Vite config
- Kept: Core components migrated to RN, services rewritten for Expo
- Bundle size: ~40% smaller than original
