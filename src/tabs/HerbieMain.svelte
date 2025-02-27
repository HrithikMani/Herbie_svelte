<script>
  import { onMount } from "svelte";
  import EventEmitter from "../utils/EventEmitter.js"; // Use your event emitter utility
  import LogComponent from '../components/LogComponent.svelte'; // Import LogComponent
  export let activeTab;
  let progress = 0;
  let logs = [];
  let scriptContent = "";
  // Handle event subscriptions on mount
  onMount(() => {
    chrome.storage.local.get("herbie_script", (result) => {
      scriptContent = result.herbie_script || ""; // Set saved content or default to an empty string
    });
    chrome.storage.local.get(["herbiestop"], (result) => {
   
      if (result.herbiestop === undefined) {
      chrome.storage.local.set({ herbiestop: false });
      }
  });
    // Subscribe to progress updates
    EventEmitter.on("progressUpdate", (value) => {
      progress = value; // Update the progress bar
      updateProgressBar(progress);
    });

    // Subscribe to log events
    EventEmitter.on("logEvent", (message) => {
      logs = [...logs, message]; // Add new log messages
    });
  });

  // Popup script: Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "updatePopupProgressBar") {
    console.log("Message received in popup:", message.data);
      var value = Math.round((message.data.line/message.data.total)*100)
    EventEmitter.emit("progressUpdate", value);
    sendResponse({ status: "Popup updated" });
  }
  if (message.action === "updateLogPopup") {
    console.log("Message received in popup:", message.data);
    EventEmitter.emit("logEvent", "Line: "+(message.data.line)+", "+message.data.desc);
    sendResponse({ status: "Popup updated" });
  }
});





 // Save the script content to Chrome storage when it changes
 function saveScriptContent() {
    chrome.storage.local.set({ herbie_script: scriptContent }, () => {
      console.log("Script content saved to Chrome storage:", scriptContent);
    });
  }



  // Simulate progress updates
  function simulateProgress() {
    let value = 0;
    const interval = setInterval(() => {
      value += 10;
      EventEmitter.emit("progressUpdate", value);
      EventEmitter.emit("logEvent", `Progress updated to ${value}%`);
      if (value >= 100) clearInterval(interval);
    }, 1000);
  }

  // Function to update the progress bar DOM
  function updateProgressBar(value) {
    const progressBar = document.getElementById("herbie_progress");
    if (progressBar) {
      progressBar.style.width = `${value}%`;
      progressBar.textContent = `${value}%`;
    }
  }


  function handleHerbieRun() {
    chrome.storage.local.set({ herbiestop: false });
    EventEmitter.emit("progressUpdate", 0);
  const scriptContent = document.getElementById('herbie_script').value;
  logs=[];
  chrome.runtime.sendMessage({
    action: 'excuteScript',
    payload: scriptContent,
  },(response)=>{
    console.log('Background response:', response);
  })

  }


  function handleParseCommand(){
    const scriptContent = document.getElementById('herbie_command').value;

    chrome.runtime.sendMessage(
    {
      action: 'parseLine',
      payload: scriptContent,
    },
    (response) => {
      // Handle the response from the background script
      console.log('Background response:', response);
      EventEmitter.emit("logEvent",response.data)
    }
  );


  }
  function handleClearButton(){
    logs = [];
  }
  function handleHerbieStop() {
  chrome.storage.local.set({ herbiestop: true }, () => {
    console.log("Herbie stopped, herbiestop set to true.");
  });
  }
  function handleHerbieSave() {
  // We'll store the current scriptContent in an array of saved scripts
  chrome.storage.local.get(["savedScripts"], (result) => {
    let allScripts = result.savedScripts || [];

    // Create a new script object with a timestamp
    const newScript = {
      title: `Test Script ${new Date().toLocaleTimeString()}`,
      content: scriptContent,
      timestamp: Date.now() // or new Date().getTime()
    };

    // Add the new script to the array
    allScripts.push(newScript);

    // Sort in descending order by timestamp (newest first)
    allScripts.sort((a, b) => b.timestamp - a.timestamp);

    // Save back to Chrome storage
    chrome.storage.local.set({ savedScripts: allScripts }, () => {
      console.log("Script saved to 'savedScripts':", newScript);
      
      // Switch to "Saved Scripts" tab
      activeTab = "tab3";
    });
  });
}

