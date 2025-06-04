<script>
    import './Main.css'; // Your external CSS
    import { onMount } from 'svelte';
  
    // NEW: Accept props for usability testing integration
    export let title = "Herbie Interface";
    export let testScript = "Write Amoxicillin 500mg capsule 2 caps daily for 7 days.  For Prescriber: Anna Bates.  Total quantity: 14 and no refills. Allow substitutions   Send the script to 'MIE Test Pharmacy'";
  
    let offsetX = 0;
    let offsetY = 0;
    let isDragging = false;
    let popup;
  
    // Timer variables (existing)
    let startTime = 0;
    let timerInterval;
    let displayTime = '00:00:00.000'; // Shown in the UI

    // NEW: Persistence variables
    let persistenceStatus = 'enabled';
    let stateRestored = false;
    let autoSaveInterval;
    
    /**
     * FIXED: Start Dragging - Prevent position jumping
     */
    function startDrag(event) {
      isDragging = true;
      
      // Get current position from computed style (actual rendered position)
      const rect = popup.getBoundingClientRect();
      
      // Calculate offset from mouse to component's top-left corner
      offsetX = event.clientX - rect.left;
      offsetY = event.clientY - rect.top;
      
      // IMPORTANT: Reset left/top to 0 and use current position as transform
      // This prevents the jump when switching from left/top to transform
      popup.style.left = '0px';
      popup.style.top = '0px';
      popup.style.transform = `translate(${rect.left}px, ${rect.top}px)`;
      
      // Add dragging class for visual feedback
      popup.classList.add('dragging');
      
      // Use passive listeners for better performance
      document.addEventListener('mousemove', onDrag, { passive: true });
      document.addEventListener('mouseup', stopDrag);
      
      // Prevent text selection
      event.preventDefault();
    }
  
    function onDrag(event) {
      if (!isDragging) return;
      
      // Calculate new position maintaining the original mouse offset
      let newX = event.clientX - offsetX;
      let newY = event.clientY - offsetY;
      
      // Constrain to viewport (cache window size for performance)
      const maxX = window.innerWidth - popup.offsetWidth;
      const maxY = window.innerHeight - popup.offsetHeight;
      
      newX = Math.max(0, Math.min(maxX, newX));
      newY = Math.max(0, Math.min(maxY, newY));
      
      // Use transform for smooth dragging (no DOM style recalculation)
      popup.style.transform = `translate(${newX}px, ${newY}px)`;
    }
  
    function stopDrag() {
      if (!isDragging) return;
      
      isDragging = false;
      document.removeEventListener('mousemove', onDrag);
      document.removeEventListener('mouseup', stopDrag);
      
      // Remove dragging class
      popup.classList.remove('dragging');
      
      // Get final position from transform and set as left/top
      const transform = popup.style.transform;
      if (transform) {
        const match = transform.match(/translate\((.+)px,\s*(.+)px\)/);
        if (match) {
          const finalX = parseFloat(match[1]);
          const finalY = parseFloat(match[2]);
          
          popup.style.left = `${finalX}px`;
          popup.style.top = `${finalY}px`;
          popup.style.transform = '';
        }
      } else {
        // Fallback: get position from current bounding rect
        const rect = popup.getBoundingClientRect();
        popup.style.left = `${rect.left}px`;
        popup.style.top = `${rect.top}px`;
      }
      
      // ONLY NOW save position (not during drag)
      setTimeout(() => saveComponentState(), 100);
    }
  
    /**
     * ENHANCED: Close popup with persistence cleanup
     */
    function handleRemove() {
      // Clear persistence when manually removing
      chrome.runtime?.sendMessage(
        { action: 'clearInjectionState' },
        (response) => {
          console.log('Injection state cleared:', response);
        }
      );
      
      // Clear auto-save interval
      if (autoSaveInterval) {
        clearInterval(autoSaveInterval);
      }
      
      // Clear component state
      chrome.storage?.local.remove(['herbieComponentState']);
      
      // Remove from DOM
      popup.remove();
    }
  
    /**
     * EXISTING: When "Run" is clicked
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
      
      // Save state after running (debounced)
      debouncedSave();
    }
  
    /**
     * EXISTING: When "Stop" is clicked
     */
    function handleHerbieStop() {
      console.log("Stopping Herbie...");
      chrome.storage?.local.set({ herbiestop: true }, () => {
        console.log("Herbie stopped, herbiestop set to true.");
      });

      stopTimer();
      
      // Save state after stopping (debounced)
      debouncedSave();
    }
  
    /**
     * EXISTING: Timer Helpers
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
  
    // EXISTING: Helper to pad numbers with leading zeros
    function pad(num, size) {
      return String(num).padStart(size, '0');
    }

    // Debounced save to prevent too frequent storage writes
    let saveTimeout;
    function debouncedSave() {
      if (saveTimeout) clearTimeout(saveTimeout);
      saveTimeout = setTimeout(saveComponentState, 500);
    }

    /**
     * NEW: Save current state to storage for persistence (ONLY when not dragging)
     */
    function saveComponentState() {
      if (!popup || isDragging) return; // Don't save during drag!
      
      const currentState = {
        position: {
          left: popup.style.left,
          top: popup.style.top
        },
        scriptContent: document.getElementById('herbie_script')?.value || testScript,
        timerState: {
          isRunning: !!timerInterval,
          startTime: startTime,
          displayTime: displayTime
        },
        lastUpdated: Date.now()
      };
      
      chrome.storage?.local.set({ 
        herbieComponentState: currentState 
      }).then(() => {
        console.log('Component state saved');
      }).catch((error) => {
        console.error('Error saving component state:', error);
      });
    }

    /**
     * NEW: Restore component state from storage
     */
    function restoreComponentState() {
      chrome.storage?.local.get(['herbieComponentState'], (result) => {
        if (result.herbieComponentState && !stateRestored) {
          const state = result.herbieComponentState;
          console.log('Restoring component state:', state);
          
          // Restore position
          if (state.position && popup) {
            popup.style.left = state.position.left || '20px';
            popup.style.top = state.position.top || '20px';
          }
          
          // Restore script content
          if (state.scriptContent) {
            const scriptEl = document.getElementById('herbie_script');
            if (scriptEl) {
              scriptEl.value = state.scriptContent;
              testScript = state.scriptContent;
            }
          }
          
          // Restore timer if it was running (but don't auto-restart)
          if (state.timerState) {
            if (state.timerState.displayTime) {
              displayTime = state.timerState.displayTime;
            }
          }
          
          stateRestored = true;
        }
      });
    }

    /**
     * NEW: Toggle persistence
     */
    function togglePersistence() {
      if (persistenceStatus === 'enabled') {
        // Disable persistence
        chrome.runtime?.sendMessage(
          { action: 'clearInjectionState' },
          (response) => {
            if (response?.status === 'success') {
              persistenceStatus = 'disabled';
              console.log('Persistence disabled');
            }
          }
        );
      } else {
        // Re-enable persistence
        chrome.runtime?.sendMessage({
          action: 'setInjectionState',
          componentData: {
            componentName: 'MainComponent',
            scriptPath: 'build/injected/main-component.js',
            cssPath: 'build/injected/css/main-style.css',
            props: { title: "Herbie Interface" },
            mountId: 'injected-root-maincomponent'
          }
        }, (response) => {
          if (response?.status === 'success') {
            persistenceStatus = 'enabled';
            console.log('Persistence enabled');
          }
        });
      }
    }

    /**
     * NEW: Handle script content changes (debounced)
     */
    function handleScriptChange() {
      debouncedSave();
    }

    /**
     * ENHANCED: onMount with state restoration
     */
    onMount(() => {
      // Set initial position
      popup.style.position = 'fixed';
      popup.style.left = '20px';
      popup.style.top = '20px';
      popup.style.willChange = 'transform'; // Optimize for transforms
      
      // Restore previous state if available
      setTimeout(() => {
        restoreComponentState();
      }, 100);
      
      // Set up auto-save interval (longer interval, debounced)
      autoSaveInterval = setInterval(() => {
        if (!isDragging) { // Only auto-save when not dragging
          saveComponentState();
        }
      }, 15000); // Every 15 seconds instead of 10
      
      // Add event listener for script content changes (debounced)
      setTimeout(() => {
        const scriptEl = document.getElementById('herbie_script');
        if (scriptEl) {
          scriptEl.addEventListener('input', handleScriptChange);
          scriptEl.addEventListener('paste', handleScriptChange);
        }
      }, 200);
      
      // Save state when visibility changes (debounced)
      document.addEventListener('visibilitychange', () => {
        if (document.hidden && !isDragging) {
          debouncedSave();
        }
      });
      
      // Save state before page unload
      window.addEventListener('beforeunload', () => {
        if (!isDragging) {
          saveComponentState();
        }
      });
    });
