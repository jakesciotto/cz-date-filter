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
        applyDateFilter(request.startDate, request.endDate, request.advancedParams);
        sendResponse({ success: true });
    }
    
    if (request.action === 'checkCloudZeroPage') {
        const isCloudZeroPage = window.location.hostname === 'app.cloudzero.com';
        sendResponse({ isCloudZeroPage });
    }
    
    // Add manual series control for debugging
    if (request.action === 'debugSeriesControl') {
        console.log('Manual series control triggered');
        applySeriesControl(request.seriesValue);
        sendResponse({ success: true });
    }
});

/**
 * Applies date filter directly to the CloudZero page
 * @param {string} startDate - ISO formatted start date
 * @param {string} endDate - ISO formatted end date
 * @param {Object} advancedParams - Advanced parameters including series
 */
function applyDateFilter(startDate, endDate, advancedParams = {}) {
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
    
    // Store series parameter in session storage for after page reload
    if (advancedParams.series) {
        console.log('Storing series parameter for after reload:', advancedParams.series);
        sessionStorage.setItem('czdf_series_control', advancedParams.series);
    }
    
    // Navigate to the modified URL
    window.location.href = finalURL;
}

/**
 * Applies series control to the CloudZero page by manipulating the Series dropdown
 * @param {string} seriesValue - The series value to select (5, 10, or 25)
 */
