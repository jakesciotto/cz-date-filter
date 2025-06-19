/**
 * CloudZero Date Filter Extension - Popup Interface
 */

// Add immediate console log to test if JavaScript is loading
console.log("=== POPUP.JS LOADING ===");

import { 
    parseFlexibleDateInput, 
    calculateDateRange 
} from '../shared/date-utils.js';
import { 
    getSavedFilters, 
    saveFilter, 
    deleteFilter, 
    createFilter,
    getUserSettings,
    saveUserSettings,
    clearAllData
} from '../shared/storage-utils.js';
import { applyDateFilterToTab } from '../shared/url-utils.js';
import { DATE_RANGES, UI_MESSAGES, CLOUDZERO_PARAMETERS } from '../shared/constants.js';

console.log("=== IMPORTS LOADED ===");

// Feature flags
const FEATURE_FLAGS = {
    ENABLE_FILTERS: false // Set to true to enable additional filters
};

// Default settings
const DEFAULT_SETTINGS = {
    autoApplyFilters: false,
    defaultFilter: '',
    theme: 'auto',
    compactMode: false,
    showNotifications: true,
    enableShortcuts: true
};

// Content templates
const mainViewHTML = `
    <section class="date-selection">
        <div class="form-field">
            <label for="dateFilter" class="form-label">Date Range</label>
            <div class="select-wrapper">
                <select id="dateFilter" class="form-select">
                    <option value="Last 7 Days">Last 7 Days</option>
                    <option value="Last 14 Days">Last 14 Days</option>
                    <option value="Last 28 Days">Last 28 Days</option>
                    <option value="Last 30 Days">Last 30 Days</option>
                    <option value="Last 90 Days">Last 90 Days</option>
                    <option value="Custom">Custom Range</option>
                </select>
            </div>
        </div>

        <div class="custom-fields" id="customFields">
            <div class="form-field">
                <label for="customDate" class="form-label">Date Range</label>
                <input id="customDate" type="text" class="form-input" placeholder="e.g. last 45 days, 01/15/2025 to 02/28/2025" />
            </div>
            
            <div class="form-field">
                <label for="customName" class="form-label">Filter Name</label>
                <input id="customName" type="text" class="form-input" placeholder="Enter a name for your filter" />
            </div>
        </div>
    </section>

    <section class="advanced-options-section">
        <div class="advanced-toggle">
            <label class="toggle-label">
                <input type="checkbox" id="advancedToggle" class="toggle-checkbox">
                <span class="toggle-switch"></span>
                <span class="toggle-text">Advanced CloudZero Options</span>
            </label>
        </div>

        <div class="advanced-fields" id="advancedFields">
            <div class="form-field">
                <label for="costType" class="form-label">Cost Type</label>
                <div class="select-wrapper">
                    <select id="costType" class="form-select">
                        <option value="billed_cost">Billed Cost</option>
                        <option value="discounted_cost">Discounted Cost</option>
                        <option value="invoiced_amortized_cost">Invoiced Amortized Cost</option>
                        <option value="real_cost" selected>Real Cost</option>
                        <option value="on_demand_cost">On-Demand Cost</option>
                    </select>
                </div>
            </div>

            <div class="form-field">
                <label for="granularity" class="form-label">Granularity</label>
                <div class="select-wrapper">
                    <select id="granularity" class="form-select">
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                    </select>
                </div>
            </div>

            <div class="form-field">
                <label for="groupBy" class="form-label">Group By</label>
                <div class="select-wrapper">
                    <select id="groupBy" class="form-select">
                        <option value="">None</option>
                        <option value="account">Account</option>
                        <option value="service">Service</option>
                        <option value="region">Region</option>
                    </select>
                </div>
            </div>
        </div>
    </section>

    <section class="actions">
        <button id="saveFilter" class="btn btn-secondary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16L21 8V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
                <path d="M17 21V13H7V21" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
                <path d="M7 3V8H15" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
            </svg>
            Save Filter
        </button>
        <button id="applyFilter" class="btn btn-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 12L10 17L20 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Apply Filter
        </button>
    </section>

    <section class="saved-filters-section">
        <h2 class="section-title">Saved Filters</h2>
        <div class="saved-filters-container">
            <ul id="savedFilters" class="saved-filters-list"></ul>
            <div id="emptyState" class="empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
                    <path d="M14 2V8H20" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
                    <path d="M16 13H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M16 17H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M10 9H9H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <p>No saved filters yet</p>
                <span>Create custom filters to save them here</span>
            </div>
        </div>
    </section>
`;

