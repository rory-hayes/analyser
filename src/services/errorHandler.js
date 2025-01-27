export class ErrorHandler {
    static handleApiError(error) {
        console.error('API Error:', error);
        
        if (error.response) {
            // Server responded with error
            return `Server Error: ${error.response.data.message || 'Unknown error'}`;
        } else if (error.request) {
            // No response received
            return 'Network Error: Could not connect to server';
        } else {
            // Error in request setup
            return `Request Error: ${error.message}`;
        }
    }

    static handleHexError(error) {
        console.error('Hex Error:', error);
        return `Hex API Error: ${error.message || 'Unknown error'}`;
    }
} 