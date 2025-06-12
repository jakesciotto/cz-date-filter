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
    
    console.log('Checking groupBy parameter:', advancedParams.groupBy);
    console.log('groupBy exists and is not empty:', !!(advancedParams.groupBy && advancedParams.groupBy.trim()));
    
    if (advancedParams.groupBy && advancedParams.groupBy.trim()) {
        // CloudZero uses 'costcontext:' prefix with display names for partitions
        const groupByValue = advancedParams.groupBy.trim();
        console.log(`Processing groupBy value: "${groupByValue}"`);
        
        // Map our internal values to CloudZero's partition names
        // Some use simple format, others use costcontext: prefix
        const cloudZeroPartitions = {
            // Simple format (no costcontext prefix) - basic dimensions
            'account': 'accounts',
            'region': 'regions',
            'service': 'services',
            
            // CostContext format (requires costcontext: prefix) - detailed dimensions
            'billing_line_item': 'costcontext:Billing Line Item',
            'cloud_provider': 'costcontext:Cloud Provider',
            'genai_model': 'costcontext:GenAI Model',
            'genai_model_family': 'costcontext:GenAI Model Family',
            'genai_platform': 'costcontext:GenAI Platform',
            'genai_token_type': 'costcontext:GenAI Token Type',
            'instance_type': 'costcontext:Instance Type',
            'networking_category': 'costcontext:Networking Category',
            'networking_sub_category': 'costcontext:Networking Sub-Category',
            'payment_option': 'costcontext:Payment Option',
            'resource_summary': 'costcontext:Resource Summary',
            'resource_type': 'costcontext:Resource Type',
            'service_category': 'costcontext:Service Category',
            'service_detail': 'costcontext:Service Detail',
            'taggable_vs_untaggable': 'costcontext:Taggable vs. Untaggable',
            'usage_family': 'costcontext:Usage Family'
        };
        
        const partitionValue = cloudZeroPartitions[groupByValue] || groupByValue;
        console.log(`Mapped "${groupByValue}" to partition value: "${partitionValue}"`);
        console.log(`Setting partitions parameter in URL: ${partitionValue}`);
        url.searchParams.set("partitions", partitionValue);
        console.log('Current URL after setting partitions:', url.toString());
    } else {
        console.log('No groupBy parameter provided or it is empty');
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
        
        // CloudZero uses individual URL parameters for filters (not JSON)
        if (Object.keys(filterGroups).length > 0) {
            Object.entries(filterGroups).forEach(([key, values]) => {
                const paramValue = values.join(',');
                console.log(`Setting filter parameter: ${key}=${paramValue}`);
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