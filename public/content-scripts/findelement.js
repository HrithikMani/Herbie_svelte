async function find_element(desc, retries = 3, delay = 1000) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            // Attempt to find the element
            return await new Promise((resolve, reject) => {
                try {
                    // Try finding the element using XPath
                    const xpathResult = document.evaluate(
                        desc,
                        document,
                        null,
                        XPathResult.FIRST_ORDERED_NODE_TYPE,
                        null
                    );

                    if (xpathResult.singleNodeValue) {
                        console.log("XPath result found:", xpathResult.singleNodeValue);
                        resolve(xpathResult.singleNodeValue); // Return the DOM element
                        return;
                    } else {
                        console.warn("Element not found for XPath:", desc);
                    }

                    // Fallbacks if XPath fails
                    let el = null;

                    // Normalize description to be case-insensitive
                    const originalDesc = desc;
                    desc = desc.toLowerCase();

                    // 1. Try finding a label with text matching the description
                    el = Array.from(document.querySelectorAll('label')).find((label) =>
                        label.textContent.trim().toLowerCase().includes(desc)
                    );
                    if (el) {
                        const forAttr = el.getAttribute('for');
                        if (forAttr) {
                            el = document.getElementById(forAttr);
                        }
                        if (el) {
                            console.log("Found element using label:", el);
                            resolve(el);
                            return;
                        }
                    }

                    // 2. Look for buttons containing the description
                    el = Array.from(document.querySelectorAll('button')).find((button) =>
                        button.textContent.trim().toLowerCase().includes(desc)
                    );
                    if (el) {
                        console.log("Found element using button text:", el);
                        resolve(el);
                        return;
                    }

                    // 3. Look for links (anchor tags) containing the description
                    el = Array.from(document.querySelectorAll('a')).find((link) =>
                        link.textContent.trim().toLowerCase().includes(desc)
                    );
                    if (el) {
                        console.log("Found element using link text:", el);
                        resolve(el);
                        return;
                    }

                    // 4. Try using the description as a CSS selector
                    try {
                        el = document.querySelector(desc);
                        if (el) {
                            console.log("Found element using CSS selector:", el);
                            resolve(el);
                            return;
                        }
                    } catch (e) {
                        console.warn("Invalid CSS selector:", desc);
                    }

                    // Log final failure
                    console.error(`Failed to find element for description: "${originalDesc}"`);
                    reject(new Error(`Element not found for description: "${originalDesc}"`));
                } catch (e) {
                    console.error("Error in find_element:", e);
                    reject(e);
                }
            });
        } catch (error) {
            console.warn(`Attempt ${attempt} failed: ${error.message}`);
            if (attempt < retries) {
                console.log(`Retrying in ${delay}ms...`);
                await new Promise((resolve) => setTimeout(resolve, delay));
            } else {
                throw new Error(`All ${retries} attempts failed to find element: ${desc}`);
            }
        }
    }
}
