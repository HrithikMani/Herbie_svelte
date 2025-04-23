<script>
    import { onMount, onDestroy } from "svelte";
  
    let usabilityTest = null;
    let isRunning = false;
    let elapsedTime = 0;
    let startTime = 0;
    let interval;
    let showScript = false; // Toggle for showing/hiding Herbie script
  
    function loadUsabilityTest() {
        chrome.storage.local.get(null, (items) => {
            const tests = Object.keys(items)
                .filter((key) => key.startsWith("usabilityTest"))
                .map((key) => items[key]);
  
            if (tests.length > 0) {
                usabilityTest = tests[0]; 
                console.log("Loaded usability test:", usabilityTest);
                isRunning = true;
                startTime = usabilityTest.startTime || Date.now();
                startStopwatch();
                chrome.runtime.sendMessage({
                action: "setObserver",
                herbie_script: usabilityTest.herbieScript,
                
                });
            }
        });
    }
  
    function startStopwatch() {
        interval = setInterval(() => {
            elapsedTime = Date.now() - startTime;
        }, 10); 
    }
  
    function stopStopwatch() {
        clearInterval(interval);
    }
  
    function endTest() {
    if (!isRunning) return;
    isRunning = false;
    stopStopwatch();

    // Format time properly
    const timeString = formatTime(elapsedTime);
    
    // Get the tester name if available
    const testerName = usabilityTest.testerName || 'Unknown';
    
    // Get task name if available
    const taskName = usabilityTest.taskName || 'Unknown Task';
    
    // Send complete information with the endUsabilityTest message
    chrome.runtime.sendMessage({
        action: "endUsabilityTest",
        taskId: usabilityTest.taskId,
        taskName: taskName,
        testerName: testerName,
        time: timeString
    });

    chrome.storage.local.remove("usabilityTest", () => {
        usabilityTest = null;
    });
}
  
    function formatTime(ms) {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        const milliseconds = Math.floor((ms % 1000) / 10);
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(2, '0')}`;
    }
    
    function toggleScript() {
        showScript = !showScript;
    }
  
    onMount(() => {
        loadUsabilityTest();
    });
  
    onDestroy(() => {
        stopStopwatch();
    });
</script>
  
<!-- 🟢 Usability Testing Tab UI -->
<div id="usability-test">
    <h1>Usability Testing Mode</h1>
  
    {#if usabilityTest}
        <div class="test-details">
            <h2>{usabilityTest.taskName}</h2>
            <p class="description"><i class="fas fa-info-circle"></i> {usabilityTest.description}</p>
  
            <!-- Centered Stopwatch -->
            <div class="stopwatch">
                <i class="fas fa-stopwatch"></i> {formatTime(elapsedTime)}
            </div>
  
            <p class="start-time"><i class="fas fa-clock"></i> Start Time: {new Date(usabilityTest.startTime).toLocaleString()}</p>
            
            <!-- Show Script Toggle Button -->
            <button class="toggle-script-btn" on:click={toggleScript}>
                <i class="fas {showScript ? 'fa-eye-slash' : 'fa-eye'}"></i>
                {showScript ? 'Hide Herbie Script' : 'Show Herbie Script'}
            </button>
            
            <!-- Herbie Script Display (conditionally rendered) -->
            {#if showScript && usabilityTest.herbieScript}
                <div class="herbie-script-container">
                    <h3>Herbie Script</h3>
                    <pre class="herbie-script">{usabilityTest.herbieScript}</pre>
                </div>
            {/if}
  
            <button class="button-end" on:click={endTest}>
                <i class="fas fa-times-circle"></i> End Test
            </button>
        </div>
    {:else}
        <p class="no-test"><i class="fas fa-exclamation-triangle"></i> No usability test found.</p>
    {/if}
</div>
  
<!-- 🟢 Styling -->
<style>
   #usability-test {
    padding: 20px;
    width: 360px;
    font-family: 'Poppins', Arial, sans-serif;
    text-align: center;
    background: white;
    border-radius: 12px;
    box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
    margin: auto; /* Centers the whole popup */
    display: flex;
    flex-direction: column;
    align-items: center; /* Ensures content stays centered */
}

h1 {
    font-size: 22px;
    font-weight: bold;
    margin-bottom: 20px;
}

.test-details {
    background: #f9f9f9;
    padding: 20px;
    border-radius: 10px;
    text-align: center;
    width: 100%; /* Ensures it doesn't stretch */
    max-width: 320px; /* Keeps width uniform */
}

.description {
    font-size: 16px;
    color: #555;
    margin-bottom: 15px;
}

.stopwatch {
    font-size: 24px;
    font-weight: bold;
    color: #007bff;
    margin: 15px 0;
    padding: 10px;
    background: #eef4ff;
    border-radius: 8px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 120px;
}

.start-time {
    font-size: 14px;
    color: #777;
    margin-top: 10px;
}

.button-end {
    padding: 12px 18px;
    font-size: 16px;
    background: #dc3545;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-weight: bold;
    transition: 0.3s;
    width: 100%; /* Makes the button full width */
    max-width: 200px;
    margin-top: 15px;
}

.button-end:hover {
    background: #b02a37;
}

.no-test {
    font-size: 16px;
    color: #777;
}

.fas {
    margin-right: 8px;
}

.test-results {
    background: #f9f9f9;
    border-left: 5px solid #34d399;
    padding: 12px;
    margin-top: 10px;
    border-radius: 8px;
    font-family: Arial, sans-serif;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    transition: transform 0.2s ease-in-out;
}

.test-results:hover {
    transform: scale(1.02);
}

.test-results-header {
    font-size: 18px;
    font-weight: bold;
    color: #2d6a4f;
    margin-bottom: 8px;
}

.test-results-content p {
    font-size: 14px;
    margin: 5px 0;
}

.highlight {
    font-weight: bold;
    color: #2563eb;
}

.highlight.error {
    color: #dc2626;
}

.rating {
    font-size: 18px;
    color: #f59e0b;
}

/* Script display styling */
.toggle-script-btn {
    margin-top: 10px;
    padding: 8px 12px;
    background-color: #6c757d;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    transition: background-color 0.2s;
}

.toggle-script-btn:hover {
    background-color: #5a6268;
}

.herbie-script-container {
    margin-top: 15px;
    width: 100%;
    text-align: left;
}

.herbie-script-container h3 {
    font-size: 14px;
    margin-bottom: 5px;
    color: #495057;
}

.herbie-script {
    background-color: #f3f3f3;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 8px;
    font-family: monospace;
    font-size: 12px;
    white-space: pre-wrap;
    max-height: 150px;
    overflow-y: auto;
    text-align: left;
    color: #212529;
    margin-bottom: 15px;
}
</style>