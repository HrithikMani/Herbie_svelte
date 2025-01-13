

console.log("Content scripts loaded");
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "executeCommand") {
      console.log("From content scripts: execute command received");
      console.log("Executing command:", message.data);

      (async () => {
        const element = document.getElementById("text-input");
        if (!element) {
            console.error("Element not found");
            sendResponse({ status: 'error', message: 'Element not found' });
            return;
        }

    
        await execute("navigate", element, 1000,"https://www.google.com/"); // Click operation

        sendResponse({ status: 'success', message: 'Commands executed successfully!' });
    })();

      // Return true to keep the message channel open
      return true;
  }
});
