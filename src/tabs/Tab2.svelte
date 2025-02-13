<script>
   export let activeTab;
</script>
<div id="tab2" class="tab-content active">
  <div class="log-header-container">
      <h2>Logs</h2>
      <button id="export-logs" class="export-logs" aria-label="Export Logs">
          <i class="fas fa-file-export"></i> Export
      </button>
  </div>
  <div class="logs-progress-bar-container" id="logs-progress-bar-container">
    <div class="logs-progress-bar" id="logs-progress-bar"></div>
</div>
  <div id="logs-container" class="logs-container">
      <!-- Log entries will be loaded here -->
  </div>
 
</div>
