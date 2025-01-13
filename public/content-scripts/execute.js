async function execute(operation, element, delay, value = null) {
    return new Promise((resolve) => {
        if (operation === 'wait') {
            delay = element;
        }

        setTimeout(() => {
            switch (operation) {
                case 'click':
                    if (element) {
                        console.log("Clicking element");
                        console.log(element);
                        simulijs.simulateClick(element);
                    } else {
                        console.error("Element is required for 'click' operation.");
                    }
                    break;

                case 'wait':
                    console.log("Waiting for " + delay + " ms");
                    break;

                case 'press':
                case 'type': // Same logic as 'press'
                    if (element) {
                        if (value !== null && value !== undefined) {
                            console.log(`Entering "${value}" into the element`);
                            console.log(element);
                            simulijs.simulateFocus(element, function () {
                                simulijs.simulateKeyPress(element, value);
                            });
                        } else {
                            console.error(
                                `Value is required for '${operation}' operation.`
                            );
                        }
                    } else {
                        console.error(
                            "Element is required for 'press' or 'type' operation."
                        );
                    }
                    break;

                case 'navigate':
                    if (value) {
                        console.log(`Navigating to URL: ${value}`);
                        window.location.href = value;
                    } else {
                        console.error("Value (URL) is required for 'navigate' operation.");
                    }
                    break;

                case 'verify':
                    // Placeholder for future functionality
                    console.log("Verification logic will be implemented later.");
                    break;

                default:
                    console.error(`Unknown operation: ${operation}`);
            }

            resolve(); // Resolve after the operation
        }, delay);
    });
}
