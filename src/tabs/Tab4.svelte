<script>
  import { onMount } from "svelte";

  let globalKeywords = [];
  let newKeyword = "";
  let newXpath = "";
  let hasVariable = false;

  const loadKeywords = () => {
    chrome.storage.local.get({ globalKeywords: [] }, (result) => {
      globalKeywords = result.globalKeywords || [];
    });
  };

  const addKeyword = () => {
    if (newKeyword.trim() && newXpath.trim()) {
      const newKeywordObj = {
        keyword: newKeyword.trim(),
        xpath: newXpath.trim(),
        global: true,
        hasVariable,
      };

      chrome.storage.local.get({ globalKeywords: [] }, (result) => {
        const updatedKeywords = [...(result.globalKeywords || []), newKeywordObj];
        chrome.storage.local.set({ globalKeywords: updatedKeywords }, () => {
          globalKeywords = updatedKeywords;
          resetForm();
        });
      });
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
    chrome.storage.local.get({ globalKeywords: [] }, (result) => {
      let globalKeywords = result.globalKeywords || [];

      keywords.forEach((keywordObj) => {
        const { keyword, xpath, global = true, hasVariable = false } = keywordObj;
        if (!globalKeywords.some((item) => item.keyword === keyword)) {
          globalKeywords.push({ keyword, xpath, global, hasVariable });
        } else {
          console.log(`Duplicate keyword skipped: ${keyword}`);
        }
      });

      chrome.storage.local.set({ globalKeywords }, () => {
        console.log("Keywords imported successfully.");
        loadKeywords();
      });
    });
  };

  onMount(() => {
    loadKeywords();
  });

  const toggleDetails = (index) => {
    const detailsElement = document.getElementById(`details-${index}`);
    if (detailsElement) {
      detailsElement.style.display =
        detailsElement.style.display === "none" ? "flex" : "none";
    }
  };

  const deleteKeyword = (index) => {
    chrome.storage.local.get({ globalKeywords: [] }, (result) => {
      const updatedKeywords = [...(result.globalKeywords || [])];
      updatedKeywords.splice(index, 1);
      chrome.storage.local.set({ globalKeywords: updatedKeywords }, () => {
        globalKeywords = updatedKeywords;
      });
    });
  };
</script>

<div id="tab4" class="tab-content active">
  <div class="keywords-header">
    <h1 class="keywords-title">Keywords</h1>
    <div class="keywords-buttons">
      <button id="inspect-element" class="button">
        <i class="fas fa-search"></i> Inspect
      </button>
      <!-- Add hidden file input -->
      <input
        type="file"
        id="file-input"
        accept="application/json"
        on:change={importKeywords}
        style="display: none;"
      />
      <button
        id="import-keywords"
        class="button"
        on:click={() => document.getElementById("file-input").click()}
      >
        <i class="fas fa-file-import"></i> Import
      </button>
    </div>
  </div>

  <div id="keywords-container" class="form-group">
    <input bind:value={newKeyword} type="text" id="new-keyword" placeholder="Enter keyword" aria-label="Keyword Input" class="form-control">
    <textarea bind:value={newXpath} id="keyword-xpath" placeholder="Enter XPath" aria-label="XPath Input" class="form-control"></textarea>

    <div class="keyword-actions">
      <label class="checkbox-inline">
        <input bind:value={hasVariable} type="checkbox" id="has-variable"> Has Variable
        <input type="checkbox" id="keyword-global" style="display:none" checked/> 
      </label>
      <button id="add-keyword" on:click={addKeyword} class="button">Add Keyword</button>
    </div>
  </div>

  <input type="text" id="search-keyword" placeholder="Search keywords" aria-label="Search Keyword" class="form-control">

  <div id="global-keywords-container" class="keywords-list">
    <h1>Global Keywords</h1>

    <div>
      <ul id="global-keywords-list">
        {#each globalKeywords as keyword, index}
          <li class="keyword-item">
            <div class="keyword-header" 
            on:click={() => toggleDetails(index)}
            on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && toggleDetails(index)}>
              <span class="keyword-name">{keyword.keyword}</span>
              <div class="keyword-actions">
                <button
                  class="delete-keyword"
                  aria-label="Delete"
                  on:click={(e) => {
                    e.stopPropagation();
                    deleteKeyword(index);
                  }}
                >
                  <i class="fas fa-trash-alt"></i>
                </button>
              </div>
            </div>
    
            <div
              id={`details-${index}`}
              class="keyword-details"
              style="display: none;"
            >
              <textarea class="xpath" bind:value={keyword.xpath}></textarea>
              <label>
                <input
                  type="checkbox"
                  class="has-variable"
                  bind:checked={keyword.hasVariable}
                />
                Has Variable
              </label>
            </div>
          </li>
        {/each}
      </ul>
    </div>
  </div>

  <div id="local-keywords-container" class="keywords-list">
    <ul id="local-keywords-list"></ul>
  </div>
</div>

<style>
.button {
  background-color: var(--primary-base, #007bff);
  color: var(--base-white, #ffffff);
  padding: 0.5rem 1rem;
  border: none;
  border-radius: var(--button-border-radius-md, 8px);
  font-size: var(--font-size-md, 16px);
  transition: var(--transition-base, all 0.3s ease);
  cursor: pointer;
}

.button:hover {
  background-color: var(--primary-dark, #0056b3);
  box-shadow: var(--shadow-base-dark, 0px 4px 6px rgba(0, 0, 0, 0.2));
}
</style>
