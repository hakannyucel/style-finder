// Required definitions to use Figma API types
// __html__ variable is automatically injected by Figma
// We're removing this line because it's already defined

// Only keep this import from colorUtils
import { getColorName } from './colorUtils';

// Interface definition for style data
interface StyleData {
  colors: string[];
  fonts: string[];
  fontSizes: string[];
}

// Variable to store all style information
let extractedStyles: StyleData | null = null;

figma.showUI(__html__, { width: 400, height: 295 });

// Style extraction method
async function extractStylesFromUrl(url: string): Promise<StyleData> {
  if (!url || url.trim() === '') {
    throw new Error('URL cannot be empty');
  }

  // Simple URL format validation
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }

  // CORS proxy list - try another if one fails
  const corsProxies = [
    (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
    (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    (url: string) => `https://cors-anywhere.herokuapp.com/${url}`
  ];
  
  let html = '';
  let lastError: Error | null = null;
  
  // Try each proxy in sequence
  for (let i = 0; i < corsProxies.length; i++) {
    try {
      console.log(`CORS proxy ${i+1} successful:`, corsProxies[i](url));
      const proxyUrl = corsProxies[i](url);
      
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
      
      html = await response.text();
      
      break;
    } catch (error) {
      console.error(`CORS proxy ${i+1} failed:`, error);
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (i === corsProxies.length - 1) {
        throw new Error(`All CORS proxy's failed: ${lastError.message}`);
      }
      
      continue;
    }
  }
  
  if (!html || html.length === 0) {
    throw new Error('HTML content could not be retrieved');
  }

  // Get page title
  const pageTitle = getPageTitleFromHtml(html);

  // Regex for extracting color information (hex color codes)
  const colorRegex = /#(?:[0-9a-fA-F]{3}){1,2}\b/g;
  const colors = html.match(colorRegex) || [];
  
  // Convert all hex colors to uppercase
  const uppercaseHexColors = colors.map(color => ensureHexUppercase(color));

  // Additional regex for RGB and RGBA color codes
  const rgbRegex = /rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)/gi;
  const rgbaRegex = /rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)/gi;
  
  const rgbColors = html.match(rgbRegex) || [];
  const rgbaColors = html.match(rgbaRegex) || [];

  // Convert RGB colors to HEX format
  const convertedRgbColors = rgbColors.map(color => {
    const rgbMatch = color.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i);
    if (rgbMatch) {
      return rgbToHex(parseInt(rgbMatch[1], 10), parseInt(rgbMatch[2], 10), parseInt(rgbMatch[3], 10));
    }
    return color;
  });

  // Convert RGBA colors to HEX format (ignoring alpha)
  const convertedRgbaColors = rgbaColors.map(color => {
    const rgbaMatch = color.match(/rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*[\d.]+\s*\)/i);
    if (rgbaMatch) {
      return rgbToHex(parseInt(rgbaMatch[1], 10), parseInt(rgbaMatch[2], 10), parseInt(rgbaMatch[3], 10));
    }
    return color;
  });

  // Additional checks for CSS color names can be added
  // (black, white, red, etc.)

  // Search for font-family and font-size for typography information
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

  // Combine all colors and remove duplicates
  const allColors = [...uppercaseHexColors, ...convertedRgbColors, ...convertedRgbaColors];

  // Make extracted data unique
  const uniqueColors = [...new Set(allColors)];
  const uniqueFonts = [...new Set(fonts)];
  const uniqueFontSizes = [...new Set(fontSizes)];

  // Create frame from style data
  await createFramesFromStyles({ colors: uniqueColors, fonts: uniqueFonts, fontSizes: uniqueFontSizes }, url, pageTitle);

  return { colors: uniqueColors, fonts: uniqueFonts, fontSizes: uniqueFontSizes };
}

/**
 * Extracts page title from HTML content
 * @param html HTML content
 * @returns Page title or empty string
 */
