# CLAUDE.md

## Project Overview
Chrome browser extension template using Manifest V3. Generic starter for building various browser extensions with React popups, options pages, background service workers, and content scripts.

## Tech Stack
- Chrome Extension Manifest V3
- TypeScript
- React 18
- Tailwind CSS
- Webpack 5
- Vitest for testing

## Commands
- `npm run dev` - Build in watch mode for development
- `npm run build` - Production build
- `npm run test` - Run Vitest unit tests
- `npm run lint` - Run ESLint
- `npm run format` - Run Prettier

## Architecture
- Popup: React app rendered in extension popup
- Options: React app for extension settings page
- Background: Service worker for event handling and API calls
- Content: Scripts injected into web pages
- Shared: Common types, storage helpers, and messaging utilities

## Code Conventions
- Use named exports for all modules
- Keep popup and options as thin UI layers
- Business logic goes in background service worker
- Use chrome.storage.sync for user settings
- Use chrome.runtime.sendMessage for communication between contexts
- All types defined in src/shared/types.ts

## Important
- Never include API keys in content scripts (they're visible to page)
- Test on Chrome with developer mode enabled
- Load unpacked from the `dist/` directory
- Icons are placeholders - replace before publishing
