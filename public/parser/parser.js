async function ParseScript(script, currentUrl) {
    if (!script) {
        return [];
    }

    var lines = script.split('\n');
    var cmdtree = [];
    var stack = [];
    var currentIndentLevel = 0;

    // Extract hostname from the URL for local keyword lookup
    let hostname = '';
    if (currentUrl) {
        try {
            const url = new URL(currentUrl);
            hostname = url.hostname;
            console.log(`Parsing script for hostname: ${hostname}`);
        } catch (error) {
            console.warn("Invalid URL format:", error);
        }
    }

    // Pre-load all keywords (both global and local) for efficient lookups
    const { globalKeywords, pageLocalKeywords } = await loadAllKeywords(hostname);
    console.log(`Loaded ${globalKeywords.length} global keywords and ${pageLocalKeywords.length} local keywords`);

    function addCommand(cmd, indentLevel) {
        while (stack.length > 0 && indentLevel <= stack[stack.length - 1].indentLevel) {
            stack.pop();
        }
        if (stack.length === 0) {
            cmdtree.push(cmd);
        } else {
            stack[stack.length - 1].cmd.subcommands.push(cmd);
        }
        stack.push({ cmd: cmd, indentLevel: indentLevel });
    }

    // Create an array of promises for each line parsing
    let promises = lines.map(async (line, i) => {
        var indentLevel = line.search(/\S|$/); // Find the indentation level
        var cmd = { line: i, code: [], src: line.trim(), timeout: 5000, subcommands: [] };

        // Handle bulleted lists (field/value pairs)
        if (line.trim().startsWith('*')) {
            // This is a field value pair.  ie:  * Field: value
            const fieldValueParts = line.trim().match(/\*[^:]+|:.+/g);
            if (fieldValueParts && fieldValueParts.length >= 2) {
                cmd.code.push('type');
                cmd.code.push(fieldValueParts[1].slice(1).trim());
                cmd.code.push('in');
                cmd.code.push(fieldValueParts[0].slice(1).trim());
                
                // Process for keywords
                await processCommandKeywords(cmd, globalKeywords, pageLocalKeywords);
                
                addCommand(cmd, indentLevel);
                return; // Skip the rest of processing for this line
            }
        }
        
        // Regular parsing for non-bulleted items
        var stmt = line.trim().match(/\w+|'[^']+'|"[^"]+"|\{\{(.*?)\}\}|\*|:/g); // Tokenize line
        if (stmt) {
            await parseStatement(stmt, cmd);
            
            // Process for keywords after parsing the statement
            await processCommandKeywords(cmd, globalKeywords, pageLocalKeywords);
            
            addCommand(cmd, indentLevel);
        }
    });

    // Wait for all the parsing promises to complete
    await Promise.all(promises);
    
    return cmdtree;
}

// Helper function to load all keywords from storage
async function loadAllKeywords(hostname) {
    return new Promise((resolve) => {
        chrome.storage.local.get(["globalKeywords", "localKeywords"], function(result) {
            const globalKeywords = result.globalKeywords || [];
            const localKeywords = result.localKeywords || {};
            
            // Get local keywords for the current hostname
            const pageLocalKeywords = hostname ? (localKeywords[hostname] || []) : [];
            
            resolve({ globalKeywords, pageLocalKeywords });
        });
    });
}

async function parseStatement(stmt, cmd) {
    for (var j = 0; j < stmt.length; j++) {
        var z = stmt[j].charAt(0);
        if (z === '{' || z === '"' || z === '\'') {
            cmd.code.push(stmt[j]);
        } else {
            var candidate = stmt[j].toLowerCase();
            switch (candidate) {
                // verbs
                case 'click':
                    cmd.code.push(candidate);
                    cmd.code.push('in');
                    break;
                case 'type':
                case 'capture':
                case 'test':
                case 'open':
                case 'wait':  // Handle the 'wait' command
                    cmd.code.push(candidate);
                    if (candidate === 'wait' && stmt[j + 1]) {
                        cmd.code.push(stmt[j + 1]);  // Add the wait duration
                        j++;  // Skip the next token as it has been added as wait duration
                    }
                    break;
                case 'switch':
                case 'navigate':
                    cmd.code.push(candidate);
                    break;
                case 'press':
                    cmd.code.push(candidate);
                    break;
                // nouns
                case 'button':
                case 'close':
                case 'autocomplete':
                case 'ok':
                case 'save':
                    cmd.code.push(candidate);
                    break;
                case 'on':
                case 'in':
                case 'into':
                    // Check if previous token is already 'in' - if so, skip adding it again
                    if (cmd.code.length && cmd.code[cmd.code.length - 1] !== 'in') {
                        cmd.code.push('in');
                    }
                    break;
                case 'under':
                    cmd.code.push('under');
                    break;
                case 'mouseover':
                    cmd.code.push('mouseover');
                    break;
                case 'verify':
                    cmd.code.push('verify');
                    
                    // Parse verification statement
                    parseVerificationStatement(cmd.src.trim(), cmd);
                    break;
                case 'select':
                    cmd.code.push('select');
                    break;
            }
        }
    }
}

