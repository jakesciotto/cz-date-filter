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

export const CLOUDZERO_PARAMETERS = {
    COST_TYPES: [
        { value: 'billed_cost', label: 'Billed Cost' },
        { value: 'discounted_cost', label: 'Discounted Cost' },
        { value: 'discounted_amortized_cost', label: 'Discounted Amortized Cost' },
        { value: 'amortized_cost', label: 'Amortized Cost' },
        { value: 'invoiced_amortized_cost', label: 'Invoiced Amortized Cost' },
        { value: 'real_cost', label: 'Real Cost' },
        { value: 'on_demand_cost', label: 'On-Demand Cost' }
    ],
    GRANULARITIES: [
        { value: 'daily', label: 'Daily' },
        { value: 'weekly', label: 'Weekly' },
        { value: 'monthly', label: 'Monthly' }
    ],
    GROUP_BY_OPTIONS: [
        { value: '', label: 'None' },
        { value: 'account', label: 'Account' },
        { value: 'billing_line_item', label: 'Billing Line Item' },
        { value: 'cloud_provider', label: 'Cloud Provider' },
        { value: 'genai_model', label: 'GenAI Model' },
        { value: 'genai_model_family', label: 'GenAI Model Family' },
        { value: 'genai_platform', label: 'GenAI Platform' },
        { value: 'genai_token_type', label: 'GenAI Token Type' },
        { value: 'instance_type', label: 'Instance Type' },
        { value: 'networking_category', label: 'Networking Category' },
        { value: 'networking_sub_category', label: 'Networking Sub-Category' },
        { value: 'payment_option', label: 'Payment Option' },
        { value: 'region', label: 'Region' },
        { value: 'resource_summary', label: 'Resource Summary' },
        { value: 'resource_type', label: 'Resource Type' },
        { value: 'service', label: 'Service' },
        { value: 'service_category', label: 'Service Category' },
        { value: 'service_detail', label: 'Service Detail' },
        { value: 'taggable_vs_untaggable', label: 'Taggable vs. Untaggable' },
        { value: 'usage_family', label: 'Usage Family' }
    ],
    DEFAULTS: {
        costType: 'real_cost',
        granularity: 'daily',
        groupBy: '',
        filters: ''
    }
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