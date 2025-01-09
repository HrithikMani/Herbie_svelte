<script>
     import 'mie-ds-brand-grayscale-light/dist/styles.css';
</script>
<div id="tab1" class="tab-content active">
  <div id="herbie_div">
    <div id="herbie_buttons">
      <img id="herbie_logo" align="left" src="logos/herbie48.png" alt="Herbie Logo" height="30" style="padding-top: 2px; padding-left: 4px;">
      <span id="herbie_documentation"><a  target="_blank" href="http://mieweb.github.io/herbie/">Herbie</a></span>
      
      <button id="herbie_run" title="Run" class="run-button" aria-label="Run Herbie">
        <i class="fas fa-play"></i>
      </button>
      <button id="herbie_save" title="Add to Saved Scripts" class="save-button" aria-label="Save Herbie">
        <i class="fas fa-save"></i>
        <i class="fas fa-check"></i>
      </button>        
    </div>
    <div class="progress-container">
      <div id="herbie_progress" class="progress-bar"></div>
    </div>
    <div class="herbie_script">
      <label class="prompt" for="herbie_script">Script:</label>
      <textarea id="herbie_script" placeholder="Type or load your test scripts here..." name="Script" rows="10" cols="80" aria-label="Herbie Script Area"></textarea>
    </div>
    <div class="herbie_output" aria-label="Herbie Output Area">
      <span id="herbie_output">Click parse or run</span>
    </div>
    <div class="button-container">
      <button id="herbie_add" class="button" aria-label="Add Command"><i class="fas fa-plus"></i> Add</button>
      <button id="herbie_parse" class="button" aria-label="Parse Command"><i class="fas fa-code"></i> Parse</button>
      <button id="herbie_clear" class="button" aria-label="Clear Command"><i class="fas fa-trash-alt"></i> Clear</button>
      <button id="herbie_save_logs" class="button" aria-label="Save Command"><i class="fas fa-save"></i> Save</button>
    </div>
  </div>
</div>
<style>
  .button {
    background-color: var(--primary-base, #007bff); /* Fallback */
    color: var(--base-white, #ffffff); /* Fallback */
    padding: 0.5rem 1rem;
    border: none;
    border-radius: var(--button-border-radius-md, 8px); /* Fallback */
    font-size: var(--font-size-md, 16px); /* Fallback */
    transition: var(--transition-base, all 0.3s ease);
  }

  .button:hover {
    background-color: var(--primary-dark, #0056b3); /* Fallback */
    box-shadow: var(--shadow-base-dark, 0px 4px 6px rgba(0, 0, 0, 0.2));
  }
</style>