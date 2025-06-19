/**
 * CloudZero Date Filter Extension - Popup Interface
 * 
 * EXECUTION ORDER:
 * 1. Module imports and constants
 * 2. HTML templates for content swapping
 * 3. Navigation functions (showSettingsView, showMainView)
 * 4. Settings management functions 
 * 5. Main view functions (filters, saving, applying)
 * 6. UI helper functions (messages, state management)
 * 7. Event listener attachment functions
 * 8. DOMContentLoaded initialization
 */

// =============================================================================
// 1. IMPORTS AND CONSTANTS
// =============================================================================

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

// =============================================================================
// 2. HTML TEMPLATES
// =============================================================================

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
                        <!-- Options will be populated dynamically from constants -->
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
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                <path d="M9 12L11 14L15 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Apply to CloudZero
        </button>
    </section>

    <section class="saved-filters-section">
        <h2 class="section-title">Saved Filters</h2>
        <div class="saved-filters-container">
            <ul id="savedFilters" class="saved-filters-list"></ul>
            <div id="emptyState" class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 11H5M5 11L9 7M5 11L9 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <p>No saved filters yet</p>
                <span>Create your first filter to get started</span>
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

// =============================================================================
// 3. NAVIGATION FUNCTIONS
// =============================================================================

function showSettingsView() {
    const mainContent = document.getElementById('mainContent');
    const header = document.querySelector('.header h1');
    
    if (mainContent && header) {
        // Remove any hide class that might be blocking display
        mainContent.classList.remove('hide');
        
        mainContent.innerHTML = settingsViewHTML;
        header.textContent = 'Settings';
        document.body.classList.add('settings-view');
        
        // Force visibility and layout
        mainContent.style.display = 'flex';
        mainContent.style.flexDirection = 'column';
        mainContent.style.width = '100%';
        mainContent.style.minHeight = '400px';
        mainContent.style.padding = '12px';
        mainContent.style.overflowY = 'auto';
        mainContent.style.visibility = 'visible';
        mainContent.style.opacity = '1';
        
        // Force reflow
        mainContent.offsetHeight;
        
        // Force the body and html to show content with maximum priority
        document.body.style.cssText = `
            height: auto !important;
            min-height: 500px !important;
            width: 350px !important;
            max-height: none !important;
            overflow: visible !important;
            display: block !important;
        `;
        
        document.documentElement.style.cssText = `
            height: auto !important;
            min-height: 500px !important;
            max-height: none !important;
            overflow: visible !important;
        `;
        
        // Force a hard reflow and repaint
        document.body.offsetHeight;
        window.dispatchEvent(new Event('resize'));
        
        // Re-attach settings event listeners
        setTimeout(() => {
            attachSettingsEventListeners();
            loadSettings();
        }, 10);
    }
}

function showMainView() {
    const mainContent = document.getElementById('mainContent');
    const header = document.querySelector('.header h1');
    
    if (mainContent && header) {
        // Remove any hide class that might be blocking display
        mainContent.classList.remove('hide');
        
        mainContent.innerHTML = mainViewHTML;
        header.textContent = 'CloudZero Date Filter';
        document.body.classList.remove('settings-view');
        mainContent.style.cssText = ''; // Reset custom styles
        
        // Reset document body and html styles to defaults
        document.body.style.cssText = '';
        document.documentElement.style.cssText = '';
        
        // Re-attach main view event listeners
        attachMainViewEventListeners();
        
        // Re-initialize main view state
        setTimeout(() => {
            updateSaveButtonState();
            loadSavedFilters();
            loadAdvancedOptionsState();
        }, 0);
    }
}

// =============================================================================
// 4. SETTINGS MANAGEMENT
// =============================================================================

let currentSettings = { ...DEFAULT_SETTINGS };

async function loadSettings() {
    const settings = await getUserSettings();
    currentSettings = { ...DEFAULT_SETTINGS, ...settings };
    populateSettingsUI();
}

