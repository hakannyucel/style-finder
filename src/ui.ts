const websiteUrlInput = document.getElementById('websiteUrl') as HTMLInputElement;
const extractBtn = document.getElementById('extractBtn') as HTMLButtonElement;

extractBtn.addEventListener('click', () => {
  const url = websiteUrlInput.value;
  if (url) {
    // Sending URL information to the main code.
    parent.postMessage({ pluginMessage: { type: 'extract', url } }, '*');
  } else {
    alert('Please enter a URL.');
  }
});