function getPageTitleFromHtml(html: string): string {
  try {
    // Find title tag
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
    let title = titleMatch ? titleMatch[1] : '';

    // Decode HTML entities
    if (title) {
      title = title.replace(/&amp;/g, '&')
                  .replace(/&lt;/g, '<')
                  .replace(/&gt;/g, '>')
                  .replace(/&quot;/g, '"')
                  .replace(/&#39;/g, "'")
                  .replace(/&nbsp;/g, ' ');
    }

    // Find H1 tag (if title not found)
    if (!title) {
      const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
      title = h1Match ? h1Match[1].replace(/<[^>]+>/g, '') : '';
    }

    // Find meta description (if title and h1 not found)
    if (!title) {
      const metaMatch = html.match(/<meta\s+name=["']description["']\s+content=["'](.*?)["']/i);
      title = metaMatch ? metaMatch[1] : '';
    }

    return title || 'Title not found';
  } catch (error) {
    console.error('Title extraction error:', error);
    return 'Title not found';
  }
}

// Utility function to convert RGB values to uppercase HEX format
function rgbToHex(r: number, g: number, b: number): string {
  // Convert from 0-1 range to 0-255 range if needed
  const rInt = r <= 1 ? Math.round(r * 255) : Math.round(r);
  const gInt = g <= 1 ? Math.round(g * 255) : Math.round(g);
  const bInt = b <= 1 ? Math.round(b * 255) : Math.round(b);
  
  // Convert to hex and ensure 2 digits
  const rHex = rInt.toString(16).padStart(2, '0');
  const gHex = gInt.toString(16).padStart(2, '0');
  const bHex = bInt.toString(16).padStart(2, '0');
  
  // Return uppercase hex code
  return `#${rHex}${gHex}${bHex}`.toUpperCase();
}

// Function to ensure hex codes are uppercase and in 6-digit format
function ensureHexUppercase(hexColor: string): string {
  if (!hexColor.startsWith('#')) return hexColor;
  
  // Convert 3-digit hex (#RGB) to 6-digit format (#RRGGBB)
  if (hexColor.length === 4) {
    hexColor = '#' + 
      hexColor[1] + hexColor[1] + 
      hexColor[2] + hexColor[2] + 
      hexColor[3] + hexColor[3];
  }
  
  return hexColor.toUpperCase();
}

/**
 * @param styleData Extracted style data
 */
async function createFramesFromStyles(styleData: StyleData, url: string, pageTitle: string): Promise<void> {
  try {
    // First load all fonts to be used
    await figma.loadFontAsync({ family: "Inter", style: "Regular" });
    await figma.loadFontAsync({ family: "Inter", style: "Medium" });
    await figma.loadFontAsync({ family: "Inter", style: "Bold" });
    
    // Create main frame
    const mainFrame = figma.createFrame();
    mainFrame.name = "Style Finder";
    mainFrame.resize(1200, 100);
    mainFrame.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
    mainFrame.cornerRadius = 24;
    mainFrame.layoutMode = "VERTICAL";
    mainFrame.primaryAxisSizingMode = "AUTO";
    mainFrame.counterAxisSizingMode = "FIXED";
    mainFrame.itemSpacing = 0;

    // Create title section
    const titleSection = figma.createFrame();
    titleSection.name = "Title Section";
    titleSection.resize(1200, 208);
    titleSection.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
    titleSection.x = 0;
    titleSection.y = 0;
    titleSection.horizontalPadding = 64;
    titleSection.verticalPadding = 64;
    titleSection.strokeWeight = 1;
    titleSection.strokes = [{ type: 'SOLID', color: { r: 0.93, g: 0.93, b: 0.93 } }];
    titleSection.strokeAlign = "INSIDE";

    // Add a tooltip or label showing the HEX color value for the stroke
    const strokeColorHex = rgbToHex(0.93, 0.93, 0.93);
    titleSection.setRelaunchData({ strokeColor: strokeColorHex });

    mainFrame.appendChild(titleSection);

    const titleContainer = figma.createFrame();
    titleContainer.name = "Title Container";
    titleContainer.resize(1072, 80);
    titleContainer.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
    
    // Add a tooltip or label showing the HEX color value for the fill
    const fillColorHex = rgbToHex(1, 1, 1);
    titleContainer.setRelaunchData({ fillColor: fillColorHex });

    titleContainer.x = 0;
    titleContainer.y = 0;
    titleContainer.verticalPadding = 64;
    titleContainer.horizontalPadding = 64;
    titleContainer.itemSpacing = 8;
    titleContainer.layoutMode = "VERTICAL";
    titleContainer.primaryAxisSizingMode = "AUTO";
    titleContainer.counterAxisSizingMode = "AUTO";
    
    titleSection.appendChild(titleContainer);

    const titleText = figma.createFrame();
    titleText.name = "Title Text";
    titleText.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
    titleText.x = 0;
    titleText.y = 0;

    const titleTextTitle = figma.createText();
    titleTextTitle.characters = "Style Finder";
    titleTextTitle.fontSize = 24;
    titleTextTitle.fontName = { family: "Inter", style: "Medium" };
    titleTextTitle.fills = [{ type: 'SOLID', color: { r: 0.07, g: 0.07, b: 0.07 } }];
    
    // Add a tooltip or label showing the HEX color value for the text fill
    const textFillColorHex = rgbToHex(0.07, 0.07, 0.07);
    titleTextTitle.setRelaunchData({ textColor: textFillColorHex });

    titleTextTitle.resize(titleTextTitle.width, titleTextTitle.height);

    titleText.resize(titleTextTitle.width, 32);
    titleText.appendChild(titleTextTitle);
    titleContainer.appendChild(titleText);

    const titleContainer2 = figma.createFrame();
    titleContainer2.name = "Title Container 2";
    titleContainer2.resize(1072, 40);
    titleContainer2.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
    titleContainer2.x = 0;
    titleContainer2.y = 0;
    titleContainer.appendChild(titleContainer2);

    const titleText2Title = figma.createText();
    titleText2Title.characters = pageTitle ? `${pageTitle} Style Guide` : "Style Finder Style Guide";
    titleText2Title.fontSize = 32;
    titleText2Title.fontName = { family: "Inter", style: "Medium" };
    titleText2Title.fills = [{ type: 'SOLID', color: { r: 0.07, g: 0.07, b: 0.07 } }];
    titleText2Title.resize(titleText2Title.width, titleText2Title.height);
    titleContainer2.appendChild(titleText2Title);
    
    const titleText2Title2 = figma.createText();
    titleText2Title2.characters = url;
    titleText2Title2.fontSize = 16;
    titleText2Title2.fontName = { family: "Inter", style: "Medium" };
    titleText2Title2.fills = [{ type: 'SOLID', color: { r: 0.1, g: 0.32, b: 1 } }];
    titleText2Title2.x = 908;
    titleText2Title2.y = 16;
    titleText2Title2.textAlignHorizontal = "RIGHT";
    titleText2Title2.textAlignVertical = "CENTER";
    titleText2Title2.resize(titleText2Title2.width, 24);

    titleContainer2.appendChild(titleText2Title2);

    titleContainer.appendChild(titleContainer2);
    
    // Create a variable to track Y position
    let currentY = titleSection.height;
    
    // Create section for color cards
    if (styleData.colors.length > 0) {
      const colorsSection = figma.createFrame();
      colorsSection.name = "Colors Section";
      colorsSection.layoutMode = "VERTICAL";
      colorsSection.primaryAxisSizingMode = "AUTO";
      colorsSection.counterAxisSizingMode = "AUTO";
      colorsSection.paddingLeft = 64;
      colorsSection.paddingRight = 64;
      colorsSection.paddingTop = 40;
      colorsSection.paddingBottom = 40;
      colorsSection.itemSpacing = 20;
      colorsSection.x = 0;
      colorsSection.y = currentY; // Position below the previous section
      colorsSection.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];

      // Add a new frame named Heading with w: 1072 h: 56 vertical gap: 24 x: 64 y: 64
      const heading = figma.createFrame();
      heading.name = "Heading";
      heading.resize(1072, 56);
      heading.verticalPadding = 24;
      heading.x = 64;
      heading.y = 64;
      colorsSection.appendChild(heading);

      // Add two text elements inside the Heading
      const headingText = figma.createText();
      headingText.characters = "Color Palette";
      headingText.fontSize = 20;
      headingText.fontName = { family: "Inter", style: "Medium" };
      headingText.x = 0;
      headingText.y = 0;
      headingText.resize(1072, 28)
      headingText.fills = [{ type: 'SOLID', color: { r: 0.07, g: 0.07, b: 0.07 } }];
      headingText.lineHeight = { value: 28, unit: "PIXELS" };
      headingText.textAlignVertical = "CENTER";
      headingText.textAlignHorizontal = "LEFT";

      heading.appendChild(headingText);

      const headingText2 = figma.createText();
      headingText2.characters = `${styleData.colors.length} found colors`;
      headingText2.fontSize = 16;
      headingText2.fontName = { family: "Inter", style: "Regular" };
      headingText2.lineHeight = { value: 24, unit: "PIXELS" };
      headingText2.fills = [{ type: 'SOLID', color: { r: 0.07, g: 0.07, b: 0.07 } }];
      headingText2.resize(1072, 24)
      headingText2.x = 0;
      headingText2.y = 32;
      headingText.textAlignVertical = "CENTER";
      headingText.textAlignHorizontal = "LEFT";
      
      heading.appendChild(headingText2);

      const colorCardsSection = figma.createFrame();
      colorCardsSection.name = "Color Cards Section";
      colorCardsSection.x = 64;
      colorCardsSection.y = 144;
      colorCardsSection.layoutAlign = "STRETCH";
      colorCardsSection.primaryAxisAlignItems = "MIN";
      colorCardsSection.layoutMode = "HORIZONTAL";
      colorCardsSection.itemSpacing = 18;
      colorCardsSection.counterAxisSpacing = 18;
      colorCardsSection.layoutWrap = "WRAP";
      colorCardsSection.fills = [];
      colorCardsSection.clipsContent = false;
      colorCardsSection.resize(1072, colorCardsSection.height);
      colorsSection.appendChild(colorCardsSection);

      // Create a card for each color - Show maximum 5 colors, may need scrollable view for more
      for (let i = 0; i < styleData.colors.length; i++) {
        const colorCard = figma.createFrame();
        colorCard.name = `Color Card ${i + 1}`;
        colorCard.resize(200, 210);
        colorCard.cornerRadius = 16;
        colorCard.verticalPadding = 4;
        colorCard.horizontalPadding = 4;
        colorCard.itemSpacing = 4;
        colorCard.effects = [{ type: 'DROP_SHADOW', color: {
          r: 0.06, g: 0.1, b: 0.14,
          a: 0.05
        }, offset: { x: 0, y: 1 }, radius: 1, spread: 0, visible: true, blendMode: 'NORMAL' },
        { type: 'DROP_SHADOW', color: {
          r: 0.06, g: 0.1, b: 0.14,
          a: 0.09
        }, offset: { x: 0, y: 0 }, radius: 0, spread: 1, visible: true, blendMode: 'NORMAL' },
        { type: 'DROP_SHADOW', color: {
          r: 0.06, g: 0.1, b: 0.14,
          a: 0.05
        }, offset: { x: 0, y: 2 }, radius: 3, spread: 0, visible: true, blendMode: 'NORMAL' }
      ];

        colorCard.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
        
        // Add a tooltip or label showing the HEX color value for the shadow
        const shadowColorHex = rgbToHex(0.06, 0.1, 0.14);
        colorCard.setRelaunchData({ shadowColor: shadowColorHex });
        
        // Add color sample
        const colorSample = figma.createFrame();
        colorSample.name = `Color Sample ${i + 1}`;
        colorSample.resize(192, 98);
        colorSample.x = 4;
        colorSample.y = 4;
        colorSample.cornerRadius = 12;
        colorSample.verticalPadding = 8;
        
        // Parse and apply color value
        const colorValue = styleData.colors[i];
        let colorFill: RGB = { r: 0.95, g: 0.98, b: 0.99 }; // Default color
        let hexColorValue = "";
        
        // If it's a HEX color code
        if (colorValue.startsWith('#')) {
          const hex = colorValue.replace('#', '');
          if (hex.length === 3) {
            const r = parseInt(hex[0] + hex[0], 16) / 255;
            const g = parseInt(hex[1] + hex[1], 16) / 255;
            const b = parseInt(hex[2] + hex[2], 16) / 255;
            colorFill = { r, g, b };
            // Convert 3-digit hex to 6-digit format
            const expandedHex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
            hexColorValue = `#${expandedHex}`.toUpperCase();
          } else if (hex.length === 6) {
            const r = parseInt(hex.slice(0, 2), 16) / 255;
            const g = parseInt(hex.slice(2, 4), 16) / 255;
            const b = parseInt(hex.slice(4, 6), 16) / 255;
            colorFill = { r, g, b };
            hexColorValue = `#${hex}`.toUpperCase();
          }
        }
        // If it's an RGB color code
        else if (colorValue.startsWith('rgb')) {
          const rgbMatch = colorValue.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i);
          if (rgbMatch) {
            const r = parseInt(rgbMatch[1], 10) / 255;
            const g = parseInt(rgbMatch[2], 10) / 255;
            const b = parseInt(rgbMatch[3], 10) / 255;
            colorFill = { r, g, b };
            hexColorValue = rgbToHex(parseInt(rgbMatch[1], 10), parseInt(rgbMatch[2], 10), parseInt(rgbMatch[3], 10));
          }
        }
        
        colorSample.fills = [{ type: 'SOLID', color: colorFill }];
        colorCard.appendChild(colorSample);
        
        // Get the hex color value
        const hexValue = hexColorValue || rgbToHex(colorFill.r, colorFill.g, colorFill.b);
        
        // Get the color name from the hex code
        const colorName = getColorName(hexValue);
        
        // Add text showing the color name
        const colorNameText = figma.createText();
        colorNameText.characters = colorName;
        colorNameText.fontSize = 16;
        colorNameText.fontName = { family: "Inter", style: "Medium" };
        colorNameText.x = 10;
        colorNameText.y = 110;
        colorNameText.textAlignHorizontal = "LEFT";
        colorCard.appendChild(colorNameText);
        
        // Add text showing the color value in HEX format
        const colorText = figma.createText();
        colorText.characters = hexValue;
        colorText.fontSize = 14;
        colorText.fontName = { family: "Inter", style: "Regular" };
        colorText.x = 10;
        colorText.y = 130; // Increased Y position to make room for the name
        colorText.textAlignHorizontal = "LEFT";
        colorCard.appendChild(colorText);
        
        colorCardsSection.appendChild(colorCard);
      }
      
      colorCardsSection.resize(1072, colorCardsSection.height);
      colorCardsSection.counterAxisSizingMode = "AUTO";
      colorsSection.resize(1200, colorsSection.height);
      mainFrame.appendChild(colorsSection);
      
      // Update Y position
      currentY += colorsSection.height;
    }

    // Focus on the created main frame
    figma.currentPage.appendChild(mainFrame);
    figma.viewport.scrollAndZoomIntoView([mainFrame]);
    
    // Completion notification
    figma.notify('Style Guide created!', { timeout: 3000 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log('Error occurred:', errorMessage);
    
    // Send error details to UI
    figma.ui.postMessage({ 
      type: 'error', 
      message: errorMessage,
      details: error instanceof Error ? error.stack : 'No details'
    });
    
    // Show error notification
    figma.notify("Error: " + errorMessage, { error: true });
  }
}

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'log') {
    console.log(msg.text); // Log message from UI to console
  }
  else if (msg.type === 'extract') {
    figma.notify("Getting styles from website...", { timeout: 1000 });
    
    const url = msg.url;
    
    // Send error message if URL is empty
    if (!url) {
      figma.ui.postMessage({ type: 'validation-error', message: 'URL cannot be empty' });
      return;
    }

    try {
      // Extract styles from URL
      extractedStyles = await extractStylesFromUrl(url);
      
      // Send results to UI
      figma.ui.postMessage({ type: 'result', data: extractedStyles });
      figma.notify("Styles extracted successfully!", { timeout: 2000 });
    } catch (error: unknown) {
      console.error('Error extracting styles:', error);
      
      // Send error message to UI
      figma.ui.postMessage({ 
        type: 'error', 
        message: error instanceof Error ? error.message : String(error),
        details: error instanceof Error ? error.stack : 'No details available'
      });
      
      // Show error notification
      figma.notify("Error extracting styles: " + (error instanceof Error ? error.message : String(error)), { error: true });
    }
  }
};