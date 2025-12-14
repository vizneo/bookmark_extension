# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

MyBookmarkSession is a Chrome Manifest V3 browser extension built with React that transfers browser sessions between browsers. The extension uses a service worker background script to interact with Chrome's APIs for saving and restoring tab sessions as JSON files.

## Architecture

### Build System
The project uses Webpack 5 with separate development and production configurations:
- **Entry points**: Two separate bundles are generated:
  - `main.js` - React UI popup (entry: `src/index.js`)
  - `background.js` - Chrome service worker (entry: `src/Core/background.js`)
- **Webpack configs** are in `webpack/`:
  - `webpack.common.js` - Shared configuration
  - `webpack.dev.js` - Development with hot reload
  - `webpack.prod.js` - Production build
- Build output goes to `build/` directory which is loaded as an unpacked extension

### Component Structure
- **Core**: `src/Core/` contains the main App component and background service worker
- **Pages**: `src/components/Pages/` contains feature components:
  - `SaveTabs/` - Saves current browser tabs to JSON
  - `RestoreSession/` - Restores tabs from uploaded JSON
  - `About/` - Information page
- **Shared**: `src/components/Shared/` contains reusable components (Dropzone, Filepond)
- **Navigation**: `src/components/Navbar/` contains the main navigation using React Bootstrap

### Chrome Extension Architecture
- **Manifest V3**: Uses service worker instead of background page
- **Communication**: UI communicates with background script via `chrome.runtime.sendMessage()`
- **Permissions**: Requires `bookmarks`, `tabs`, `downloads`, `storage`
- **Background script** handles:
  - `save_tabs` action: Queries current window tabs, converts to JSON, triggers download
  - `restore_session` action: Opens new window with tabs from uploaded JSON

## Common Commands

### Development
```bash
# Install dependencies (clean install)
npm ci

# Start development server with hot reload
npm run start

# Build for production
npm run build

# Run tests
npm test
```

### Loading Extension in Chrome
After building, load the extension in Chrome:
1. Navigate to `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `build/` directory

### Testing
Tests use React Testing Library and Jest (via react-scripts). Test files are co-located with components using `.test.js` suffix.

Run specific test file:
```bash
npm test -- SaveTabsComponent.test.js
```

## Key Implementation Details

### Background Script Message Handling
The background service worker (`src/Core/background.js`) listens for messages and must return `true` to keep the message channel open for async `sendResponse`. Both save and restore actions handle errors and send responses back to the UI.

### Tab Restoration Limits
In `background.js`, if more than 5 tabs are stored, only the last tabs (after index 3) are restored to prevent overwhelming the browser. This logic may need adjustment based on user feedback.

### Babel Configuration
React preset uses automatic runtime (`"runtime": "automatic"`), so no explicit React imports are needed in JSX files (though some files still have them for backwards compatibility).

## Development Notes

- The extension is currently in development stage
- Roadmap includes Firefox, Safari, Edge compatibility and cloud backup features
- Uses Bootstrap 5.3 and React Bootstrap for UI styling
- ESLint extends react-app configuration
- Chrome global variables are available via `/* eslint-disable no-undef */` comments where needed
