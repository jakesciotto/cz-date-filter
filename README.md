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

### Version 1.1 (Upcoming)
**UI Enhancements & Code Refactoring**
- **UI Enhancements**:
  - Added icons to buttons and labels (📅 💾 🚀 📋)
  - Improved spacing and breathing room between sections
  - Better visual hierarchy with clearer section separation
  - Enhanced input group styling with subtle backgrounds
  - Hover effects on saved filter items
  - Larger popup width for better readability
- **Code Architecture**:
  - Refactored codebase into modular structure under `/src` directory
  - Separated concerns into dedicated modules (popup, content, background, shared utilities)
  - Improved maintainability and code organization

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