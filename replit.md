# Lovat Collection

## Overview
A React Native / Expo mobile app for FRC (FIRST Robotics Competition) scouting data collection. Built with Expo SDK 54, expo-router for navigation, and designed primarily for iOS and Android with web support.

## Recent Changes
- 2026-02-22: Initial Replit setup, installed Node.js 22, npm dependencies, react-native-web, removed deprecated babel plugin (expo-router/babel)

## Project Architecture
- **Framework**: Expo SDK 54 with expo-router (file-based routing)
- **Language**: TypeScript
- **State Management**: Zustand + Jotai
- **Styling**: React Native StyleSheet with react-native-web for web
- **Navigation**: expo-router (Stack-based)
- **Storage**: AsyncStorage
- **Key Libraries**: react-native-gesture-handler, react-native-reanimated, react-native-svg, qrcode, react-native-keyboard-controller

## Directory Structure
- `app/` - Screen components (file-based routing via expo-router)
  - `_layout.tsx` - Root layout with font loading and providers
  - `index.tsx` - Entry point with onboarding redirect
  - `game/` - Game/match scouting screens
  - `history/` - Match history screens
  - `onboarding/` - Onboarding flow
  - `settings/` - Settings screens
  - `set-url/` - URL configuration
- `lib/` - Business logic, utilities, stores
- `assets/` - Images, fonts, SVG components
- `components/` - Reusable UI components

## Environment Variables
- `EXPO_PUBLIC_API_URL` - Backend API URL (see `.env.example`)

## Development
- Run: `npx expo start --web --port 5000 --host localhost`
- The app is primarily a mobile app; the web version has limited functionality

## Deployment
- Export: `npx expo export --platform web`
- Serve: `npx expo serve --port 5000`
