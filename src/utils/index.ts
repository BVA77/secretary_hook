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
