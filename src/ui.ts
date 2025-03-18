const websiteUrlInput = document.getElementById('websiteUrl') as HTMLInputElement;
const extractBtn = document.getElementById('extractBtn') as HTMLButtonElement;
const loadingSpinner = document.getElementById('loadingSpinner') as HTMLSpanElement;


// Handle extract button click
extractBtn.addEventListener('click', () => {
  const url = websiteUrlInput.value;
  if (url) {
    // Show loading state
    loadingSpinner.style.display = 'inline-block';
    extractBtn.disabled = true;
    websiteUrlInput.disabled = true;
    
    // Sending URL information to the main code
    parent.postMessage({ pluginMessage: { type: 'extract-styles', url } }, '*');
  }
});

// Listen for messages from the plugin
window.onmessage = (event) => {
  const message = event.data.pluginMessage;
  
  if (message && message.type === 'extract-complete') {
    // Reset UI
    loadingSpinner.style.display = 'none';
    extractBtn.disabled = false;
    websiteUrlInput.disabled = false;
  } else if (message && message.type === 'extract-error') {
    // Reset UI state completely
    loadingSpinner.style.display = 'none';
    extractBtn.disabled = false;
    websiteUrlInput.disabled = false;
  } else if (message && message.type === 'validation-error') {
    // Validation error - highlight input with red border
    websiteUrlInput.style.border = '1px solid #FF4545';
    
    // Reset border after 2 seconds
    setTimeout(() => {
      websiteUrlInput.style.border = '1px solid #363636';
    }, 2000);
  }
};