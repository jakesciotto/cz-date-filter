document.addEventListener("DOMContentLoaded", function () {
    const dateFilter = document.getElementById("dateFilter");
    const customDateInput = document.getElementById("customDate");
    const saveButton = document.getElementById("saveFilter");
    const applyButton = document.getElementById("applyFilter");
    const savedFiltersList = document.getElementById("savedFilters");
    const customNameInput = document.getElementById("customName");

    // Flexible date parsing functions
    function parseFlexibleDateInput(input) {
        if (!input || !input.trim()) {
            throw new Error("Please enter a date range");
        }

        const trimmed = input.trim().toLowerCase();
        
        // Handle relative dates like "last 45 days"
        const relativeMatch = trimmed.match(/^last (\d+) days?$/);
        if (relativeMatch) {
            const days = parseInt(relativeMatch[1]);
            const endDate = new Date();
            endDate.setDate(endDate.getDate() - 2); // 2 days prior due to data ingestion lag
            const startDate = new Date();
            startDate.setDate(endDate.getDate() - days + 1);
            return { startDate, endDate };
        }
        
        // Handle date ranges with various separators
        const rangeSeparators = [' to ', ' - ', ' through ', ' thru ', '--', ' — '];
        let separator = null;
        let separatorIndex = -1;
        
        // Find which separator is used
        for (let sep of rangeSeparators) {
            const index = input.toLowerCase().indexOf(sep);
            if (index !== -1) {
                separator = sep;
                separatorIndex = index;
                break;
            }
        }
        
        if (separator && separatorIndex !== -1) {
            const startStr = input.substring(0, separatorIndex).trim();
            const endStr = input.substring(separatorIndex + separator.length).trim();
            
            try {
                const startDate = parseIndividualDate(startStr);
                const endDate = parseIndividualDate(endStr);
                
                if (startDate > endDate) {
                    throw new Error("Start date must be before end date");
                }
                
                return { startDate, endDate };
            } catch (error) {
                throw new Error(`Invalid date format: ${error.message}`);
            }
        }
        
        throw new Error("Please use format like 'YYYY-MM-DD to YYYY-MM-DD' or 'last 30 days'");
    }

    function parseIndividualDate(dateStr) {
        if (!dateStr || !dateStr.trim()) {
            throw new Error("Empty date string");
        }

        const trimmed = dateStr.trim();
        
        // Date format patterns with capture groups
        const formats = [
            // YYYY-MM-DD or YYYY/MM/DD
            { 
                regex: /^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})$/, 
                order: 'YMD' 
            },
            // MM-DD-YYYY or MM/DD/YYYY  
            { 
                regex: /^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/, 
                order: 'MDY' 
            },
            // DD-MM-YYYY or DD/MM/YYYY (European format)
            { 
                regex: /^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/, 
                order: 'DMY' 
            }
        ];
        
        for (let format of formats) {
            const match = trimmed.match(format.regex);
            if (match) {
                let year, month, day;
                
                switch (format.order) {
                    case 'YMD':
                        year = parseInt(match[1]);
                        month = parseInt(match[2]) - 1; // JS months are 0-indexed
                        day = parseInt(match[3]);
                        break;
                    case 'MDY':
                        month = parseInt(match[1]) - 1;
                        day = parseInt(match[2]);
                        year = parseInt(match[3]);
                        break;
                    case 'DMY':
                        day = parseInt(match[1]);
                        month = parseInt(match[2]) - 1;
                        year = parseInt(match[3]);
                        break;
                }
                
                // Validate date components
                if (month < 0 || month > 11) {
                    throw new Error("Invalid month");
                }
                if (day < 1 || day > 31) {
                    throw new Error("Invalid day");
                }
                if (year < 1900 || year > 2100) {
                    throw new Error("Year must be between 1900 and 2100");
                }
                
                const date = new Date(year, month, day);
                
                // Check if the date is valid (handles leap years, month lengths, etc.)
                if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
                    throw new Error("Invalid date");
                }
                
                return date;
            }
        }
        
        // Fallback: try native Date parsing
        const parsed = new Date(trimmed);
        if (isNaN(parsed.getTime())) {
            throw new Error(`Unable to parse date: "${trimmed}"`);
        }
        
        return parsed;
    }

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

        // Validate custom date format using flexible parser
        if (customDate) {
            try {
                parseFlexibleDateInput(customDate);
            } catch (error) {
                alert(`Invalid date format: ${error.message}`);
                return;
            }
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

    // Apply the filter by modifying the CloudZero URL
    applyButton.addEventListener("click", function () {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            let url = new URL(tabs[0].url);

            let today = new Date();
            let startDate, endDate;

            // Define date range based on selection
            switch (dateFilter.value) {
                case "Last 7 Days":
                    startDate = new Date();
                    startDate.setDate(today.getDate() - 8); // 7 days + 2 day lag = 9 days back, then -1 for inclusive range
                    break;
                case "Last 14 Days":
                    startDate = new Date();
                    startDate.setDate(today.getDate() - 15); // 14 days + 2 day lag = 16 days back, then -1 for inclusive range
                    break;
                case "Last 28 Days":
                    ({ startDate, endDate } = findValid28DayWindow());
                    break;
                case "Last 30 Days":
                    startDate = new Date();
                    startDate.setDate(today.getDate() - 31); // 30 days + 2 day lag = 32 days back, then -1 for inclusive range
                    break;
                case "Last 90 Days":
                    startDate = new Date();
                    startDate.setDate(today.getDate() - 91); // 90 days + 2 day lag = 92 days back, then -1 for inclusive range
                    break;
                case "Custom":
                    try {
                        const parsedDates = parseFlexibleDateInput(customDateInput.value);
                        startDate = parsedDates.startDate;
                        endDate = parsedDates.endDate;
                    } catch (error) {
                        alert(`Invalid date format: ${error.message}`);
                        return;
                    }
                    break;
                default:
                    return;
            }

            // Default end date (for predefined ranges, set it to 2 days prior due to data ingestion lag)
            if (!endDate) {
                endDate = new Date();
                endDate.setDate(today.getDate() - 2);
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
            let partitionsValue = url.searchParams.get("partitions");
            if (partitionsValue) {
                partitionsValue = partitionsValue.replace(/\+/g, "%20");
                url.searchParams.set("partitions", partitionsValue);
            }

            // **Ensure granularity=daily is placed right after real_cost**
            url.searchParams.set("activeCostType", "real_cost");
            url.searchParams.set("granularity", "daily");

            // Modify the URL components correctly
            url.searchParams.set("dateRange", "Custom");
            url.searchParams.set("startDate", formattedStartDate);
            url.searchParams.set("endDate", formattedEndDate);
            url.searchParams.set("showRightFlyout", "filters");

            // **Remove all instances of "25" after percent signs**
            let finalURL = url.toString().replace(/%25/g, "%"); // Fix over-encoding issue

            // Apply the modified URL
            chrome.tabs.update(tabs[0].id, { url: finalURL });
        });
    });
});