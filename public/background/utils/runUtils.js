import { ParseScript } from '../../parser/parser.js'; 

export async function handleRunScript(scriptContent, sendResponse) {
 console.log("Run is a combination of parse and execute")
}

export async function handleExecuteScript(scriptContent, sendResponse) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length > 0 && tabs[0].id) {
            const activeTabId = tabs[0].id;

            // Send message to content script
            chrome.tabs.sendMessage(
                activeTabId,
                { action: 'executeCommand', data: scriptContent, line: 0 },
                (response) => {
                    if (chrome.runtime.lastError) {
                        console.error("Error sending message to content script:", chrome.runtime.lastError.message);
                        sendResponse({ status: 'error', message: 'Failed to execute command' });
                    } else {
                        console.log('Response from content script:', response);
                        sendResponse(response);
                    }
                }
            );
        } else {
            console.error("No active tab found");
            sendResponse({ status: 'error', message: 'No active tab found' });
        }
    });

    // Keep the message channel open for async response
    return true;
}
