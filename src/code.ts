// Figma API tiplerini kullanmak için gerekli tanımlamalar
// __html__ değişkeni Figma tarafından otomatik olarak enjekte edilir
// Bu satırı kaldırıyoruz çünkü zaten tanımlanmış
// declare const __html__: string;

figma.showUI(__html__, { width: 400, height: 295 });

figma.ui.onmessage = async (msg: { type: string; url?: string }) => {
  if (msg.type === 'extract') {
    const url: string = msg.url || '';
    try {
      // Websitesinin HTML içeriğini çekiyoruz.
      // NOT: CORS kısıtlamaları nedeniyle sorun yaşayabilirsiniz. Gerekirse bir proxy kullanmayı düşünün.
      const response = await fetch(url);
      const html = await response.text();

      // Renk bilgilerini çıkarmak için basit bir regex (hex renk kodları)
      const colorRegex = /#(?:[0-9a-fA-F]{3}){1,2}\b/g;
      const colors = html.match(colorRegex) || [];

      // Typography bilgileri için font-family ve font-size araması (basit örnek)
      const fontFamilyRegex = /font-family\s*:\s*([^;"}]+)/gi;
      const fontSizeRegex = /font-size\s*:\s*([^;"}]+)/gi;

      let fonts: string[] = [];
      let fontSizes: string[] = [];

      let match;
      while ((match = fontFamilyRegex.exec(html)) !== null) {
        fonts.push(match[1].trim());
      }

      while ((match = fontSizeRegex.exec(html)) !== null) {
        fontSizes.push(match[1].trim());
      }

      // Çıkarılan verileri tekrardan tekrarsız hale getiriyoruz.
      const result = {
        colors: Array.from(new Set(colors)),
        fonts: Array.from(new Set(fonts)),
        fontSizes: Array.from(new Set(fontSizes))
      };

      // Sonuçları UI'ye gönderiyoruz.
      figma.ui.postMessage({ type: 'result', data: result });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      figma.ui.postMessage({ type: 'error', message: errorMessage });
    }
  }
};