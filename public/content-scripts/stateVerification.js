/**
 * State Verification Module
 * Handles verification of element states (visible, enabled, checked, disabled, hidden)
 */

// Store active observers to allow cleanup
window.stateVerificationObservers = window.stateVerificationObservers || [];

/**
 * Sets up an observer to verify element states
 * @param {Object} verifyData - The verification data object
 * @param {Function} callback - Callback to execute when verification succeeds
 * @returns {MutationObserver} - The created observer
 */
async function setupStateVerificationObserver(verifyData, callback) {
    if (!verifyData || !verifyData.verifyExpected) {
        console.error("Invalid verification data: missing expected state");
        return null;
    }
    
    // For 'hidden' state, we might not find the element (which is expected)
    const isHiddenCheck = verifyData.verifyExpected === 'hidden';
    
    // If we have a locator, try to find the element
    let element = null;
    if (verifyData.verifyLocator) {
        element = await find_element(verifyData.verifyLocator);
        console.log("Initial element for state verification:", element);
    }
    
    // If we're not checking for hidden and element is not found, we can't verify
    if (!isHiddenCheck && !element) {
        console.warn(`Element not found for state verification: ${verifyData.verifyLocator}`);
        return null;
    }
    
    // For hidden check, if element is not found, it's considered a success
    if (isHiddenCheck && !element) {
        console.log("Element not found, which matches 'hidden' state requirement");
        
        // Send verification success to background
        chrome.runtime.sendMessage({
            action: "verifyStatement",
            data: verifyData.src
        });
        
        // Execute callback if provided
        if (typeof callback === 'function') {
            callback(true);
        }
        
        return null; // No observer needed
    }
    
    // Create a mutation observer
    const observer = new MutationObserver(mutations => {
        // Check if element is still in the DOM
        const inDom = element ? document.body.contains(element) : false;
        
        // Hidden check - if it's not in DOM, that satisfies hidden
        if (isHiddenCheck && !inDom) {
            console.log(`State verification passed: element is hidden (not in DOM)`);
            
            // Send verification result to background
            chrome.runtime.sendMessage({
                action: "verifyStatement",
                data: verifyData.src
            });
            
            // Execute callback if provided
            if (typeof callback === 'function') {
                callback(true);
            }
            
            // Disconnect observer once verified
            observer.disconnect();
            
            // Remove from active observers list
            const index = window.stateVerificationObservers.indexOf(observer);
            if (index > -1) {
                window.stateVerificationObservers.splice(index, 1);
            }
            
            return;
        }
        
        // Proceed only if element is in DOM (except for hidden check)
        if (inDom) {
            const state = verifyData.verifyExpected;
            let result = false;
            
            // Check for different states
            switch (state) {
                case "visible":
                    const style = window.getComputedStyle(element);
                    result = style.display !== "none" && 
                             style.visibility !== "hidden" && 
                             element.offsetWidth > 0 && 
                             element.offsetHeight > 0;
                    break;
                    
                case "hidden":
                    const hiddenStyle = window.getComputedStyle(element);
                    result = hiddenStyle.display === "none" || 
                             hiddenStyle.visibility === "hidden" || 
                             element.offsetWidth === 0 || 
                             element.offsetHeight === 0;
                    break;
                    
                case "enabled":
                    result = !element.disabled;
                    break;
                    
                case "disabled":
                    result = element.disabled === true;
                    break;
                    
                case "checked":
                    result = element.checked === true;
                    break;
                    
                default:
                    console.warn(`Unknown state: ${state}`);
                    return;
            }
            
            // If verification passes, trigger callback
            if (result) {
                console.log(`State verification passed: ${state}`);
                
                // Send verification result to background - no extra details for compatibility
                chrome.runtime.sendMessage({
                    action: "verifyStatement",
                    data: verifyData.src
                });
                
                // Execute callback if provided
                if (typeof callback === 'function') {
                    callback(true);
                }
                
                // Disconnect observer once verified
                observer.disconnect();
                
                // Remove from active observers list
                const index = window.stateVerificationObservers.indexOf(observer);
                if (index > -1) {
                    window.stateVerificationObservers.splice(index, 1);
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
    if (window.stateVerificationObservers && window.stateVerificationObservers.length > 0) {
        console.log(`Cleaning up ${window.stateVerificationObservers.length} state verification observers`);
        window.stateVerificationObservers.forEach(cleanupObserver);
        window.stateVerificationObservers = [];
    }
}

// Export functions for use in other modules
window.stateVerification = {
    setupStateVerificationObserver,
    cleanupObserver,
    cleanupAllObservers
};