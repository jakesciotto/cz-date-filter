/**
 * URL manipulation utilities for CloudZero Date Filter extension
 */

import { formatToCloudZeroISO } from './date-utils.js';
import { CLOUDZERO_PARAMETERS } from './constants.js';

/**
 * Builds CloudZero URL with date filters and optional advanced parameters
 * @param {string} baseUrl - Base CloudZero URL
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {Object} advancedParams - Optional advanced parameters
 * @param {string} advancedParams.costType - Cost type (real_cost, amortized_cost, etc.)
 * @param {string} advancedParams.granularity - Data granularity (daily, weekly, monthly)
 * @param {string} advancedParams.groupBy - Group by parameter
 * @param {string} advancedParams.filters - Additional filters
 * @returns {string} Modified CloudZero URL
 */
export function buildCloudZeroUrl(baseUrl, startDate, endDate, advancedParams = {}) {
    const url = new URL(baseUrl);
    
    // Format dates to CloudZero's required format
    const formattedStartDate = formatToCloudZeroISO(startDate);
    const formattedEndDate = formatToCloudZeroISO(endDate, true);
    
    // Encode colons properly to avoid over-encoding
    const encodedStartDate = formattedStartDate.replace(/:/g, "%3A");
    const encodedEndDate = formattedEndDate.replace(/:/g, "%3A");
    
    // Set CloudZero parameters with defaults
    const costType = advancedParams.costType || CLOUDZERO_PARAMETERS.DEFAULTS.costType;
    const granularity = advancedParams.granularity || CLOUDZERO_PARAMETERS.DEFAULTS.granularity;
    
    url.searchParams.set("activeCostType", costType);
    url.searchParams.set("granularity", granularity);
    url.searchParams.set("dateRange", "Custom");
    url.searchParams.set("startDate", encodedStartDate);
    url.searchParams.set("endDate", encodedEndDate);
    url.searchParams.set("showRightFlyout", "filters");
    
    // Set optional advanced parameters
    console.log('Advanced params:', advancedParams);
    
    if (advancedParams.groupBy && advancedParams.groupBy.trim()) {
        // CloudZero uses 'costcontext:' prefix with display names for partitions
        const groupByValue = advancedParams.groupBy.trim();
        
        // Map our internal values to CloudZero's display names
        const cloudZeroDisplayNames = {
            'billing_line_item': 'Billing Line Item',
            'service': 'Service',
            'account': 'Account',
            'region': 'Region',
            'availability_zone': 'Availability Zone',
            'instance_type': 'Instance Type',
            'resource_type': 'Resource Summary',
            'category': 'Category',
            'service_detail': 'Service Detail',
            'payment_option': 'Payment Option',
            'elasticity': 'Elasticity',
            'networking_category': 'Networking Category',
            'taggable_vs_untaggable': 'Taggable vs Untaggable',
            'operation': 'Operation',
            'usage_type': 'Usage Type',
            'product_code': 'Product Code',
            'resource_id': 'Resource ID'
        };
        
        const displayName = cloudZeroDisplayNames[groupByValue] || groupByValue;
        const partitionValue = `costcontext:${displayName}`;
        console.log(`Setting partitions parameter: ${partitionValue}`);
        // CloudZero uses both 'partitions' (for UI) and 'partition_by' (for API)
        url.searchParams.set("partitions", partitionValue);
    } else {
        // Fix existing partitions encoding if no groupBy is specified
        let partitionsValue = url.searchParams.get("partitions");
        if (partitionsValue) {
            partitionsValue = partitionsValue.replace(/\+/g, "%20");
            url.searchParams.set("partitions", partitionsValue);
        }
    }
    
    if (advancedParams.filters && advancedParams.filters.trim()) {
        // Parse CloudZero filters - format: "services:AmazonCloudWatch,region:us-east-1,us-east-2"
        const filtersString = advancedParams.filters.trim();
        console.log(`Parsing filters: ${filtersString}`);
        
        // Split by commas and process each filter
        const filterPairs = filtersString.split(',').map(f => f.trim());
        const filterGroups = {};
        
        filterPairs.forEach(pair => {
            if (pair.includes(':')) {
                const [key, value] = pair.split(':', 2);
                const trimmedKey = key.trim();
                const trimmedValue = value.trim();
                
                if (!filterGroups[trimmedKey]) {
                    filterGroups[trimmedKey] = [];
                }
                filterGroups[trimmedKey].push(trimmedValue);
            }
        });
        
        // CloudZero expects filters as JSON, but also supports individual URL parameters
        // Try both approaches: JSON filters parameter AND individual parameters
        if (Object.keys(filterGroups).length > 0) {
            // Set as JSON filters parameter (for API compatibility)
            const filtersJSON = JSON.stringify(filterGroups);
            console.log(`Setting JSON filters parameter: ${filtersJSON}`);
            url.searchParams.set("filters", filtersJSON);
            
            // Also set individual parameters (for UI compatibility)
            Object.entries(filterGroups).forEach(([key, values]) => {
                const paramValue = values.join(',');
                console.log(`Setting individual filter parameter: ${key}=${paramValue}`);
                url.searchParams.set(key, paramValue);
            });
        }
    }
    
    // Fix over-encoding issue
    let finalURL = url.toString().replace(/%25/g, "%");
    
    console.log(`Final URL: ${finalURL}`);
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
 * Applies date filter and advanced parameters to current CloudZero tab
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {Object} advancedParams - Optional advanced parameters
 * @returns {Promise<void>}
 */
export function applyDateFilterToTab(startDate, endDate, advancedParams = {}) {
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
            
            const modifiedUrl = buildCloudZeroUrl(currentUrl, startDate, endDate, advancedParams);
            
            chrome.tabs.update(tabs[0].id, { url: modifiedUrl }, () => {
                resolve();
            });
        });
    });
}