const settingsViewHTML = `
    <div class="settings-header">
        <button id="backButton" class="back-button" title="Back to main">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 12H5m0 0l7 7m-7-7l7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Back
        </button>
        <h2>Settings</h2>
    </div>
    
    <section class="settings-section">
        <h3>Default Filters</h3>
        <div class="setting-group">
            <label class="setting-item">
                <input type="checkbox" id="autoApplyFilters">
                <span class="checkmark"></span>
                <span class="setting-label">Auto-apply saved filters on page load</span>
            </label>
        </div>
        
        <div class="setting-group">
            <label for="defaultFilter" class="setting-label">Default Filter</label>
            <select id="defaultFilter" class="setting-select">
                <option value="">None</option>
            </select>
        </div>
    </section>

    <section class="settings-section">
        <h3>UI Preferences</h3>
        <div class="setting-group">
            <label class="setting-item">
                <input type="checkbox" id="compactMode">
                <span class="checkmark"></span>
                <span class="setting-label">Compact mode</span>
            </label>
        </div>

        <div class="setting-group">
            <label class="setting-item">
                <input type="checkbox" id="showNotifications">
                <span class="checkmark"></span>
                <span class="setting-label">Show notifications</span>
            </label>
        </div>
    </section>

    <section class="settings-section">
        <h3>Data Management</h3>
        <div class="setting-group">
            <button id="exportFilters" class="action-button secondary">Export Saved Filters</button>
        </div>

        <div class="setting-group">
            <label for="importFilters" class="action-button secondary">
                Import Filters
                <input type="file" id="importFilters" accept=".json" style="display: none;">
            </label>
        </div>

        <div class="setting-group">
            <button id="clearAllData" class="action-button danger">Clear All Data</button>
        </div>
    </section>

    <div class="settings-footer">
        <div class="footer-actions">
            <button id="resetSettings" class="action-button secondary">Reset to Defaults</button>
            <button id="saveSettings" class="action-button primary">Save Settings</button>
        </div>
    </div>
`;

// Navigation functions
function showSettingsView() {
    console.log("=== showSettingsView called ===");
    const mainContent = document.getElementById('mainContent');
    const header = document.querySelector('.header h1');
    
    console.log("mainContent element:", mainContent);
    console.log("header element:", header);
    console.log("settingsViewHTML length:", settingsViewHTML.length);
    
    if (mainContent && header) {
        console.log("Elements found, setting innerHTML...");
        mainContent.innerHTML = settingsViewHTML;
        console.log("innerHTML set, new content:", mainContent.innerHTML.substring(0, 100) + "...");
        
        header.textContent = 'Settings';
        document.body.classList.add('settings-view');
        
        console.log("Body classes:", document.body.className);
        
        // Re-attach settings event listeners
        attachSettingsEventListeners();
        loadSettings();
        
        console.log("Settings view loaded successfully");
    } else {
        console.error("Could not find required elements:");
        console.error("- mainContent:", mainContent);
        console.error("- header:", header);
    }
}

function showMainView() {
    console.log("Showing main view");
    const mainContent = document.getElementById('mainContent');
    const header = document.querySelector('.header h1');
    
    if (mainContent && header) {
        mainContent.innerHTML = mainViewHTML;
        header.textContent = 'CloudZero Date Filter';
        document.body.classList.remove('settings-view');
        
        // Re-attach main view event listeners
        attachMainViewEventListeners();
        
        // Re-initialize main view - use setTimeout to ensure DOM is ready
        setTimeout(() => {
            updateSaveButtonState();
            loadSavedFilters();
            loadAdvancedOptionsState();
        }, 0);
        
        console.log("Main view loaded");
    } else {
        console.error("Could not find mainContent element");
    }
}

// Settings management
let currentSettings = { ...DEFAULT_SETTINGS };

async function loadSettings() {
    const settings = await getUserSettings();
    currentSettings = { ...DEFAULT_SETTINGS, ...settings };
    populateSettingsUI();
}

