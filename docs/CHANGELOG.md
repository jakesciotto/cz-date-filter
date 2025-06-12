# Changelog

## [2.1.0] - Modern UI Redesign

### Added
- Modern header with gradient background and CloudZero branding
- Professional Inter font family for improved typography
- Elegant toast notifications for success/error messages
- Loading states with spinners for all async operations
- Animated custom fields with smooth slide transitions
- Enhanced empty state for saved filters with helpful messaging
- Auto-close popup functionality after successful filter application

### Changed
- Complete visual redesign with modern color palette and shadows
- Increased popup width from 380px to 600px for better layout
- Replaced intrusive alerts with non-blocking toast notifications
- Updated button hierarchy with primary/secondary styling
- Improved form validation with inline error messages
- Enhanced semantic HTML structure for better accessibility

### Improved
- Smooth micro-interactions and hover effects throughout the interface
- Better visual feedback for all interactive elements
- Enhanced filter item interactions with smooth animations
- Improved focus management and keyboard navigation
- Added support for reduced motion and high contrast preferences
- Better spacing and visual hierarchy with design tokens

### Technical
- Modern CSS architecture with custom properties (design tokens)
- Smooth animations with proper easing curves
- Responsive design considerations and mobile-friendly viewport
- Enhanced error handling and user feedback systems
- Accessibility improvements with ARIA labels and semantic markup

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