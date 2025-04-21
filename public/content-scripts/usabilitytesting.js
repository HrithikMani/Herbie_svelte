
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
  
  
  chrome.runtime.onMessage.addListener(async(message, sender, sendResponse) => {
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
        console.log("data-test-results"+ JSON.stringify(message.data));

        sendResponse({ status: "Test results rendered successfully" });
    }
  


    if (message.action === "setObserver") {
        console.log("Setting observability on verified statements");
        console.log(message.herbie_object);
      
        const element = await find_element(message.herbie_object[0].verifyLocator);
        console.log("Initial element:", element);
      
        const observer = new MutationObserver(mutations => {
          // 1) Is it still in the document?
          const inDom = document.body.contains(element);
      
          // 2) If it is, is it actually visible?
          let isVisible = false;
          if (inDom) {
            const style = window.getComputedStyle(element);
            isVisible =
              style.display !== "none" &&
              style.visibility !== "hidden" &&
              element.offsetWidth > 0 &&
              element.offsetHeight > 0;
          }
      
         if(isVisible){
            chrome.runtime.sendMessage(
                {
                  action: "verifyStatement",
                  data:message.herbie_object[0].src ,
                });
         }
        });
      
        observer.observe(document.body, {
          childList: true,
          subtree: true,
          attributes: true,
          characterData: true
        });
      }
      





});
/*

function setupObserver(element, verification, index) {
    const observer = new MutationObserver(mutations => {
        const condition = verification.verifyType || 'text';
        const expected = verification.verifyExpected || 
                        (verification.code[1] ? verification.code[1].replace(/^["']|["']$/g, '') : '');
        const operator = verification.verifyOperator || 'contains';
        
        checkVerificationCondition(element, condition, expected, operator, index, verification);
    });
    
    observer.observe(element, {
        attributes: true,
        childList: true,
        characterData: true,
        subtree: true
    });
    
    return observer;
}
*/