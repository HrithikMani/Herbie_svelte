async function ParseScript(script, currentUrl) {
    if (!script) {
        return [];
    }
    
    var lines = script.split('\n');
    var cmdtree = [];
    var stack = [];
    var currentIndentLevel = 0;

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
        var indentLevel = line.search(/\S|$/); // Find indentation level
        var cmd = { line: i, code: [], src: line.trim(), timeout: 5000, subcommands: [] }; // Maintain original timeout of 5000
        
        // Handle bulleted lists (field/value pairs) as in original parser
        if (line.trim().startsWith('*')) {
            // This is a field value pair.  ie:  * Field: value
            const fieldValueParts = line.trim().match(/\*[^:]+|:.+/g);
            if (fieldValueParts && fieldValueParts.length >= 2) {
                cmd.code.push('type');
                cmd.code.push(fieldValueParts[1].slice(1).trim());
                cmd.code.push('in');
                cmd.code.push(fieldValueParts[0].slice(1).trim());
                addCommand(cmd, indentLevel);
                return; // Skip the rest of processing for this line
            }
        }
        
        // Regular parsing for non-bulleted items
        var stmt = line.trim().match(/\w+|'[^']+'|"[^"]+"|\{\{(.*?)\}\}|\*|:/g); // Tokenize line
        if (stmt) {
            await parseStatement(stmt, cmd, currentUrl);
            addCommand(cmd, indentLevel);
        }
    });

    // Wait for all the parsing promises to complete
    await Promise.all(promises);
    
    return cmdtree;
}

async function parseStatement(stmt, cmd, currentUrl) {
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
                    cmd.code.push('in');
                    var sentence = cmd.src;
                    var verifyRegex = /^verify\s+that\s+the\s+(?<property>\w+)\s+of\s+(?<target>[\w\s]+)\s+(?<operator>equals|contains|is)\s+"(?<expectedValue>[^"]+)"$/i;
                    var match = sentence.match(verifyRegex); 
                    cmd.code.push(match[2]);
                    cmd.verify=match;
                    break;
                case 'select':
                    cmd.code.push('select');
                    break;
            }
        }
    }

    // Get hostname from URL for local keywords
    let hostname = '';
    if (currentUrl) {
        try {
            const url = new URL(currentUrl);
            hostname = url.hostname;
        } catch (error) {
            console.warn("Invalid URL format:", error);
        }
    }

    // Find keyword (local first, then global)
    const foundKeyword = await findKeywordWithPriority(cmd.code, hostname);
    
    if (foundKeyword) {
        if (foundKeyword.hasVariable) {
            // Handle variable substitution
            const variables = cmd.code.filter(str => 
                (str.startsWith('"') && str.endsWith('"')) || 
                (str.startsWith("'") && str.endsWith("'"))
            ).map(str => str.slice(1, -1));

            let updatedXpath = foundKeyword.xpath;

            // For 'type' commands, skip the first variable, for others, use all variables
            const relevantVariables = (cmd.code[0] === "type" || cmd.code[0] === "verify" || cmd.code[0] === "select") 
                ? variables.slice(1) 
                : variables;
            
            relevantVariables.forEach(variable => {
                updatedXpath = updatedXpath.replace('{$}', "'" + variable + "'");
            });

            var inclause = cmd.code.indexOf("in");
            if (inclause !== -1 && inclause + 1 < cmd.code.length) {
                cmd.code[inclause + 1] = updatedXpath;
            }
        } else {
            // Simple replacement with no variables
            var inclause = cmd.code.indexOf("in");
            if (inclause !== -1 && inclause + 1 < cmd.code.length) {
                cmd.code[inclause + 1] = foundKeyword.xpath;
            }
        }
    } else {
        console.log("The string does not contain any matching keywords.");
    }
}

// Find a keyword prioritizing local ones first, then falling back to global
async function findKeywordWithPriority(cmdCode, hostname) {
    return new Promise((resolve) => {
        chrome.storage.local.get(["globalKeywords", "localKeywords"], function(result) {
            const globalKeywords = result.globalKeywords || [];
            const localKeywords = result.localKeywords || {};
            
            // Get local keywords for the current hostname
            const pageLocalKeywords = hostname ? (localKeywords[hostname] || []) : [];
            
            // Clean strings for comparison (remove quotes)
            const cleanedCmdCode = cmdCode.map(str => {
                if ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"))) {
                    return str.slice(1, -1);
                }
                return str;
            });
            
            // First try to find a local keyword match
            let foundKeyword = null;
            if (hostname) {
                foundKeyword = pageLocalKeywords.find(item => 
                    cleanedCmdCode.includes(item.keyword)
                );
            }
            
            // If no local keyword found, try global keywords
            if (!foundKeyword) {
                foundKeyword = globalKeywords.find(item => 
                    cleanedCmdCode.includes(item.keyword)
                );
            }
            
            resolve(foundKeyword);
        });
    });
}

export { ParseScript };