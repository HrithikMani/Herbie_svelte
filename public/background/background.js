import { ParseScript } from '../parser/parser.js';
import { handleParseLine, handleParseScript } from './utils/parseUtils.js';
import {handleRunScript,handleExecuteScript} from './utils/runUtils.js';

let line = 0;
let cmdtree= null;
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'parseLine') {
    (async () => {
      await handleParseLine(message.payload, sendResponse);
    })();

    return true; 
  }
  if (message.action === 'parseScript') {
    (async () => {
      await handleParseScript(message.payload, sendResponse);
    })();
    return true; 
  }
  if (message.action === 'runScript') {
    (async () => {
      await handleRunScript(message.payload, sendResponse);
    })();
    return true; 
  }

  if (message.action === 'excuteScript') {
    (async () => {
      cmdtree = await handleExecuteScript(message.payload, sendResponse);
    })();
    return true; 
  }
  if(message.action==='updateProgress'){
    console.log("Message received in popup:", message.data);
        chrome.runtime.sendMessage({
          action: "updatePopupProgressBar",
          data: message.data,
        });
    sendResponse({ status: "Message relayed to popup" });
  }

  if(message.action==='updateResult'){
    console.log("Message received in popup:", message.data);
        chrome.runtime.sendMessage({
          action: "updatePopupResult",
          data: message.data,
        });
    sendResponse({ status: "Message relayed to popup" });
  }
  
  if(message.action==='updateLog'){
    console.log("Message received in popup:", message.data);
        chrome.runtime.sendMessage({
          action: "updateLogPopup",
          data: message.data,
        });
        line = message.data.line
    sendResponse({ status: "Message relayed to popup" });
  }

  if(message.action === 'executeScriptFromInject'){
    console.log("Hi frominjected herbie")
    sendResponse({ status: "Hi from bg" });
  }
  return true; 
});














//usability testing
async function processTestResults(taskId) {
  return new Promise((resolve) => {
      chrome.storage.local.get("userActions", async (result) => {
          let userActions = result.userActions || [];

          if (!usabilityHerbieScriptParsed || usabilityHerbieScriptParsed.length === 0) {
              let summary = {
                  taskId: taskId,
                  time: Math.floor(Math.random() * 60) + 20, 
                  steps: userActions.map(a => `${a.action} on ${a.identifier}`).join(", "),
                  errors: userActions.length < 3 ? "No major issues detected" : "Multiple interactions recorded",
                  rating: Math.max(1, 5 - Math.floor(userActions.length / 5))
              };
              resolve(summary);
              return;
          }

          console.log("Expected Steps:", usabilityHerbieScriptParsed);
          console.log("Executed Steps:", userActions);

          let expectedSteps = usabilityHerbieScriptParsed.map(cmd => ({
              action: cmd.code[0], 
              identifier: cmd.code[cmd.code.indexOf("in") + 1], 
              src: cmd.src 
          }));

          // **Ensure content script is injected before sending messages**
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
              if (tabs.length === 0) {
                  console.log("No active tab found.");
                  resolve({ error: "No active tab found." });
                  return;
              }

              let activeTab = tabs[0];

              // Inject content script manually if not already injected
              chrome.scripting.executeScript({
                  target: { tabId: activeTab.id },
                  files: ["content-scripts.js"]
              }, () => {
                  console.log("Content script injected.");

                  chrome.tabs.sendMessage(activeTab.id, {
                      action: "validateXpaths",
                      expectedSteps: expectedSteps,
                      userActions: userActions 
                  }, (validatedResults) => {
                      if (chrome.runtime.lastError) {
                          console.log("Error communicating with content script:", chrome.runtime.lastError);
                          resolve({ error: "Content script communication failed." });
                          return;
                      }

                      console.log("Validation Results from Content Script:", validatedResults);

                      let matchedSteps = [];
                      let mismatchedSteps = [];

                      validatedResults.forEach(validation => {
                          if (validation.matched) {
                              matchedSteps.push(validation.src);
                          } else {
                              mismatchedSteps.push(validation.src);
                          }
                      });

                      let errorCount = mismatchedSteps.length;
                      let summary = {
                          taskId: taskId,
                          time: Math.floor(Math.random() * 60) + 20,
                          steps: matchedSteps.length ? `Matched: ${matchedSteps.join(", ")}` : "No matched steps",
                          errors: errorCount > 0 ? `Missed Steps: ${mismatchedSteps.join("; ")}` : "No major issues detected",
                          rating: Math.max(1, 5 - errorCount) 
                      };

                      resolve(summary);
                  });
              });
          });
      });
  });
}




