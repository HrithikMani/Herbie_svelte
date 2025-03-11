console.log("Tracking user interactions...");

// Initialize storage for user actions if not present
chrome.storage.local.get({ userActions: [] }, (result) => {
    if (!result.userActions) {
        chrome.storage.local.set({ userActions: [] });
    }
});

// Track button, link, and span/div clicks
document.addEventListener("click", (event) => {
    let target = event.target;
    let tagName = target.tagName.toLowerCase();
    let identifier = getElementIdentifier(target);

    if (["button", "a", "span", "div"].includes(tagName) || target.hasAttribute("onclick")) {
        let actionData = {
            action: "userClick",
            type: tagName,
            text: target.innerText.trim() || target.value || target.getAttribute("href"),
            identifier: identifier,
            timestamp: new Date().toISOString(),
        };
        storeUserAction(actionData);
    }
});

// Track input focus
document.addEventListener("focus", (event) => {
    let target = event.target;
    if (["input", "textarea"].includes(target.tagName.toLowerCase())) {
        let identifier = getElementIdentifier(target);
        let actionData = {
            action: "userFocus",
            type: "input",
            name: target.name || null,
            placeholder: target.placeholder || null,
            identifier: identifier,
            timestamp: new Date().toISOString(),
        };
        storeUserAction(actionData);
    }
}, true);

// Track input changes (without duplicates)
document.addEventListener("input", (event) => {
    let target = event.target;
    if (["input", "textarea"].includes(target.tagName.toLowerCase())) {
        let identifier = getElementIdentifier(target);

        chrome.storage.local.get({ userActions: [] }, (result) => {
            let userActions = result.userActions || [];

            // Check if an input change for this element already exists
            let existingIndex = userActions.findIndex(
                (action) => action.action === "userInput" && action.identifier === identifier
            );

            let actionData = {
                action: "userInput",
                type: "input",
                name: target.name || null,
                value: target.value,
                identifier: identifier,
                timestamp: new Date().toISOString(),
            };

            if (existingIndex !== -1) {
                // Update the existing entry
                userActions[existingIndex] = actionData;
            } else {
                // Add new entry
                userActions.push(actionData);
            }

            chrome.storage.local.set({ userActions: userActions }, () => {
                console.log("Updated user action:", actionData);
            });
        });
    }
});

// Function to store user actions (prevents duplicates)
function storeUserAction(action) {
    chrome.storage.local.get({ userActions: [] }, (result) => {
        let userActions = result.userActions || [];

        // Check if this action already exists
        let existingIndex = userActions.findIndex(
            (a) => a.action === action.action && a.identifier === action.identifier
        );

        if (existingIndex === -1) {
            // Add new action if it doesn't exist
            userActions.push(action);
        }

        chrome.storage.local.set({ userActions: userActions }, () => {
            console.log("Stored user action:", action);
        });
    });
}

// Function to get a simplified identifier for an element
function getElementIdentifier(element) {
    if (element.id) return `#${element.id}`;
    if (element.name) return `[name='${element.name}']`;
    if (element.className && typeof element.className === "string") {
        let classList = element.className.split(" ").filter((c) => c.trim() !== "").join(".");
        return `.${classList}`;
    }
    return element.tagName.toLowerCase();
}
