<script>
  import { onMount } from "svelte";
  import EventEmitter from "../utils/EventEmitter.js"; // Use your event emitter utility
  import LogComponent from '../components/LogComponent.svelte'; // Import LogComponent

  let progress = 0;
  let logs = [];

  // Handle event subscriptions on mount
  onMount(() => {
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

      <button
        id="herbie_save"
        title="Add to Saved Scripts"
        class="save-button"
        aria-label="Save Herbie"
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
        placeholder="Type or load your test scripts here..."
        name="Script"
        rows="10"
        cols="80"
        aria-label="Herbie Script Area"
      >click on '#test-button'</textarea>
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
        <button id="herbie_add" class="button" aria-label="Add Command">
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
</style>


