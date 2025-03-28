<script>
  import { onMount } from "svelte";

  let globalKeywords = [];
  let localKeywords = [];
  let newKeyword = "";
  let newXpath = "";
  let hasVariable = false;
  let isGlobal = true; // Default to global
  let searchTerm = "";
  let activeTab = "global"; // 'global' or 'local'
  let currentHostname = "";

  // Function to get current hostname and then load keywords
  onMount(() => {
    chrome.storage.local.get("keywordInput", (result) => {
    if (result.keywordInput) {
      // Restore saved input values
      newKeyword = result.keywordInput.keyword || "";
      newXpath = result.keywordInput.xpath || "";
      hasVariable = !!result.keywordInput.hasVariable;
      isGlobal = result.keywordInput.isGlobal !== undefined ? 
        result.keywordInput.isGlobal : true;
    }
   });
  
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].url) {
        try {
          const url = new URL(tabs[0].url);
          currentHostname = url.hostname;
          console.log("Current hostname:", currentHostname);
          
          // Now that we have the hostname, load keywords
          loadKeywords();
        } catch (e) {
          console.error("Error getting hostname:", e);
          // Still load global keywords even if hostname fails
          loadGlobalKeywords();
        }
      } else {
        // Still load global keywords if no tab is active
        loadGlobalKeywords();
      }
    });
  });
  const saveInputValues = () => {
  // Save current input values to Chrome storage
  chrome.storage.local.set({
    keywordInput: {
      keyword: newKeyword,
      xpath: newXpath,
      hasVariable: hasVariable,
      isGlobal: isGlobal
    }
  });
};

  // Split the loadKeywords function to handle global and local separately
  const loadGlobalKeywords = () => {
    chrome.storage.local.get({ globalKeywords: [] }, (result) => {
      console.log("Loaded global keywords:", result.globalKeywords);
      globalKeywords = result.globalKeywords || [];
    });
  };

  const loadLocalKeywords = () => {
    if (currentHostname) {
      chrome.storage.local.get({ localKeywords: {} }, (result) => {
        console.log("All local keywords:", result.localKeywords);
        console.log("Current hostname for local keywords:", currentHostname);
        localKeywords = (result.localKeywords && result.localKeywords[currentHostname]) || [];
        console.log("Loaded local keywords for current site:", localKeywords);
      });
    }
  };

  const loadKeywords = () => {
    loadGlobalKeywords();
    loadLocalKeywords();
  };

  const addKeyword = () => {
    if (newKeyword.trim() && newXpath.trim()) {
      const newKeywordObj = {
        keyword: newKeyword.trim(),
        xpath: newXpath.trim(),
        global: isGlobal,
        hasVariable,
      };

      if (isGlobal) {
        // Add to global keywords
        chrome.storage.local.get({ globalKeywords: [] }, (result) => {
          const updatedKeywords = [...(result.globalKeywords || []), newKeywordObj];
          chrome.storage.local.set({ globalKeywords: updatedKeywords }, () => {
            globalKeywords = updatedKeywords;
            resetForm();
          });
        });
      } else {
        // Add to local keywords for the current URL
        if (currentHostname) {
          chrome.storage.local.get({ localKeywords: {} }, (result) => {
            const allLocalKeywords = result.localKeywords || {};
            const siteKeywords = allLocalKeywords[currentHostname] || [];
            
            const updatedSiteKeywords = [...siteKeywords, newKeywordObj];
            allLocalKeywords[currentHostname] = updatedSiteKeywords;
            
            chrome.storage.local.set({ localKeywords: allLocalKeywords }, () => {
              localKeywords = updatedSiteKeywords;
              resetForm();
            });
          });
        }
      }
    }
  };

  const resetForm = () => {
    newKeyword = "";
    newXpath = "";
    hasVariable = false;
  };

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

  const processImportedKeywords = (keywords) => {
    if (activeTab === "global") {
      chrome.storage.local.get({ globalKeywords: [] }, (result) => {
        let globalKeywords = result.globalKeywords || [];

        keywords.forEach((keywordObj) => {
          const { keyword, xpath, hasVariable = false } = keywordObj;
          if (!globalKeywords.some((item) => item.keyword === keyword)) {
            globalKeywords.push({ keyword, xpath, global: true, hasVariable });
          } else {
            console.log(`Duplicate keyword skipped: ${keyword}`);
          }
        });

        chrome.storage.local.set({ globalKeywords }, () => {
          console.log("Keywords imported successfully.");
          loadKeywords();
        });
      });
    } else {
      if (currentHostname) {
        chrome.storage.local.get({ localKeywords: {} }, (result) => {
          const allLocalKeywords = result.localKeywords || {};
          const siteKeywords = allLocalKeywords[currentHostname] || [];
          
          keywords.forEach((keywordObj) => {
            const { keyword, xpath, hasVariable = false } = keywordObj;
            if (!siteKeywords.some((item) => item.keyword === keyword)) {
              siteKeywords.push({ keyword, xpath, global: false, hasVariable });
            } else {
              console.log(`Duplicate keyword skipped: ${keyword}`);
            }
          });
          
          allLocalKeywords[currentHostname] = siteKeywords;
          chrome.storage.local.set({ localKeywords: allLocalKeywords }, () => {
            console.log("Local keywords imported successfully.");
            loadKeywords();
          });
        });
      }
    }
  };

  // Improved toggleDetails function with reactive binding
  let visibleDetails = { global: null, local: null };

  function toggleDetails(index, isGlobalKeyword = true) {
    if (isGlobalKeyword) {
      visibleDetails.global = visibleDetails.global === index ? null : index;
    } else {
      visibleDetails.local = visibleDetails.local === index ? null : index;
    }
  }

  // Delete a keyword without confirmation dialog
  const deleteKeyword = (index, isGlobalKeyword = true) => {
    if (isGlobalKeyword) {
      chrome.storage.local.get({ globalKeywords: [] }, (result) => {
        const updatedKeywords = [...(result.globalKeywords || [])];
        updatedKeywords.splice(index, 1);
        chrome.storage.local.set({ globalKeywords: updatedKeywords }, () => {
          globalKeywords = updatedKeywords;
        });
      });
    } else {
      if (currentHostname) {
        chrome.storage.local.get({ localKeywords: {} }, (result) => {
          const allLocalKeywords = result.localKeywords || {};
          const siteKeywords = [...(allLocalKeywords[currentHostname] || [])];
          
          siteKeywords.splice(index, 1);
          allLocalKeywords[currentHostname] = siteKeywords;
          
          chrome.storage.local.set({ localKeywords: allLocalKeywords }, () => {
            localKeywords = siteKeywords;
          });
        });
      }
    }
  };
  
  // Delete all keywords for the current tab without confirmation
  const deleteAllKeywords = () => {
    if (activeTab === 'global') {
      chrome.storage.local.set({ globalKeywords: [] }, () => {
        globalKeywords = [];
      });
    } else if (currentHostname) {
      chrome.storage.local.get({ localKeywords: {} }, (result) => {
        const allLocalKeywords = result.localKeywords || {};
        delete allLocalKeywords[currentHostname];
        chrome.storage.local.set({ localKeywords: allLocalKeywords }, () => {
          localKeywords = [];
        });
      });
    }
  };

  const updateKeyword = (index, field, value, isGlobalKeyword = true) => {
    if (isGlobalKeyword) {
      chrome.storage.local.get({ globalKeywords: [] }, (result) => {
        const updatedKeywords = [...(result.globalKeywords || [])];
        if (updatedKeywords[index]) {
          updatedKeywords[index][field] = value;
        }
        chrome.storage.local.set({ globalKeywords: updatedKeywords }, () => {
          globalKeywords = updatedKeywords;
          console.log(`Keyword updated: ${field} = ${value}`);
        });
      });
    } else {
      if (currentHostname) {
        chrome.storage.local.get({ localKeywords: {} }, (result) => {
          const allLocalKeywords = result.localKeywords || {};
          const siteKeywords = [...(allLocalKeywords[currentHostname] || [])];
          
          if (siteKeywords[index]) {
            siteKeywords[index][field] = value;
          }
          
          allLocalKeywords[currentHostname] = siteKeywords;
          chrome.storage.local.set({ localKeywords: allLocalKeywords }, () => {
            localKeywords = siteKeywords;
            console.log(`Local keyword updated: ${field} = ${value}`);
          });
        });
      }
    }
  };

  // Export keywords function
  const exportKeywords = () => {
    const keywordsToExport = activeTab === 'global' ? globalKeywords : localKeywords;
    
    if (keywordsToExport.length === 0) {
      alert('No keywords to export');
      return;
    }
    
    const blob = new Blob([JSON.stringify(keywordsToExport, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeTab === 'global' ? 'global-keywords.json' : `${currentHostname}-keywords.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Filtered keywords based on search
  $: filteredGlobalKeywords = globalKeywords.filter(k => 
    k.keyword.toLowerCase().includes(searchTerm.toLowerCase()) || 
    k.xpath.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  $: filteredLocalKeywords = localKeywords.filter(k => 
    k.keyword.toLowerCase().includes(searchTerm.toLowerCase()) || 
    k.xpath.toLowerCase().includes(searchTerm.toLowerCase())
  );
</script>

<div id="tab4" class="tab-content active">
  <!-- Header -->
  <h1 class="keywords-title">Keywords</h1>
  
  <!-- Action buttons -->
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

  <!-- Form for adding new keywords -->
  <div class="keyword-form">
    <div class="form-group">
      <input 
        bind:value={newKeyword} 
        type="text" 
        id="new-keyword" 
        placeholder="Enter keyword" 
        aria-label="Keyword Input"
        on:change={saveInputValues}
      >
    </div>
    
    <div class="form-group">
      <textarea 
        bind:value={newXpath} 
        id="keyword-xpath" 
        placeholder="Enter XPath" 
        aria-label="XPath Input"
        on:change={saveInputValues}
      ></textarea>
    </div>

    <div class="form-actions">
      <div class="checkbox-group">
        <label class="checkbox-container">
          <input bind:checked={hasVariable} type="checkbox" id="has-variable" on:change={saveInputValues} >
          <span>Has Variable</span>
        </label>
        
        <label class="checkbox-container">
          <input bind:checked={isGlobal} type="checkbox" id="global-keyword" on:change={saveInputValues}>
          <span>Global Keyword</span>
        </label>
      </div>
      
      <button id="add-keyword" on:click={addKeyword} class="add-button">
        <i class="fas fa-plus"></i> Add Keyword
      </button>
    </div>
  </div>

  <!-- Search Bar -->
  <div class="search-container">
    <input 
      type="text" 
      id="search-keyword" 
      bind:value={searchTerm} 
      placeholder="Search keywords" 
      aria-label="Search Keyword"
    >
  </div>

  <!-- Tab navigation for Global/Local -->
  <div class="keyword-tabs">
    <button 
      class="tab-button {activeTab === 'global' ? 'active' : ''}" 
      on:click={() => activeTab = "global"}
    >
      Global Keywords
    </button>
    <button 
      class="tab-button {activeTab === 'local' ? 'active' : ''}" 
      on:click={() => activeTab = "local"}
    >
      Local Keywords
    </button>
  </div>
  
  <!-- Keywords list -->
  <div class="keywords-list-container">
    {#if activeTab === 'global'}
      {#if filteredGlobalKeywords.length === 0}
        <div class="no-keywords">
          No global keywords found.
        </div>
      {:else}
        <ul class="keywords-list">
          {#each filteredGlobalKeywords as keyword, index}
            <li class="keyword-item">
              <div class="keyword-header" 
                on:click={() => toggleDetails(index, true)}
                on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && toggleDetails(index, true)}>
                <span class="keyword-name">{keyword.keyword}</span>
                <div class="keyword-actions">
                  <button
                    class="delete-keyword"
                    aria-label="Delete"
                    on:click={(e) => {
                      e.stopPropagation();
                      deleteKeyword(index, true);
                    }}
                  >
                    <i class="fas fa-trash-alt"></i>
                  </button>
                </div>
              </div>
        
              <!-- Use reactive binding for showing/hiding details -->
              <div
                class="keyword-details"
                style="display: {visibleDetails.global === index ? 'flex' : 'none'};"
              >
                <textarea
                  class="xpath"
                  bind:value={keyword.xpath}
                  on:input={() => updateKeyword(index, 'xpath', keyword.xpath, true)}
                ></textarea>
                <label>
                  <input
                    type="checkbox"
                    class="has-variable"
                    bind:checked={keyword.hasVariable}
                    on:change={() => updateKeyword(index, 'hasVariable', keyword.hasVariable, true)}
                  />
                  Has Variable
                </label>
              </div>
            </li>
          {/each}
        </ul>
      {/if}
    {:else}
      <!-- Local Keywords List -->
      {#if !currentHostname}
        <div class="no-keywords">
          No active tab or valid URL detected.
        </div>
      {:else if filteredLocalKeywords.length === 0}
        <div class="no-keywords">
          No local keywords for {currentHostname}.
        </div>
      {:else}
        <ul class="keywords-list">
          {#each filteredLocalKeywords as keyword, index}
            <li class="keyword-item">
              <div class="keyword-header" 
                on:click={() => toggleDetails(index, false)}
                on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && toggleDetails(index, false)}>
                <span class="keyword-name">{keyword.keyword}</span>
                <div class="keyword-actions">
                  <button
                    class="delete-keyword"
                    aria-label="Delete"
                    on:click={(e) => {
                      e.stopPropagation();
                      deleteKeyword(index, false);
                    }}
                  >
                    <i class="fas fa-trash-alt"></i>
                  </button>
                </div>
              </div>
        
              <!-- Use reactive binding for showing/hiding details -->
              <div
                class="keyword-details"
                style="display: {visibleDetails.local === index ? 'flex' : 'none'};"
              >
                <textarea
                  class="xpath"
                  bind:value={keyword.xpath}
                  on:input={() => updateKeyword(index, 'xpath', keyword.xpath, false)}
                ></textarea>
                <label>
                  <input
                    type="checkbox"
                    class="has-variable"
                    bind:checked={keyword.hasVariable}
                    on:change={() => updateKeyword(index, 'hasVariable', keyword.hasVariable, false)}
                  />
                  Has Variable
                </label>
              </div>
            </li>
          {/each}
        </ul>
      {/if}
    {/if}
  </div>
</div>

<style>
  /* Main container */
  .tab-content {
    padding: 0;
    margin: 0;
    font-family: Arial, sans-serif;
    max-width: 400px;
    background-color: white;
  }
  
  /* Header */
  .keywords-title {
    padding: 10px;
    margin: 0;
    font-size: 24px;
    font-weight: normal;
    border-bottom: 1px solid #ddd;
    background-color: #f8f9fa;
    color: #333;
  }
  
  /* Action buttons row */
  .action-buttons {
    display: flex;
    padding: 10px;
    border-bottom: 1px solid #ddd;
    gap: 5px;
    background-color: #fff;
  }
  
  .action-button {
    background-color: #5b7db1;
    color: white;
    border: none;
    padding: 6px 12px;
    font-size: 14px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    border-radius: 3px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    transition: all 0.2s ease;
  }
  
  .action-button:hover {
    background-color: #4a6a9b;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  }
  
  .action-button i {
    margin-right: 5px;
  }
  
  /* Search bar */
  .search-container {
    padding: 10px;
    border-bottom: 1px solid #ddd;
    margin-top: 10px;
    background-color: #fff;
  }
  
  #search-keyword {
    width: 100%;
    padding: 8px 12px 8px 30px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 14px;
    box-sizing: border-box;
    background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="%23999" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>') no-repeat;
    background-position: 8px center;
    background-color: #fff;
    transition: all 0.2s ease;
  }
  
  #search-keyword:focus {
    border-color: #5b7db1;
    outline: none;
    box-shadow: 0 0 0 2px rgba(91, 125, 177, 0.2);
  }
  
  /* Tab navigation */
  .keyword-tabs {
    display: flex;
    border-bottom: 1px solid #ddd;
    background-color: #fff;
  }
  
  .tab-button {
    flex: 1;
    background: none;
    border: none;
    padding: 12px 15px;
    font-size: 13px;
    cursor: pointer;
    text-align: center;
    color: #666;
    position: relative;
    transition: all 0.2s ease;
  }
  
  .tab-button:hover {
    color: #007bff;
    background-color: rgba(0, 123, 255, 0.05);
  }
  
  .tab-button.active {
    color: #007bff;
    font-weight: 500;
  }
  
  .tab-button.active::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 2px;
    background-color: #007bff;
    animation: slideIn 0.3s ease;
  }
  
  @keyframes slideIn {
    from {
      transform: scaleX(0);
    }
    to {
      transform: scaleX(1);
    }
  }
  
  /* Add keyword form */
  .keyword-form {
    padding: 10px;
    border-bottom: 1px solid #ddd;
  }
  
  .form-group {
    margin-bottom: 10px;
  }
  
  #new-keyword, #keyword-xpath {
    width: 100%;
    padding: 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 14px;
    box-sizing: border-box;
  }
  
  #keyword-xpath {
    min-height: 80px;
    max-height: 150px;
    resize: vertical;
    width: 100%;
    box-sizing: border-box;
    font-family: monospace;
  }
  
  .form-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 10px;
  }
  
  .checkbox-group {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  
  .checkbox-container {
    display: inline-flex;
    align-items: center;
    background-color: #f8f9fa;
    border: 1px solid #ccc;
    border-radius: 4px;
    padding: 6px 10px;
    white-space: nowrap;
  }
  
  .checkbox-container input {
    margin-right: 5px;
  }
  
  .add-button {
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 8px 15px;
    font-size: 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    white-space: nowrap;
  }
  
  .add-button i {
    margin-right: 5px;
  }
  
  /* Keywords list */
  .keywords-list-container {
    margin-top: 10px;
  }
  
  .no-keywords {
    text-align: center;
    padding: 20px;
    color: #666;
    font-style: italic;
  }
  
  .keywords-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  
  .keyword-item {
    border: 1px solid #ddd;
    border-radius: 4px;
    margin-bottom: 10px;
    overflow: hidden;
    margin: 10px;
  }
  
  .keyword-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 15px;
    background-color: #f8f9fa;
    cursor: pointer;
  }
  
  .keyword-name {
    font-weight: 500;
  }
  
  .delete-keyword {
    background: none;
    border: none;
    color: #dc3545;
    cursor: pointer;
  }
  
  .keyword-details {
    padding: 15px;
    border-top: 1px solid #ddd;
    display: flex;
    flex-direction: column;
  }
  
  .keyword-details textarea {
    width: 100%;
    height: 80px;
    margin-bottom: 10px;
    border: 1px solid #ccc;
    border-radius: 4px;
    resize: vertical;
  }
  
  .keyword-details label {
    display: flex;
    align-items: center;
  }
  
  .keyword-details input[type="checkbox"] {
    margin-right: 8px;
  }
</style>