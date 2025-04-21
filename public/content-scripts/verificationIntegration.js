/**
 * Verification Integration
 * Extends usability testing with advanced verification capabilities
 */

// Initialize verification containers if not already present
window.textVerificationObservers = window.textVerificationObservers || [];
window.attributeVerificationObservers = window.attributeVerificationObservers || [];
window.stateVerificationObservers = window.stateVerificationObservers || [];
window.pageVerificationTimers = window.pageVerificationTimers || [];

// Add an enhanced message listener that doesn't interfere with existing ones
chrome.runtime.onMessage.addListener(async function(message, sender, sendResponse) {
    // Handle the setObserver message
    if (message.action === "setObserver") {
        console.log("Setting observability on verified statements");
        console.log(message.herbie_object);
        
        // Process all verification items
        if (Array.isArray(message.herbie_object)) {
            // For backward compatibility, handle the first item with original code
            if (message.herbie_object.length > 0 && message.herbie_object[0].verifyLocator) {
                const element = await find_element(message.herbie_object[0].verifyLocator);
                console.log("Initial element:", element);
                
                if (element) {
                    const observer = new MutationObserver(mutations => {
                        // 1) Is it still in the document?
                        const inDom = document.body.contains(element);
                        
                        // 2) If it is, is it actually visible?
                        let isVisible = false;
                        if (inDom) {
                            const style = window.getComputedStyle(element);
                            isVisible = style.display !== "none" &&
                                        style.visibility !== "hidden" &&
                                        element.offsetWidth > 0 &&
                                        element.offsetHeight > 0;
                        }
                        
                        if(isVisible){
                            chrome.runtime.sendMessage({
                                action: "verifyStatement",
                                data: message.herbie_object[0].src
                            });
                        }
                    });
                    
                    observer.observe(document.body, {
                        childList: true,
                        subtree: true,
                        attributes: true,
                        characterData: true
                    });
                    
                    // Store observer for cleanup
                    window.stateVerificationObservers.push(observer);
                }
            }
            
            // Handle all items with our enhanced system
            for (const verifyItem of message.herbie_object) {
                if (verifyItem && window.verificationManager) {
                    window.verificationManager.setupVerificationObserver(verifyItem);
                }
            }
        }
        
        // Return true to prevent other handlers from processing this message
        return true;
    }
    
    // Handle test end to clean up observers
    if (message.action === "endUsabilityTest") {
        console.log("Ending usability test, cleaning up all verification resources");
        
        // Clean up all verification resources
        if (window.verificationManager) {
            window.verificationManager.cleanupAllVerifications();
        } else {
            // Fallback cleanup if the verification manager isn't loaded
            // Clean up text verification observers
            if (window.textVerificationObservers && window.textVerificationObservers.length > 0) {
                window.textVerificationObservers.forEach(observer => {
                    if (observer && typeof observer.disconnect === 'function') {
                        observer.disconnect();
                    }
                });
                window.textVerificationObservers = [];
            }
            
            // Clean up attribute verification observers
            if (window.attributeVerificationObservers && window.attributeVerificationObservers.length > 0) {
                window.attributeVerificationObservers.forEach(observer => {
                    if (observer && typeof observer.disconnect === 'function') {
                        observer.disconnect();
                    }
                });
                window.attributeVerificationObservers = [];
            }
            
            // Clean up state verification observers
            if (window.stateVerificationObservers && window.stateVerificationObservers.length > 0) {
                window.stateVerificationObservers.forEach(observer => {
                    if (observer && typeof observer.disconnect === 'function') {
                        observer.disconnect();
                    }
                });
                window.stateVerificationObservers = [];
            }
            
            // Clean up page verification timers
            if (window.pageVerificationTimers && window.pageVerificationTimers.length > 0) {
                window.pageVerificationTimers.forEach(timerId => {
                    clearInterval(timerId);
                });
                window.pageVerificationTimers = [];
            }
        }
        
        // Don't return true here to allow other handlers to process the message
        return false;
    }
    
    // Continue normal processing for other messages
    return false;
});

console.log("Enhanced verification system initialized");