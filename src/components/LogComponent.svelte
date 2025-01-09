<script>
    export let logs = []; // Accept logs as a prop
  </script>
  
  <div class="log-container">
    <h3>Execution Logs</h3>
    <ul class="log-list">
      {#each logs as log, index}
        <li class="log-item">
          <span class="log-line">Line: {index + 1}, </span>
          <span class="log-message">{log}</span>
        </li>
      {/each}
    </ul>
  </div>
  
  <style>
    .log-container {
      background: #f9f9f9;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 10px;
      margin-top: 10px;
      max-height: 150px;
      overflow-y: auto;
    }
  
    .log-list {
      list-style: none;
      margin: 0;
      padding: 0;
    }
  
    .log-item {
      padding: 5px 0;
      border-bottom: 1px solid #eee;
      font-family: monospace;
      font-size: 1rem;
      font-size: 1.5em;
    }
  
    .log-item:last-child {
      border-bottom: none;
    }
  
    .log-line {
      font-weight: bold;
    }
  
    .log-message {
      color: #333;
    }
  </style>
  