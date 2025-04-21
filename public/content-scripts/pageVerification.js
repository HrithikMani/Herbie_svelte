/**
 * Page Verification Module
 * Handles verification of page properties (title, url)
 */

// Store active timers to allow cleanup
window.pageVerificationTimers = window.pageVerificationTimers || [];

/**
 * Sets up verification for page properties (no observer needed)
 * @param {Object} verifyData - The verification data object
 * @param {Function} callback - Callback to execute when verification succeeds
 * @returns {number} - The interval ID for cleanup
 */
function setupPageVerificationCheck(verifyData, callback) {
    if (!verifyData || !verifyData.verifyType) {
        console.error("Invalid verification data: missing verification type");
        return null;
    }
    
    // We'll check page properties periodically
    const checkInterval = setInterval(() => {
        const pageProperty = verifyData.verifyType; // 'title' or 'url'
        const expectedValue = verifyData.verifyExpected;
        const operator = verifyData.verifyOperator || "contains";
        
        let actualValue = '';
        let result = false;
        
        // Get the current page property value
        if (pageProperty === 'title') {
            actualValue = document.title;
        } else if (pageProperty === 'url') {
            actualValue = window.location.href;
        } else {
            console.warn(`Unknown page property: ${pageProperty}`);
            return;
        }
        
        // Check against expected value with the specified operator
        switch (operator) {
            case "equals":
                result = actualValue === expectedValue;
                break;
            case "contains":
                result = actualValue.includes(expectedValue);
                break;
            case "starts_with":
                result = actualValue.startsWith(expectedValue);
                break;
            case "ends_with":
                result = actualValue.endsWith(expectedValue);
                break;
            default:
                console.warn(`Unknown operator: ${operator}`);
                return;
        }
        
        // If verification passes, trigger callback
        if (result) {
            console.log(`Page verification passed: ${pageProperty} ${operator} "${expectedValue}"`);
            
            // Send verification result to background
            chrome.runtime.sendMessage({
                action: "verifyStatement",
                data: verifyData.src,
                result: {
                    success: true,
                    message: `Page ${pageProperty} ${operator.replace('_', ' ')} "${expectedValue}" verified`,
                    actualValue: actualValue
                }
            });
            
            // Execute callback if provided
            if (typeof callback === 'function') {
                callback(true);
            }
            
            // Clear interval once verified
            clearInterval(checkInterval);
            
            // Remove from active timers list
            const index = window.pageVerificationTimers.indexOf(checkInterval);
            if (index > -1) {
                window.pageVerificationTimers.splice(index, 1);
            }
        }
    }, 500); // Check every 500ms
    
    return checkInterval;
}

/**
 * Cleanup all timers
 */
function cleanupAllTimers() {
    if (window.pageVerificationTimers && window.pageVerificationTimers.length > 0) {
        console.log(`Cleaning up ${window.pageVerificationTimers.length} page verification timers`);
        window.pageVerificationTimers.forEach(timerId => {
            clearInterval(timerId);
        });
        window.pageVerificationTimers = [];
    }
}

// Export functions for use in other modules
window.pageVerification = {
    setupPageVerificationCheck,
    cleanupAllTimers
};