function populateSettingsUI() {
    // Checkboxes
    document.getElementById('autoApplyFilters').checked = currentSettings.autoApplyFilters;
    document.getElementById('compactMode').checked = currentSettings.compactMode;
    document.getElementById('showNotifications').checked = currentSettings.showNotifications;

    // Selects
    document.getElementById('theme').value = currentSettings.theme;
    
    // Populate default filter dropdown
    populateDefaultFilterDropdown();

    // Apply compact mode class if enabled
    if (currentSettings.compactMode) {
        document.body.classList.add('compact');
    }
}

async function populateDefaultFilterDropdown() {
    const select = document.getElementById('defaultFilter');
    const savedFilters = await getSavedFilters();
    
    // Clear existing options except "None"
    while (select.children.length > 1) {
        select.removeChild(select.lastChild);
    }

    // Add saved filters
    savedFilters.forEach((filter, index) => {
        const option = document.createElement('option');
        option.value = index.toString();
        option.textContent = filter.customName || `Filter ${index + 1}`;
        select.appendChild(option);
    });

    // Set current value
    select.value = currentSettings.defaultFilter;
}

async function saveSettings() {
    await saveUserSettings(currentSettings);
    showNotification('Settings saved successfully!', 'success');
}

function resetSettings() {
    const confirmed = confirm('Are you sure you want to reset all settings to defaults?');
    
    if (confirmed) {
        currentSettings = { ...DEFAULT_SETTINGS };
        populateSettingsUI();
        showNotification('Settings reset to defaults!', 'success');
    }
}

async function exportFilters() {
    const filters = await getSavedFilters();
    const dataStr = JSON.stringify(filters, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cloudzero-filters-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showNotification('Filters exported successfully!', 'success');
}

async function importFilters(file) {
    if (!file) return;

    try {
        const text = await file.text();
        const importedFilters = JSON.parse(text);
        
        if (!Array.isArray(importedFilters)) {
            throw new Error('Invalid file format');
        }

        // Validate filter structure
        for (const filter of importedFilters) {
            if (!filter.range && !filter.dates) {
                throw new Error('Invalid filter structure');
            }
        }

        // Merge with existing filters
        const existingFilters = await getSavedFilters();
        const mergedFilters = [...existingFilters, ...importedFilters];

        chrome.storage.sync.set({ savedFilters: mergedFilters }, () => {
            loadSavedFilters();
            populateDefaultFilterDropdown();
            showNotification(`Imported ${importedFilters.length} filters successfully!`, 'success');
        });

    } catch (error) {
        console.error('Import error:', error);
        showNotification('Failed to import filters. Please check the file format.', 'error');
    }
}

function clearAllDataConfirm() {
    const confirmed = confirm(
        'Are you sure you want to clear all data? This will remove all saved filters and reset settings to defaults. This action cannot be undone.'
    );

    if (confirmed) {
        clearAllData().then(() => {
            currentSettings = { ...DEFAULT_SETTINGS };
            populateSettingsUI();
            loadSavedFilters();
            showNotification('All data cleared successfully!', 'success');
        });
    }
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Style the notification
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '12px 24px',
        borderRadius: '6px',
        color: 'white',
        fontWeight: '500',
        zIndex: '10000',
        opacity: '0',
        transform: 'translateY(-20px)',
        transition: 'all 0.3s ease'
    });

    // Set background color based on type
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        info: '#2563eb',
        warning: '#f59e0b'
    };
    notification.style.backgroundColor = colors[type] || colors.info;

    // Add to page
    document.body.appendChild(notification);

    // Animate in
    requestAnimationFrame(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateY(0)';
    });

    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-20px)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

/**
 * Updates the state of UI elements based on filter selection
 */
function updateSaveButtonState() {
    const dateFilter = document.getElementById("dateFilter");
    const customFields = document.getElementById('customFields');
    const saveButton = document.getElementById("saveFilter");
    const customDateInput = document.getElementById("customDate");
    
    if (!dateFilter || !customFields) return;
    
    const isCustomSelected = dateFilter.value === DATE_RANGES.CUSTOM;
    
    // Toggle custom fields visibility with smooth animation
    if (isCustomSelected) {
        customFields.classList.add('show');
    } else {
        customFields.classList.remove('show');
    }
    
    // Save button is always enabled now (if it exists)
    if (saveButton) {
        saveButton.disabled = false;
    }
    
    // Update input states only for custom inputs when not custom
    if (isCustomSelected && customDateInput) {
        customDateInput.disabled = false;
    }
}

