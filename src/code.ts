// Required definitions to use Figma API types
/// <reference lib="dom" />

// Import necessary modules
import { fetchStyleData } from './services/apiService';
import { createFramesFromStyles } from './components/MainFrame';
import { StyleData } from './types/StyleData';

// Show UI
figma.showUI(__html__, { width: 400, height: 295 });

// Listen for messages from the UI
figma.ui.onmessage = async (msg) => {
  if (msg.type === 'extract-styles') {
    try {
      figma.notify('Extracting styles from URL...', { timeout: 2000 });
      
      // Get the URL from the message
      const url = msg.url;
    
      if (!url || url.trim() === '') {
        figma.notify('URL cannot be empty', { error: true });
        return;
      }

      // Show loading indicator
      figma.notify('Processing, please wait...', { timeout: 3000 });
      
      // Fetch style data from API
      const { styleData, pageTitle } = await fetchStyleData(url);
      
      // Create frames from the extracted styles
      await createFramesFromStyles(styleData, url, pageTitle);
      
      // Show success message
      figma.notify('Styles extracted successfully!', { timeout: 2000 });
      
      // Signal UI that extraction is complete
      figma.ui.postMessage({ type: 'extract-complete' });
      
    } catch (error) {
      console.error("Error processing styles:", error);
      const errorMessage = (error instanceof Error) ? error.message : String(error);
      
      // Show notification for 5 seconds with the error message
      figma.notify(errorMessage, { error: true, timeout: 5000 });
      
      // Signal UI that extraction failed and to reset the input
      figma.ui.postMessage({ 
        type: 'extract-error', 
        error: errorMessage,
        resetInput: true // Tell the UI to reset the input field to its original state
      });
    }
  } else if (msg.type === 'cancel') {
    // Close the plugin
    figma.closePlugin();
  }
};

// When the plugin is closed
figma.on('close', () => {
  console.log("Plugin closed");
});