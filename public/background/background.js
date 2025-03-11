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


//thisi si the logic we use in background inorder to store information related to test case 

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Received message from content script:", message);
  if (message.action === "startUsabilityTest") {
    const testDetails = {
        taskId: message.taskId,
        taskName: message.taskName,
        description: message.description,
        status: "in-progress",
        startTime: Date.now()
    };

    chrome.storage.local.set({ [`usabilityTest`]: testDetails }, () => {
        console.log(`Stored usability test: ${message.taskId}`);
    });

    sendResponse({ status: "success", message: `Usability test started for ${message.taskId}` });
  }
 

});


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Received message from popup:", message);

  if (message.action === "endUsabilityTest") {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          

          chrome.tabs.sendMessage(tabs[0].id, {
              action: "endUsabilityTest",
              taskId: message.taskId
          }, (response) => {
              console.log("Message forwarded to content script:", response);
              sendResponse({ status: "success", message: "End test message sent" });
          });
      });

      return true; // Keep the message channel open for async operations
  }
});




chrome.webNavigation.onDOMContentLoaded.addListener((details) => {
  console.log("\nNavigating to :" + details.url + "\n");
 console.log(line)
});


