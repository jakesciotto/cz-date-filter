/**
 * CloudZero Date Filter Extension - Background Service Worker
 * Handles background tasks and messaging
 */

import { CLOUDZERO_CONFIG } from '../shared/constants.js';

// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
    console.log('CloudZero Date Filter extension installed');
});

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
        case 'urlChanged':
            handleUrlChange(request.url);
            break;
        case 'getActiveTab':
            getActiveTab().then(sendResponse);
            return true; // Will respond asynchronously
        default:
            break;
    }
});

/**
 * Handles URL changes in CloudZero pages
 * @param {string} url - New URL
 */
function handleUrlChange(url) {
    // Could be used for analytics or state management
    console.log('CloudZero URL changed:', url);
}

/**
 * Gets information about the active tab
 * @returns {Promise<Object>} Tab information
 */
async function getActiveTab() {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const activeTab = tabs[0];
    
    return {
        id: activeTab.id,
        url: activeTab.url,
        isCloudZeroPage: activeTab.url?.includes(CLOUDZERO_CONFIG.BASE_URL) || false
    };
}