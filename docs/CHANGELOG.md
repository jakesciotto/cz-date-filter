# Changelog

## [2.0.0] - Restructure Release

### Added
- Modular architecture with separated concerns
- Modern build system with Webpack
- Content script for better CloudZero integration
- Background service worker for Manifest V3 compliance
- Comprehensive error handling and user feedback
- Development documentation and guides

### Changed
- **BREAKING**: Complete project restructure
- Moved from direct tab manipulation to content script messaging
- Reorganized files into logical directories (`src/popup`, `src/shared`, etc.)
- Updated manifest to use new file paths and content scripts
- Refactored all JavaScript modules to use ES6 imports/exports

### Improved
- Better separation of date utilities, storage, and URL manipulation
- More maintainable and testable code structure
- Cleaner development workflow with build tools
- Enhanced error messages using centralized constants

### Technical
- Webpack bundling for optimized builds
- ES6 modules with proper imports/exports
- Asset management and copying via build process
- Prepared foundation for TypeScript migration
- Set up testing infrastructure with Jest

## [1.0.1] - Previous Version
- Original flat file structure
- Basic date filtering functionality
- Chrome storage integration
- CloudZero URL manipulation