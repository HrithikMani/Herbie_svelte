export async function injectSvelteComponent({ componentName, scriptPath, cssPath, props = {} }) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Generate a unique mount ID based on the component name
    const mountId = `injected-root-${componentName.toLowerCase()}`;

    // Remove existing instance if present
    await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (id) => {
            const existing = document.getElementById(id);
            if (existing) existing.remove();
        },
        args: [mountId]
    });

    // Inject styles dynamically
    if (cssPath) {
        await chrome.scripting.insertCSS({
            target: { tabId: tab.id },
            files: [cssPath]
        });
    }

    // Inject the component script dynamically
    await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: [scriptPath]
    });

    // Mount the component dynamically
    await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (id, componentName, props) => {
            const mountEl = document.createElement('div');
            mountEl.id = id;
            document.body.insertBefore(mountEl, document.body.firstChild);
            
            // Ensure the component is properly registered in window
            const ComponentClass = window[componentName]; 
            if (ComponentClass) {
                new ComponentClass({ 
                    target: mountEl,
                    props
                });
            } else {
                console.error(`Component ${componentName} not found on window object.`);
            }
        },
        args: [mountId, componentName, props]
    });
}
