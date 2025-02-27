<script>
    import './Main.css'; // Your external CSS
    import { onMount } from 'svelte';
  
    let offsetX = 0;
    let offsetY = 0;
    let isDragging = false;
    let popup;
    let testScript = "Write Amoxicillin 500mg capsule 2 caps daily for 7 days.  For Prescriber: Anna Bates.  Total quantity: 14 and no refills. Allow substitutions   Send the script to 'MIE Test Pharmacy'"; // Example script to inject
  
    // Timer variables
    let startTime = 0;
    let timerInterval;
    let displayTime = '00:00:00.000'; // Shown in the UI
  
    /**
     * Start Dragging
     */
    function startDrag(event) {
      isDragging = true;
      offsetX = event.clientX - popup.getBoundingClientRect().left;
      offsetY = event.clientY - popup.getBoundingClientRect().top;
  
      document.addEventListener('mousemove', onDrag);
      document.addEventListener('mouseup', stopDrag);
    }
  
    function onDrag(event) {
      if (!isDragging) return;
  
      let newX = event.clientX - offsetX;
      let newY = event.clientY - offsetY;
  
      // Prevent out-of-bounds dragging
      newX = Math.max(0, Math.min(window.innerWidth - popup.offsetWidth, newX));
      newY = Math.max(0, Math.min(window.innerHeight - popup.offsetHeight, newY));
  
      popup.style.left = `${newX}px`;
      popup.style.top = `${newY}px`;
    }
  
    function stopDrag() {
      isDragging = false;
      document.removeEventListener('mousemove', onDrag);
      document.removeEventListener('mouseup', stopDrag);
    }
  
    /**
     * Close popup
     */
    function handleRemove() {
      popup.remove();
    }
  
    /**
     * When "Run" is clicked:
     *  - Reset and start timer
     *  - Optionally invoke background script
     */
    function handleHerbieRun() {
      // For Chrome extension usage:
      chrome.storage?.local.set({ herbiestop: false });
  
      // Start fresh
      resetTimer();
      startTimer();
  
      const scriptContent = document.getElementById('herbie_script').value;
      chrome.runtime?.sendMessage(
        { action: 'excuteScript', payload: scriptContent },
        (response) => {
          if (chrome.runtime.lastError) {
            console.error("Error communicating with background:", chrome.runtime.lastError.message);
          } else {
            console.log("Background response:", response);
          }
        }
      );
    }
  
    /**
     * When "Stop" is clicked:
     *  - Stop the timer
     */
    function handleHerbieStop() {
      console.log("Stopping Herbie...");
      chrome.storage.local.set({ herbiestop: true }, () => {
    console.log("Herbie stopped, herbiestop set to true.");
  });


      stopTimer();
    }
  
    /**
     * Timer Helpers
     */
    function startTimer() {
      stopTimer(); // Clear any existing interval
      startTime = performance.now(); // Mark the start time
  
      // Update ~60 times a second (16ms). Adjust as needed (e.g., 100ms for 10 times/s).
      timerInterval = setInterval(() => {
        updateDisplayTime(performance.now() - startTime);
      }, 16);
    }
  
    function stopTimer() {
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
    }
  
    function resetTimer() {
      displayTime = '00:00:00.000';
    }
  
    function updateDisplayTime(msElapsed) {
      // Convert total milliseconds to hours, minutes, seconds, ms
      let totalMilliseconds = Math.floor(msElapsed);
      let hours   = Math.floor(totalMilliseconds / 3600000); // 1 hour = 3600000 ms
      totalMilliseconds %= 3600000;
      let minutes = Math.floor(totalMilliseconds / 60000);    // 1 min = 60000 ms
      totalMilliseconds %= 60000;
      let seconds = Math.floor(totalMilliseconds / 1000);     // 1 sec = 1000 ms
      let millis  = totalMilliseconds % 1000;
  
      // Format with zero-padding
      displayTime = `${pad(hours, 2)}:${pad(minutes, 2)}:${pad(seconds, 2)}.${pad(millis, 3)}`;
    }
  
    // Helper to pad numbers with leading zeros
    function pad(num, size) {
      return String(num).padStart(size, '0');
    }
  
    onMount(() => {
      popup.style.position = 'fixed';
      popup.style.top = '20px';
      popup.style.left = '20px';
    });
  </script>
  
  <!-- Main Popup Container -->
  <div bind:this={popup} id="injected-root">
    <div id="herbie_header" on:mousedown={startDrag}>
      <img
        src="https://github.com/mieweb/herbie/blob/master/logos/herbie128.png?raw=true"
        alt="Herbie Logo"
      />
      <span id="herbie_title">Herbie</span>
      <button class="close-button" on:click={handleRemove}>×</button>
    </div>
  
    <!-- Control Buttons -->
    <div id="herbie_buttons">
      <button id="herbie_run" class="run-button" on:click={handleHerbieRun}>
        Run
      </button>
      <button id="herbie_stop" class="stop-button" on:click={handleHerbieStop}>
        Stop
      </button>
    </div>
  
    <!-- Timer Display -->
    <div class="timer-display">
      Timer: {displayTime}
    </div>
  
    <!-- Script Input -->
    <div class="herbie_script">
      <label for="herbie_script">Script:</label>
      <textarea
      bind:value={testScript}
        id="herbie_script"
        placeholder="Type or load your test scripts here..."
      ></textarea>
    </div>
  </div>
  