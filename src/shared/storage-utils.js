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
 */
export function saveFilter(filter) {
    return new Promise((resolve) => {
        getSavedFilters().then((filters) => {
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
 * @returns {Object} Filter object
 */
export function createFilter(range, dates, customName = null) {
    return {
        range: dates ? "Custom" : range,
        dates: dates || "Auto-generated",
        customName: customName || null
    };
}