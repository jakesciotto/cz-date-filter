# NEXTUP.md

## Planned Improvements for CloudZero Date Filter Extension

### Enhanced Functionality
- **Preset filters** - Quick buttons for common ranges (Last 30 days, This month, Last quarter)
- **Recurring filters** - Auto-apply saved filters on page load
- **Filter sharing** - Export/import filter configurations
- **Keyboard shortcuts** - Quick access without clicking extension icon
- **Multiple date range comparison** - Apply 2+ periods simultaneously

### UX Improvements
- **Visual calendar picker** - Replace date inputs with interactive calendar
- **Filter preview** - Show estimated data range before applying
- **Success notifications** - Confirm when filters are applied
- **Dark mode support** - Match CloudZero's theme
- **Filter validation** - Warn about invalid date ranges
- ~~**Settings page functionality**~~ - ✅ **COMPLETED** (v2.2.2)
- ~~**Settings navigation improvements**~~ - ✅ **COMPLETED** (v2.2.2)

### Advanced Features
- **Auto-sync with CloudZero saved views** - Bidirectional integration
- **Analytics tracking** - Most used filters, time saved
- **Bulk operations** - Apply multiple filters in sequence
- **Context menu integration** - Right-click date ranges to save

### Technical Improvements
- **Test coverage** - Add unit and integration tests for:
  - 28-day window logic validation
  - URL manipulation and encoding
  - Storage utilities
  - Popup interactions
  - CloudZero page integration
- **Testing framework** - Jest + Chrome extension testing tools like `@types/chrome`

### Development Notes
- Empty tests/ directory structure already exists (unit/ and integration/ folders)
- CLAUDE.md should remain tracked as valuable project documentation
- Consider adding ESLint/Prettier configuration for code consistency