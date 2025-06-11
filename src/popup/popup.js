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
        
        saveButton.disabled = !isCustomSelected;
        saveButton.style.opacity = isCustomSelected ? "1" : "0.5";
        
        customDateInput.disabled = !isCustomSelected;
        customNameInput.disabled = !isCustomSelected;
        
        const labels = document.querySelectorAll('label[for="customDate"], label[for="customName"]');
        labels.forEach(label => {
            if (isCustomSelected) {
                label.classList.remove('disabled');
            } else {
                label.classList.add('disabled');
            }
        });
    }

    /**
     * Loads and displays saved filters in the UI
     */
    async function loadSavedFilters() {
        savedFiltersList.innerHTML = "";
        const filters = await getSavedFilters();
        
        filters.forEach((filter, index) => {
            const li = document.createElement("li");
            li.classList.add("filter-item");
            const displayText = filter.customName || `${filter.range} (${filter.dates})`;
            li.innerHTML = `
                <span class="filter-text" data-index="${index}">${displayText}</span> 
                <button class="delete-btn" data-index="${index}">X</button>
            `;
            savedFiltersList.appendChild(li);
        });

        // Add event listeners to delete buttons
        document.querySelectorAll(".delete-btn").forEach(button => {
            button.addEventListener("click", async function () {
                const index = parseInt(this.getAttribute("data-index"));
                await deleteFilter(index);
                loadSavedFilters();
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
            });
        });
    }

    /**
     * Handles saving a new filter
     */
    async function handleSaveFilter() {
        const selectedDate = dateFilter.value;
        const customDate = customDateInput.value;
        const customName = customNameInput.value.trim();

        // Validate custom date format
        if (customDate) {
            try {
                parseFlexibleDateInput(customDate);
            } catch (error) {
                alert(`${UI_MESSAGES.ERRORS.INVALID_DATE_FORMAT}: ${error.message}`);
                return;
            }
        }

        const filterObj = createFilter(selectedDate, customDate, customName);
        
        try {
            await saveFilter(filterObj);
            loadSavedFilters();
            customNameInput.value = "";
            alert(UI_MESSAGES.SUCCESS.FILTER_SAVED);
        } catch (error) {
            alert(`Error saving filter: ${error.message}`);
        }
    }

    /**
     * Handles applying the selected date filter
     */
    async function handleApplyFilter() {
        try {
            let startDate, endDate;

            if (dateFilter.value === DATE_RANGES.CUSTOM) {
                const parsedDates = parseFlexibleDateInput(customDateInput.value);
                startDate = parsedDates.startDate;
                endDate = parsedDates.endDate;
            } else {
                const dateRange = calculateDateRange(dateFilter.value);
                startDate = dateRange.startDate;
                endDate = dateRange.endDate;
            }

            await applyDateFilterToTab(startDate, endDate);
        } catch (error) {
            alert(`Error applying filter: ${error.message}`);
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