<script>
    import { onMount, onDestroy } from "svelte";
  
    let usabilityTest = null;
    let isRunning = false;
    let elapsedTime = 0;
    let startTime = 0;
    let interval;
  
    function loadUsabilityTest() {
        chrome.storage.local.get(null, (items) => {
            const tests = Object.keys(items)
                .filter((key) => key.startsWith("usabilityTest"))
                .map((key) => items[key]);
  
            if (tests.length > 0) {
                usabilityTest = tests[0]; 
                isRunning = true;
                startTime = usabilityTest.startTime || Date.now();
                startStopwatch();
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

    chrome.runtime.sendMessage({
        action: "endUsabilityTest",
        taskId: usabilityTest.taskId
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
            <h2> {usabilityTest.taskName}</h2>
            <p class="description"><i class="fas fa-info-circle"></i> {usabilityTest.description}</p>
  
            <!-- Centered Stopwatch -->
            <div class="stopwatch">
                <i class="fas fa-stopwatch"></i> {formatTime(elapsedTime)}
            </div>
  
            <p class="start-time"><i class="fas fa-clock"></i> Start Time: {new Date(usabilityTest.startTime).toLocaleString()}</p>
  
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

  </style>
  