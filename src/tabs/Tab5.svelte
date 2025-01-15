<script>
  import { onMount } from "svelte";

  // Function to handle drag start
  function handleDragStart(actionType, event) {
    event.dataTransfer.setData("text/plain", actionType);
    event.dataTransfer.effectAllowed = "move";
  }

  // Lifecycle to ensure DOM is ready
  onMount(() => {
    const recordClickButton = document.getElementById("record_click");
    const recordTypeButton = document.getElementById("record_type");

    if (recordClickButton && recordTypeButton) {
      recordClickButton.addEventListener("dragstart", handleDragStart.bind(null, "click"));
      recordTypeButton.addEventListener("dragstart", handleDragStart.bind(null, "type"));
    } else {
      console.error("Buttons not found in DOM!");
    }
  });
</script>

<div id="tab5" class="tab-content record-tab active">
  <h2 class="record-title">Record</h2>

  <div class="record-button-container">
    <div class="record-row">
      <button id="record_click" class="record-button record-click" aria-label="Record Click" draggable="true">
        <i class="fas fa-mouse-pointer"></i> Click
      </button>
      <button id="record_type" class="record-button record-type" aria-label="Record Type" draggable="true">
        <i class="fas fa-keyboard"></i> Type
      </button>
    </div>
    <div class="record-row">
      <button id="record_verify" class="record-button record-verify" aria-label="Record Verify" draggable="true">
        <i class="fas fa-check"></i> Verify
      </button>
    </div>
    <button id="record_wait" class="record-button record-wait" aria-label="Record Wait" draggable="true">
      <i class="fas fa-clock"></i> Wait
    </button>
  </div>

  <div class="record-row">
    <button id="record_run" class="record-button record-run" aria-label="Run Script">
      <i class="fas fa-play"></i> Run
    </button>
  </div>
  <div class="record-row">
    <button id="save_actions" class="record-button record-save" aria-label="Save Actions">
      Save Actions
    </button>
  </div>

  <div class="record-row">
    <button id="clear_actions" class="record-button record-clear" aria-label="Clear Actions">
      Clear Actions
    </button>
  </div>

  <div id="actions_container"></div>
</div>

<style>
  /* Add your styles here */
</style>
