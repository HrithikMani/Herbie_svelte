<script>
    import { onMount } from 'svelte';
    import { injectSvelteComponent, removeInjectedComponent } from '../utils/injectComponent';

    // Props (optional customization)
    export let buttonText = "Inject Herbie";
    export let removeText = "Remove Herbie";
    export let title = "Herbie Interface";
    export let testScript = "";

    // State
    let isInjected = false;
    let isLoading = false;

    // Check injection state
    async function checkInjectionState() {
        try {
            const result = await chrome.storage.local.get(['injectedComponent']);
            isInjected = !!(result.injectedComponent && result.injectedComponent.isActive);
        } catch (error) {
            console.error('Error checking injection state:', error);
            isInjected = false;
        }
    }

    // Toggle injection
    async function toggleInjection() {
        if (isInjected) {
            await removeHerbie();
        } else {
            await injectHerbie();
        }
    }

    // Inject Herbie
    async function injectHerbie() {
        isLoading = true;
        try {
            await injectSvelteComponent({
                componentName: 'MainComponent',
                scriptPath: 'build/injected/main-component.js',
                cssPath: 'build/injected/css/main-style.css',
                props: { 
                    title: title,
                    testScript: testScript
                },
                persist: true
            });
            
            await checkInjectionState();
            console.log('Herbie injected successfully');
        } catch (error) {
            console.error('Error injecting Herbie:', error);
            alert('Failed to inject Herbie: ' + error.message);
        } finally {
            isLoading = false;
        }
    }

    // Remove Herbie
    async function removeHerbie() {
        isLoading = true;
        try {
            await removeInjectedComponent();
            await checkInjectionState();
            console.log('Herbie removed successfully');
        } catch (error) {
            console.error('Error removing Herbie:', error);
            alert('Failed to remove Herbie: ' + error.message);
        } finally {
            isLoading = false;
        }
    }

    // Check state on mount
    onMount(() => {
        checkInjectionState();
    });
</script>

<button 
    class="inject-herbie-button {isInjected ? 'injected' : 'not-injected'}"
    on:click={toggleInjection}
    disabled={isLoading}
>
    {#if isLoading}
        <i class="fas fa-spinner fa-spin"></i>
        {isInjected ? 'Removing...' : 'Injecting...'}
    {:else}
        <i class="fas {isInjected ? 'fa-times' : 'fa-robot'}"></i>
        {isInjected ? removeText : buttonText}
    {/if}
</button>

<style>
    .inject-herbie-button {
        padding: 12px 20px;
        font-size: 14px;
        font-weight: bold;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.3s ease;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        min-width: 140px;
    }

    .inject-herbie-button.not-injected {
        background: #28a745;
        color: white;
    }

    .inject-herbie-button.not-injected:hover {
        background: #218838;
        transform: translateY(-1px);
        box-shadow: 0 2px 6px rgba(40, 167, 69, 0.3);
    }

    .inject-herbie-button.injected {
        background: #dc3545;
        color: white;
    }

    .inject-herbie-button.injected:hover {
        background: #c82333;
        transform: translateY(-1px);
        box-shadow: 0 2px 6px rgba(220, 53, 69, 0.3);
    }

    .inject-herbie-button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none;
        box-shadow: none;
    }

    .fa-spinner {
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
</style>