/**
 * URL manipulation utilities for CloudZero Date Filter extension
 */

import { formatToCloudZeroISO } from './date-utils.js';

/**
 * Builds CloudZero URL with date filters
 * @param {string} baseUrl - Base CloudZero URL
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {string} Modified CloudZero URL
 */
export function buildCloudZeroUrl(baseUrl, startDate, endDate) {
    const url = new URL(baseUrl);
    
    // Format dates to CloudZero's required format
    const formattedStartDate = formatToCloudZeroISO(startDate);
    const formattedEndDate = formatToCloudZeroISO(endDate, true);
    
    // Encode colons properly to avoid over-encoding
    const encodedStartDate = formattedStartDate.replace(/:/g, "%3A");
    const encodedEndDate = formattedEndDate.replace(/:/g, "%3A");
    
    // Fix partitions encoding (replace "+" with "%20")
    let partitionsValue = url.searchParams.get("partitions");
    if (partitionsValue) {
        partitionsValue = partitionsValue.replace(/\+/g, "%20");
        url.searchParams.set("partitions", partitionsValue);
    }
    
    // Set required CloudZero parameters
    url.searchParams.set("activeCostType", "real_cost");
    url.searchParams.set("granularity", "daily");
    url.searchParams.set("dateRange", "Custom");
    url.searchParams.set("startDate", encodedStartDate);
    url.searchParams.set("endDate", encodedEndDate);
    url.searchParams.set("showRightFlyout", "filters");
    
    // Fix over-encoding issue
    let finalURL = url.toString().replace(/%25/g, "%");
    
    return finalURL;
}

/**
 * Validates if URL is a CloudZero URL
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid CloudZero URL
 */
export function isCloudZeroUrl(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname === 'app.cloudzero.com';
    } catch {
        return false;
    }
}

/**
 * Applies date filter to current CloudZero tab
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<void>}
 */
export function applyDateFilterToTab(startDate, endDate) {
    return new Promise((resolve, reject) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (!tabs[0]) {
                reject(new Error('No active tab found'));
                return;
            }
            
            const currentUrl = tabs[0].url;
            
            if (!isCloudZeroUrl(currentUrl)) {
                reject(new Error('Current tab is not a CloudZero page'));
                return;
            }
            
            const modifiedUrl = buildCloudZeroUrl(currentUrl, startDate, endDate);
            
            chrome.tabs.update(tabs[0].id, { url: modifiedUrl }, () => {
                resolve();
            });
        });
    });
}