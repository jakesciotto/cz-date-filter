document.addEventListener("DOMContentLoaded", function () {
    const dateFilter = document.getElementById("dateFilter");
    const customDateInput = document.getElementById("customDate");
    const saveButton = document.getElementById("saveFilter");
    const applyButton = document.getElementById("applyFilter");
    const savedFiltersList = document.getElementById("savedFilters");


    // Load and display saved filters
    function loadSavedFilters() {
        chrome.storage.sync.get("savedFilters", function (data) {
            savedFiltersList.innerHTML = ""; // Clear existing list
            let filters = data.savedFilters || [];
            
            filters.forEach((filter, index) => {
                let li = document.createElement("li");
                li.classList.add("filter-item");
                li.innerHTML = `<span>${filter.range} (${filter.dates})</span> 
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
        });
    }

    loadSavedFilters(); // Load saved filters on popup open

    /// Enable custom date input if "Custom" is selected
    dateFilter.addEventListener("change", function () {
        customDateInput.disabled = dateFilter.value !== "Custom";
    });

    // Save selected filter
    saveButton.addEventListener("click", function () {
        const selectedDate = dateFilter.value;
        const customDate = customDateInput.value;

        if (selectedDate === "Custom" && !customDate.includes(" to ")) {
            alert("Please enter a valid custom date range in 'YYYY-MM-DD to YYYY-MM-DD' format.");
            return;
        }

        let filterObj = {
            range: selectedDate,
            dates: selectedDate === "Custom" ? customDate : "Auto-generated",
        };

        chrome.storage.sync.get("savedFilters", function (data) {
            let filters = data.savedFilters || [];
            filters.push(filterObj);
            chrome.storage.sync.set({ savedFilters: filters }, loadSavedFilters);
        });

        alert("Filter saved successfully!");
    });

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
                    startDate.setDate(today.getDate() - 7);
                    break;
                case "Last 14 Days":
                    startDate = new Date();
                    startDate.setDate(today.getDate() - 14);
                    break;
                case "Last 30 Days":
                    startDate = new Date();
                    startDate.setDate(today.getDate() - 30);
                    break;
                case "Last 90 Days":
                    startDate = new Date();
                    startDate.setDate(today.getDate() - 90);
                    break;
                case "Custom":
                    if (!customDateInput.value.includes(" to ")) {
                        alert("Please enter a valid date range in 'YYYY-MM-DD to YYYY-MM-DD' format.");
                        return;
                    }
                    let [customStart, customEnd] = customDateInput.value.split(" to ");
                    startDate = new Date(customStart);
                    endDate = new Date(customEnd);
                    break;
                default:
                    return;
            }

            // Default end date (for predefined ranges, set it to yesterday)
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