console.log("Content scripts loaded");

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "executeCommand") {
    console.log("From content scripts: execute command received");
    console.log("Executing commands:", message.data);

    const test = message.data;
    console.log(test);
    (async () => {
      try {
        var i=0;
        for (const item of test) {
          i=i+1;
          const action = item.code[0]; // e.g., "type" or "click"
          const value = action === "type" ? item.code[1].replace(/"/g, "") : null; // Extract the value if action is "type"
          const xpath = item.code[item.code.indexOf("in") + 1].replace(/"/g, ""); // Extract the XPath
          const delay = item.timeout || 1000; // Use the timeout from the command or default to 1000ms

          console.log(`Executing action: ${action}, Value: ${value}, XPath: ${xpath}, Delay: ${delay}`);

          const element = await find_element(xpath); // Find element using XPath
          if (!element) {
            console.error(`Element not found for XPath: ${xpath}`);
            sendResponse({ status: 'error', message: `Element not found for XPath: ${xpath}` });
            return;
          }

          await execute(action, element, delay, value); 

              // Content script: Sending a message to the background script
                chrome.runtime.sendMessage(
                  {
                    action: "updateProgress",
                    data: {line:i,total:test.length},
                  },
                  (response) => {
                    console.log("Response from background script:", response);
                  }
                );

        }

        sendResponse({ status: 'success', message: 'Commands executed successfully!' });
      } catch (error) {
        console.error("Error during execution:", error);
        sendResponse({ status: 'error', message: error.message });
      }
    })();

    return true; // Keep the message channel open for async response
  }
});
