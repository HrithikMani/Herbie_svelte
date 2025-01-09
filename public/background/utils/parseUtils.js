import { ParseScript } from '../../parser/parser.js';

export async function handleParseLine(scriptContent, sendResponse) {
  try {
    // Select the first line from the input
    const firstLine = scriptContent.split('\n')[0].trim();
    console.log('Parsing single line:', firstLine);

    // Parse the first line
    const result = await ParseScript(firstLine);
    console.log('Parsed result:', result);

    // Send success response
    sendResponse({ status: 'success', data: result });
  } catch (error) {
    console.error('Error parsing line:', error);
    sendResponse({ status: 'error', message: 'Failed to parse line', error: error.message });
  }
}

export async function handleParseScript(scriptContent, sendResponse) {
  try {
    console.log('Parsing entire script:', scriptContent);

    // Pass the entire script to ParseScript
    const result = await ParseScript(scriptContent);
    console.log('Parsed script result:', result);

    // Send success response
    sendResponse({ status: 'success', data: result });
  } catch (error) {
    console.error('Error parsing script:', error);
    sendResponse({ status: 'error', message: 'Failed to parse script', error: error.message });
  }
}