/**
 * Toggles the advanced options section
 */
function toggleAdvancedOptions() {
    const advancedToggle = document.getElementById("advancedToggle");
    const advancedFields = document.getElementById("advancedFields");
    
    if (!advancedToggle || !advancedFields) return;
    
    if (advancedToggle.checked) {
        advancedFields.classList.add('show');
    } else {
        advancedFields.classList.remove('show');
    }
    
    // Save state to storage
    chrome.storage.sync.set({ advancedOptionsEnabled: advancedToggle.checked });
}

/**
 * Loads the state of advanced options from storage
 */
function loadAdvancedOptionsState() {
    const advancedToggle = document.getElementById("advancedToggle");
    if (!advancedToggle) return;
    
    chrome.storage.sync.get("advancedOptionsEnabled", (data) => {
        if (data.advancedOptionsEnabled) {
            advancedToggle.checked = true;
            toggleAdvancedOptions();
        }
    });
}

/**
 * Handles saving a filter
 */
async function handleSaveFilter() {
    const dateFilter = document.getElementById("dateFilter");
    const customDateInput = document.getElementById("customDate");
    const customNameInput = document.getElementById("customName");
    const saveButton = document.getElementById("saveFilter");
    
    if (!dateFilter || !saveButton) return;
    
    // Add loading state
    saveButton.classList.add('loading');
    saveButton.disabled = true;
    
    try {
        let range = dateFilter.value;
        let dates = null;
        let customName = null;

        if (range === DATE_RANGES.CUSTOM) {
            if (!customDateInput?.value?.trim()) {
                showErrorMessage('Please enter a date range');
                customDateInput?.focus();
                return;
            }
            dates = customDateInput.value.trim();
        }

        if (customNameInput?.value?.trim()) {
            customName = customNameInput.value.trim();
        }

        const advancedParams = getAdvancedParameters();
        const filter = createFilter(range, dates, customName, advancedParams);

        await saveFilter(filter);
        loadSavedFilters();
        
        if (customNameInput) customNameInput.value = "";
        if (range === DATE_RANGES.CUSTOM && customDateInput) {
            customDateInput.value = "";
        }
        
        showSuccessMessage('Filter saved successfully!');
    } catch (error) {
        if (error.message.includes('already exists')) {
            showErrorMessage(error.message);
            customNameInput?.focus();
            customNameInput?.select();
        } else {
            showErrorMessage(`Error saving filter: ${error.message}`);
        }
    } finally {
        saveButton.classList.remove('loading');
        saveButton.disabled = false;
    }
}

/**
 * Handles applying a filter
 */
async function handleApplyFilter() {
    const dateFilter = document.getElementById("dateFilter");
    const customDateInput = document.getElementById("customDate");
    const applyButton = document.getElementById("applyFilter");
    
    if (!dateFilter || !applyButton) return;
    
    // Add loading state
    applyButton.classList.add('loading');
    applyButton.disabled = true;
    
    try {
        let startDate, endDate;

        if (dateFilter.value === DATE_RANGES.CUSTOM) {
            const customDate = customDateInput?.value?.trim();
            if (!customDate) {
                showErrorMessage('Please enter a date range');
                customDateInput?.focus();
                return;
            }
            
            const parsedDates = parseFlexibleDateInput(customDate);
            startDate = parsedDates.startDate;
            endDate = parsedDates.endDate;
        } else {
            const dateRange = calculateDateRange(dateFilter.value);
            startDate = dateRange.startDate;
            endDate = dateRange.endDate;
        }

        const advancedParams = getAdvancedParameters();
        await applyDateFilterToTab(startDate, endDate, advancedParams);
        showSuccessMessage('Filter applied to CloudZero!');
        
        // Close popup after successful application
        setTimeout(() => {
            window.close();
        }, 1500);
    } catch (error) {
        showErrorMessage(`Error applying filter: ${error.message}`);
    } finally {
        applyButton.classList.remove('loading');
        applyButton.disabled = false;
    }
}

/**
 * Gets advanced parameters from the form
 */
