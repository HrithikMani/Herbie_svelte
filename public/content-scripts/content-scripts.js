

console.log("Content scripts loaded");
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "executeCommand") {
      console.log("From content scripts: execute command received");
      console.log("Executing command:", message.data);

      const element = document.getElementById("test-button");
      // Call the execute function
      (async () => {
          await execute("click", element, 1000);
      })();

      sendResponse({ status: 'success', message: 'Command executed successfully!' });

      // Return true to keep the message channel open
      return true;
  }
});
