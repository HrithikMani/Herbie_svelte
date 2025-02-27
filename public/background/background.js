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


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "openPopup") {
    chrome.action.openPopup(); // This will open the extension's popup
    sendResponse({ status: "Popup opened" });
  }
});



chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Received message from content script:", message);

  if (message.action === "buttonClick") {
      // Store button click in Chrome storage
      chrome.storage.local.set({ lastClicked: message.buttonId }, () => {
          console.log(`Stored button click: ${message.buttonId}`);
      });

      sendResponse({ action: "updateLastClicked", buttonId: message.buttonId });
  } 
  else if (message.action === "getLastClicked") {
      // Retrieve last clicked button from storage
      chrome.storage.local.get("lastClicked", (data) => {
          sendResponse({ action: "updateLastClicked", buttonId: data.lastClicked || "None" });
      });

      return true; // Indicate async response
  }
});







chrome.webNavigation.onDOMContentLoaded.addListener((details) => {
  console.log("\nNavigating to :" + details.url + "\n");
 console.log(line)
});

// function sendMessageWithRetry(tabId, data, line, retries = 3) {

//   debugger;
//   if (retries <= 0) {
//     console.error('Exceeded maximum retries. Stopping message attempts.');
//     return;
//   }

  

//   chrome.tabs.sendMessage(
//     tabId,
//     { action: 'executeCommandFrom', data: data, line: line },
//     (response) => {
//       if (chrome.runtime.lastError || !response) {
//         console.warn(`Retry ${6 - retries}: Failed to send message, retrying...`);
//         setTimeout(() => {
//           sendMessageWithRetry(tabId, data, line, retries - 1);
//         }, 500); 
//       } else {
//         console.log('Response from content script:', response);
//         return;
//       }
//     }
//   );
// }
// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//   console.log("Received message in background:", message);

//   if (message.action === 'executeScriptFromInject') {
//       console.log("Executing script:", message.payload);

//       // Simulate processing
//       setTimeout(() => {
//           sendResponse({ status: "Script executed successfully" });
//       }, 1000); // Delay response to prevent early closure
//   }

//   return true; // Keep message port open for async response
// });
