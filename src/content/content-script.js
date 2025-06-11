/**
 * CloudZero Date Filter Extension - Content Script
 * Runs on CloudZero pages to enhance integration
 */

// Constants (duplicated from shared/constants.js since imports aren't supported)
const CLOUDZERO_CONFIG = {
    BASE_URL: 'https://app.cloudzero.com',
    URL_PATTERN: 'https://app.cloudzero.com/*',
    REQUIRED_PARAMS: {
        activeCostType: 'real_cost',
        granularity: 'daily',
        showRightFlyout: 'filters'
    },
    DATA_INGESTION_LAG_DAYS: 2
};

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (request.action === 'applyDateFilter') {
        applyDateFilter(request.startDate, request.endDate);
        sendResponse({ success: true });
    }
    
    if (request.action === 'checkCloudZeroPage') {
        const isCloudZeroPage = window.location.hostname === 'app.cloudzero.com';
        sendResponse({ isCloudZeroPage });
    }
});

/**
 * Applies date filter directly to the CloudZero page
 * @param {string} startDate - ISO formatted start date
 * @param {string} endDate - ISO formatted end date
 */
function applyDateFilter(startDate, endDate) {
    const currentUrl = window.location.href;
    const url = new URL(currentUrl);
    
    // Encode dates properly
    const encodedStartDate = startDate.replace(/:/g, "%3A");
    const encodedEndDate = endDate.replace(/:/g, "%3A");
    
    // Fix partitions encoding
    let partitionsValue = url.searchParams.get("partitions");
    if (partitionsValue) {
        partitionsValue = partitionsValue.replace(/\+/g, "%20");
        url.searchParams.set("partitions", partitionsValue);
    }
    
    // Set CloudZero parameters
    url.searchParams.set("activeCostType", CLOUDZERO_CONFIG.REQUIRED_PARAMS.activeCostType);
    url.searchParams.set("granularity", CLOUDZERO_CONFIG.REQUIRED_PARAMS.granularity);
    url.searchParams.set("dateRange", "Custom");
    url.searchParams.set("startDate", encodedStartDate);
    url.searchParams.set("endDate", encodedEndDate);
    url.searchParams.set("showRightFlyout", CLOUDZERO_CONFIG.REQUIRED_PARAMS.showRightFlyout);
    
    // Fix over-encoding
    const finalURL = url.toString().replace(/%25/g, "%");
    
    // Navigate to the modified URL
    window.location.href = finalURL;
}

/**
 * Observes CloudZero page changes and notifies extension
 */
function observePageChanges() {
    // Monitor URL changes for SPA navigation
    let currentUrl = window.location.href;
    
    const observer = new MutationObserver(() => {
        if (currentUrl !== window.location.href) {
            currentUrl = window.location.href;
            // Notify background script of URL change if needed
            chrome.runtime.sendMessage({
                action: 'urlChanged',
                url: currentUrl
            });
        }
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

// Initialize content script
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', observePageChanges);
} else {
    observePageChanges();
}