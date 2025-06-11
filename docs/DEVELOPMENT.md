# Development Guide

## Project Structure

```
src/
├── popup/           # Extension popup interface
├── content/         # Content scripts for CloudZero pages
├── background/      # Background service worker
├── shared/          # Shared utilities and constants
└── types/           # TypeScript definitions
```

## Building the Extension

### Development
```bash
npm run dev     # Build and watch for changes
```

### Production
```bash
npm run build   # Build for production
```

The built extension will be in the `dist/` directory.

## Loading in Chrome

1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `dist/` directory

## Testing

```bash
npm test        # Run unit tests
npm run lint    # Run ESLint
```

## Architecture

### Modular Design
- **Date utilities**: Flexible date parsing and formatting
- **Storage utilities**: Chrome storage abstraction
- **URL utilities**: CloudZero URL manipulation
- **Constants**: Shared configuration and messages

### Modern Build System
- Webpack for bundling and optimization
- ES6 modules with tree shaking
- Asset copying and optimization
- Development and production builds

## Key Features

1. **Flexible Date Parsing**: Supports multiple date formats and relative dates
2. **Modular Architecture**: Clean separation of concerns
3. **Type Safety**: TypeScript definitions for better development
4. **Modern Tooling**: Webpack, ESLint, Jest integration
5. **Content Script Integration**: Direct page interaction instead of tab manipulation