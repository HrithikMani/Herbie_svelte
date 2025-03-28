<script>
  import { onMount } from "svelte";

  // Data storage
  let globalKeywords = [];
  let localKeywords = {};
  let currentHostname = '';
  let currentPageKeywords = [];
  
  // Form fields
  let newKeyword = "";
  let newXpath = "";
  let hasVariable = false;
  let isLocalKeyword = false;

  // Interface states
  let searchTerm = "";
  let activeTab = "global"; // Default to global tab
  
  // Filtered keywords based on search
  $: filteredGlobalKeywords = filterKeywords(globalKeywords, searchTerm);
  $: filteredLocalKeywords = filterKeywords(currentPageKeywords, searchTerm);

  // Get current tab's hostname
  const getCurrentHostname = async () => {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs.length > 0 && tabs[0].url) {
        const url = new URL(tabs[0].url);
        return url.hostname;
      }
    } catch (error) {
      console.error("Error getting hostname:", error);
    }
    return '';
  };

  // Load all keywords from storage
  const loadKeywords = async () => {
    // Get current hostname first
    currentHostname = await getCurrentHostname();
    
    // Load keywords from storage
    chrome.storage.local.get({ globalKeywords: [], localKeywords: {} }, (result) => {
      globalKeywords = result.globalKeywords || [];
      localKeywords = result.localKeywords || {};
      
      // Get keywords specific to current page
      currentPageKeywords = currentHostname ? (localKeywords[currentHostname] || []) : [];
      
      // Auto-switch to local tab if we're on a page with local keywords
      if (currentPageKeywords.length > 0) {
        activeTab = "local";
      }
    });
  };

  // Add a new keyword
  const addKeyword = () => {
    if (newKeyword.trim() && newXpath.trim()) {
      const newKeywordObj = {
        keyword: newKeyword.trim(),
        xpath: newXpath.trim(),
        hasVariable
      };

      if (isLocalKeyword && currentHostname) {
        // Add to local keywords for the current page
        chrome.storage.local.get({ localKeywords: {} }, (result) => {
          const updatedLocalKeywords = { ...result.localKeywords };
          
          // Initialize array for this hostname if it doesn't exist
          if (!updatedLocalKeywords[currentHostname]) {
            updatedLocalKeywords[currentHostname] = [];
          }
          
          updatedLocalKeywords[currentHostname] = [
            ...updatedLocalKeywords[currentHostname],
            newKeywordObj
          ];
          
          chrome.storage.local.set({ localKeywords: updatedLocalKeywords }, () => {
            localKeywords = updatedLocalKeywords;
            currentPageKeywords = updatedLocalKeywords[currentHostname];
            resetForm();
          });
        });
      } else {
        // Add to global keywords
        chrome.storage.local.get({ globalKeywords: [] }, (result) => {
          const updatedKeywords = [...(result.globalKeywords || []), newKeywordObj];
          chrome.storage.local.set({ globalKeywords: updatedKeywords }, () => {
            globalKeywords = updatedKeywords;
            resetForm();
          });
        });
      }
    }
  };

  // Reset form after submission
  const resetForm = () => {
    newKeyword = "";
    newXpath = "";
    hasVariable = false;
  };

  // Import keywords from a JSON file
  const importKeywords = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedKeywords = JSON.parse(e.target.result);
          processImportedKeywords(importedKeywords);
        } catch (error) {
          console.error("Invalid JSON file:", error);
        }
      };
      reader.readAsText(file);
    }
  };

  // Process and store imported keywords
  const processImportedKeywords = (keywords) => {
    chrome.storage.local.get({ globalKeywords: [], localKeywords: {} }, (result) => {
      let updatedGlobalKeywords = [...(result.globalKeywords || [])];
      let updatedLocalKeywords = { ...(result.localKeywords || {}) };

      keywords.forEach((keywordObj) => {
        const { keyword, xpath, isLocal = false, hostname = '', hasVariable = false } = keywordObj;
        
        if (isLocal && hostname) {
          // Process as local keyword
          if (!updatedLocalKeywords[hostname]) {
            updatedLocalKeywords[hostname] = [];
          }
          
          // Avoid duplicates in local keywords
          if (!updatedLocalKeywords[hostname].some(k => k.keyword === keyword)) {
            updatedLocalKeywords[hostname].push({ 
              keyword, 
              xpath, 
              hasVariable 
            });
          }
        } else {
          // Process as global keyword
          if (!updatedGlobalKeywords.some(k => k.keyword === keyword)) {
            updatedGlobalKeywords.push({ 
              keyword, 
              xpath, 
              hasVariable 
            });
          }
        }
      });

      // Save all updated keywords
      chrome.storage.local.set({ 
        globalKeywords: updatedGlobalKeywords,
        localKeywords: updatedLocalKeywords
      }, () => {
        globalKeywords = updatedGlobalKeywords;
        localKeywords = updatedLocalKeywords;
        currentPageKeywords = currentHostname ? (updatedLocalKeywords[currentHostname] || []) : [];
        console.log("Keywords imported successfully");
      });
    });
  };

  // Export all keywords to a JSON file
  const exportKeywords = () => {
    // Prepare export data structure
    const exportData = [
      // Export global keywords
      ...globalKeywords.map(kw => ({ 
        ...kw, 
        isLocal: false 
      })),
      
      // Export all local keywords with their hostnames
      ...Object.entries(localKeywords).flatMap(([hostname, keywords]) => 
        keywords.map(kw => ({ 
          ...kw, 
          isLocal: true, 
          hostname 
        }))
      )
    ];
    
    // Create file and trigger download
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'herbie-keywords.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Filter keywords based on search term
  function filterKeywords(keywords, term) {
    if (!term || term.trim() === '') return keywords;
    
    const normalizedTerm = term.toLowerCase().trim();
    
    return keywords.filter(item => 
      item.keyword.toLowerCase().includes(normalizedTerm) ||
      item.xpath.toLowerCase().includes(normalizedTerm)
    );
  }

  // Clear search term
  function clearSearch() {
    searchTerm = '';
  }

  // Toggle details visibility for a keyword
  const toggleDetails = (keywordSet, index) => {
    const detailsElement = document.getElementById(`${keywordSet}-${index}`);
    if (detailsElement) {
      detailsElement.style.display = 
        detailsElement.style.display === "none" ? "flex" : "none";
    }
  };

  // Delete a global keyword
  const deleteGlobalKeyword = (index) => {
    chrome.storage.local.get({ globalKeywords: [] }, (result) => {
      const updatedKeywords = [...(result.globalKeywords || [])];
      updatedKeywords.splice(index, 1);
      chrome.storage.local.set({ globalKeywords: updatedKeywords }, () => {
        globalKeywords = updatedKeywords;
      });
    });
  };

  // Delete a local keyword
  const deleteLocalKeyword = (index) => {
    if (!currentHostname) return;
    
    chrome.storage.local.get({ localKeywords: {} }, (result) => {
      const updatedLocalKeywords = { ...result.localKeywords };
      
      if (updatedLocalKeywords[currentHostname]) {
        updatedLocalKeywords[currentHostname].splice(index, 1);
        
        // Remove the hostname entry if there are no keywords left
        if (updatedLocalKeywords[currentHostname].length === 0) {
          delete updatedLocalKeywords[currentHostname];
        }
        
        chrome.storage.local.set({ localKeywords: updatedLocalKeywords }, () => {
          localKeywords = updatedLocalKeywords;
          currentPageKeywords = updatedLocalKeywords[currentHostname] || [];
        });
      }
    });
  };

  // Update a global keyword
  const updateGlobalKeyword = (index, field, value) => {
    chrome.storage.local.get({ globalKeywords: [] }, (result) => {
      const updatedKeywords = [...(result.globalKeywords || [])];
      if (updatedKeywords[index]) {
        updatedKeywords[index][field] = value;
      }
      chrome.storage.local.set({ globalKeywords: updatedKeywords }, () => {
        globalKeywords = updatedKeywords;
      });
    });
  };

  // Update a local keyword
  const updateLocalKeyword = (index, field, value) => {
    if (!currentHostname) return;
    
    chrome.storage.local.get({ localKeywords: {} }, (result) => {
      const updatedLocalKeywords = { ...result.localKeywords };
      
      if (updatedLocalKeywords[currentHostname] && updatedLocalKeywords[currentHostname][index]) {
        updatedLocalKeywords[currentHostname][index][field] = value;
        
        chrome.storage.local.set({ localKeywords: updatedLocalKeywords }, () => {
          localKeywords = updatedLocalKeywords;
          currentPageKeywords = updatedLocalKeywords[currentHostname] || [];
        });
      }
    });
  };

  // Load keywords when component mounts
  onMount(() => {
    loadKeywords();
  });
</script>

<div id="tab4" class="tab-content active">
  <div class="keywords-header">
    <h1 class="keywords-title">Keywords</h1>
    <div class="action-buttons">
      <button id="inspect-element" class="action-button">
        <i class="fas fa-search"></i> Inspect
      </button>
      <input
        type="file"
        id="file-input"
        accept="application/json"
        on:change={importKeywords}
        style="display: none;"
      />
      <button
        id="import-keywords"
        class="action-button"
        on:click={() => document.getElementById("file-input").click()}
      >
        <i class="fas fa-file-import"></i> Import
      </button>
      <button
        id="export-keywords"
        class="action-button"
        on:click={exportKeywords}
      >
        <i class="fas fa-file-export"></i> Export
      </button>
    </div>
  </div>

  <!-- Search bar with clear button -->
  <div class="search-container">
    <div class="search-input-wrapper">
      <input 
        type="text" 
        id="search-keyword" 
        placeholder="Search keywords" 
        bind:value={searchTerm}
        aria-label="Search Keywords" 
      />
      {#if searchTerm}
        <button class="clear-search" on:click={clearSearch}>
          <i class="fas fa-times"></i>
        </button>
      {/if}
    </div>
  </div>

  <!-- Tab selector -->
  <div class="tab-navigation">
    <button 
      class={`tab-link ${activeTab === "global" ? "" : "active"}`} 
      on:click={() => activeTab = "global"}
    >
      Global Keywords
    </button>
    <button 
      class={`tab-link ${activeTab === "local" ? "active" : ""}`} 
      on:click={() => activeTab = "local"}
    >
      Local Keywords ({currentPageKeywords.length})
    </button>
  </div>

  <!-- Add keyword form -->
  <div id="keywords-container" class="form-group">
    <input 
      bind:value={newKeyword} 
      type="text" 
      id="new-keyword" 
      placeholder="Enter keyword" 
      aria-label="Keyword Input" 
      class="form-control"
    >
    <textarea 
      bind:value={newXpath} 
      id="keyword-xpath" 
      placeholder="Enter XPath" 
      aria-label="XPath Input" 
      class="form-control"
    ></textarea>

    <div class="keyword-actions">
      <label class="checkbox-inline">
        <input 
          type="checkbox" 
          bind:checked={hasVariable} 
          id="has-variable"
        > 
        Has Variable
      </label>
      {#if currentHostname}
        <label class="checkbox-inline local-toggle">
          <input 
            type="checkbox" 
            bind:checked={isLocalKeyword} 
            id="is-local-keyword"
          > 
          <span class="local-label">
            {isLocalKeyword ? 'Local' : 'Global'} Keyword
            {#if isLocalKeyword}
              <span class="hostname">({currentHostname})</span>
            {/if}
          </span>
        </label>
      {/if}
      <button 
        id="add-keyword" 
        on:click={addKeyword} 
        class="add-button"
        disabled={isLocalKeyword && !currentHostname}
      >
        <i class="fas fa-plus"></i> Add Keyword
      </button>
    </div>
  </div>

  <!-- Local Keywords Tab -->
  {#if activeTab === "local" && currentHostname}
    <div id="local-keywords-container" class="keywords-list">
      <h2>Local Keywords for {currentHostname}</h2>

      {#if currentPageKeywords.length === 0}
        <div class="empty-message">
          <p>No local keywords for this page.</p>
          <p class="helper-text">Add keywords specific to {currentHostname} using the form above.</p>
        </div>
      {:else if filteredLocalKeywords.length === 0 && searchTerm}
        <div class="empty-message">
          <p>No matching keywords found for "{searchTerm}"</p>
          <p class="helper-text">Try a different search term or <button class="clear-search-link" on:click={clearSearch}>clear the search</button></p>
        </div>
      {:else}
        <ul id="local-keywords-list">
          {#each filteredLocalKeywords as keyword, index}
            <li class="keyword-item">
              <div class="keyword-header" 
                on:click={() => toggleDetails('local', index)}
                on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && toggleDetails('local', index)}
              >
                <span class="keyword-name">{keyword.keyword}</span>
                <div class="keyword-actions">
                  <span class="badge">Fixed</span>
                  <button
                    class="icon-button delete-keyword"
                    aria-label="Delete"
                    on:click={(e) => {
                      e.stopPropagation();
                      deleteLocalKeyword(index);
                    }}
                  >
                    <i class="fas fa-trash-alt"></i>
                  </button>
                </div>
              </div>
      
              <div
                id={`local-${index}`}
                class="keyword-details"
                style="display: none;"
              >
                <textarea
                  class="xpath"
                  bind:value={keyword.xpath}
                  on:input={() => updateLocalKeyword(index, 'xpath', keyword.xpath)}
                ></textarea>
                <label class="details-option">
                  <input
                    type="checkbox"
                    class="has-variable"
                    bind:checked={keyword.hasVariable}
                    on:change={() => updateLocalKeyword(index, 'hasVariable', keyword.hasVariable)}
                  />
                  Has Variable
                </label>
              </div>
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  {/if}

  <!-- Global Keywords Tab -->
  {#if activeTab === "global" || !currentHostname}
    <div id="global-keywords-container" class="keywords-list">
      <h2>Global Keywords</h2>

      {#if globalKeywords.length === 0}
        <div class="empty-message">
          <p>No global keywords defined.</p>
          <p class="helper-text">Add keywords that work across all pages using the form above.</p>
        </div>
      {:else if filteredGlobalKeywords.length === 0 && searchTerm}
        <div class="empty-message">
          <p>No matching keywords found for "{searchTerm}"</p>
          <p class="helper-text">Try a different search term or <button class="clear-search-link" on:click={clearSearch}>clear the search</button></p>
        </div>
      {:else}
        <ul id="global-keywords-list">
          {#each filteredGlobalKeywords as keyword, index}
            <li class="keyword-item">
              <div class="keyword-header" 
                on:click={() => toggleDetails('global', index)}
                on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && toggleDetails('global', index)}
              >
                <span class="keyword-name">{keyword.keyword}</span>
                <div class="keyword-actions">
                  <span class="badge">Fixed</span>
                  <button
                    class="icon-button delete-keyword"
                    aria-label="Delete"
                    on:click={(e) => {
                      e.stopPropagation();
                      deleteGlobalKeyword(index);
                    }}
                  >
                    <i class="fas fa-trash-alt"></i>
                  </button>
                </div>
              </div>
      
              <div
                id={`global-${index}`}
                class="keyword-details"
                style="display: none;"
              >
                <textarea
                  class="xpath"
                  bind:value={keyword.xpath}
                  on:input={() => updateGlobalKeyword(index, 'xpath', keyword.xpath)}
                ></textarea>
                <label class="details-option">
                  <input
                    type="checkbox"
                    class="has-variable"
                    bind:checked={keyword.hasVariable}
                    on:change={() => updateGlobalKeyword(index, 'hasVariable', keyword.hasVariable)}
                  />
                  Has Variable
                </label>
              </div>
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  {/if}
</div>

<style>
  /* Tab Navigation */
  .tab-navigation {
    display: flex;
    border-bottom: 2px solid #f0f0f0;
    margin-bottom: 15px;
  }

  .tab-link {
    flex: 1;
    padding: 10px 0;
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    margin-bottom: -2px;
    text-align: center;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    color: #666;
  }

  .tab-link.active {
    border-bottom: 2px solid #007bff;
    color: #007bff;
  }

  /* Keywords Header */
  .keywords-header {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 15px;
  }

  .keywords-title {
    font-size: 24px;
    margin: 0;
    padding: 0;
    font-weight: bold;
  }

  /* Action Buttons Container */
  .action-buttons {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  /* Action Button Style */
  .action-button {
    background-color: #5b6f92;
    color: #fff;
    border: none;
    border-radius: 3px;
    padding: 8px 12px;
    font-size: 14px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 5px;
    transition: background-color 0.2s;
  }

  .action-button:hover {
    background-color: #4a5d7e;
  }

  /* Search Container with Clear Button */
  .search-container {
    margin-bottom: 15px;
  }
  
  .search-input-wrapper {
    position: relative;
    width: 100%;
  }
  
  #search-keyword {
    width: 100%;
    padding: 8px 12px;
    padding-right: 30px; /* Space for clear button */
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
    box-sizing: border-box;
  }
  
  .clear-search {
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: #999;
    cursor: pointer;
    font-size: 14px;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .clear-search:hover {
    color: #666;
  }
  
  .clear-search-link {
    background: none;
    border: none;
    color: #007bff;
    padding: 0;
    font-size: inherit;
    text-decoration: underline;
    cursor: pointer;
  }
  
  .clear-search-link:hover {
    color: #0056b3;
  }

  /* Add button style */
  .add-button {
    background-color: #007bff;
    color: #ffffff;
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    font-size: 14px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 5px;
    transition: all 0.2s;
  }

  .add-button:hover {
    background-color: #0056b3;
  }
  
  .add-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  /* Form Elements */
  .form-group {
    margin-bottom: 15px;
  }

  .form-control {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    box-sizing: border-box;
    margin-bottom: 8px;
    font-family: inherit;
  }

  textarea.form-control {
    min-height: 80px;
    resize: vertical;
  }

  /* Keyword Actions */
  .keyword-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    margin-top: 10px;
    gap: 10px;
  }

  /* Checkbox Styling */
  .checkbox-inline {
    display: flex;
    align-items: center;
    gap: 5px;
    user-select: none;
  }

  /* Local toggle styling */
  .local-toggle {
    background-color: #f5f5f5;
    padding: 4px 8px;
    border-radius: 4px;
    transition: background-color 0.3s;
  }

  .local-toggle:has(input:checked) {
    background-color: #e6f7ff;
  }

  .local-label {
    font-weight: 500;
  }

  .hostname {
    font-size: 12px;
    color: #666;
  }

  /* Keyword List */
  .keywords-list {
    margin-bottom: 20px;
  }

  /* Keyword Items */
  .keyword-item {
    margin-bottom: 15px;
    padding: 15px;
    background: #f8f9fa;
    border-radius: 6px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }

  .keyword-name {
    font-weight: bold;
    color: #333;
  }

  /* Badge */
  .badge {
    background-color: #e2e6ea;
    color: #495057;
    padding: 3px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: normal;
  }

  /* Icon Buttons */
  .icon-button {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 14px;
    color: #666;
    padding: 4px;
    border-radius: 4px;
    transition: all 0.2s;
  }

  .icon-button:hover {
    background-color: rgba(0,0,0,0.05);
  }

  .delete-keyword:hover {
    color: #dc3545;
  }

  /* Keyword Details */
  .keyword-details {
    padding: 10px 12px;
    border-top: 1px solid #eee;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .keyword-details textarea {
    width: 100%;
    height: 80px;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-family: monospace;
    resize: vertical;
  }

  /* Empty State */
  .empty-message {
    padding: 15px;
    text-align: center;
    color: #666;
    background-color: #f8f9fa;
    border-radius: 4px;
  }

  .helper-text {
    font-size: 0.9em;
    color: #6c757d;
    margin-top: 5px;
  }

  /* Details Option */
  .details-option {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  /* Headers */
  h2 {
    font-size: 16px;
    font-weight: bold;
    margin: 10px 0;
    color: #333;
  }
</style>