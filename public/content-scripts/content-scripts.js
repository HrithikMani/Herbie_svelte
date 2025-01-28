console.log("Content scripts loaded");
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "executeCommandFrom") {
    console.log("Executing commands:", message.data);

    const test = message.data;
    const startLine = message.line || 0; // Default to 0 if message.line is not provided

    if (!Array.isArray(test) || test.length === 0) {
      sendResponse({ status: 'error', message: 'No valid commands to execute' });
      return;
    }

    (async () => {
      try {
        for (let i = startLine; i < test.length; i++) {
          const item = test[i];
          const action = item.code[0]; // Action type (e.g., "type", "click")
          const value = action === "type" ? item.code[1].replace(/"/g, "") : null; // Value to type
          const xpath = item.code[item.code.indexOf("in") + 1]; // Extract XPath
          const delay = item.timeout || 1000; // Default delay
        var element =null
          console.log(`Executing action: ${action}, Value: ${value}, XPath: ${xpath}, Delay: ${delay}`);
          if(action !=="wait"){
          element=await find_element(xpath);
          if (!element) {
            console.error(`Element not found for XPath: ${xpath}`);
            sendResponse({ status: 'error', message: `Element not found for XPath: ${xpath}` });
          }
          }
          await execute(action, element, delay, value);

          // Update progress in the background script
          chrome.runtime.sendMessage(
            {
              action: "updateProgress",
              data: { line: i + 1, total: test.length }, // Line starts from 1 for progress
            },
            (response) => {
              console.log("Response from background script (progress):", response);
            }
          );

          // Update logs in the background script
          chrome.runtime.sendMessage(
            {
              action: "updateLog",
              data: { line: i + 1, desc: `Performed '${action}' on '${xpath}'` },
            },
            (response) => {
              console.log("Response from background script (logs):", response);
            }
          );
        }

        // Notify that the execution was successful
        sendResponse({ status: 'success', message: 'Commands executed successfully!' });
      } catch (error) {
        console.error("Error during execution:", error);
        sendResponse({ status: 'error', message: error.message });
      }
    })();

    return true; // Keep the message channel open for async operations
  }
});


document.addEventListener("click", (event) => {
  const target = event.target;

  // Check if the clicked element is a link with the class "trigger-extension"
  if (target.tagName === "A" && target.classList.contains("trigger-extension")) {
    event.preventDefault(); // Prevent the default link action

    // Send a message to the background script
    chrome.runtime.sendMessage({ action: "openPopup" }, (response) => {
      console.log("Popup triggered:", response);
    });
  }
});
