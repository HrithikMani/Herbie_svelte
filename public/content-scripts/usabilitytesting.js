window.addEventListener("message", (event) => {
    if (event.source !== window || !event.data) return;
  
    if (event.data.action === "startUsabilityTest") {
        console.log("Forwarding usability test start to background script:", event.data);
        startTracking();
        chrome.runtime.sendMessage({
            action: "startUsabilityTest",
            taskId: event.data.taskId,
            taskName: event.data.taskName,
            description: event.data.description,
            testHerbieScript: event.data.testHerbieScript
        });
    }
   
  });
  
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Received message from background script:", message);
  
    if (message.action === "endUsabilityTest") {
        console.log("Ending usability test...");
       
  
        sendResponse({ status: "success", message: "Usability test ended on the page" });
    }
  });
  
  
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "updateUsabilityResults") {
        console.log("Updating usability test attribute:", message.data);

        // Find or create a hidden div element to store the results
        let resultDiv = document.getElementById("usabilityTestResults");
        if (!resultDiv) {
            resultDiv = document.createElement("div");
            resultDiv.id = "usabilityTestResults";
            resultDiv.style.display = "none"; // Keep it hidden
            document.body.appendChild(resultDiv);
        }

        // Update the attribute with JSON string
        resultDiv.setAttribute("data-test-results", JSON.stringify(message.data));

        sendResponse({ status: "Test results rendered successfully" });
    }
});
