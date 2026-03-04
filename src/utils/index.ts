// Placeholder for utility functions

/**
 * A simple logging function that can be extended later.
 * @param message The message to log.
 * @param level The log level (e.g., 'info', 'warn', 'error').
 */
export function log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    const timestamp = new Date().toISOString();
    console[level](`[${timestamp}][${level.toUpperCase()}] ${message}`);
}

/**
 * Basic error handling utility.
 * @param error The error object.
 * @param context Optional context for the error.
 */
export function handleError(error: unknown, context: string = 'Application'): void {
    if (error instanceof Error) {
        log(`ERROR in ${context}: ${error.message}`, 'error');
        // In a real application, you might send this to an error tracking service
    } else {
        log(`UNKNOWN ERROR in ${context}: ${String(error)}`, 'error');
    }
}

/**
 * Parses and normalizes various date formats to dd/mm/yyyy format.
 * @param dateInput The date string to parse.
 * @returns The formatted date string in dd/mm/yyyy format, or null if parsing fails.
 */
export function parseAndFormatDate(dateInput: string): string | null {
    if (!dateInput || typeof dateInput !== 'string') {
        return null;
    }

    // Clean the input
    const cleanInput = dateInput.trim();
    
    // Try to parse various date formats
    const datePatterns = [
        // Thai dates: 25/12/2567, 25-12-2567, 25.12.2567
        /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/,
        // English dates: 25/12/2024, 25-12-2024, 25.12.2024
        /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/,
        // ISO format: 2024-12-25
        /(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/,
        // Month names: Dec 25, 2024; 25 Dec 2024
        /(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{4})/i,
        /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2}),?\s+(\d{4})/i,
        // Thai month names (simplified)
        /(\d{1,2})\s+(ม\.ค\.|ก\.พ\.|มี\.ค\.|เม\.ย\.|พ\.ค\.|มิ\.ย\.|ก\.ค\.|ส\.ค\.|ก\.ย\.|ต\.ค\.|พ\.ย\.|ธ\.ค\.)\s+(\d{4})/
    ];

    for (const pattern of datePatterns) {
        const match = cleanInput.match(pattern);
        if (match) {
            let day, month, year;

            if (pattern === datePatterns[0] || pattern === datePatterns[1]) {
                // dd/mm/yyyy or dd-mm-yyyy format
                day = parseInt(match[1]);
                month = parseInt(match[2]);
                year = parseInt(match[3]);
                
                // Check if it's a Thai Buddhist year (typically 543 years ahead)
                if (year > 2400) {
                    year -= 543;
                }
            } else if (pattern === datePatterns[2]) {
                // yyyy-mm-dd format
                year = parseInt(match[1]);
                month = parseInt(match[2]);
                day = parseInt(match[3]);
            } else if (pattern === datePatterns[3]) {
                // 25 Dec 2024 format
                day = parseInt(match[1]);
                month = new Date(Date.parse(match[2] + " 1, 2000")).getMonth() + 1;
                year = parseInt(match[3]);
            } else if (pattern === datePatterns[4]) {
                // Dec 25, 2024 format
                month = new Date(Date.parse(match[1] + " 1, 2000")).getMonth() + 1;
                day = parseInt(match[2]);
                year = parseInt(match[3]);
            } else if (pattern === datePatterns[5]) {
                // Thai month names - simplified mapping
                const thaiMonths = {
                    'ม.ค.': 1, 'ก.พ.': 2, 'มี.ค.': 3, 'เม.ย.': 4,
                    'พ.ค.': 5, 'มิ.ย.': 6, 'ก.ค.': 7, 'ส.ค.': 8,
                    'ก.ย.': 9, 'ต.ค.': 10, 'พ.ย.': 11, 'ธ.ค.': 12
                };
                day = parseInt(match[1]);
                month = thaiMonths[match[2] as keyof typeof thaiMonths];
                year = parseInt(match[3]);
                
                // Convert Thai Buddhist year to Gregorian
                if (year > 2400) {
                    year -= 543;
                }
            }

            // Validate date
            if (day && month && year && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
                const date: Date = new Date(year, month - 1, day);
                // Check if the date is valid (e.g., not Feb 30)
                if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) {
                    return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
                }
            }
        }
    }

    return null;
}

/**
 * Gets today's date in dd/mm/yyyy format.
 * @returns Today's date formatted as dd/mm/yyyy.
 */
export function getTodayDate(): string {
    const today = new Date();
    const day = today.getDate().toString().padStart(2, '0');
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const year = today.getFullYear();
    return `${day}/${month}/${year}`;
}

/**
 * Validates if text contains an amount/number before sending to Gemini API.
 * @param text The text message to validate.
 * @returns True if the text contains a number/amount, false otherwise.
 */
export function hasAmount(text: string): boolean {
    if (!text || typeof text !== 'string') {
        return false;
    }
    
    // First, check for obvious non-amount patterns
    const yearPattern = /\b(19|20)\d{2}\b/; // Years 1900-2099
    const phonePattern = /\b0[1-9]\d{8,9}\b/; // Thai phone numbers starting with 0
    
    if (yearPattern.test(text) || phonePattern.test(text)) {
        return false;
    }
    
    // Regular expressions to match various number formats
    const numberPatterns = [
        // Numbers with digits: 200, 1,500, 1,000.50, 200.50
        /\b\d{1,3}(?:,\d{3})*(?:\.\d+)?\b/,
        // Numbers with spaces: 1 500, 1 000.50
        /\b\d{1,3}(?:\s\d{3})*(?:\.\d+)?\b/,
        // Thai numbers: ๒๐๐, ๑๐๐๐ (optional)
        /\b[๐-๙]+\b/,
        // Mixed formats: 200บาท, 1000฿, $500, 50usd
        /\b\d+(?:[.,]\d+)?\s*(?:บาท|฿|\$|usd|eur|gbp|yen|yuan|won)\b/i,
        // Simple digits with word boundaries (fallback)
        /\b\d+\b/,
    ];
    
    // Check if any pattern matches
    for (const pattern of numberPatterns) {
        if (pattern.test(text)) {
            // Additional validation: ensure it's not just a year or phone number
            const match = text.match(pattern);
            if (match) {
                const numberStr = match[0];
                // Remove non-digit characters for validation
                const cleanNumber = numberStr.replace(/[^\d.]/g, '');
                
                // Skip if it looks like a year (1900-2100) or phone number (7+ digits)
                const num = parseFloat(cleanNumber);
                if (num >= 1900 && num <= 2100 && cleanNumber.length === 4) {
                    continue; // Skip years
                }
                if (cleanNumber.length >= 9 && !cleanNumber.includes('.')) {
                    continue; // Skip potential phone numbers
                }
                
                return true;
            }
        }
    }
    
    return false;
}
