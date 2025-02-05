
<script>
    import './Main.css';
    import { onMount } from "svelte";
    import EventEmitter from "../../utils/EventEmitter"; // Ensure EventEmitter is available
  
    let offsetX = 0, offsetY = 0, isDragging = false;
    let popup;
    let logs = [];
  
    // Drag Start
    function startDrag(event) {
        isDragging = true;
        offsetX = event.clientX - popup.getBoundingClientRect().left;
        offsetY = event.clientY - popup.getBoundingClientRect().top;
        document.addEventListener("mousemove", onDrag);
        document.addEventListener("mouseup", stopDrag);
    }
  
    // Dragging
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
  
    // Stop Dragging
    function stopDrag() {
        isDragging = false;
        document.removeEventListener("mousemove", onDrag);
        document.removeEventListener("mouseup", stopDrag);
    }
  
    // Function Handlers
    function handleRemove() {
        popup.remove();
    }
  
    function handleHerbieRun() {
      chrome.storage.local.set({ herbiestop: false });
  
      const scriptContent = document.getElementById('herbie_script').value;
      logs = []; // Clear previous logs
      chrome.runtime.sendMessage(
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
  
    function handleHerbieStop() {
        console.log("Stopping Herbie...");
        chrome.storage.local.set({ herbiestop: true });
    }
  
    onMount(() => {
        popup.style.position = "fixed"; // Ensure fixed position
        popup.style.top = "20px";
        popup.style.left = "20px";
    });
  </script>
  
  <!-- Main Popup Container -->
  <div bind:this={popup} id="injected-root">
    <div id="herbie_header" on:mousedown={startDrag}>
        <img src="https://github.com/mieweb/herbie/blob/master/logos/herbie128.png?raw=true" alt="Herbie Logo">
        <span id="herbie_title">Herbie</span>
        <button class="close-button" on:click={handleRemove}>×</button>
    </div>
  
    <!-- Control Buttons -->
    <div id="herbie_buttons">
        <button id="herbie_run" class="run-button" title="Run" on:click={handleHerbieRun}>Run</button>
        <button id="herbie_stop" class="stop-button" title="Stop" on:click={handleHerbieStop}>Stop</button>
    </div>
  
    <div class="progress-container">
        <div class="progress-bar"></div>
    </div>
  
    <!-- Script Input -->
    <div class="herbie_script">
        <label for="herbie_script">Script:</label>
        <textarea id="herbie_script" placeholder="Type or load your test scripts here..."></textarea>
    </div>
  
  </div>
  