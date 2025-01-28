import { handleParseLine, handleParseScript } from './utils/parseUtils.js';
import {handleRunScript,handleExecuteScript} from './utils/runUtils.js';

let line = 10;
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
});


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "openPopup") {
    chrome.action.openPopup(); // This will open the extension's popup
    sendResponse({ status: "Popup opened" });
  }
});




chrome.webNavigation.onDOMContentLoaded.addListener((details) => {
  console.log("\nNavigating to :" + details.url + "\n");

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0 && tabs[0].id) {  // Ensure the tab object is valid
          sendMessageWithRetry(tabs[0].id, cmdtree, line); // Pass the tab ID, not the whole tab object
      }
  });
});

function sendMessageWithRetry(tabId, data, line, retries = 5) {
  if (retries <= 0) {
    console.error('Exceeded maximum retries. Stopping message attempts.');
    return;
  }

  console.log(`Sending message to tabId: ${tabId}, line: ${line + 1}, retries left: ${retries}`);

  chrome.tabs.sendMessage(tabId, { 
      action: 'executeCommandFrom', 
      data: data, 
      line: line 
    }, 
    (response) => {
      if (chrome.runtime.lastError || !response) {
        console.log(`Retry ${6 - retries}: Failed to send message, retrying...\n`);
        setTimeout(() => {
          sendMessageWithRetry(tabId, data, line, retries - 1);
        }, 500); // Wait 500ms before retrying
      } else {
        console.log('Response from content script:', response);
      }
    }
  );
}