function handleHerbieAdd(){
  var  herbieCommand = document.getElementById("herbie_command");
  scriptContent = scriptContent + '\n' + herbieCommand.value;
  herbieCommand.value = "";
}

</script>

<div id="tab1" class="tab-content active">
  <div id="herbie_div">
    <div id="herbie_buttons">
      <img
        id="herbie_logo"
        align="left"
        src="logos/herbie48.png"
        alt="Herbie Logo"
        height="30"
        style="padding-top: 2px; padding-left: 4px;"
      />
      <span id="herbie_documentation">
        <a target="_blank" href="http://mieweb.github.io/herbie/">Herbie</a>
      </span>

      <!-- Herbie Run Button -->
      <button
        id="herbie_run"
        title="Run"
        class="run-button"
        aria-label="Run Herbie"
        on:click={handleHerbieRun}
      >
        <i class="fas fa-play"></i>
      </button>
      <!-- Herbie Stop Button -->
      <button
        id="herbie_stop"
        title="Stop"
        class="stop-button"
        aria-label="Stop Herbie"
        on:click={handleHerbieStop}
      >
        <i class="fas fa-stop"></i>
      </button>

      <button
        id="herbie_save"
        title="Add to Saved Scripts"
        class="save-button"
        aria-label="Save Herbie"
        on:click={handleHerbieSave}
      >
        <i class="fas fa-save"></i>
        <i class="fas fa-check"></i>
      </button>
    </div>

    <!-- Progress Bar -->
    <div class="progress-container">
      <div id="herbie_progress" class="progress-bar"></div>
    </div>

    <!-- Script Area -->
    <div class="herbie_script">
      <label class="prompt" for="herbie_script">Script:</label>
      <textarea
      id="herbie_script"
      bind:value={scriptContent}
      placeholder="Type or load your test scripts here..."
      name="Script"
      rows="10"
      cols="80"
      aria-label="Herbie Script Area"
      on:input={saveScriptContent}
    ></textarea>
    </div>

    <!-- Command Bar -->
    <div class="herbie_bar">
      <label for="herbie_command">Command:</label>
      <input
        id="herbie_command"
        type="text"
        name="Command"
        maxlength="100"
        aria-label="Herbie Command Input"
      />
      <div class="button-container">
        <button id="herbie_add" class="button" aria-label="Add Command" on:click={handleHerbieAdd} >
          <i class="fas fa-plus"></i> Add
        </button>
        <button id="herbie_parse" class="button" aria-label="Parse Command"     on:click={handleParseCommand}>
          <i class="fas fa-code"></i> Parse
        </button>
        <button id="herbie_clear" class="button" aria-label="Clear Command" on:click={handleClearButton}>
          <i class="fas fa-trash-alt"></i> Clear
        </button>
        <button id="herbie_save_logs" class="button" aria-label="Save Command">
          <i class="fas fa-save"></i> Save
        </button>
      </div>
    </div>

    <!-- Log Component -->
    <LogComponent {logs} />
  </div>
</div>

<style>
  .progress-container {
    margin-top: 10px;
    width: 100%;
    height: 20px;
    background: #eee;
    border-radius: 5px;
    overflow: hidden;
  }

  .progress-bar {
    height: 100%;
    width: 0;
    background: #0078d4;
    color: white;
    text-align: center;
    line-height: 20px;
    transition: width 0.5s ease;
  }
  .button {
  background-color: var(--primary-base, #007bff); /* Fallback */
  color: var(--base-white, #ffffff); /* Fallback */
  padding: 0.5rem 1rem;
  border: none;
  border-radius: var(--button-border-radius-md, 8px); /* Fallback */
  font-size: var(--font-size-md, 16px); /* Fallback */
  transition: var(--transition-base, all 0.3s ease);
}

.button:hover {
  background-color: var(--primary-dark, #0056b3); /* Fallback */
  box-shadow: var(--shadow-base-dark, 0px 4px 6px rgba(0, 0, 0, 0.2));
}
#herbie_stop{
  background-color: #d9534f;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
}

</style>


