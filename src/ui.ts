const websiteUrlInput = document.getElementById('websiteUrl') as HTMLInputElement;
const extractBtn = document.getElementById('extractBtn') as HTMLButtonElement;
const output = document.getElementById('output') as HTMLPreElement;

extractBtn.addEventListener('click', () => {
  const url = websiteUrlInput.value;
  if (url) {
    // Ana koda URL bilgisini gönderiyoruz.
    parent.postMessage({ pluginMessage: { type: 'extract', url } }, '*');
  }
});

// Ana koddan gelecek mesajları dinliyoruz.
onmessage = (event) => {
  const msg = event.data.pluginMessage;
  if (msg.type === 'result') {
    output.textContent = JSON.stringify(msg.data, null, 2);
  } else if (msg.type === 'error') {
    output.textContent = `Hata: ${msg.message}`;
  }
};