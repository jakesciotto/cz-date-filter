document.addEventListener("DOMContentLoaded", function () {
    const dateFilter = document.getElementById("dateFilter");
    const customDateInput = document.getElementById("customDate");
    const saveButton = document.getElementById("saveFilter");
    const applyButton = document.getElementById("applyFilter");
    const savedFiltersList = document.getElementById("savedFilters");
    const customNameInput = document.getElementById("customName");
    const useDefaultOffset = document.getElementById("useDefaultOffset");

    // Load saved offset preference when popup opens
    chrome.storage.sync.get("useOffset", function(data) {
        useDefaultOffset.checked = data.useOffset || false;
        // Initialize URL after loading preference
        initializeURL(true);
    });

    // Save offset preference when checkbox changes
    useDefaultOffset.addEventListener("change", function() {
        chrome.storage.sync.set({ useOffset: this.checked }, function() {
            // Reinitialize URL when offset preference changes
            initializeURL(true);
        });
    });

    // Add this function after the constants
    function updateSaveButtonState() {
        const isCustomSelected = dateFilter.value === "Custom";
        
        // Update save button state
        saveButton.disabled = !isCustomSelected;
        saveButton.style.opacity = isCustomSelected ? "1" : "0.5";
        
        // Update custom inputs state
        customDateInput.disabled = !isCustomSelected;
        customNameInput.disabled = !isCustomSelected;
        
        // Update labels styling
        const labels = document.querySelectorAll('label[for="customDate"], label[for="customName"]');
        labels.forEach(label => {
            if (isCustomSelected) {
                label.classList.remove('disabled');
            } else {
                label.classList.add('disabled');
            }
        });
    }

    // Add this function to handle date offsets
    function applyDateOffset(url, offsetDays) {
        let params = url.searchParams;
        if (params.has('startDate') && params.has('endDate')) {
            let startDate = new Date(params.get('startDate').replace(/%3A/g, ':'));
            let endDate = new Date(params.get('endDate').replace(/%3A/g, ':'));
            
            startDate.setDate(startDate.getDate() - offsetDays);
            endDate.setDate(endDate.getDate() - offsetDays);

            // Format dates back to CloudZero's format
            const formatToCloudZeroISO = (date, endOfDay = false) => {
                let isoString = date.toISOString().split("T")[0];
                let timePart = endOfDay ? "23:59:59" : "00:00:00";
                return `${isoString}T${timePart}Z`.replace(/:/g, "%3A");
            };

            params.set('startDate', formatToCloudZeroISO(startDate));
            params.set('endDate', formatToCloudZeroISO(endDate, true));
        }
        return url;
    }

    // Modify initializeURL to accept a parameter for updating the tab
    function initializeURL(shouldUpdateTab) {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            let baseURL = tabs[0].url.includes('cloudzero.com') ? 
            new URL(tabs[0].url) : 
            new URL('https://app.cloudzero.com/explorer');

            // Set default parameters for new URLs or update existing ones
            const today = new Date();
            const startDate = new Date();
            startDate.setDate(today.getDate() - 7); // Default to last 7 days
    
            const formatToCloudZeroISO = (date, endOfDay = false) => {
                let isoString = date.toISOString().split("T")[0];
                let timePart = endOfDay ? "23:59:59" : "00:00:00";
                return `${isoString}T${timePart}Z`.replace(/:/g, "%3A");
            };
    
            // Always ensure these parameters are set
            baseURL.searchParams.set("activeCostType", "real_cost");
            baseURL.searchParams.set("granularity", "daily");
            baseURL.searchParams.set("dateRange", "Custom");
            baseURL.searchParams.set("showRightFlyout", "filters");
            
            // Set initial dates if they're not already present
            if (!baseURL.searchParams.has('startDate')) {
                baseURL.searchParams.set("startDate", formatToCloudZeroISO(startDate));
            }
            if (!baseURL.searchParams.has('endDate')) {
                baseURL.searchParams.set("endDate", formatToCloudZeroISO(today, true));
            }
    
            // Apply offset if enabled
            chrome.storage.sync.get("useOffset", function(data) {
                if (data.useOffset) {
                    baseURL = applyDateOffset(baseURL, 2);
                    
                    // Only update the tab if explicitly requested
                    if (shouldUpdateTab && tabs[0].url.includes('cloudzero.com')) {
                        chrome.tabs.update(tabs[0].id, { 
                            url: baseURL.toString().replace(/%25/g, "%") 
                        });
                    }
                }
                
                // Store the URL for later use
                window.cloudZeroURL = baseURL;
            });
        });
    }

    updateSaveButtonState(); // Initial state
    
    // Add this event listener
    dateFilter.addEventListener("change", updateSaveButtonState);

    // Load and display saved filters
    function loadSavedFilters() {
        chrome.storage.sync.get("savedFilters", function (data) {
            savedFiltersList.innerHTML = ""; // Clear existing list
            let filters = data.savedFilters || [];
            
            filters.forEach((filter, index) => {
                let li = document.createElement("li");
                li.classList.add("filter-item");
                // Use the custom name if it exists, otherwise fall back to the default format
                const displayText = filter.customName || `${filter.range} (${filter.dates})`;
                li.innerHTML = `<span class="filter-text" data-index="${index}">${displayText}</span> 
                                <button class="delete-btn" data-index="${index}">X</button>`;
                savedFiltersList.appendChild(li);
            });

            // Add event listeners to delete buttons
            document.querySelectorAll(".delete-btn").forEach(button => {
                button.addEventListener("click", function () {
                    let index = parseInt(this.getAttribute("data-index"));
                    filters.splice(index, 1);
                    chrome.storage.sync.set({ savedFilters: filters }, loadSavedFilters);
                });
            });

            // Add event listeners to saved filter items
            document.querySelectorAll(".filter-text").forEach(item => {
                item.addEventListener("click", function () {
                    let index = parseInt(this.getAttribute("data-index"));
                    let selectedFilter = filters[index];

                    // Populate the date filter, custom date input, and custom name input
                    dateFilter.value = selectedFilter.range;
                    customDateInput.value = selectedFilter.dates;
                    customNameInput.value = selectedFilter.customName || "";
                });
            });
        });
    }

    loadSavedFilters(); // Load saved filters on popup open

    // Save selected filter
    saveButton.addEventListener("click", function () {
        const selectedDate = dateFilter.value;
        const customDate = customDateInput.value;
        const customName = customNameInput.value.trim();

        // Only validate custom date format if a custom date is entered
        if (customDate && !customDate.includes(" to ")) {
            alert("Please enter a valid custom date range in 'YYYY-MM-DD to YYYY-MM-DD' format.");
            return;
        }

        let filterObj = {
            // If there's a custom date entered, use "Custom" as the range regardless of dropdown selection
            range: customDate ? "Custom" : selectedDate,
            dates: customDate || "Auto-generated",
            customName: customName || null  // Store the custom name if provided
        };

        chrome.storage.sync.get("savedFilters", function (data) {
            let filters = data.savedFilters || [];
            filters.push(filterObj);
            chrome.storage.sync.set({ savedFilters: filters }, function() {
                loadSavedFilters();
                // Clear the custom name input after saving
                customNameInput.value = "";
            });
        });

        alert("Filter saved successfully!");
    });

    // Handle the date filter in the case where we need 4 full weekends and 4 full weeks in a 28 day period
    function findValid28DayWindow() {
        const today = new Date();
        let end = new Date(today);
        end.setDate(today.getDate() - 2);
        end.setHours(0, 0, 0, 0);
    
        // We'll go back one day at a time until we find a valid window
        while (true) {
            let start = new Date(end);
            start.setDate(end.getDate() - 27); // Inclusive 28-day window
    
            let weekdays = 0;
            let weekends = 0;
            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                const day = d.getDay(); // 0 = Sunday, 6 = Saturday
                if (day === 0 || day === 6) {
                    weekends++;
                } else {
                    weekdays++;
                }
            }
    
            if (Math.floor(weekdays / 5) >= 4 && Math.floor(weekends / 2) >= 4) {
                return { startDate: start, endDate: end };
            }
    
            // Step back one day and try again
            end.setDate(end.getDate() - 1);
        }
    }

    // Modify the existing applyButton click handler
    applyButton.addEventListener("click", function () {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            let url = window.cloudZeroURL;
            let today = new Date();
            let startDate, endDate;

            // Define date range based on selection
            switch (dateFilter.value) {
                case "Last 7 Days":
                    startDate = new Date();
                    startDate.setDate(today.getDate() - (7));
                    break;
                case "Last 14 Days":
                    startDate = new Date();
                    startDate.setDate(today.getDate() - (14));
                    break;
                case "Last 28 Days":
                    ({ startDate, endDate } = findValid28DayWindow());
                    if (offsetDays) {
                        startDate.setDate(startDate.getDate());
                        endDate.setDate(endDate.getDate());
                    }
                    break;
                case "Last 30 Days":
                    startDate = new Date();
                    startDate.setDate(today.getDate() - (30 + offsetDays));
                    break;
                case "Last 90 Days":
                    startDate = new Date();
                    startDate.setDate(today.getDate() - (90 + offsetDays));
                    break;
                case "Custom":
                    if (!customDateInput.value.includes(" to ")) {
                        alert("Please enter a valid date range in 'YYYY-MM-DD to YYYY-MM-DD' format.");
                        return;
                    }
                    let [customStart, customEnd] = customDateInput.value.split(" to ");
                    startDate = new Date(customStart);
                    endDate = new Date(customEnd);
                    if (offsetDays) {
                        startDate.setDate(startDate.getDate());
                        endDate.setDate(endDate.getDate());
                    }
                    break;
                default:
                    return;
            }

            // Default end date (for predefined ranges)
            if (!endDate) {
                endDate = new Date();
                endDate.setDate(today.getDate() - 1);
            }

            // Format dates to CloudZero's required format (YYYY-MM-DDTHH:MM:SSZ)
            const formatToCloudZeroISO = (date, endOfDay = false) => {
                let isoString = date.toISOString().split("T")[0]; // YYYY-MM-DD
                let timePart = endOfDay ? "23:59:59" : "00:00:00"; // Full timestamp
                return `${isoString}T${timePart}Z`;
            };

            let formattedStartDate = formatToCloudZeroISO(startDate);
            let formattedEndDate = formatToCloudZeroISO(endDate, true);

            // Encode colons (:) properly to avoid over-encoding
            formattedStartDate = formattedStartDate.replace(/:/g, "%3A");
            formattedEndDate = formattedEndDate.replace(/:/g, "%3A");

            // **Fix partitions encoding (replace "+" with "%20")**
            partitionsValue = url.searchParams.get("partitions");
            if (partitionsValue) {
                partitionsValue = partitionsValue.replace(/\+/g, "%20");
                url.searchParams.set("partitions", partitionsValue);
            }

            // **Ensure granularity=daily is placed right after real_cost**
            url.searchParams.set("activeCostType", "real_cost");
            url.searchParams.set("granularity", "daily");
            url.searchParams.set("dateRange", "Custom");
            url.searchParams.set("showRightFlyout", "filters");
            url.searchParams.set("startDate", formattedStartDate);
            url.searchParams.set("endDate", formattedEndDate);
           

            // **Remove all instances of "25" after percent signs**
            let finalURL = url.toString().replace(/%25/g, "%"); // Fix over-encoding issue

            // Apply the modified URL
            chrome.tabs.update(tabs[0].id, { url: finalURL });
        });
    });
});