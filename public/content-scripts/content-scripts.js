chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "APPLY_COLOR") {
      try {
        document.body.style.backgroundColor = message.color;
        sendResponse({ status: "success", message: "Color applied successfully!" });
      } catch (error) {
        console.error("Error applying color:", error);
        sendResponse({ status: "error", message: "Failed to apply color." });
      }
    }
  });
  