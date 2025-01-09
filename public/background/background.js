chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "COLOR_UPDATE") {
      const color = message.color.trim();
  
      // Validate the color
      const isValidColor =
        /^#[0-9A-F]{6}$/i.test(color) ||
        /^rgb\((\d{1,3},\s*){2}\d{1,3}\)$/i.test(color) ||
        /^[a-z]+$/i.test(color);
  
      if (!isValidColor) {
        sendResponse({ status: "error", message: "Invalid color format. Try again." });
        return;
      }
  
      // Relay the color to the content script
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(
            tabs[0].id,
            { type: "APPLY_COLOR", color },
            (response) => {
              if (chrome.runtime.lastError) {
                console.error("Error communicating with content script:", chrome.runtime.lastError.message);
                sendResponse({ status: "error", message: "Failed to apply color." });
              } else {
                sendResponse(response);
              }
            }
          );
        }
      });
  
      // Required for asynchronous responses
      return true;
    }
  });
  