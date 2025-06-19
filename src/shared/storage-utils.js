/**
 * Chrome storage utilities for CloudZero Date Filter extension
 */

/**
 * Gets saved filters from Chrome storage
 * @returns {Promise<Array>} Array of saved filters
 */
export function getSavedFilters() {
    return new Promise((resolve) => {
        chrome.storage.sync.get("savedFilters", (data) => {
            resolve(data.savedFilters || []);
        });
    });
}

/**
 * Saves a filter to Chrome storage
 * @param {Object} filter - Filter object to save
 * @returns {Promise<Array>} Updated array of saved filters
 * @throws {Error} If filter with same name already exists
 */
export function saveFilter(filter) {
    return new Promise((resolve, reject) => {
        getSavedFilters().then((filters) => {
            // Check for duplicate filter names
            const existingFilter = filters.find(f => 
                f.customName && filter.customName && 
                f.customName.toLowerCase() === filter.customName.toLowerCase()
            );
            
            if (existingFilter) {
                reject(new Error(`A filter named "${filter.customName}" already exists. Please choose a different name.`));
                return;
            }
            
            filters.push(filter);
            chrome.storage.sync.set({ savedFilters: filters }, () => {
                resolve(filters);
            });
        });
    });
}

/**
 * Deletes a filter from Chrome storage
 * @param {number} index - Index of filter to delete
 * @returns {Promise<Array>} Updated array of saved filters
 */
export function deleteFilter(index) {
    return new Promise((resolve) => {
        getSavedFilters().then((filters) => {
            filters.splice(index, 1);
            chrome.storage.sync.set({ savedFilters: filters }, () => {
                resolve(filters);
            });
        });
    });
}

/**
 * Creates a filter object
 * @param {string} range - Date range type
 * @param {string} dates - Date range string
 * @param {string} customName - Custom name for the filter
 * @param {Object} advancedParams - Advanced CloudZero parameters
 * @param {string} advancedParams.costType - Cost type
 * @param {string} advancedParams.granularity - Data granularity
 * @param {string} advancedParams.groupBy - Group by parameter
 * @param {string} advancedParams.filters - Additional filters
 * @returns {Object} Filter object
 */
export function createFilter(range, dates, customName = null, advancedParams = {}) {
    return {
        range: dates ? "Custom" : range,
        dates: dates || "Auto-generated",
        customName: customName || null,
        advancedParams: {
            costType: advancedParams.costType || null,
            granularity: advancedParams.granularity || null,
            groupBy: advancedParams.groupBy || null,
            filters: advancedParams.filters || null
        }
    };
}

/**
 * Gets user settings from Chrome storage
 * @returns {Promise<Object>} User settings object
 */
export function getUserSettings() {
    return new Promise((resolve) => {
        chrome.storage.sync.get("userSettings", (data) => {
            resolve(data.userSettings || {});
        });
    });
}

/**
 * Saves user settings to Chrome storage
 * @param {Object} settings - Settings object to save
 * @returns {Promise<void>}
 */
export function saveUserSettings(settings) {
    return new Promise((resolve) => {
        chrome.storage.sync.set({ userSettings: settings }, () => {
            resolve();
        });
    });
}

/**
 * Clears all data from Chrome storage
 * @returns {Promise<void>}
 */
export function clearAllData() {
    return new Promise((resolve) => {
        chrome.storage.sync.clear(() => {
            resolve();
        });
    });
}