function populateSettingsUI() {
    // Populate checkboxes
    const autoApplyEl = document.getElementById('autoApplyFilters');
    const compactModeEl = document.getElementById('compactMode');
    const showNotificationsEl = document.getElementById('showNotifications');
    
    if (autoApplyEl) autoApplyEl.checked = currentSettings.autoApplyFilters;
    if (compactModeEl) compactModeEl.checked = currentSettings.compactMode;
    if (showNotificationsEl) showNotificationsEl.checked = currentSettings.showNotifications;
    
    // Populate default filter dropdown
    populateDefaultFilterDropdown();
}

async function populateDefaultFilterDropdown() {
    const defaultFilterEl = document.getElementById('defaultFilter');
    if (!defaultFilterEl) return;
    
    const filters = await getSavedFilters();
    
    // Clear existing options except "None"
    defaultFilterEl.innerHTML = '<option value="">None</option>';
    
    // Add saved filters as options
    filters.forEach((filter, index) => {
        const option = document.createElement('option');
        option.value = index.toString();
        option.textContent = filter.customName || `${filter.range} (${filter.dates})`;
        defaultFilterEl.appendChild(option);
    });
    
    // Set current selection
    if (currentSettings.defaultFilter) {
        defaultFilterEl.value = currentSettings.defaultFilter;
    }
}

async function saveSettings() {
    await saveUserSettings(currentSettings);
    showSuccessMessage('Settings saved successfully!');
}

function resetSettings() {
    currentSettings = { ...DEFAULT_SETTINGS };
    populateSettingsUI();
    showSuccessMessage('Settings reset to defaults');
}

// Export/Import functions
async function exportFilters() {
    const filters = await getSavedFilters();
    const settings = await getUserSettings();
    
    const exportData = {
        filters,
        settings,
        exportDate: new Date().toISOString(),
        version: "2.2.1"
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cloudzero-filters-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    showSuccessMessage('Filters exported successfully!');
}

async function importFilters(file) {
    if (!file) return;
    
    try {
        const text = await file.text();
        const data = JSON.parse(text);
        
        if (data.filters) {
            for (const filter of data.filters) {
                try {
                    await saveFilter(filter);
                } catch (error) {
                    console.warn('Skipped duplicate filter:', filter.customName);
                }
            }
        }
        
        if (data.settings) {
            await saveUserSettings(data.settings);
            currentSettings = { ...DEFAULT_SETTINGS, ...data.settings };
            populateSettingsUI();
        }
        
        loadSavedFilters();
        showSuccessMessage('Filters imported successfully!');
    } catch (error) {
        showErrorMessage(`Error importing filters: ${error.message}`);
    }
}

function clearAllDataConfirm() {
    if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
        clearAllData().then(() => {
            currentSettings = { ...DEFAULT_SETTINGS };
            populateSettingsUI();
            loadSavedFilters();
            showSuccessMessage('All data cleared successfully!');
        });
    }
}

// Notification function
function showNotification(message, type = 'info') {
    if (!currentSettings.showNotifications) return;
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => notification.remove(), 3000);
}

// =============================================================================
// 5. MAIN VIEW FUNCTIONS
// =============================================================================

function updateSaveButtonState() {
    const dateFilter = document.getElementById("dateFilter");
    const customDateInput = document.getElementById("customDate");
    const customNameInput = document.getElementById("customName");
    const customFields = document.getElementById("customFields");
    const saveButton = document.getElementById("saveFilter");
    
    if (!dateFilter || !saveButton) return;
    
    const isCustomSelected = dateFilter.value === DATE_RANGES.CUSTOM;
    
    // Show/hide custom fields
    if (customFields) {
        if (isCustomSelected) {
            customFields.classList.add('show');
        } else {
            customFields.classList.remove('show');
        }
    }
    
    // Update save button state
    if (isCustomSelected) {
        const hasCustomDate = customDateInput?.value?.trim();
        const hasCustomName = customNameInput?.value?.trim();
        saveButton.disabled = !hasCustomDate || !hasCustomName;
    } else {
        saveButton.disabled = false;
    }
}

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

