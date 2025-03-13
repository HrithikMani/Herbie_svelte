console.log("Content scripts loaded");

chrome.storage.local.get({ herbiecmdtree:[],herbiestartline:0 }, (result) => {
  console.log("retriving  herbiecmd tree in chrome storage")
  console.log(result.herbiecmdtree)
  console.log(result.herbiestartline);
 
  if(result.herbiestartline < result.herbiecmdtree.length){
    executeCommands(result.herbiestartline+1, result.herbiecmdtree)
  }
  
})

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "executeCommandFrom") {
    sendResponse({ status: 'success', message: 'Commands received' });
    console.log("Executing commands:", message.data);

    const cmdtree = message.data;
    const startLine = message.line || 0; // Default to 0 if message.line is not provided

    chrome.storage.local.set({ herbiecmdtree: cmdtree, herbiestartline: startLine }, () => {
      console.log("Stored cmdtree in Chrome storage");
    });

    if (!Array.isArray(cmdtree) || cmdtree.length === 0) {
      chrome.runtime.sendMessage({ status: 'error', message: 'No valid commands to execute' });
      return;
    }

    executeCommands(startLine, cmdtree)
      .then(() => {
        chrome.runtime.sendMessage({ status: 'success', message: 'Execution completed successfully' });
      })
      .catch((error) => {
        console.error("Error during execution:", error);
        chrome.runtime.sendMessage({ status: 'error', message: error.message });
      });

    return true; // Keep the message channel open for async operations
  }
});


async function executeCommands(startLine, cmdtree) {
  for (let i = startLine; i < cmdtree.length; i++) {

     // Properly await retrieving storage value
     const storageData = await new Promise((resolve) => {
      chrome.storage.local.get({ herbiestop: false }, (data) => resolve(data.herbiestop));
    });

    // If herbiestop is true, break the loop to stop execution
    if (storageData) {
      console.log("Stopping the test case as herbiestop is set to true.");
      return;
    }
    const item = cmdtree[i];
    const action = item.code[0]; // Action type (e.g., "type", "click")
    const value = (action === "type" || action === "select")? item.code[1].replace(/"/g, "") : null; // Value to type
    const xpath = item.code[item.code.indexOf("in") + 1]; // Extract XPath
    const delay = item.timeout || 1000; // Default delay
    let element = null;

    console.log(`Executing action: ${action}, Value: ${value}, XPath: ${xpath}, Delay: ${delay}`);

    if (action !== "wait") {
      element = await find_element(xpath);
      if (!element) {
        console.error(`Element not found for XPath: ${xpath}`);
        chrome.runtime.sendMessage({ status: 'error', message: `Element not found for XPath: ${xpath}` });
        throw new Error(`Element not found for XPath: ${xpath}`);
      }
    }

    await execute(action, element, delay, value);
    chrome.storage.local.set({ herbiestartline: i });

    // Update progress in the background script
    chrome.runtime.sendMessage(
      {
        action: "updateProgress",
        data: { line: i + 1, total: cmdtree.length }, // Line starts from 1 for progress
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
}

window.addEventListener("message", (event) => {
  if (event.source !== window || !event.data) return;

  if (event.data.action === "startUsabilityTest") {
      console.log("Forwarding usability test start to background script:", event.data);
      startTracking();
      chrome.runtime.sendMessage({
          action: "startUsabilityTest",
          taskId: event.data.taskId,
          taskName: event.data.taskName,
          description: event.data.description
      });
  }
 
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Received message from background script:", message);

  if (message.action === "endUsabilityTest") {
      console.log("Ending usability test...");
      stopTracking();
      // Directly update the webpage
      const usabilityTestElement = document.getElementById("usability-test");
      if (usabilityTestElement) {
          usabilityTestElement.innerHTML = `<p class="no-test"><i class="fas fa-exclamation-triangle"></i> Usability test ended.</p>`;
      }

      // Remove from storage
      chrome.storage.local.remove("usabilityTest", () => {
          console.log("Usability test removed from storage.");
      });

      sendResponse({ status: "success", message: "Usability test ended on the page" });
  }
});

