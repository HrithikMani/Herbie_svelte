<script>
    export let activeTab;
  
    let tabs = [
      { id: "tab1", label: "Herbie" },
      { id: "tab2", label: "Logs" },
    ];
  
    let isDropdownVisible = false;
  
    function toggleDropdown() {
      isDropdownVisible = !isDropdownVisible;
    }
  
    function selectTab(tabId) {
      activeTab = tabId;
      isDropdownVisible = false; // Close dropdown after selection
    }
  </script>
  
  <div class="dropdown-container">
    <div class="dropdown">
      <button class="dropdown-toggle" aria-label="Menu" on:click={toggleDropdown}>
        <span class="hamburger-icon">&#9776;</span>
      </button>
      {#if isDropdownVisible}
        <div class="dropdown-menu">
          {#each tabs as tab}
            <button
              class="dropdown-item {activeTab === tab.id ? 'active' : ''}"
              on:click={() => selectTab(tab.id)}
            >
              {tab.label}
            </button>
          {/each}
        </div>
      {/if}
    </div>
  </div>
  
  <style>
    .dropdown-container {
      position: relative;
      width: 100%;
      background-color: white;
      border-bottom: 1px solid #ddd;
      padding: 5px;
    }
  
    .dropdown {
      display: inline-block;
    }
  
    .dropdown-toggle {
      background: none;
      border: none;
      font-size: 18px;
      cursor: pointer;
      outline: none;
    }
  
    .dropdown-menu {
      position: absolute;
      top: 100%;
      left: 0;
      z-index: 10;
      display: flex;
      flex-direction: column;
      width: 150px;
      background: #fff;
      border: 1px solid #ddd;
      border-radius: 4px;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
      margin: 0;
      padding: 0;
    }
  
    .dropdown-item {
      padding: 8px 12px;
      border: none;
      text-align: left;
      background: none;
      cursor: pointer;
      font-size: 14px;
    }
  
    .dropdown-item:hover,
    .dropdown-item.active {
      background: #0078d4;
      color: white;
    }
  </style>
  