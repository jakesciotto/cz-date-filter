/**
 * Shared constants for CloudZero Date Filter extension
 */

export const DATE_RANGES = {
    LAST_7_DAYS: 'Last 7 Days',
    LAST_14_DAYS: 'Last 14 Days',
    LAST_28_DAYS: 'Last 28 Days',
    LAST_30_DAYS: 'Last 30 Days',
    LAST_90_DAYS: 'Last 90 Days',
    CUSTOM: 'Custom'
};

export const CLOUDZERO_CONFIG = {
    BASE_URL: 'https://app.cloudzero.com',
    URL_PATTERN: 'https://app.cloudzero.com/*',
    REQUIRED_PARAMS: {
        activeCostType: 'real_cost',
        granularity: 'daily',
        showRightFlyout: 'filters'
    },
    DATA_INGESTION_LAG_DAYS: 2
};

export const STORAGE_KEYS = {
    SAVED_FILTERS: 'savedFilters'
};

export const UI_MESSAGES = {
    ERRORS: {
        NO_DATE_RANGE: 'Please enter a date range',
        INVALID_DATE_FORMAT: 'Invalid date format',
        START_AFTER_END: 'Start date must be before end date',
        EMPTY_DATE: 'Empty date string',
        INVALID_MONTH: 'Invalid month',
        INVALID_DAY: 'Invalid day',
        INVALID_YEAR: 'Year must be between 1900 and 2100',
        INVALID_DATE: 'Invalid date',
        NOT_CLOUDZERO_PAGE: 'Current tab is not a CloudZero page',
        NO_ACTIVE_TAB: 'No active tab found'
    },
    SUCCESS: {
        FILTER_SAVED: 'Filter saved successfully!'
    },
    PLACEHOLDERS: {
        CUSTOM_DATE: 'e.g. last 45 days, 01/15/2025 to 02/28/2025, 2025-01-15 - 2025-02-28',
        CUSTOM_NAME: 'Enter a name for your filter'
    }
};