function getAdvancedParameters() {
    const costType = document.getElementById("costType")?.value || null;
    const granularity = document.getElementById("granularity")?.value || null;
    const groupBy = document.getElementById("groupBy")?.value || null;
    const filters = document.getElementById("filters")?.value || null;
    
    return {
        costType: costType || null,
        granularity: granularity || null,
        groupBy: groupBy || null,
        filters: filters || null
    };
}

/**
 * Loads saved filters and displays them
 */
async function loadSavedFilters() {
    const savedFiltersList = document.getElementById("savedFilters");
    const emptyState = document.getElementById('emptyState');
    
    if (!savedFiltersList) {
        console.log("savedFilters element not found, skipping loadSavedFilters");
        return;
    }
    
    savedFiltersList.innerHTML = "";
    const filters = await getSavedFilters();
    
    // Show/hide empty state
    if (emptyState) {
        if (filters.length === 0) {
            emptyState.style.display = 'flex';
        } else {
            emptyState.style.display = 'none';
        }
    }
    
    filters.forEach((filter, index) => {
        const li = document.createElement("li");
        li.classList.add("filter-item");
        const displayText = filter.customName || `${filter.range} (${filter.dates})`;
        li.innerHTML = `
            <span class="filter-text" data-index="${index}">${displayText}</span> 
            <button class="delete-btn" data-index="${index}" aria-label="Delete filter">×</button>
        `;
        
        savedFiltersList.appendChild(li);
    });
    
    // Attach event listeners to new elements
    attachFilterListeners();
}

/**
 * Attaches event listeners to filter list items
 */
function attachFilterListeners() {
    const deleteButtons = document.querySelectorAll('.delete-btn');
    const filterTexts = document.querySelectorAll('.filter-text');
    
    deleteButtons.forEach(button => {
        button.addEventListener('click', async (e) => {
            e.stopPropagation();
            const index = parseInt(button.dataset.index);
            await deleteFilter(index);
            loadSavedFilters();
            showSuccessMessage('Filter deleted successfully!');
        });
    });
    
    filterTexts.forEach(text => {
        text.addEventListener('click', async (e) => {
            const index = parseInt(text.dataset.index);
            const filters = await getSavedFilters();
            const selectedFilter = filters[index];
            
            if (selectedFilter) {
                const dateFilter = document.getElementById("dateFilter");
                const customDateInput = document.getElementById("customDate");
                const customNameInput = document.getElementById("customName");
                
                if (dateFilter) dateFilter.value = selectedFilter.range;
                if (customDateInput) customDateInput.value = selectedFilter.dates;
                if (customNameInput) customNameInput.value = selectedFilter.customName || "";
                
                updateSaveButtonState();
            }
        });
    });
}

/**
 * Shows a success message
 */
