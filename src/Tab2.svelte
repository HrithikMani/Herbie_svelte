<script>
    import { onMount } from "svelte";
    let logs = [];
  
    onMount(() => {
      logs = ["Log 1: Action executed", "Log 2: Parsing complete"];
    });
  </script>
  
  <div id="logs">
    <h2>Logs</h2>
    {#if logs.length > 0}
      <ul>
        {#each logs as log}
          <li>{log}</li>
        {/each}
      </ul>
    {:else}
      <p>No logs available.</p>
    {/if}
  </div>
  
  <style>
    #logs {
      padding: 10px;
      background-color: #f9f9f9;
      font-family: Arial, sans-serif;
    }
  
    ul {
      list-style: none;
      padding: 0;
      font-size: 14px;
    }
  
    li {
      margin: 5px 0;
      padding: 5px;
      background: #fff;
      border: 1px solid #ddd;
      border-radius: 4px;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }
  </style>


  
