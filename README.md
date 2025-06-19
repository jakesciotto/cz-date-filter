# Chrome Extension Installation Guide -- CZ Date Filter

Follow these steps to install this project as a Chrome extension:

## Prerequisites
- Ensure you have the Google Chrome browser installed.

## Installation Steps

1. **Download or Clone the Repository**
    - Download the project as a ZIP file or clone it using Git:
      ```bash
      git clone <repository-url>
      ```
    - If downloaded as a ZIP file, extract its contents.

2. **Open Chrome Extensions Page**
    - Launch Google Chrome.
    - Navigate to `chrome://extensions/` in the address bar.

3. **Enable Developer Mode**
    - Toggle the "Developer mode" switch in the top-right corner of the Extensions page.

4. **Load the Extension**
    - Click the "Load unpacked" button.
    - Select the folder containing the extension's source code (ensure it includes the `manifest.json` file).

5. **Verify Installation**
    - Confirm the extension appears in the list of installed extensions.
    - Optionally, pin the extension to the toolbar for quick access.

## Additional Notes
- Verify that the `manifest.json` file is properly configured for your extension.
- After making changes to the source code, click the "Reload" button on the Extensions page to apply updates.

## Changelog

### Version 2.2.1 (Latest)
**Modern UI Redesign & Enhanced UX**
- **Complete Visual Redesign**:
  - Modern header with gradient background and professional CloudZero branding
  - Updated typography using Inter font family for improved readability
  - Professional color palette with proper contrast and accessibility
  - Subtle shadows, elevation, and depth for visual hierarchy
  - Smooth micro-interactions and hover effects throughout
  - Increased popup width to 600px for better layout and readability
- **Enhanced User Experience**:
  - Animated custom fields that slide in/out smoothly when toggling
  - Replaced intrusive alerts with elegant toast notifications for success/error states
  - Added loading states with spinners for all async operations
  - Improved form validation with inline error messages and focus management
  - Auto-close popup after successful filter application
  - Enhanced empty state for saved filters with helpful messaging
  - Better visual feedback for all interactive elements
- **Accessibility & Performance**:
  - Improved semantic HTML structure for better screen reader support
  - CSS custom properties for consistent design system
  - Smooth animations with proper easing curves and reduced motion support
  - High contrast mode support for accessibility
  - Responsive design considerations
- **Technical Improvements**:
  - Modern CSS architecture with design tokens
  - Better button hierarchy (primary vs secondary styling)
  - Enhanced filter item interactions with smooth animations
  - Improved error handling and user feedback systems

### Version 2.0.0
**Major Architecture Restructure**
- **Code Architecture**:
  - Refactored codebase into modular structure under `/src` directory
  - Separated concerns into dedicated modules (popup, content, background, shared utilities)
  - Modern build system with Webpack for optimized builds
  - ES6 modules with proper imports/exports
  - Manifest V3 compliance with background service worker
  - Comprehensive error handling and user feedback systems
- **Development Improvements**:
  - Asset management and copying via build process
  - Prepared foundation for future TypeScript migration
  - Enhanced development workflow and maintainability
  - Better separation of date utilities, storage, and URL manipulation

### Version 1.0.1
**Enhanced Date Input Flexibility**
- Added support for multiple date formats:
  - `YYYY-MM-DD` or `YYYY/MM/DD` (e.g., `2025-01-15` or `2025/01/15`)
  - `MM-DD-YYYY` or `MM/DD/YYYY` (e.g., `01-15-2025` or `01/15/2025`)
  - `DD-MM-YYYY` or `DD/MM/YYYY` (European format)
- Added support for multiple date range separators:
  - `to`: `2025-01-15 to 2025-02-28`
  - `-`: `01/15/2025 - 02/28/2025`
  - `through`: `2025-01-15 through 2025-02-28`
  - `thru`: `01-15-2025 thru 02-28-2025`
  - `--`: `2025-01-15 -- 2025-02-28`
  - `—`: `01/15/2025 — 02/28/2025`
- Added support for relative date expressions:
  - `last X days` (e.g., `last 45 days`, `last 1 day`)
- **Data Lag Alignment**: Updated all date calculations to account for CloudZero's 2-day data ingestion lag
  - All predefined ranges (Last 7/14/28/30/90 Days) now end 2 days prior to current date
  - Relative date expressions (e.g., "last 45 days") also end 2 days prior to current date
- Enhanced date validation with comprehensive error messages
- Updated UI placeholder text to show new supported formats
- Updated permissions and manifest configuration
- Updated README documentation
- UI improvements for filter text positioning and disabled state styling