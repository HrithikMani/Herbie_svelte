import { ParseScript } from '../parser/parser.js';
import { handleParseLine, handleParseScript } from './utils/parseUtils.js';
import {handleRunScript,handleExecuteScript} from './utils/runUtils.js';

let line = 0;
let cmdtree= null;
let verifyStmpts = {};
let usabilityHerbieScript=null;
let usabilityHerbieScriptParsed=null;
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

  if (message.action === "verifyStatement") {
    // Store all verification attempts, whether successful or not
    const data = message.data; // The verification statement text
    
    if (message.result) {
      // If we have a result object, store it with success status
      verifyStmpts[data] = {
        message: message.result.message,
        success: message.result.success || false // Default to true if not specified
      };
    } else {
      // If no result object was provided, record it as a failed verification
      verifyStmpts[data] = {
        message: "Verification condition was not met during test",
        success: false
      };
    }
  }
  return true; 
});











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



chrome.runtime.onMessage.addListener(async(message, sender, sendResponse) => {
  console.log("Received message from content script:", message);
  if (message.action === "startUsabilityTest") {
    // Parse the Herbie script
    usabilityHerbieScript = message.testHerbieScript;
    usabilityHerbieScriptParsed = await ParseScript(usabilityHerbieScript);
    console.log(usabilityHerbieScriptParsed);
    console.log(message.testerName);
    
    // Initialize all verification statements as false
    verifyStmpts = {}; // Clear any previous verification statements
    
    // Add each verification statement from the parsed script with initial false status
    if (Array.isArray(usabilityHerbieScriptParsed)) {
      usabilityHerbieScriptParsed.forEach(command => {
        if (command.code[0] === "verify") {
          verifyStmpts[command.src] = {
            message: "Verification not yet met",
            success: false
          };
        }
      });
    }
    
    // Create test details with both raw and parsed scripts
    const testDetails = {
        taskId: message.taskId,
        taskName: message.taskName,
        testerName: message.testerName,
        description: message.description,
        status: "in-progress",
        startTime: Date.now(),
        herbieScript: usabilityHerbieScript,           // Store the raw script
        herbieScriptParsed: usabilityHerbieScriptParsed, // Store the parsed script
        initialVerifyStmpts: JSON.parse(JSON.stringify(verifyStmpts)) // Store a copy of the initial verification statements
    };
    
    // Save to Chrome storage
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
        "time": message.time,
        "verify_statements": JSON.stringify(verifyStmpts),
        "taskName": message.taskName,
        "testerName": message.testerName,
        
    };
      
    
      sendTestResultsToTargetTab(testResults);
      for (const key in verifyStmpts) {
        if (Object.prototype.hasOwnProperty.call(verifyStmpts, key)) {
          delete verifyStmpts[key];
        }
      }
      

      sendResponse({ status: "Test results processed and sent." });
  }
  if(message.action ==="setObserver"){
    
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tabs.length === 0 || !tabs[0].id) {
            console.error("No active tab found");
            sendResponse({ status: 'error', message: 'No active tab found' });
            return null;
        }
        const activeTabId = tabs[0].id;
        const currentUrl = tabs.length > 0 ? tabs[0].url : '';
       
        const result = await ParseScript(message.herbie_script, currentUrl); 
        console.log(result);
    chrome.tabs.sendMessage(
      activeTabId,
      { action: 'setObserver',   herbie_object:result})
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