function getAdvancedParameters() {
    const costType = document.getElementById("costType")?.value || null;
    const granularity = document.getElementById("granularity")?.value || null;
    const groupBy = document.getElementById("groupBy")?.value || null;
    
    return {
        costType: costType || null,
        granularity: granularity || null,
        groupBy: groupBy || null,
        filters: null
    };
}

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

// =============================================================================
// 6. UI HELPER FUNCTIONS
// =============================================================================

function populateGroupByOptions() {
    const groupBySelect = document.getElementById('groupBy');
    if (!groupBySelect) return;
    
    // Clear existing options
    groupBySelect.innerHTML = '';
    
    // Populate with all options from constants
    CLOUDZERO_PARAMETERS.GROUP_BY_OPTIONS.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option.value;
        optionElement.textContent = option.label;
        
        // Set default selection
        if (option.value === CLOUDZERO_PARAMETERS.DEFAULTS.groupBy) {
            optionElement.selected = true;
        }
        
        groupBySelect.appendChild(optionElement);
    });
}

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

// =============================================================================
// 7. EVENT LISTENER ATTACHMENT FUNCTIONS
// =============================================================================

function attachMainViewEventListeners() {
    const dateFilter = document.getElementById("dateFilter");
    const customDateInput = document.getElementById("customDate");
    const customNameInput = document.getElementById("customName");
    const advancedToggle = document.getElementById("advancedToggle");
    const saveButton = document.getElementById("saveFilter");
    const applyButton = document.getElementById("applyFilter");
    
    // Main form interactions
    if (dateFilter) {
        dateFilter.addEventListener("change", updateSaveButtonState);
    }
    
    if (customDateInput) {
        customDateInput.addEventListener("input", updateSaveButtonState);
    }
    
    if (customNameInput) {
        customNameInput.addEventListener("input", updateSaveButtonState);
    }
    
    if (advancedToggle) {
        advancedToggle.addEventListener("change", toggleAdvancedOptions);
    }
    
    // Action buttons
    if (saveButton) {
        saveButton.addEventListener("click", handleSaveFilter);
    }
    
    if (applyButton) {
        applyButton.addEventListener("click", handleApplyFilter);
    }
}

function attachSettingsEventListeners() {
    // Back button
    const backButton = document.getElementById('backButton');
    if (backButton) {
        backButton.addEventListener('click', showMainView);
    }
    
    // Settings form elements
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

    // Action buttons
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

// =============================================================================
// 8. INITIALIZATION
// =============================================================================

document.addEventListener("DOMContentLoaded", function () {
    // Initialize main view content
    const mainContent = document.getElementById('mainContent');
    if (mainContent) {
        mainContent.innerHTML = mainViewHTML;
        attachMainViewEventListeners();
        
        // Initialize UI state
        setTimeout(() => {
            populateGroupByOptions();
            updateSaveButtonState();
            loadSavedFilters();
            loadAdvancedOptionsState();
        }, 0);
    }
    
    // Attach settings button listener
    const settingsButton = document.getElementById("settingsButton");
    if (settingsButton) {
        // Make button keyboard accessible
        settingsButton.setAttribute('tabindex', '0');
        
        // Handle direct clicks
        settingsButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            showSettingsView();
        });
        
        // Handle keyboard navigation
        settingsButton.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                showSettingsView();
            }
        });
        
        // Fallback: Handle clicks on the header area
        const header = document.querySelector('.header');
        if (header) {
            header.addEventListener('click', (e) => {
                const clickedButton = e.target.closest('#settingsButton');
                if (clickedButton) {
                    e.preventDefault();
                    e.stopPropagation();
                    showSettingsView();
                }
            });
        }
    }
});