/**
 * Parse verification statements and extract verification properties
 * @param {string} verifyStatement - The full verification statement to parse
 * @param {object} cmd - The command object to update with verification properties
 */
function parseVerificationStatement(verifyStatement, cmd) {
    // Initialize verification properties
    cmd.verifyType = null;
    cmd.verifyOperator = null;
    cmd.verifyExpected = null;
    cmd.verifyLocator = null;
    
    console.log("Parsing verification statement:", verifyStatement);
    
    // For text verification (most common)
    // Example: verify text equals "Welcome" in "#header"
    const textVerifyRegex = /verify\s+(?:that\s+)?(?:the\s+)?text(?:\s+of\s+([^]+?))?\s+(equals|contains|starts\s+with|ends\s+with)\s+["']([^"']+)["']\s*(?:in\s+["']([^"']+)["'])?/i;
    let match = verifyStatement.match(textVerifyRegex);
    
    if (match) {
        cmd.verifyType = 'text';
        cmd.verifyTarget = match[1] || null;
        cmd.verifyOperator = match[2].replace(/\s+/g, '_');
        cmd.verifyExpected = match[3];
        cmd.verifyLocator = match[4] || null;
        
        // Update the code array with the correct format
        if (cmd.verifyLocator) {
            // Make sure we don't have duplicate "in" entries
            const inIndex = cmd.code.indexOf("in");
            if (inIndex > -1) {
                // Remove all elements after "in" (including "in" itself)
                cmd.code = cmd.code.slice(0, inIndex);
            }
            
            // Add the correct locator
            cmd.code.push("in");
            cmd.code.push(`"${cmd.verifyLocator}"`);
        }
        
        console.log("Parsed text verification:", {
            type: cmd.verifyType,
            operator: cmd.verifyOperator,
            expected: cmd.verifyExpected,
            locator: cmd.verifyLocator
        });
        
        return;
    }
    
    // For attribute verification
    // Example: verify value equals "John" in "input[name='firstname']"
    const attrVerifyRegex = /verify\s+(?:that\s+)?(?:the\s+)?(value|placeholder)(?:\s+of\s+([^]+?))?\s+(equals|contains|starts\s+with|ends\s+with)\s+["']([^"']+)["']\s*(?:in\s+["']([^"']+)["'])?/i;
    match = verifyStatement.match(attrVerifyRegex);
    
    if (match) {
        cmd.verifyType = match[1].toLowerCase();
        cmd.verifyTarget = match[2] || null;
        cmd.verifyOperator = match[3].replace(/\s+/g, '_');
        cmd.verifyExpected = match[4];
        cmd.verifyLocator = match[5] || null;
        
        // Update the code array
        if (cmd.verifyLocator) {
            const inIndex = cmd.code.indexOf("in");
            if (inIndex > -1) {
                cmd.code = cmd.code.slice(0, inIndex);
            }
            
            cmd.code.push("in");
            cmd.code.push(`"${cmd.verifyLocator}"`);
        }
        
        console.log("Parsed attribute verification:", {
            type: cmd.verifyType,
            operator: cmd.verifyOperator,
            expected: cmd.verifyExpected,
            locator: cmd.verifyLocator
        });
        
        return;
    }
    
    // For state verification
    // Example: verify state is visible in "#submit-button"
    const stateVerifyRegex = /verify\s+(?:that\s+)?(?:the\s+)?state(?:\s+of\s+([^]+?))?\s+is\s+(visible|enabled|checked|disabled|hidden)\s*(?:in\s+["']([^"']+)["'])?/i;
    match = verifyStatement.match(stateVerifyRegex);
    
    if (match) {
        cmd.verifyType = 'state';
        cmd.verifyTarget = match[1] || null;
        cmd.verifyOperator = 'is';
        cmd.verifyExpected = match[2].toLowerCase();
        cmd.verifyLocator = match[3] || null;
        
        // Update the code array
        if (cmd.verifyLocator) {
            const inIndex = cmd.code.indexOf("in");
            if (inIndex > -1) {
                cmd.code = cmd.code.slice(0, inIndex);
            }
            
            cmd.code.push("in");
            cmd.code.push(`"${cmd.verifyLocator}"`);
        }
        
        console.log("Parsed state verification:", {
            type: cmd.verifyType,
            operator: cmd.verifyOperator,
            expected: cmd.verifyExpected,
            locator: cmd.verifyLocator
        });
        
        return;
    }
    
    // For page verification
    // Example: verify title equals "Dashboard"
    const pageVerifyRegex = /verify\s+(?:that\s+)?(?:the\s+)?(title|url)\s+(equals|contains|starts\s+with|ends\s+with)\s+["']([^"']+)["']/i;
    match = verifyStatement.match(pageVerifyRegex);
    
    if (match) {
        cmd.verifyType = match[1].toLowerCase();
        cmd.verifyOperator = match[2].replace(/\s+/g, '_');
        cmd.verifyExpected = match[3];
        
        console.log("Parsed page verification:", {
            type: cmd.verifyType,
            operator: cmd.verifyOperator,
            expected: cmd.verifyExpected
        });
        
        return;
    }
    
    // If we got here, we couldn't parse the verification statement properly
    console.warn("Could not parse verification statement:", verifyStatement);
    
    // Default fallback
    cmd.code.push('in');
}