function showSuccessMessage(message) {
    const existingMessage = document.querySelector('.success-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--green-500);
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        box-shadow: var(--shadow-lg);
        z-index: 1000;
        opacity: 0;
        transform: translateX(100%);
        transition: all 300ms ease;
    `;
    successDiv.textContent = message;
    
    document.body.appendChild(successDiv);
    
    requestAnimationFrame(() => {
        successDiv.style.opacity = '1';
        successDiv.style.transform = 'translateX(0)';
    });
    
    setTimeout(() => {
        successDiv.style.opacity = '0';
        successDiv.style.transform = 'translateX(100%)';
        setTimeout(() => successDiv.remove(), 300);
    }, 3000);
}

/**
 * Shows an error message
 */
function showErrorMessage(message) {
    const existingMessage = document.querySelector('.error-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--red-500);
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        box-shadow: var(--shadow-lg);
        z-index: 1000;
        opacity: 0;
        transform: translateX(100%);
        transition: all 300ms ease;
    `;
    errorDiv.textContent = message;
    
    document.body.appendChild(errorDiv);
    
    requestAnimationFrame(() => {
        errorDiv.style.opacity = '1';
        errorDiv.style.transform = 'translateX(0)';
    });
    
    setTimeout(() => {
        errorDiv.style.opacity = '0';
        errorDiv.style.transform = 'translateX(100%)';
        setTimeout(() => errorDiv.remove(), 300);
    }, 3000);
}

// Function to attach main view event listeners
function attachMainViewEventListeners() {
    const dateFilter = document.getElementById("dateFilter");
    const advancedToggle = document.getElementById("advancedToggle");
    const saveButton = document.getElementById("saveFilter");
    const applyButton = document.getElementById("applyFilter");
    
    if (dateFilter) dateFilter.addEventListener("change", updateSaveButtonState);
    if (advancedToggle) advancedToggle.addEventListener("change", toggleAdvancedOptions);
    if (saveButton) saveButton.addEventListener("click", handleSaveFilter);
    if (applyButton) applyButton.addEventListener("click", handleApplyFilter);
}

document.addEventListener("DOMContentLoaded", function () {
    console.log("DOM loaded, looking for settings button...");
    const settingsButton = document.getElementById("settingsButton");
    console.log("Settings button element:", settingsButton);
    
    // Let's also try a different selector in case the ID isn't working
    const settingsButtonAlt = document.querySelector('.settings-button');
    console.log("Settings button (by class):", settingsButtonAlt);
    
    // Log all buttons to see what's available
    const allButtons = document.querySelectorAll('button');
    console.log("All buttons found:", allButtons);


    

    // Load main view initially
    const mainContent = document.getElementById('mainContent');
    if (mainContent) {
        mainContent.innerHTML = mainViewHTML;
        attachMainViewEventListeners();
        
        // Initialize UI - use setTimeout to ensure DOM is ready
        setTimeout(() => {
            updateSaveButtonState();
            loadSavedFilters();
            loadAdvancedOptionsState();
        }, 0);
    }
    
    // Navigation event listeners
    const targetButton = settingsButton || settingsButtonAlt;
    if (targetButton) {
        console.log("Settings button found, attaching listener to:", targetButton);
        targetButton.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Settings button clicked!");
            showSettingsView();
        });
        
        // Add a visual test - change button color when we hover
        targetButton.style.transition = "background-color 0.2s";
        targetButton.addEventListener("mouseenter", () => {
            console.log("Mouse entered settings button");
            targetButton.style.backgroundColor = "rgba(255,255,255,0.3)";
        });
        targetButton.addEventListener("mouseleave", () => {
            targetButton.style.backgroundColor = "";
        });
        
    } else {
        console.error("Settings button not found!");
        console.log("Available buttons:", allButtons);
    }
    
});

// Settings event listeners function
function attachSettingsEventListeners() {
    console.log("Attaching settings event listeners");
    
    // Back button
    const backButton = document.getElementById('backButton');
    if (backButton) {
        backButton.addEventListener('click', () => {
            console.log("Back button clicked");
            showMainView();
        });
    }
    
    const autoApplyEl = document.getElementById('autoApplyFilters');
    const compactModeEl = document.getElementById('compactMode');
    const showNotificationsEl = document.getElementById('showNotifications');
    const defaultFilterEl = document.getElementById('defaultFilter');
    
    if (autoApplyEl) {
        autoApplyEl.addEventListener('change', (e) => {
            currentSettings.autoApplyFilters = e.target.checked;
        });
    }

    if (compactModeEl) {
        compactModeEl.addEventListener('change', (e) => {
            currentSettings.compactMode = e.target.checked;
            document.body.classList.toggle('compact', e.target.checked);
        });
    }

    if (showNotificationsEl) {
        showNotificationsEl.addEventListener('change', (e) => {
            currentSettings.showNotifications = e.target.checked;
        });
    }

    if (defaultFilterEl) {
        defaultFilterEl.addEventListener('change', (e) => {
            currentSettings.defaultFilter = e.target.value;
        });
    }

    // Settings action buttons
    const exportBtn = document.getElementById('exportFilters');
    const importBtn = document.getElementById('importFilters');
    const clearBtn = document.getElementById('clearAllData');
    const resetBtn = document.getElementById('resetSettings');
    const saveBtn = document.getElementById('saveSettings');
    
    if (exportBtn) exportBtn.addEventListener('click', exportFilters);
    if (importBtn) {
        importBtn.addEventListener('change', (e) => {
            importFilters(e.target.files[0]);
            e.target.value = ''; // Reset file input
        });
    }
    if (clearBtn) clearBtn.addEventListener('click', clearAllDataConfirm);
    if (resetBtn) resetBtn.addEventListener('click', resetSettings);
    if (saveBtn) saveBtn.addEventListener('click', saveSettings);
}