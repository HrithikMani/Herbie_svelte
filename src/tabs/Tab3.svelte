<script>
  import { onMount } from 'svelte';

  export let activeTab;

  // The list of saved scripts
  let savedScripts = [];

  // On mount, load them from Chrome storage
  onMount(() => {
    chrome.storage.local.get(['savedScripts'], (result) => {
      if (result.savedScripts) {
        savedScripts = result.savedScripts;
      }
    });
  });

  // Called whenever we want to persist savedScripts to storage
  function saveToStorage() {
    chrome.storage.local.set({ savedScripts });
  }

  // Delete a script at index
  function deleteScript(index) {
    savedScripts = savedScripts.filter((_, i) => i !== index);
    saveToStorage();
  }

  // Load a script into herbie_script, switch to Herbie tab
  function loadIntoHerbie(index) {
    const scriptToLoad = savedScripts[index];
    if (!scriptToLoad) return;

    chrome.storage.local.set({ herbie_script: scriptToLoad.content }, () => {
      console.log("Loaded into 'herbie_script' for Herbie tab.");
      activeTab = 'tab1'; // Switch to Tab1
    });
  }

  // Trigger hidden file input
  function handleImportClick() {
    document.getElementById('import-file').click();
  }

  // Read a .txt file and add to saved scripts
  function handleFileChange(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const fileContent = e.target.result;
      const newScript = {
        title: `Imported Script (${file.name})`,
        content: fileContent
      };
      savedScripts = [...savedScripts, newScript];
      saveToStorage();
    };
    reader.readAsText(file);
    event.target.value = '';
  }

  function handleTitleBlur() {
    saveToStorage();
  }
  function handleContentBlur() {
    
    saveToStorage();
  }
</script>

<!-- Header -->
<div class="saved-scripts-header">
  <h2>Saved Scripts</h2>
  <button class="import-button" on:click={handleImportClick}>
    <i class="fas fa-file-import"></i> Import
  </button>
  <input
    type="file"
    id="import-file"
    accept=".txt"
    style="display:none"
    on:change={handleFileChange}
  />
</div>

<!-- Show a message if none, else show the scripts -->
{#if savedScripts.length === 0}
  <div class="no-scripts">
    <p>No saved scripts yet</p>
  </div>
{:else}
  <div class="saved-scripts-container">
    {#each savedScripts as script, index}
      <div class="script-item">
        <div class="item-header">
          <!-- Editable input for title -->
          <input
            class="script-title"
            type="text"
            bind:value={script.title}
            on:blur={handleTitleBlur}
          />

          <div class="action-buttons">
            <!-- Load into Herbie -->
            <button
              class="btn-icon"
              title="Load into Herbie Tab"
              on:click={() => loadIntoHerbie(index)}
            >
              <i class="fas fa-share"></i>
            </button>
            <!-- Delete script -->
            <button
              class="btn-icon delete-btn"
              title="Delete Script"
              on:click={() => deleteScript(index)}
            >
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
        <!-- Editable script content. Remove `readonly` and bind:value. -->
        <textarea
          class="script-content"
          rows="4"
          bind:value={script.content}
          on:blur={handleContentBlur}
        ></textarea>
      </div>
    {/each}
  </div>
{/if}

<style>
  /* Remove default body margins in the extension popup */
  :global(html, body) {
    margin: 0;
    padding: 0;
    font-family: Arial, sans-serif;
    background: #fff;
  }

  /* Header bar */
  .saved-scripts-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    border-bottom: 1px solid #ddd;
    background-color: #f8f9fa;
  }

  .import-button {
    border: none;
    background-color: #007bff;
    color: #fff;
    padding: 6px 10px;
    border-radius: 4px;
    font-size: 0.9rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.3rem;
  }
  .import-button:hover {
    background-color: #0056b3;
  }

  /* If no scripts, a small message */
  .no-scripts {
    padding: 12px;
    text-align: center;
    color: #666;
    font-size: 0.9rem;
  }

  /* Container for saved scripts list */
  .saved-scripts-container {
    padding: 8px 12px;
  }

  /* Each script's "card" */
  .script-item {
    background-color: #fafafa;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 8px;
    margin-bottom: 8px;
  }

  .item-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 6px;
  }

  /* Editable Title Input */
  .script-title {
    width: 95%;       /* So it doesn't overflow the popup */
    font-size: 0.9rem;
    border: 1px solid #ccc;
    border-radius: 3px;
    padding: 4px;
    margin-right: 8px;
  }
  .script-title:focus {
    outline: 1px solid #007bff;
  }

  .action-buttons {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .btn-icon {
    border: none;
    background: transparent;
    cursor: pointer;
    font-size: 1rem;
    color: #555;
  }
  .btn-icon:hover {
    color: #007bff;
  }
  .delete-btn:hover {
    color: #e74c3c;
  }

  /* The script's content (read-only) */
  .script-content {
    width: 95%;
    border: 1px solid #ccc;
    border-radius: 3px;
    padding: 6px;
    background-color: #fff;
    font-size: 0.9rem;
    color: #333;
    resize: vertical;
    height: 150px;
  }
</style>
