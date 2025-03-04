<script>
  import { onDestroy } from "svelte";

  let testUrl = "https://hrithik.webchartnow.com/webchart.cgi?f=chart&s=pat&pat_id=46";
  let testScript = "Write Amoxicillin 500mg capsule 2 caps daily for 7 days.  For Prescriber: Anna Bates.  Total quantity: 14 and no refills. Allow substitutions   Send the script to 'MIE Test Pharmacy'"; // Example script to inject
  let isRunning = false;
  let currentTabId = null;

  // Start Test Function
  function startTest() {
    if (!testUrl.trim()) {
      alert("Please enter a valid URL before starting.");
      return;
    }
    if (isRunning) return;

    isRunning = true;

    // Check if chrome API is available
    if (typeof chrome !== "undefined" && chrome.tabs) {
      chrome.tabs.create({ url: testUrl }, (tab) => {
        if (chrome.runtime.lastError) {
          alert("Failed to open tab: " + chrome.runtime.lastError.message);
          isRunning = false;
          return;
        }
        currentTabId = tab.id;

        // Listen for the tab to completely load
        chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
          if (tabId === currentTabId && changeInfo.status === "complete") {
            // Inject script when the tab is fully loaded
            injectScript(tabId);
            chrome.tabs.onUpdated.removeListener(listener); // Remove listener to avoid multiple injections
          }
        });
      });
    } else {
      alert("Chrome API is not available. Ensure this is running inside a Chrome extension.");
      isRunning = false;
    }
  }

  // Function to inject script
  function injectScript(tabId) {
    if (!tabId) return;

    chrome.scripting.executeScript(
      {
        target: { tabId: tabId },
        func: () => {
          document.body.style.backgroundColor = "lightblue"; // Directly change background color
        }
      },
      () => {
        if (chrome.runtime.lastError) {
          console.error("Injection failed:", chrome.runtime.lastError.message);
        }
      }
    );
  }

  // Stop Test Function
  function stopTest() {
    if (!isRunning || !currentTabId) return;
    isRunning = false;

    chrome.tabs.remove(currentTabId, () => {
      if (chrome.runtime.lastError) {
        console.warn("Error closing tab:", chrome.runtime.lastError.message);
      }
    });

    chrome.runtime.sendMessage({ action: "STOP_TEST" });
  }

  // Cleanup on component destroy
  onDestroy(() => {
    if (isRunning) stopTest();
  });
</script>

<div id="usability-test">
  <h2>Usability Testing</h2>

  <!-- Test URL Input -->
  <div class="form-group">
    <label for="test-url">Test URL:</label>
    <input type="text" id="test-url" bind:value={testUrl} placeholder="Enter URL (e.g. https://example.com)" />
  </div>

  <!-- Test Script Input -->
  <div class="form-group">
    <label for="test-script">Test Script:</label>
    <textarea id="test-script" bind:value={testScript} placeholder="Enter JavaScript to execute..." rows="4"></textarea>
  </div>

  <!-- Control Buttons -->
  <div class="button-group">
    <button on:click={startTest} class="btn btn-primary" disabled={isRunning}>
      <i class="fas fa-play"></i> Start Test
    </button>
    <!-- <button on:click={stopTest} class="btn btn-danger" disabled={!isRunning}>
      <i class="fas fa-stop"></i> Stop Test
    </button> -->
  </div>
</div>

<style>
  #usability-test {
    padding: 16px;
    width: 300px;
    font-family: Arial, sans-serif;
  }

  .form-group {
    margin-bottom: 10px;
  }

  label {
    display: block;
    font-weight: bold;
  }

  input, textarea {
    width: 100%;
    padding: 6px;
    margin-top: 5px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 14px;
  }

  .button-group {
    display: flex;
    gap: 10px;
  }

  .btn {
    padding: 8px 12px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
  }

  .btn-primary {
    background-color: #007bff;
    color: white;
  }

  .btn-danger {
    background-color: #dc3545;
    color: white;
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
</style>
