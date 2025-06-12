/**
 * CloudZero Date Filter Extension - Popup Interface
 */

import { 
    parseFlexibleDateInput, 
    calculateDateRange 
} from '../shared/date-utils.js';
import { 
    getSavedFilters, 
    saveFilter, 
    deleteFilter, 
    createFilter 
} from '../shared/storage-utils.js';
import { applyDateFilterToTab } from '../shared/url-utils.js';
import { DATE_RANGES, UI_MESSAGES, CLOUDZERO_PARAMETERS } from '../shared/constants.js';

// Feature flags
const FEATURE_FLAGS = {
    ENABLE_FILTERS: false // Set to true to enable additional filters
};

document.addEventListener("DOMContentLoaded", function () {
    const dateFilter = document.getElementById("dateFilter");
    const customDateInput = document.getElementById("customDate");
    const saveButton = document.getElementById("saveFilter");
    const applyButton = document.getElementById("applyFilter");
    const savedFiltersList = document.getElementById("savedFilters");
    const customNameInput = document.getElementById("customName");
    
    // Advanced options elements
    const advancedToggle = document.getElementById("advancedToggle");
    const advancedFields = document.getElementById("advancedFields");
    const costTypeSelect = document.getElementById("costType");
    const granularitySelect = document.getElementById("granularity");
    const groupBySelect = document.getElementById("groupBy");
    const filtersInput = document.getElementById("filters");

    /**
     * Updates the state of UI elements based on filter selection
     */
    function updateSaveButtonState() {
        const isCustomSelected = dateFilter.value === DATE_RANGES.CUSTOM;
        const customFields = document.getElementById('customFields');
        
        // Toggle custom fields visibility with smooth animation
        if (isCustomSelected) {
            customFields.classList.add('show');
        } else {
            customFields.classList.remove('show');
        }
        
        // Save button is always enabled now
        saveButton.disabled = false;
        
        // Update input states only for custom inputs when not custom
        if (isCustomSelected) {
            customDateInput.disabled = false;
            customNameInput.disabled = false;
        } else {
            customDateInput.disabled = true;
            customNameInput.disabled = true;
            // Clear custom inputs when switching away from custom
            customDateInput.value = '';
            customNameInput.value = '';
        }
    }

    /**
     * Toggles advanced options visibility and saves preference
     */
    function toggleAdvancedOptions() {
        const isAdvancedEnabled = advancedToggle.checked;
        
        if (isAdvancedEnabled) {
            advancedFields.classList.add('show');
        } else {
            advancedFields.classList.remove('show');
        }
        
        // Save the toggle state
        chrome.storage.sync.set({ advancedOptionsEnabled: isAdvancedEnabled });
    }
    
    /**
     * Loads saved advanced options toggle state
     */
    function loadAdvancedOptionsState() {
        chrome.storage.sync.get('advancedOptionsEnabled', (data) => {
            const isEnabled = data.advancedOptionsEnabled || false;
            advancedToggle.checked = isEnabled;
            toggleAdvancedOptions();
        });
    }

    /**
     * Gets current advanced parameters from form
     * @returns {Object} Advanced parameters object
     */
    function getAdvancedParameters() {
        if (!advancedToggle.checked) {
            return {};
        }
        
        const params = {
            costType: costTypeSelect.value !== CLOUDZERO_PARAMETERS.DEFAULTS.costType ? costTypeSelect.value : null,
            granularity: granularitySelect.value !== CLOUDZERO_PARAMETERS.DEFAULTS.granularity ? granularitySelect.value : null,
            groupBy: groupBySelect.value || null
        };
        
        // Only include filters if feature flag is enabled
        if (FEATURE_FLAGS.ENABLE_FILTERS) {
            params.filters = filtersInput.value.trim() || null;
        }
        
        return params;
    }

    /**
     * Sets advanced parameters in form
     * @param {Object} params - Advanced parameters object
     */
    function setAdvancedParameters(params = {}) {
        costTypeSelect.value = params.costType || CLOUDZERO_PARAMETERS.DEFAULTS.costType;
        granularitySelect.value = params.granularity || CLOUDZERO_PARAMETERS.DEFAULTS.granularity;
        groupBySelect.value = params.groupBy || CLOUDZERO_PARAMETERS.DEFAULTS.groupBy;
        filtersInput.value = params.filters || CLOUDZERO_PARAMETERS.DEFAULTS.filters;
    }

    /**
     * Loads and displays saved filters in the UI
     */
    async function loadSavedFilters() {
        savedFiltersList.innerHTML = "";
        const filters = await getSavedFilters();
        const emptyState = document.getElementById('emptyState');
        
        // Show/hide empty state
        if (filters.length === 0) {
            emptyState.style.display = 'flex';
        } else {
            emptyState.style.display = 'none';
        }
        
        filters.forEach((filter, index) => {
            const li = document.createElement("li");
            li.classList.add("filter-item");
            const displayText = filter.customName || `${filter.range} (${filter.dates})`;
            li.innerHTML = `
                <span class="filter-text" data-index="${index}">${displayText}</span> 
                <button class="delete-btn" data-index="${index}" aria-label="Delete filter">×</button>
            `;
            
            // Add smooth fade-in animation
            li.style.opacity = '0';
            li.style.transform = 'translateY(10px)';
            savedFiltersList.appendChild(li);
            
            // Trigger animation
            requestAnimationFrame(() => {
                li.style.transition = 'opacity 200ms ease, transform 200ms ease';
                li.style.opacity = '1';
                li.style.transform = 'translateY(0)';
            });
        });

        // Add event listeners to delete buttons
        document.querySelectorAll(".delete-btn").forEach(button => {
            button.addEventListener("click", async function (e) {
                e.stopPropagation(); // Prevent triggering filter selection
                const index = parseInt(this.getAttribute("data-index"));
                
                // Add loading state
                this.style.pointerEvents = 'none';
                this.textContent = '⟳';
                
                try {
                    await deleteFilter(index);
                    loadSavedFilters();
                } catch (error) {
                    console.error('Error deleting filter:', error);
                    this.style.pointerEvents = 'auto';
                    this.textContent = '×';
                }
            });
        });

        // Add event listeners to saved filter items
        document.querySelectorAll(".filter-text").forEach(item => {
            item.addEventListener("click", function () {
                const index = parseInt(this.getAttribute("data-index"));
                const selectedFilter = filters[index];

                dateFilter.value = selectedFilter.range;
                customDateInput.value = selectedFilter.dates;
                customNameInput.value = selectedFilter.customName || "";
                
                // Load advanced parameters if they exist
                if (selectedFilter.advancedParams) {
                    const hasAdvancedParams = Object.values(selectedFilter.advancedParams).some(val => val !== null);
                    if (hasAdvancedParams) {
                        advancedToggle.checked = true;
                        toggleAdvancedOptions();
                        setAdvancedParameters(selectedFilter.advancedParams);
                    }
                }
                
                updateSaveButtonState();
                
                // Add visual feedback
                item.parentElement.style.background = 'var(--primary-100)';
                setTimeout(() => {
                    item.parentElement.style.background = '';
                }, 200);
            });
        });
    }

    /**
     * Shows a temporary success message
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
        }, 4000);
    }

    /**
     * Handles saving a new filter
     */
    async function handleSaveFilter() {
        const selectedDate = dateFilter.value;
        const customDate = customDateInput.value.trim();
        const customName = customNameInput.value.trim();
        const isCustomSelected = dateFilter.value === DATE_RANGES.CUSTOM;

        // Validate inputs based on selection type
        if (isCustomSelected) {
            if (!customDate) {
                showErrorMessage('Please enter a date range');
                customDateInput.focus();
                return;
            }
            
            if (!customName) {
                showErrorMessage('Please enter a name for your filter');
                customNameInput.focus();
                return;
            }
            
            // Validate custom date format
            try {
                parseFlexibleDateInput(customDate);
            } catch (error) {
                showErrorMessage(`Invalid date format: ${error.message}`);
                return;
            }
        } else {
            // For preset ranges, auto-generate name if not provided
            if (!customName) {
                const advancedParams = getAdvancedParameters();
                let autoName = selectedDate;
                
                // Add advanced params to name if any are set
                const paramParts = [];
                if (advancedParams.costType && advancedParams.costType !== CLOUDZERO_PARAMETERS.DEFAULTS.costType) {
                    paramParts.push(advancedParams.costType.replace('_', ' '));
                }
                if (advancedParams.granularity && advancedParams.granularity !== CLOUDZERO_PARAMETERS.DEFAULTS.granularity) {
                    paramParts.push(advancedParams.granularity);
                }
                if (advancedParams.groupBy) {
                    const groupByDisplayNames = {
                        'billing_line_item': 'Billing Line Item',
                        'service': 'Service',
                        'account': 'Account',
                        'region': 'Region',
                        'availability_zone': 'Availability Zone',
                        'instance_type': 'Instance Type',
                        'resource_type': 'Resource Type',
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
                    const groupByName = groupByDisplayNames[advancedParams.groupBy] || advancedParams.groupBy;
                    paramParts.push(`by ${groupByName}`);
                }
                
                if (paramParts.length > 0) {
                    autoName += ` (${paramParts.join(', ')})`;
                }
                
                customNameInput.value = autoName;
            }
        }

        // Add loading state
        saveButton.classList.add('loading');
        saveButton.disabled = true;

        try {
            const advancedParams = getAdvancedParameters();
            const finalName = customNameInput.value.trim(); // Get the final name (auto-generated or user-entered)
            const filterObj = createFilter(selectedDate, customDate, finalName, advancedParams);
            await saveFilter(filterObj);
            
            loadSavedFilters();
            customNameInput.value = "";
            if (isCustomSelected) {
                customDateInput.value = "";
            }
            
            showSuccessMessage('Filter saved successfully!');
        } catch (error) {
            if (error.message.includes('already exists')) {
                showErrorMessage(error.message);
                customNameInput.focus();
                customNameInput.select(); // Select the text so user can easily replace it
            } else {
                showErrorMessage(`Error saving filter: ${error.message}`);
            }
        } finally {
            saveButton.classList.remove('loading');
            saveButton.disabled = false;
        }
    }

    /**
     * Handles applying the selected date filter
     */
    async function handleApplyFilter() {
        // Add loading state
        applyButton.classList.add('loading');
        applyButton.disabled = true;
        
        try {
            let startDate, endDate;

            if (dateFilter.value === DATE_RANGES.CUSTOM) {
                const customDate = customDateInput.value.trim();
                if (!customDate) {
                    showErrorMessage('Please enter a date range');
                    customDateInput.focus();
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

    // Initialize feature flags
    if (FEATURE_FLAGS.ENABLE_FILTERS) {
        document.getElementById('filtersField').style.display = 'block';
    }
    
    // Initialize UI
    updateSaveButtonState();
    loadSavedFilters();
    loadAdvancedOptionsState();

    // Event listeners
    dateFilter.addEventListener("change", updateSaveButtonState);
    advancedToggle.addEventListener("change", toggleAdvancedOptions);
    saveButton.addEventListener("click", handleSaveFilter);
    applyButton.addEventListener("click", handleApplyFilter);
});