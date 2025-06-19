/**
 * Settings page functionality for CloudZero Date Filter extension
 */

import { getSavedFilters } from '../shared/storage-utils.js';

// Default settings
const DEFAULT_SETTINGS = {
    autoApplyFilters: false,
    defaultFilter: '',
    theme: 'auto',
    compactMode: false,
    showNotifications: true,
    enableShortcuts: true
};

// Settings management
class SettingsManager {
    constructor() {
        this.settings = { ...DEFAULT_SETTINGS };
        this.savedFilters = [];
        this.init();
    }

    async init() {
        await this.loadSettings();
        await this.loadSavedFilters();
        this.bindEvents();
        this.populateUI();
        this.applyTheme();
    }

    /**
     * Load settings from Chrome storage
     */
    async loadSettings() {
        return new Promise((resolve) => {
            chrome.storage.sync.get('userSettings', (data) => {
                this.settings = { ...DEFAULT_SETTINGS, ...data.userSettings };
                resolve();
            });
        });
    }

    /**
     * Save settings to Chrome storage
     */
    async saveSettings() {
        return new Promise((resolve) => {
            chrome.storage.sync.set({ userSettings: this.settings }, () => {
                console.log('Settings saved:', this.settings);
                resolve();
            });
        });
    }

    /**
     * Load saved filters for default filter dropdown
     */
    async loadSavedFilters() {
        this.savedFilters = await getSavedFilters();
    }

    /**
     * Populate UI with current settings
     */
    populateUI() {
        // Checkboxes
        document.getElementById('autoApplyFilters').checked = this.settings.autoApplyFilters;
        document.getElementById('compactMode').checked = this.settings.compactMode;
        document.getElementById('showNotifications').checked = this.settings.showNotifications;
        document.getElementById('enableShortcuts').checked = this.settings.enableShortcuts;

        // Selects
        document.getElementById('theme').value = this.settings.theme;
        
        // Populate default filter dropdown
        this.populateDefaultFilterDropdown();

        // Apply compact mode class if enabled
        if (this.settings.compactMode) {
            document.body.classList.add('compact');
        }
    }

    /**
     * Populate default filter dropdown with saved filters
     */
    populateDefaultFilterDropdown() {
        const select = document.getElementById('defaultFilter');
        
        // Clear existing options except "None"
        while (select.children.length > 1) {
            select.removeChild(select.lastChild);
        }

        // Add saved filters
        this.savedFilters.forEach((filter, index) => {
            const option = document.createElement('option');
            option.value = index.toString();
            option.textContent = filter.customName || `Filter ${index + 1}`;
            select.appendChild(option);
        });

        // Set current value
        select.value = this.settings.defaultFilter;
    }

    /**
     * Apply theme to the page
     */
    applyTheme() {
        const theme = this.settings.theme;
        
        if (theme === 'auto') {
            // Use system preference
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
        } else {
            document.documentElement.setAttribute('data-theme', theme);
        }
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Back button
        document.getElementById('backButton').addEventListener('click', () => {
            this.navigateBack();
        });

        // Setting changes
        document.getElementById('autoApplyFilters').addEventListener('change', (e) => {
            this.settings.autoApplyFilters = e.target.checked;
        });

        document.getElementById('compactMode').addEventListener('change', (e) => {
            this.settings.compactMode = e.target.checked;
            document.body.classList.toggle('compact', e.target.checked);
        });

        document.getElementById('showNotifications').addEventListener('change', (e) => {
            this.settings.showNotifications = e.target.checked;
        });

        document.getElementById('enableShortcuts').addEventListener('change', (e) => {
            this.settings.enableShortcuts = e.target.checked;
        });

        document.getElementById('theme').addEventListener('change', (e) => {
            this.settings.theme = e.target.value;
            this.applyTheme();
        });

        document.getElementById('defaultFilter').addEventListener('change', (e) => {
            this.settings.defaultFilter = e.target.value;
        });

        // Action buttons
        document.getElementById('exportFilters').addEventListener('click', () => {
            this.exportFilters();
        });

        document.getElementById('importFilters').addEventListener('change', (e) => {
            this.importFilters(e.target.files[0]);
        });

        document.getElementById('clearAllData').addEventListener('click', () => {
            this.clearAllData();
        });

        document.getElementById('resetSettings').addEventListener('click', () => {
            this.resetSettings();
        });

        document.getElementById('saveSettings').addEventListener('click', () => {
            this.saveSettingsAndNotify();
        });

        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
            if (this.settings.theme === 'auto') {
                this.applyTheme();
            }
        });
    }

    /**
     * Navigate back to main popup
     */
    navigateBack() {
        // Close current tab and open popup
        chrome.action.openPopup();
        window.close();
    }

    /**
     * Export saved filters as JSON
     */
    async exportFilters() {
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

        this.showNotification('Filters exported successfully!', 'success');
    }

    /**
     * Import filters from JSON file
     */
    async importFilters(file) {
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
                this.loadSavedFilters().then(() => {
                    this.populateDefaultFilterDropdown();
                    this.showNotification(`Imported ${importedFilters.length} filters successfully!`, 'success');
                });
            });

        } catch (error) {
            console.error('Import error:', error);
            this.showNotification('Failed to import filters. Please check the file format.', 'error');
        }

        // Reset file input
        document.getElementById('importFilters').value = '';
    }

    /**
     * Clear all data with confirmation
     */
    clearAllData() {
        const confirmed = confirm(
            'Are you sure you want to clear all data? This will remove all saved filters and reset settings to defaults. This action cannot be undone.'
        );

        if (confirmed) {
            chrome.storage.sync.clear(() => {
                this.settings = { ...DEFAULT_SETTINGS };
                this.savedFilters = [];
                this.populateUI();
                this.applyTheme();
                this.showNotification('All data cleared successfully!', 'success');
            });
        }
    }

    /**
     * Reset settings to defaults
     */
    resetSettings() {
        const confirmed = confirm('Are you sure you want to reset all settings to defaults?');
        
        if (confirmed) {
            this.settings = { ...DEFAULT_SETTINGS };
            this.populateUI();
            this.applyTheme();
            this.showNotification('Settings reset to defaults!', 'success');
        }
    }

    /**
     * Save settings and show notification
     */
    async saveSettingsAndNotify() {
        try {
            await this.saveSettings();
            this.showNotification('Settings saved successfully!', 'success');
        } catch (error) {
            console.error('Save error:', error);
            this.showNotification('Failed to save settings. Please try again.', 'error');
        }
    }

    /**
     * Show notification message
     */
    showNotification(message, type = 'info') {
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
}

// Initialize settings manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SettingsManager();
});

// Export for potential use by other modules
export { SettingsManager, DEFAULT_SETTINGS };