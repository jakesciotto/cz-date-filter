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
import { DATE_RANGES, UI_MESSAGES } from '../shared/constants.js';

document.addEventListener("DOMContentLoaded", function () {
    const dateFilter = document.getElementById("dateFilter");
    const customDateInput = document.getElementById("customDate");
    const saveButton = document.getElementById("saveFilter");
    const applyButton = document.getElementById("applyFilter");
    const savedFiltersList = document.getElementById("savedFilters");
    const customNameInput = document.getElementById("customName");

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
        
        // Update button state
        saveButton.disabled = !isCustomSelected;
        
        // Update input states
        customDateInput.disabled = !isCustomSelected;
        customNameInput.disabled = !isCustomSelected;
        
        // Clear custom inputs when switching away from custom
        if (!isCustomSelected) {
            customDateInput.value = '';
            customNameInput.value = '';
        }
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

        // Validate inputs
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

        // Add loading state
        saveButton.classList.add('loading');
        saveButton.disabled = true;

        try {
            // Validate custom date format
            parseFlexibleDateInput(customDate);
            
            const filterObj = createFilter(selectedDate, customDate, customName);
            await saveFilter(filterObj);
            
            loadSavedFilters();
            customNameInput.value = "";
            customDateInput.value = "";
            
            showSuccessMessage('Filter saved successfully!');
        } catch (error) {
            showErrorMessage(`Invalid date format: ${error.message}`);
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

            await applyDateFilterToTab(startDate, endDate);
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

    // Initialize UI
    updateSaveButtonState();
    loadSavedFilters();

    // Event listeners
    dateFilter.addEventListener("change", updateSaveButtonState);
    saveButton.addEventListener("click", handleSaveFilter);
    applyButton.addEventListener("click", handleApplyFilter);
});