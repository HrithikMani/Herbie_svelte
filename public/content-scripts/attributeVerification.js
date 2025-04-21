/**
 * Attribute Verification Module
 * Handles verification of element attributes (value, placeholder, etc.)
 */

// Store active observers to allow cleanup
window.attributeVerificationObservers = window.attributeVerificationObservers || [];

/**
 * Sets up an observer to verify element attributes
 * @param {Object} verifyData - The verification data object
 * @param {Function} callback - Callback to execute when verification succeeds
 * @returns {MutationObserver} - The created observer
 */
async function setupAttributeVerificationObserver(verifyData, callback) {
    if (!verifyData || !verifyData.verifyLocator) {
        console.error("Invalid verification data: missing locator");
        return null;
    }
    
    // Find the element to observe
    const element = await find_element(verifyData.verifyLocator);
    console.log("Initial element for attribute verification:", element);
    
    if (!element) {
        console.warn(`Element not found for attribute verification: ${verifyData.verifyLocator}`);
        return null;
    }
    
    // Create a mutation observer
    const observer = new MutationObserver(mutations => {
        // Check if element is still in the DOM
        const inDom = document.body.contains(element);
        
        // Check if element is visible or exists
        let isAvailable = false;
        if (inDom) {
            // For attributes, we don't always need the element to be visible
            // Just available in the DOM
            isAvailable = true;
        }
        
        // If element is available, verify attribute
        if (isAvailable) {
            const attributeName = verifyData.verifyType; // 'value', 'placeholder', etc.
            
            // Get the attribute value - either from attribute or property
            let actualValue = '';
            if (element[attributeName] !== undefined) {
                // Try as a property first (works better for value, checked, etc.)
                actualValue = element[attributeName];
            } else {
                // Fall back to attribute
                actualValue = element.getAttribute(attributeName) || '';
            }
            
            if (typeof actualValue !== 'string') {
                // Convert non-string values to string
                actualValue = String(actualValue);
            }
            
            actualValue = actualValue.trim();
            const expectedValue = verifyData.verifyExpected;
            const operator = verifyData.verifyOperator || "contains";
            
            let result = false;
            
            // Check attribute according to operator
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
                console.log(`Attribute verification passed: ${attributeName} ${operator} "${expectedValue}"`);
                
                // Send verification result to background
                chrome.runtime.sendMessage({
                    action: "verifyStatement",
                    data: verifyData.src,
                    result: {
                        success: true,
                        message: `${attributeName} ${operator.replace('_', ' ')} "${expectedValue}" verified`,
                        actualValue: actualValue
                    }
                });
                
                // Execute callback if provided
                if (typeof callback === 'function') {
                    callback(true);
                }
                
                // Disconnect observer once verified
                observer.disconnect();
                
                // Remove from active observers list
                const index = window.attributeVerificationObservers.indexOf(observer);
                if (index > -1) {
                    window.attributeVerificationObservers.splice(index, 1);
                }
            }
        }
    });
    
    // Start observing
    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true
    });
    
    return observer;
}

/**
 * Cleanup observer and any associated resources
 * @param {MutationObserver} observer - The observer to clean up
 */
function cleanupObserver(observer) {
    if (!observer) return;
    
    // Disconnect the observer
    observer.disconnect();
}

/**
 * Clean up all active observers
 */
function cleanupAllObservers() {
    if (window.attributeVerificationObservers && window.attributeVerificationObservers.length > 0) {
        console.log(`Cleaning up ${window.attributeVerificationObservers.length} attribute verification observers`);
        window.attributeVerificationObservers.forEach(cleanupObserver);
        window.attributeVerificationObservers = [];
    }
}

// Export functions for use in other modules
window.attributeVerification = {
    setupAttributeVerificationObserver,
    cleanupObserver,
    cleanupAllObservers
};