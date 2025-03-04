// Figma API tiplerini kullanmak için gerekli tanımlamalar
// __html__ değişkeni Figma tarafından otomatik olarak enjekte edilir
// Bu satırı kaldırıyoruz çünkü zaten tanımlanmış
// declare const __html__: string;

// Stil verileri için interface tanımlıyoruz
interface StyleData {
  colors: string[];
  fonts: string[];
  fontSizes: string[];
}

// Tüm stil bilgilerini depolayacak değişken
let extractedStyles: StyleData | null = null;

figma.showUI(__html__, { width: 400, height: 295 });

// Stil çıkarma metodu
async function extractStylesFromUrl(url: string): Promise<StyleData> {
  if (!url || url.trim() === '') {
    throw new Error('URL boş olamaz');
  }

  // URL formatı basit doğrulama
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }

  console.log('Fetch işlemi başlatılıyor:', url);
  
  // CORS proxy listesi - birisi başarısız olursa diğerini dene
  const corsProxies = [
    (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
    (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    (url: string) => `https://cors-anywhere.herokuapp.com/${url}`
  ];
  
  let html = '';
  let lastError: Error | null = null;
  
  // Her proxy'yi sırayla dene
  for (let i = 0; i < corsProxies.length; i++) {
    try {
      const proxyUrl = corsProxies[i](url);
      console.log(`CORS proxy ${i+1} deneniyor:`, proxyUrl);
      
      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml',
          'User-Agent': 'Mozilla/5.0 Figma Plugin'
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      console.log('Fetch başarılı, status:', response.status);
      html = await response.text();
      console.log('HTML içeriği alındı, uzunluk:', html.length);
      
      // Başarılı olduysa döngüden çık
      break;
    } catch (error) {
      console.error(`CORS proxy ${i+1} başarısız:`, error);
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Son proxy'yi denedik ve başarısız olduysa
      if (i === corsProxies.length - 1) {
        throw new Error(`Tüm CORS proxy'ler başarısız oldu: ${lastError.message}`);
      }
      
      // Diğer proxy'yi dene
      continue;
    }
  }
  
  if (!html || html.length === 0) {
    throw new Error('HTML içeriği alınamadı');
  }

  // Renk bilgilerini çıkarmak için regex (hex renk kodları)
  const colorRegex = /#(?:[0-9a-fA-F]{3}){1,2}\b/g;
  const colors = html.match(colorRegex) || [];
  console.log('Bulunan hex renk sayısı:', colors.length);

  // RGB ve RGBA renk kodları için ek regex
  const rgbRegex = /rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)/gi;
  const rgbaRegex = /rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)/gi;
  
  const rgbColors = html.match(rgbRegex) || [];
  const rgbaColors = html.match(rgbaRegex) || [];
  console.log('Bulunan RGB renk sayısı:', rgbColors.length);
  console.log('Bulunan RGBA renk sayısı:', rgbaColors.length);

  // CSS renk isimleri için ek kontroller eklenebilir
  // (black, white, red vb.)

  // Typography bilgileri için font-family ve font-size araması
  const fontFamilyRegex = /font-family\s*:\s*([^;"}]+)/gi;
  const fontSizeRegex = /font-size\s*:\s*([^;"}]+)/gi;
  const fontWeightRegex = /font-weight\s*:\s*([^;"}]+)/gi;
  const lineHeightRegex = /line-height\s*:\s*([^;"}]+)/gi;

  let fonts: string[] = [];
  let fontSizes: string[] = [];
  let fontWeights: string[] = [];
  let lineHeights: string[] = [];

  let match;
  while ((match = fontFamilyRegex.exec(html)) !== null) {
    fonts.push(match[1].trim());
  }

  while ((match = fontSizeRegex.exec(html)) !== null) {
    fontSizes.push(match[1].trim());
  }

  while ((match = fontWeightRegex.exec(html)) !== null) {
    fontWeights.push(match[1].trim());
  }

  while ((match = lineHeightRegex.exec(html)) !== null) {
    lineHeights.push(match[1].trim());
  }

  // Tüm renkleri birleştirip tekrarsız hale getiriyoruz
  const allColors = [...colors, ...rgbColors, ...rgbaColors];
  console.log('Toplam tekrarsız renk sayısı:', new Set(allColors).size);

  // Çıkarılan verileri tekrarsız hale getiriyoruz
  const result = {
    colors: Array.from(new Set(allColors)),
    fonts: Array.from(new Set(fonts)),
    fontSizes: Array.from(new Set(fontSizes))
  };
  
  console.log('Extraction tamamlandı:', result);
  return result;
}

figma.ui.onmessage = msg => {
    if (msg.type === 'log') {
      console.log(msg.text); // UI'dan gelen mesajı konsola yazdırma
    }
  };

figma.ui.onmessage = async (msg: { type: string; url?: string }) => {
  if (msg.type === 'extract') {
    // Buton tıklandığında bildirim göster
    figma.notify("Get Styles butonuna tıklandı!");
    console.log("Get Styles butonuna tıklandı!");
    console.log("İşlem başlatılıyor: " + new Date().toLocaleString());
    
    const url: string = msg.url || '';
    
    // URL boşsa, UI'ye bildir ve kırmızı border göster
    if (!url || url.trim() === '') {
      figma.ui.postMessage({ type: 'validation-error', field: 'url' });
      console.log("Hata: URL boş!");
      return;
    }
    
    console.log("İşlenecek URL: " + url);
    
    try {
      // Metodu kullanarak stilleri çıkar
      extractedStyles = await extractStylesFromUrl(url);
      
      // Sonuçları UI'ye gönderiyoruz
      figma.ui.postMessage({ 
        type: 'result', 
        data: extractedStyles 
      });
      
      console.log('Extracted styles:', extractedStyles);
      console.log('İşlem başarıyla tamamlandı: ' + new Date().toLocaleString());
      
      // Başarılı bildirim göster
      figma.notify("Stiller başarıyla çıkarıldı!", { timeout: 2000 });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log('Hata oluştu:', errorMessage);
      
      // Hata detaylarını UI'ye gönder
      figma.ui.postMessage({ 
        type: 'error', 
        message: errorMessage,
        details: error instanceof Error ? error.stack : 'Detay yok'
      });
      
      // Hata bildirimi göster
      figma.notify("Hata: " + errorMessage, { error: true });
      
      extractedStyles = null;
    }
  }
};