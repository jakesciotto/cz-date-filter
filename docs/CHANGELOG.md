# Changelog

## [2.2.2] - Settings Functionality & UI Fixes

### Fixed
- **Settings Navigation**: Resolved critical issue where settings wheel button was non-functional due to missing click event listener
- **Settings Display**: Fixed popup window height collapse (25px) preventing settings content from being visible  
- **Back Button Visibility**: Updated back button styling with dark theme for better visibility in settings view

### Changed
- **Popup Dimensions**: Standardized popup width to 400px with improved responsive height handling
- **Event Handling**: Enhanced settings button with proper click, keyboard, and fallback event listeners
- **Visual Consistency**: Improved settings page layout with proper forced reflow and window resize handling

### Technical
- **Window Management**: Added forced CSS styling to ensure popup expansion when switching to settings view
- **Event Listener Architecture**: Comprehensive event attachment for settings navigation
- **Accessibility**: Enhanced keyboard navigation support for settings button

## [2.2.1] - UI Polish & Animation Improvements

### Added
- **Enhanced Visual Feedback**: Improved hover states with subtle shadows and transforms across all interactive elements
- **Advanced Loading Indicators**: Shimmer animations and dual-border spinners for better loading feedback
- **Smooth Animations**: Consistent slide transitions for custom fields matching advanced options behavior
- **Form Interaction Polish**: Focus rings, hover effects, and improved dropdown arrow interactions

### Changed
- **Compact Layout**: Reduced padding and spacing throughout interface for better information density
- **Smaller Toggle Button**: More proportional 36×20px toggle (down from 44×24px)
- **Tighter Form Elements**: Optimized input padding and field spacing for streamlined appearance
- **Filter Item Design**: Smaller padding and font sizes with enhanced hover animations

### Improved
- **Zero-Space Collapse**: Perfect space removal when sections are hidden with smooth expand/collapse
- **Consistent Animations**: All expandable sections now use identical transition timing and behavior
- **Visual Hierarchy**: Better balance between information density and usability
- **Micro-interactions**: Enhanced hover and active states for improved user feedback

### Technical
- **Animation Consistency**: Unified transition patterns using CSS custom properties
- **Performance Optimized**: Hardware-accelerated transforms for smooth animations
- **Accessibility Maintained**: Proper focus states and reduced motion support preserved

## [2.2.0] - Advanced CloudZero Integration & UX Improvements

### Added
- **Advanced CloudZero Parameters**: Support for cost types, granularity, and group by options
- **Complete Cost Type Support**: All 7 official CloudZero cost types (Billed, Discounted, Amortized, etc.)
- **Group By Functionality**: 18 CloudZero dimensions including Service, Account, Region, and more
- **Smart Filter Names**: Auto-generated descriptive names for preset date ranges
- **Duplicate Filter Protection**: Prevents saving filters with identical names
- **Persistent Advanced Toggle**: Remembers advanced options preference across sessions
- **Additional Filters Framework**: Infrastructure for future filter enhancements (feature-flagged)

### Changed
- **Compact UI Design**: Reduced width to 300px and height to 400px for better screen efficiency
- **Stacked Button Layout**: Vertical button arrangement for better mobile-like experience
- **Enhanced Save Functionality**: Can now save any date range (not just custom ranges)
- **Improved Error Handling**: Better validation with helpful error messages and focus management
- **Condensed Spacing**: Tighter layout throughout the interface

### Improved
- **CloudZero URL Compatibility**: Generates URLs matching CloudZero's native format exactly
- **Advanced Parameter Persistence**: Saves and restores complex filter configurations
- **User Experience Flow**: Smoother interaction patterns with auto-focus and text selection
- **Empty State Design**: More compact and visually appealing when no filters exist

### Technical
- **CloudZero API Integration**: Proper parameter mapping for partitions and filter syntax
- **Feature Flag System**: Controlled rollout capability for experimental features
- **Enhanced Storage Schema**: Support for advanced parameters in saved filters
- **Comprehensive Validation**: Input validation for all CloudZero parameter types

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