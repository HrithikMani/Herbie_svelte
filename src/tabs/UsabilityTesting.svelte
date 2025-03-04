<script>
  import { onMount } from "svelte";

  let usabilityTest = null;
  let isRunning = false;
  let elapsedTime = 0;
  let interval;

  // Load usability test data from Chrome storage
  function loadUsabilityTest() {
      chrome.storage.local.get(null, (items) => {
          const tests = Object.keys(items)
              .filter((key) => key.startsWith("usabilityTest"))
              .map((key) => items[key]);

          if (tests.length > 0) {
              usabilityTest = tests[0]; // Load the first test
              isRunning = true;
              startStopwatch();
          }
      });
  }

  // Stopwatch function
  function startStopwatch() {
      interval = setInterval(() => {
          elapsedTime += 1;
      }, 1000);
  }

  function stopStopwatch() {
      clearInterval(interval);
  }

  // End Test Function
  function endTest() {
      if (!isRunning) return;
      isRunning = false;
      stopStopwatch();

      // Clear Chrome storage
      chrome.storage.local.remove(`usabilityTest`, () => {
          usabilityTest = null;
      });

  }

  // Load stored test when component mounts
  onMount(() => {
      loadUsabilityTest();
  });
</script>

<!-- 🟢 Usability Testing Tab UI -->
<div id="usability-test">
  <h1>Usability Testing Mode</h1>

  {#if usabilityTest}
      <div class="test-details">
          <p><strong>Task:</strong> {usabilityTest.taskName}</p>
          <p><strong>Description:</strong> {usabilityTest.description}</p>
          <p><strong>Start Time:</strong> {new Date(usabilityTest.startTime).toLocaleString()}</p>
          <p><strong>Elapsed Time:</strong> {elapsedTime} sec</p>
      </div>

      <button class="button-end" on:click={endTest}>
          End Test
      </button>
  {:else}
      <p>No usability test found.</p>
  {/if}
</div>

<!-- 🟢 Styling -->
<style>
  #usability-test {
      padding: 16px;
      width: 350px;
      font-family: Arial, sans-serif;
      text-align: center;
  }

  h1 {
      font-size: 22px;
      font-weight: bold;
      margin-bottom: 15px;
  }

  .test-details {
      background: #f9f9f9;
      padding: 15px;
      border-radius: 5px;
      border-left: 5px solid #007bff;
      text-align: left;
      margin-bottom: 10px;
      font-size: 16px;
  }

  .button-end {
      padding: 12px 16px;
      font-size: 16px;
      background: #dc3545;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-weight: bold;
  }
</style>