</script>
  
<!-- Main Popup Container -->
<div bind:this={popup} id="injected-root" class="{title.includes('Usability') ? 'usability-mode' : ''}">
  <div id="herbie_header" on:mousedown={startDrag}>
    <img
      src="https://github.com/mieweb/herbie/blob/master/logos/herbie128.png?raw=true"
      alt="Herbie Logo"
    />
    <span id="herbie_title">{title}</span>
    
    <!-- Show different indicator for usability testing mode -->
    {#if title.includes('Usability')}
      <div class="usability-indicator" title="Usability Testing Mode">
        <i class="fas fa-user-check"></i>
      </div>
    {:else}
      <!-- NEW: Persistence indicator -->
      <div class="persistence-indicator" title="Persistence: {persistenceStatus}">
        <i class="fas {persistenceStatus === 'enabled' ? 'fa-link' : 'fa-unlink'} {persistenceStatus === 'enabled' ? 'enabled' : 'disabled'}"></i>
      </div>
    {/if}
    
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
    
    <!-- Only show persistence button when NOT in usability testing mode -->
    {#if !title.includes('Usability')}
      <button 
        class="persistence-button" 
        on:click={togglePersistence}
        title="{persistenceStatus === 'enabled' ? 'Disable' : 'Enable'} persistence"
      >
        <i class="fas {persistenceStatus === 'enabled' ? 'fa-toggle-on' : 'fa-toggle-off'}"></i>
      </button>
    {/if}
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
  
  <!-- Status bar - different content for usability testing -->
  <div class="status-bar">
    {#if title.includes('Usability')}
      <span class="status-item">
        <i class="fas fa-user-check"></i>
        Usability Testing Mode
      </span>
      <span class="status-item usability-status">
        <i class="fas fa-play"></i>
        Test Active
      </span>
    {:else}
      <span class="status-item">
        <i class="fas fa-save"></i>
        Auto-save enabled
      </span>
      <span class="status-item persistence-status {persistenceStatus}">
        <i class="fas {persistenceStatus === 'enabled' ? 'fa-check' : 'fa-times'}"></i>
        Persistence {persistenceStatus}
      </span>
    {/if}
  </div>
</div>

<style>
  /* OPTIMIZED STYLES for smooth dragging */
  #injected-root {
    position: fixed;
    background: #fff;
    color: #333;
    padding: 20px;
    border-radius: 10px;
    box-shadow: 0px 5px 12px rgba(0, 0, 0, 0.2);
    z-index: 999999;
    width: 420px;
    font-family: Arial, sans-serif;
    border: 1px solid #ddd;
    box-sizing: border-box;
    /* Optimize for smooth dragging */
    will-change: transform;
  }
  
  /* NEW: Special styling for usability testing mode */
  #injected-root.usability-mode {
    border: 2px solid #007bff;
    box-shadow: 0px 5px 15px rgba(0, 123, 255, 0.3);
  }
  
  #injected-root.usability-mode #herbie_header {
    background: linear-gradient(135deg, #007bff, #0056b3);
    color: white;
    margin: -20px -20px 15px -20px;
    padding: 15px 20px 10px 20px;
    border-radius: 10px 10px 0 0;
  }
  
  #injected-root.usability-mode #herbie_title {
    color: white;
  }
  
  /* Usability testing indicator */
  .usability-indicator {
    margin-right: 10px;
    color: #ffc107;
    animation: pulse 2s infinite;
  }
  
  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.7; }
    100% { opacity: 1; }
  }
  
  /* Dragging performance optimizations */
  #injected-root.dragging {
    transition: none !important; /* Disable ALL transitions during drag */
    user-select: none;
    pointer-events: auto;
    box-shadow: 0px 8px 20px rgba(0, 0, 0, 0.3);
  }
  
  /* Prevent child elements from interfering with drag */
  #injected-root.dragging * {
    pointer-events: none;
    user-select: none;
  }
  
  /* Keep header interactive during drag setup */
  #injected-root.dragging #herbie_header {
    pointer-events: auto;
  }
  
  /* Header */
  #herbie_header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 10px;
    border-bottom: 2px solid #ddd;
    cursor: grab;
    touch-action: none; /* Better touch support */
  }
  
  #herbie_header:active,
  #herbie_header.dragging {
    cursor: grabbing;
  }
  
  #herbie_header img {
    height: 30px;
  }
  
  #herbie_title {
    font-size: 20px;
    font-weight: bold;
    flex-grow: 1;
    margin-left: 10px;
  }
  
  /* Close Button */
  .close-button {
    background: #ff4444;
    color: white;
    border: none;
    border-radius: 50%;
    width: 26px;
    height: 26px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    transition: background 0.3s ease;
  }
  
  .close-button:hover {
    background: #cc0000;
  }
  
  /* Control Buttons */
  #herbie_buttons {
    display: flex;
    justify-content: center;
    gap: 12px;
    margin-top: 15px;
  }
  
  .run-button,
  .stop-button {
    padding: 10px 15px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    font-weight: bold;
    width: 100px;
    transition: all 0.3s ease;
  }
  
  .run-button {
    background: #4caf50;
    color: white;
  }
  
  .run-button:hover {
    background: #388e3c;
  }
  
  .stop-button {
    background: #f44336;
    color: white;
  }
  
  .stop-button:hover {
    background: #d32f2f;
  }
  
  /* Timer Display */
  .timer-display {
    margin: 15px 0;
    text-align: center;
    font-size: 16px;
    font-weight: bold;
    color: #333;
  }
  
  /* Script Input */
  .herbie_script {
    margin-top: 15px;
    width: 100%;
    box-sizing: border-box;
  }
  
  .herbie_script label {
    font-weight: bold;
    display: block;
    margin-bottom: 5px;
    font-size: 14px;
  }
  
  .herbie_script textarea {
    width: 100%;
    max-width: 100%;
    padding: 12px;
    border: 1px solid #ccc;
    border-radius: 6px;
    font-family: monospace;
    background: #f9f9f9;
    color: #333;
    resize: vertical;
    box-sizing: border-box;
    display: block;
    transition: all 0.2s ease;
    min-height: 100px;
  }
  
  .herbie_script textarea:focus {
    border-color: #007bff;
    outline: none;
    box-shadow: 0px 0px 5px rgba(0, 123, 255, 0.5);
  }

  /* Persistence features */
  .persistence-indicator {
    margin-right: 10px;
  }
  
  .persistence-indicator i.enabled {
    color: #4caf50;
  }
  
  .persistence-indicator i.disabled {
    color: #f44336;
  }
  
  .persistence-button {
    background: #6c757d;
    color: white;
    border: none;
    border-radius: 6px;
    padding: 10px 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    margin-left: 8px;
  }
  
  .persistence-button:hover {
    background: #5a6268;
  }
  
  .persistence-button i {
    font-size: 16px;
  }
  
  .status-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 15px;
    padding: 8px 12px;
    background: #f8f9fa;
    border-radius: 4px;
    font-size: 12px;
    border: 1px solid #e9ecef;
  }
  
  .status-item {
    display: flex;
    align-items: center;
    gap: 4px;
    color: #6c757d;
  }
  
  .status-item i {
    font-size: 11px;
  }
  
  .persistence-status.enabled {
    color: #28a745;
  }
  
  .persistence-status.disabled {
    color: #dc3545;
  }
  
  .usability-status {
    color: #007bff;
    font-weight: 600;
  }

  /* Only apply transitions when NOT dragging */
  #injected-root:not(.dragging) {
    transition: all 0.3s ease;
  }
  
  .persistence-indicator:hover {
    transform: scale(1.1);
    transition: transform 0.2s ease;
  }
  
  /* Responsive adjustments */
  @media (max-width: 480px) {
    #injected-root {
      width: 95vw;
      max-width: 420px;
    }
    
    #herbie_buttons {
      flex-wrap: wrap;
    }
    
    .run-button,
    .stop-button {
      width: 80px;
      font-size: 12px;
    }
  }
</style>