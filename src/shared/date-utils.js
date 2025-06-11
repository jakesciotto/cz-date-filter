/**
 * Date utilities for CloudZero Date Filter extension
 */

/**
 * Parses flexible date input formats
 * @param {string} input - Date range input string
 * @returns {Object} Object with startDate and endDate
 */
export function parseFlexibleDateInput(input) {
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

/**
 * Parses individual date strings with multiple format support
 * @param {string} dateStr - Individual date string
 * @returns {Date} Parsed date object
 */
export function parseIndividualDate(dateStr) {
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

/**
 * Finds a valid 28-day window with 4 full weekends and 4 full weeks
 * @returns {Object} Object with startDate and endDate
 */
export function findValid28DayWindow() {
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

/**
 * Calculates date ranges for predefined periods
 * @param {string} period - Period type (e.g., "Last 7 Days")
 * @returns {Object} Object with startDate and endDate
 */
export function calculateDateRange(period) {
    const today = new Date();
    let startDate, endDate;

    switch (period) {
        case "Last 7 Days":
            startDate = new Date();
            startDate.setDate(today.getDate() - 8); // 7 days + 2 day lag = 9 days back, then -1 for inclusive range
            endDate = new Date();
            endDate.setDate(today.getDate() - 2);
            break;
        case "Last 14 Days":
            startDate = new Date();
            startDate.setDate(today.getDate() - 15); // 14 days + 2 day lag = 16 days back, then -1 for inclusive range
            endDate = new Date();
            endDate.setDate(today.getDate() - 2);
            break;
        case "Last 28 Days":
            ({ startDate, endDate } = findValid28DayWindow());
            break;
        case "Last 30 Days":
            startDate = new Date();
            startDate.setDate(today.getDate() - 31); // 30 days + 2 day lag = 32 days back, then -1 for inclusive range
            endDate = new Date();
            endDate.setDate(today.getDate() - 2);
            break;
        case "Last 90 Days":
            startDate = new Date();
            startDate.setDate(today.getDate() - 91); // 90 days + 2 day lag = 92 days back, then -1 for inclusive range
            endDate = new Date();
            endDate.setDate(today.getDate() - 2);
            break;
        default:
            throw new Error(`Unknown period: ${period}`);
    }

    return { startDate, endDate };
}

/**
 * Formats date to CloudZero's required ISO format
 * @param {Date} date - Date to format
 * @param {boolean} endOfDay - Whether to set time to end of day
 * @returns {string} Formatted date string
 */
export function formatToCloudZeroISO(date, endOfDay = false) {
    let isoString = date.toISOString().split("T")[0]; // YYYY-MM-DD
    let timePart = endOfDay ? "23:59:59" : "00:00:00"; // Full timestamp
    return `${isoString}T${timePart}Z`;
}