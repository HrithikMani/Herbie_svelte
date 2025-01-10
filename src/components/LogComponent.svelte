<script>
  export let logs = [];

  // Function to clear logs
  function clearLogs() {
    logs = [];
  }
</script>

<style>
  #execution-logs-container {
    padding: 1rem;
    font-family: Arial, sans-serif;
    max-height: 200px; 
    overflow-y: auto; 
    background-color: #fff; 
  }

  .log-entry {
    font-size: 1rem;
    line-height: 2;
    white-space: pre-wrap; /* Preserve whitespace and line breaks */
    margin: 0; /* Remove extra margin */
    padding: 0; /* Remove padding for a clean look */
    color: #333; /* Optional: Adjust text color */
  }


</style>

<div>
  <div id="execution-logs-container">
    {#if logs.length > 0}
      {#each logs as log}
        <div class="log-entry">
          {#if typeof log === 'object'}
            {JSON.stringify(log, null, 2)}
          {:else}
            {log}
          {/if}
        </div>
      {/each}
    {:else}
      <div class="log-entry">No logs to display.</div>
    {/if}
  </div>
</div>
