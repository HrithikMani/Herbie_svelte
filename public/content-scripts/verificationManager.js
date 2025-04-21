/**
 * Verification Manager
 * Coordinates different types of verification observers
 */

/**
 * Sets up verification observers based on verification type
 * @param {Object} verifyData - The verification object from parser
 * @returns {MutationObserver|number|null} - The created observer or timer ID
 */
function setupVerificationObserver(verifyData) {
    if (!verifyData || typeof verifyData !== 'object') {
        console.error("Invalid verification data:", verifyData);
        return null;
    }
    
    console.log("Setting up verification observer for:", verifyData);
    
    let observer = null;
    
    // Handle different verification types
    switch (verifyData.verifyType) {
        case "text":
            // Text verification
            if (window.textVerification) {
                observer = window.textVerification.setupTextVerificationObserver(verifyData);
                if (observer && window.textVerificationObservers) {
                    window.textVerificationObservers.push(observer);
                }
            } else {
                console.error("Text verification module not available");
            }
            break;
            
        case "value":
        case "placeholder":
            // Attribute verification
            if (window.attributeVerification) {
                observer = window.attributeVerification.setupAttributeVerificationObserver(verifyData);
                if (observer && window.attributeVerificationObservers) {
                    window.attributeVerificationObservers.push(observer);
                }
            } else {
                console.error("Attribute verification module not available");
            }
            break;
            
        case "state":
            // State verification
            if (window.stateVerification) {
                observer = window.stateVerification.setupStateVerificationObserver(verifyData);
                if (observer && window.stateVerificationObservers) {
                    window.stateVerificationObservers.push(observer);
                }
            } else {
                console.error("State verification module not available");
            }
            break;
            
        case "title":
        case "url":
            // Page verification
            if (window.pageVerification) {
                const timerId = window.pageVerification.setupPageVerificationCheck(verifyData);
                if (timerId && window.pageVerificationTimers) {
                    window.pageVerificationTimers.push(timerId);
                }
                observer = timerId; // Return the timer ID
            } else {
                console.error("Page verification module not available");
            }
            break;
            
        default:
            // Unknown verification type
            console.warn(`Unsupported verification type: ${verifyData.verifyType}`);
    }
    
    return observer;
}

/**
 * Clean up all verification resources
 */
function cleanupAllVerifications() {
    // Clean up all text verification observers
    if (window.textVerification) {
        window.textVerification.cleanupAllObservers();
    }
    
    // Clean up all attribute verification observers
    if (window.attributeVerification) {
        window.attributeVerification.cleanupAllObservers();
    }
    
    // Clean up all state verification observers
    if (window.stateVerification) {
        window.stateVerification.cleanupAllObservers();
    }
    
    // Clean up all page verification timers
    if (window.pageVerification) {
        window.pageVerification.cleanupAllTimers();
    }
}

// Export functions for use in other modules
window.verificationManager = {
    setupVerificationObserver,
    cleanupAllVerifications
};