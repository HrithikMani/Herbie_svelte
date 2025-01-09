
<div id="tab4" class="tab-content active"  >
 
    <div class="keywords-header">
      <h1 class="keywords-title">Keywords</h1>
      <div class="keywords-buttons">
        <button id="inspect-element" class="btn-primary">
          <i class="fas fa-search"></i> Inspect
        </button>
        <button id="import-keywords" class="btn-secondary">
          <i class="fas fa-file-import"></i> Import
        </button>
      </div>
    </div>
  
    <!-- Keywords Container with Input, Textarea, Checkbox, and Button -->
    <div id="keywords-container" class="form-group">
      <input type="text" id="new-keyword" placeholder="Enter keyword" aria-label="Keyword Input" class="form-control">
      <textarea id="keyword-xpath" placeholder="Enter XPath" aria-label="XPath Input" class="form-control"></textarea>
  
      <div class="keyword-actions">
        <label class="checkbox-inline">
          <input type="checkbox" id="has-variable"> Has Variable
          <input type="checkbox" id="keyword-global" style="display:none" checked/> 
        </label>
        <button id="add-keyword" class="btn-primary">Add Keyword</button>
      </div>
    </div>
    <input type="text" id="search-keyword" placeholder="Search keywords" aria-label="Search Keyword" class="form-control">
    <!-- Global and Local Keywords Lists -->
    <div id="global-keywords-container" class="keywords-list">
      <h1>Global Keywords</h1>
      <ul id="global-keywords-list"></ul>
    </div>
    <div id="local-keywords-container" class="keywords-list">
      <ul id="local-keywords-list"></ul>
    </div>
  </div>
  
  