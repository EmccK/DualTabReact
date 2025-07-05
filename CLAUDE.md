# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DualTab is a Chrome browser extension built with React + TypeScript that provides a customizable new tab page experience. The extension supports dual-mode (internal/external) network addresses, bookmark management, and various background themes.

## Development Commands

### Basic Development
```bash
npm install              # Install dependencies
npm run build           # Production build with post-processing (required for testing)
npm run build:check     # Build with TypeScript checking
npm run lint            # Run ESLint
npm run dev             # Vite dev server (not directly usable for extension)
npm run preview         # Preview built files
```

### Chrome Extension Development Workflow
**Important**: Chrome extensions must be built before testing - there's no live reload like web apps.

1. **Build the extension**: `npm run build`
2. **Load in Chrome**:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked extension"
   - Select the `dist` directory
3. **Development iteration**:
   - Make code changes
   - Run `npm run build` again
   - Click "Reload" button on the extension in Chrome extensions page
   - Test the changes

## Architecture Overview

### Core Architecture
- **Extension Type**: Chrome Extension Manifest V3
- **Main Pages**: New Tab page (`newtab.html`) and Popup (`popup.html`)
- **Background Service**: Service worker handling extension lifecycle
- **Content Script**: Injects functionality into web pages

### Key Components Structure
```
src/
├── components/          # React components organized by feature
│   ├── bookmarks/      # Bookmark management UI
│   ├── background/     # Background theme system
│   ├── categories/     # Bookmark categorization
│   ├── search/         # Search functionality
│   ├── settings/       # Extension settings
│   └── ui/            # Reusable UI components (shadcn/ui style)
├── hooks/              # Custom React hooks for state management
├── services/           # Business logic and API services
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── pages/              # Main application pages
```

### State Management Pattern
- Uses custom React hooks for state management (no external state library)
- Chrome Storage API for persistence
- Hook composition pattern for complex state logic
- Optimistic updates with error handling

### Key Features Architecture

#### Dual Network Mode
- Supports internal/external URL switching for bookmarks
- Network mode state managed via `useNetworkMode` hook
- Stored in Chrome storage for persistence

#### Background System
- Multiple background types: solid color, gradient, image, random images
- Background service manages image caching and auto-switching
- Custom gradient editor with real-time preview
- Image optimization and caching via service worker

#### Bookmark Management
- Category-based organization with drag-and-drop
- Multiple icon types: official favicons, text icons, uploaded images
- Icon processing and caching system
- Bookmark position management for grid layout

#### WebDAV Sync (Optional)
- Optional WebDAV integration for bookmark synchronization
- Conflict resolution system
- Auto-sync scheduler with configurable intervals

## Build System

### Vite Configuration
- Multiple entry points: newtab, popup, background service worker, content script
- Chrome Extension specific build optimizations
- Asset path fixing via post-build script (`scripts/post-build.js`)
- TypeScript compilation with strict type checking

### Extension Manifest
- Manifest V3 with required permissions: storage, tabs, activeTab
- Host permissions for external API calls
- Content Security Policy configured for extension security

## Component Patterns

### UI Components
- Based on Radix UI primitives with Tailwind CSS
- Consistent component API following shadcn/ui patterns
- Components in `src/components/ui/` are reusable primitives

### Feature Components
- Self-contained components with their own hooks
- Props interface clearly defined with TypeScript
- Error boundaries for component isolation

### Hook Patterns
- Custom hooks follow `use[Feature]` naming convention
- Hooks compose smaller hooks for complex logic
- State and effects separated into focused hooks

## Chrome Extension Specifics

### Permissions Used
- `storage`: User settings and bookmark data
- `tabs`: Current tab information access
- `activeTab`: Active tab manipulation
- `https://*/*`: Web access for favicon fetching

### Background Service Worker
- Handles extension lifecycle events
- Manages background image caching
- Processes bookmark icon fetching
- Auto-sync scheduling for WebDAV

### Content Script
- Minimal content script for web page interaction
- Runs on all HTTP/HTTPS pages
- Used for current tab information gathering

## Development Tips

### TypeScript Configuration
- Multiple tsconfig files for different build targets
- Strict type checking enabled
- Chrome Extension API types included

### Styling System
- Tailwind CSS for utility-first styling
- CSS custom properties for theme management
- Responsive design patterns

### Performance Optimizations
- Image lazy loading and caching
- Debounced user input handling
- Optimized React rendering with proper dependencies
- Chrome storage batching for multiple operations

## Testing Extension Changes
**Chrome Extension Development Cycle** (no live reload available):
1. Make code changes
2. Run `npm run build` to create distribution files
3. Go to `chrome://extensions/` and click "Reload" button for DualTab extension
4. Test both new tab page and popup functionality
5. Check Chrome DevTools Console for any errors
6. Verify Chrome storage operations work correctly

**Note**: Unlike web applications, Chrome extensions cannot use hot reload. Every change requires a full rebuild and manual reload in Chrome.

## Important Code Conventions
- Use TypeScript interfaces for all data structures
- Follow React hooks rules strictly
- Handle Chrome API errors gracefully
- Implement proper cleanup in useEffect hooks
- Use proper accessibility attributes for UI components