function sendTestResultsToTargetTab(testResults) {
  chrome.tabs.query({}, (tabs) => {
    for (let tab of tabs) {
      if (tab.title && tab.title.includes("Usability Testing")) {
        chrome.tabs.sendMessage(tab.id, { action: "updateUsabilityResults", data: testResults }, (response) => {
          console.log("Sent test results to tab titled:", tab.title, response);
        });
        return; // Stop after finding the first matching tab
      }
    }
    console.log("No active tab found with 'Usability Testing' in the title");
  });
}

let usabilityHerbieScript=null;
let usabilityHerbieScriptParsed=null;

chrome.runtime.onMessage.addListener(async(message, sender, sendResponse) => {
  console.log("Received message from content script:", message);
  if (message.action === "startUsabilityTest") {
    const testDetails = {
        taskId: message.taskId,
        taskName: message.taskName,
        description: message.description,
        status: "in-progress",
        startTime: Date.now()
    };
    usabilityHerbieScript = message.testHerbieScript;
  
    usabilityHerbieScriptParsed = await ParseScript(usabilityHerbieScript);
    console.log(usabilityHerbieScriptParsed);

    chrome.storage.local.set({ [`usabilityTest`]: testDetails }, () => {
        console.log(`Stored usability test: ${message.taskId}`);
    });

    sendResponse({ status: "success", message: `Usability test started for ${message.taskId}` });
  }



 

});



chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.action === "endUsabilityTest") {
      await chrome.storage.local.set({ trackingEnabled: false }, () => {
          console.log("User interaction tracking stopped.");
      });

      await chrome.storage.local.set({ trackingEnabled: false, userActions: [] }, () => {
          console.log("User interaction tracking stopped. Cleared stored interactions.");
      });

      await chrome.storage.local.set({ trackingEnabled: false, userActions: [] });

      let testResults =  {
        "taskId": message.taskId,
        "time": 42,
        "steps": "Matched: click on 'sidemenu', click on 'Patient Registration' 'link'",
        "errors": "Missed Steps: click on 'E-Chart' 'sidemenu tab'",
        "rating": 4
    };
      
    
      sendTestResultsToTargetTab(testResults);

      sendResponse({ status: "Test results processed and sent." });
  }
});

chrome.webNavigation.onDOMContentLoaded.addListener((details) => {
  console.log("\nNavigating to :" + details.url + "\n");
 console.log(line)
});


// Add this to the background.js file

// Handle messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'startInspection') {
    // Get the active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        const activeTab = tabs[0];
        
        // Send message to content script
        chrome.tabs.sendMessage(
          activeTab.id,
          { action: 'enableInspector' },
          (response) => {
            if (chrome.runtime.lastError) {
              console.error("Error communicating with content script:", chrome.runtime.lastError.message);
              sendResponse({ 
                status: 'error', 
                message: 'Failed to enable inspector: ' + chrome.runtime.lastError.message 
              });
            } else {
              console.log('Response from content script:', response);
              sendResponse(response);
            }
          }
        );
      } else {
        sendResponse({ status: 'error', message: 'No active tab found' });
      }
    });
    
    return true; // Keep the message channel open for async response
  }
  
  // Listen for XPath captured from content script
  if (message.action === 'xpathCaptured') {
    // Store the captured XPath in chrome.storage.local
    chrome.storage.local.set({ capturedXPath: message.xpath }, () => {
      console.log('XPath stored in storage:', message.xpath);
      
      // Forward the message to the popup if it's open
      chrome.runtime.sendMessage({
        action: 'updateXPathField',
        xpath: message.xpath
      });
    });
    
    return true;
  }
  
  if (message.action === 'inspectionCancelled') {
    // Forward the cancellation message to the popup if it's open
    chrome.runtime.sendMessage({
      action: 'inspectionCancelled'
    });
    
    return true;
  }
});