function applySeriesControl(seriesValue) {
    console.log(`Starting applySeriesControl with value: ${seriesValue}`);
    
    try {
        // Log all available select labels for debugging
        const allLabels = Array.from(document.querySelectorAll('.cz-select-label'));
        console.log('All select labels found:', allLabels.map(l => l.textContent.trim()));
        
        // Find the Series dropdown by looking for its label first
        const seriesLabel = allLabels.find(label => label.textContent.trim() === 'Series');
        if (seriesLabel) {
            console.log('Found Series label:', seriesLabel);
            const seriesContainer = seriesLabel.parentElement;
            const seriesDropdown = seriesContainer.querySelector('.cz-select-box');
            
            if (seriesDropdown) {
                const currentValue = seriesDropdown.querySelector('.cz-select-box__content')?.textContent?.trim();
                console.log('Current series value:', currentValue);
                
                if (currentValue !== seriesValue) {
                    console.log('Clicking series dropdown...');
                    
                    // Close any open dropdowns first
                    document.querySelectorAll('.cz-dropdown--open').forEach(dropdown => {
                        const toggleButton = dropdown.parentElement?.querySelector('.cz-select-box');
                        if (toggleButton && toggleButton !== seriesDropdown) {
                            console.log('Closing other open dropdown');
                            toggleButton.click();
                        }
                    });
                    
                    // Wait a bit, then open the series dropdown
                    setTimeout(() => {
                        seriesDropdown.click();
                        
                        setTimeout(() => {
                            // Look for dropdown options, but filter to only numeric values
                            const allOptions = Array.from(document.querySelectorAll('.cz-dropdown__item'));
                            console.log('All dropdown options found:', allOptions.length);
                            console.log('First 10 options:', allOptions.slice(0, 10).map(o => o.textContent.trim()));
                            
                            // More specific filtering for series options
                            const numericOptions = allOptions.filter(option => {
                                const text = option.textContent.trim();
                                const isNumeric = /^\d+$/.test(text);
                                const num = parseInt(text);
                                const isSmallNumber = num <= 100;
                                console.log(`Option "${text}": numeric=${isNumeric}, num=${num}, small=${isSmallNumber}`);
                                return isNumeric && isSmallNumber;
                            });
                            
                            console.log('Numeric options (likely series):', numericOptions.map(o => o.textContent.trim()));
                            
                            // Try to find target option
                            let targetOption = numericOptions.find(option => option.textContent.trim() === seriesValue);
                            
                            if (!targetOption) {
                                console.log(`Series option ${seriesValue} not found in numeric options, searching all options...`);
                                targetOption = allOptions.find(option => option.textContent.trim() === seriesValue);
                            }
                            
                            if (targetOption) {
                                console.log('Found target option:', targetOption);
                                console.log('Target option classes:', targetOption.className);
                                console.log('Target option attributes:', Array.from(targetOption.attributes).map(a => `${a.name}="${a.value}"`));
                                
                                // Check if it's already selected
                                const isSelected = targetOption.getAttribute('aria-selected') === 'true';
                                console.log('Is target option already selected?', isSelected);
                                
                                if (!isSelected) {
                                    console.log('Clicking target option...');
                                    targetOption.click();
                                    console.log(`Series set to ${seriesValue} successfully!`);
                                } else {
                                    console.log('Target option already selected, clicking anyway...');
                                    targetOption.click();
                                }
                            } else {
                                console.log(`Series option ${seriesValue} not found anywhere!`);
                                console.log('Available options:', allOptions.map(o => `"${o.textContent.trim()}"`));
                            }
                        }, 500); // Increased timeout
                    }, 200);
                } else {
                    console.log(`Series already set to ${seriesValue}`);
                }
                return;
            }
        } else {
            console.log('Series dropdown not found');
            console.log('Available elements with .cz-select-box:', document.querySelectorAll('.cz-select-box').length);
            console.log('Available elements with .ag-cost-graph__option-selector:', document.querySelectorAll('.ag-cost-graph__option-selector').length);
        }
        
    } catch (error) {
        console.error('Error applying series control:', error);
    }
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

/**
 * Check for pending series control after page load
 */
function checkForSeriesControl() {
    console.log('🔍 Checking for series control...');
    
    // Check URL parameters for series control
    const urlParams = new URLSearchParams(window.location.search);
    const seriesFromUrl = urlParams.get('czdf_series');
    
    console.log('🔍 URL parameters:', window.location.search);
    console.log('🔍 Series from URL:', seriesFromUrl);
    
    if (seriesFromUrl) {
        console.log('✅ Found series control from URL:', seriesFromUrl);
        
        // Remove the parameter from URL to clean up
        urlParams.delete('czdf_series');
        const cleanUrl = window.location.pathname + '?' + urlParams.toString();
        window.history.replaceState({}, '', cleanUrl);
        console.log('🧹 Cleaned URL:', cleanUrl);
        
        // Wait for page to fully load, then apply series control
        setTimeout(() => {
            console.log('⏰ Applying series control after page load...');
            applySeriesControl(seriesFromUrl);
        }, 3000);
    } else {
        console.log('❌ No series control found in URL');
    }
    
    // Also check sessionStorage as backup
    const pendingSeries = sessionStorage.getItem('czdf_series_control');
    console.log('🔍 Series from storage:', pendingSeries);
    
    if (pendingSeries && !seriesFromUrl) {
        console.log('✅ Found pending series control in storage:', pendingSeries);
        sessionStorage.removeItem('czdf_series_control');
        
        setTimeout(() => {
            console.log('⏰ Applying series control from storage...');
            applySeriesControl(pendingSeries);
        }, 3000);
    }
}

// Add global function for manual testing
window.testSeriesControl = function(value) {
    console.log('Manual test triggered from console with value:', value);
    applySeriesControl(value || '5');
};

// Initialize content script
console.log('🔧 CloudZero Date Filter content script starting...');
console.log('🔧 Current URL:', window.location.href);
console.log('🔧 Document ready state:', document.readyState);

if (document.readyState === 'loading') {
    console.log('🔧 Document loading, waiting for DOMContentLoaded...');
    document.addEventListener('DOMContentLoaded', () => {
        console.log('🔧 DOMContentLoaded fired');
        observePageChanges();
        checkForSeriesControl();
        console.log('✅ CloudZero Date Filter content script loaded');
    });
} else {
    console.log('🔧 Document already loaded');
    observePageChanges();
    checkForSeriesControl();
    console.log('✅ CloudZero Date Filter content script loaded');
}