// Process a command for keyword replacements
async function processCommandKeywords(cmd, globalKeywords, pageLocalKeywords) {
    // Find the "in" clause in the command
    const inClauseIndex = cmd.code.indexOf('in');
    if (inClauseIndex === -1 || inClauseIndex + 1 >= cmd.code.length) {
        return; // No "in" clause or nothing after it
    }
    
    // Get the target element reference (might be a keyword)
    let targetRef = cmd.code[inClauseIndex + 1];
    
    // Remove quotes if present
    if ((targetRef.startsWith('"') && targetRef.endsWith('"')) || 
        (targetRef.startsWith("'") && targetRef.endsWith("'"))) {
        targetRef = targetRef.slice(1, -1);
    }
    
    // Check if it's already an xpath (starts with /)
    if (targetRef.startsWith('/')) {
        return; // Already an XPath, no need to process
    }
    
    // First check local keywords
    let foundKeyword = pageLocalKeywords.find(kw => kw.keyword === targetRef);
    
    // If not found in local, check global
    if (!foundKeyword) {
        foundKeyword = globalKeywords.find(kw => kw.keyword === targetRef);
    }
    
    if (foundKeyword) {
        console.log(`Found keyword "${targetRef}": ${foundKeyword.xpath}`);
        
        if (foundKeyword.hasVariable) {
            // Handle variable substitution
            const variables = cmd.code.filter(str => 
                (str.startsWith('"') && str.endsWith('"')) || 
                (str.startsWith("'") && str.endsWith("'"))
            ).map(str => str.slice(1, -1));
            
            let updatedXpath = foundKeyword.xpath;
            
            // For 'type' commands, skip the first variable (it's the input value)
            const relevantVariables = (cmd.code[0] === "type" || cmd.code[0] === "verify" || cmd.code[0] === "select") 
                ? variables.slice(1) 
                : variables;
            
            relevantVariables.forEach(variable => {
                updatedXpath = updatedXpath.replace('{$}', "'" + variable + "'");
            });
            
            // Update the command with the substituted XPath
            cmd.code[inClauseIndex + 1] = updatedXpath;
        } else {
            // Simple replacement with the XPath
            cmd.code[inClauseIndex + 1] = foundKeyword.xpath;
        }
    } else {
        console.log(`No keyword found for "${targetRef}"`);
    }
}

export { ParseScript };