console.log('UI TypeScript dosyası yüklendi!');

const websiteUrlInput = document.getElementById('websiteUrl') as HTMLInputElement;
const extractBtn = document.getElementById('extractBtn') as HTMLButtonElement;

extractBtn.addEventListener('click', () => {
  window.console.log('===== GET STYLES BUTTON CLICKED! =====');
  console.log('Get Styles button clicked!');
  
  const url = websiteUrlInput.value;
  if (url) {
    // Ana koda URL bilgisini gönderiyoruz.
    parent.postMessage({ pluginMessage: { type: 'extract', url } }, '*');
  } else {
    console.log('URL boş, lütfen bir URL girin.');
    alert('Lütfen bir URL girin.');
  }
});