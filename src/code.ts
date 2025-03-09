// Required definitions to use Figma API types
// __html__ variable is automatically injected by Figma
// We're removing this line because it's already defined

// Only keep this import from colorUtils
import { getColorName } from './colorUtils';
import headerLogo from './assets/header-logo.svg';
import headerBanner from './assets/header-banner.svg';

// Interface definition for style data
interface StyleData {
  colors: string[];
  fonts: string[];
  fontSizes: string[];
  gradients: string[];
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
  
  // Regex for extracting gradient information
  const linearGradientRegex = /linear-gradient\([^)]+\)/gi;
  const radialGradientRegex = /radial-gradient\([^)]+\)/gi;
  
  const rgbColors = html.match(rgbRegex) || [];
  const rgbaColors = html.match(rgbaRegex) || [];
  const linearGradients = html.match(linearGradientRegex) || [];
  const radialGradients = html.match(radialGradientRegex) || [];
  
  // Combine all gradients and remove duplicates
  const allGradients = [...linearGradients, ...radialGradients];
  const uniqueGradients = [...new Set(allGradients)];

  // Filter gradients to only include those with at least 2 color stops
  const filteredGradients = uniqueGradients.filter(gradient => {
    const colorStops = extractGradientColors(gradient);
    return colorStops.length >= 2; // Only keep gradients with at least 2 color stops
  });

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
  await createFramesFromStyles({ colors: uniqueColors, fonts: uniqueFonts, fontSizes: uniqueFontSizes, gradients: filteredGradients }, url, pageTitle);

  return { colors: uniqueColors, fonts: uniqueFonts, fontSizes: uniqueFontSizes, gradients: filteredGradients };
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

// Function to convert rgba/rgb string to hex
function rgbaToHex(rgbaStr: string): string {
  // Extract the RGB values from the rgba/rgb string
  // Handle both comma and space separated values, and optional spaces
  // Also handle decimal points in alpha values (like .9 instead of 0.9)
  const rgbMatch = rgbaStr.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*(?:[\d]*\.[\d]+|[\d]+))?\s*\)/i);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1], 10);
    const g = parseInt(rgbMatch[2], 10);
    const b = parseInt(rgbMatch[3], 10);
    return rgbToHex(r, g, b);
  }
  
  // If the string doesn't match the pattern but still contains 'rgb', 
  // try to extract just the numbers
  if (rgbaStr.includes('rgb')) {
    const numbers = rgbaStr.match(/\d+/g);
    if (numbers && numbers.length >= 3) {
      const r = parseInt(numbers[0], 10);
      const g = parseInt(numbers[1], 10);
      const b = parseInt(numbers[2], 10);
      return rgbToHex(r, g, b);
    }
  }
  
  return rgbaStr; // Return original if not a valid rgba/rgb string
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

// Function to calculate color brightness (higher value = lighter color)
function getColorBrightness(hexColor: string): number {
  // Ensure the hex color is in the correct format
  hexColor = ensureHexUppercase(hexColor);
  
  // Extract RGB components
  let r, g, b;
  
  if (hexColor.startsWith('#')) {
    const hex = hexColor.replace('#', '');
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length === 6) {
      r = parseInt(hex.slice(0, 2), 16);
      g = parseInt(hex.slice(2, 4), 16);
      b = parseInt(hex.slice(4, 6), 16);
    } else {
      return 0; // Invalid hex
    }
  } else if (hexColor.startsWith('rgb')) {
    const rgbMatch = hexColor.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i);
    if (rgbMatch) {
      r = parseInt(rgbMatch[1], 10);
      g = parseInt(rgbMatch[2], 10);
      b = parseInt(rgbMatch[3], 10);
    } else {
      return 0; // Invalid rgb
    }
  } else {
    return 0; // Unknown format
  }
  
  // Calculate perceived brightness using the formula: (0.299*R + 0.587*G + 0.114*B)
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

// Function to get the hue value of a color (0-360)
function getColorHue(hexColor: string): number {
  // Ensure the hex color is in the correct format
  hexColor = ensureHexUppercase(hexColor);
  
  // Extract RGB components
  let r, g, b;
  
  if (hexColor.startsWith('#')) {
    const hex = hexColor.replace('#', '');
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16) / 255;
      g = parseInt(hex[1] + hex[1], 16) / 255;
      b = parseInt(hex[2] + hex[2], 16) / 255;
    } else if (hex.length === 6) {
      r = parseInt(hex.slice(0, 2), 16) / 255;
      g = parseInt(hex.slice(2, 4), 16) / 255;
      b = parseInt(hex.slice(4, 6), 16) / 255;
    } else {
      return 0; // Invalid hex
    }
  } else if (hexColor.startsWith('rgb')) {
    const rgbMatch = hexColor.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i);
    if (rgbMatch) {
      r = parseInt(rgbMatch[1], 10) / 255;
      g = parseInt(rgbMatch[2], 10) / 255;
      b = parseInt(rgbMatch[3], 10) / 255;
    } else {
      return 0; // Invalid rgb
    }
  } else {
    return 0; // Unknown format
  }
  
  // Calculate hue
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  
  if (max === min) {
    return 0; // Achromatic (gray)
  }
  
  const d = max - min;
  
  if (max === r) {
    h = (g - b) / d + (g < b ? 6 : 0);
  } else if (max === g) {
    h = (b - r) / d + 2;
  } else if (max === b) {
    h = (r - g) / d + 4;
  }
  
  h = Math.round(h * 60);
  
  if (h < 0) {
    h += 360;
  }
  
  return h;
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
    mainFrame.strokes = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 }, opacity: 0.12 }];
    mainFrame.strokeWeight = 1;
    mainFrame.strokeAlign = "INSIDE";

    mainFrame.fills = [{ type: 'SOLID', color: { r: 0.082, g: 0.082, b: 0.082 } }];
    mainFrame.cornerRadius = 24;
    mainFrame.layoutMode = "VERTICAL";
    mainFrame.primaryAxisSizingMode = "AUTO";
    mainFrame.counterAxisSizingMode = "FIXED";
    mainFrame.itemSpacing = 0;
    mainFrame.clipsContent = true;

    // Create title section
    const titleSection = figma.createFrame();
    titleSection.name = "Title Section";
    titleSection.resize(1200, 246);
    titleSection.fills = [];
    titleSection.x = 0;
    titleSection.y = 0;
    titleSection.horizontalPadding = 8;
    titleSection.verticalPadding = 8
    titleSection.itemSpacing = 8;

    mainFrame.appendChild(titleSection);

    const titleContainer = figma.createFrame();
    titleContainer.name = "Title Container";
    titleContainer.resize(1184, 230);
    titleContainer.fills = [{ type: 'SOLID', color: { r: 0.0588, g: 0.0588, b: 0.0588 } }];
    titleContainer.x = 8;
    titleContainer.y = 8;
    titleContainer.verticalPadding = 64;
    titleContainer.horizontalPadding = 64;
    titleContainer.itemSpacing = 8;
    titleContainer.clipsContent = true;
    titleContainer.cornerRadius = 16;
    
    titleSection.appendChild(titleContainer);

    const titleTextContainer = figma.createFrame();
    titleTextContainer.name = "Title Text Container";
    titleTextContainer.resize(1056, 102);
    titleTextContainer.x = 64;
    titleTextContainer.y = 64;
    titleTextContainer.itemSpacing = 16;
    titleTextContainer.clipsContent = false;
    titleTextContainer.layoutMode = "VERTICAL";
    titleTextContainer.primaryAxisSizingMode = "AUTO";
    titleTextContainer.counterAxisSizingMode = "AUTO";
    titleTextContainer.fills = [];
    
    titleContainer.appendChild(titleTextContainer);

    var logoNode = figma.createNodeFromSvg(headerLogo);
    logoNode.fills = [];
    titleTextContainer.appendChild(logoNode);

    var bannerNode = figma.createNodeFromSvg(headerBanner);
    bannerNode.fills = [];
    bannerNode.x = 594;
    bannerNode.y = 16;
    bannerNode.resize(526, 198);
    titleContainer.appendChild(bannerNode);

    const titleTextContainer2 = figma.createFrame();
    titleTextContainer2.name = "Title Text Container";
    titleTextContainer2.resize(1056, 72);
    titleTextContainer2.x = 0;
    titleTextContainer2.y = 30;
    titleTextContainer2.itemSpacing = 8;
    titleTextContainer2.clipsContent = false;
    titleTextContainer2.layoutMode = "VERTICAL";
    titleTextContainer2.primaryAxisSizingMode = "AUTO";
    titleTextContainer2.counterAxisSizingMode = "AUTO";
    titleTextContainer2.clipsContent = false;
    titleTextContainer2.fills = [];

    titleTextContainer.appendChild(titleTextContainer2);

    const titleText2Title = figma.createText();
    titleText2Title.characters = pageTitle ? `${pageTitle} Style Guide` : "Style Finder Style Guide";
    titleText2Title.fontSize = 32;
    titleText2Title.fontName = { family: "Inter", style: "Medium" };
    titleText2Title.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
    titleText2Title.resize(titleText2Title.width, titleText2Title.height);
    titleText2Title.lineHeight = { value: 40, unit: "PIXELS" };
    titleText2Title.letterSpacing = { value: -2, unit: "PERCENT" };
    titleText2Title.textAlignHorizontal = "LEFT";
    titleText2Title.textAlignVertical = "CENTER";
    titleTextContainer2.appendChild(titleText2Title);


    const titleText2Title2 = figma.createText();
    titleText2Title2.characters = url;
    titleText2Title2.fontSize = 14;
    titleText2Title2.fontName = { family: "Inter", style: "Medium" };
    titleText2Title2.fills = [{ type: 'SOLID', color: { r: 0.1, g: 0.32, b: 1 } }];
    titleText2Title2.x = 0;
    titleText2Title2.y = 48;
    titleText2Title2.textAlignHorizontal = "LEFT";
    titleText2Title2.textAlignVertical = "TOP";
    titleText2Title2.textDecoration = "UNDERLINE";
    titleText2Title2.lineHeight = { value: 24, unit: "PIXELS" };
    titleText2Title2.letterSpacing = { value: -2, unit: "PERCENT" };
    titleText2Title2.resize(titleText2Title2.width, 24);

    titleTextContainer2.appendChild(titleText2Title2);

    // Create a variable to track Y position
    let currentY = titleSection.height;
    
    // Create section for color cards
    if (styleData.colors.length > 0) {
      // Group colors by hue ranges and then sort each group by brightness
      const colorGroups: { [key: string]: string[] } = {};
      const hueRanges = [
        { name: "red", min: 355, max: 360 }, // Red wraps around
        { name: "red", min: 0, max: 10 },
        { name: "orange", min: 10, max: 45 },
        { name: "yellow", min: 45, max: 70 },
        { name: "green", min: 70, max: 170 },
        { name: "cyan", min: 170, max: 200 },
        { name: "blue", min: 200, max: 260 },
        { name: "purple", min: 260, max: 290 },
        { name: "magenta", min: 290, max: 330 },
        { name: "pink", min: 330, max: 355 },
        { name: "grayscale", min: -1, max: -1 } // Special case for grayscale colors
      ];

      // Initialize color groups
      hueRanges.forEach(range => {
        colorGroups[range.name] = [];
      });

      // Group colors by hue range
      styleData.colors.forEach(color => {
        const hue = getColorHue(color);
        const brightness = getColorBrightness(color);
        
        // Check if it's a grayscale color (very low saturation)
        const isGrayscale = isGrayscaleColor(color);
        
        if (isGrayscale) {
          colorGroups["grayscale"].push(color);
        } else {
          // Find which hue range this color belongs to
          for (const range of hueRanges) {
            if (range.name === "grayscale") continue;
            
            if ((range.min <= hue && hue < range.max) || 
                (range.name === "red" && (hue >= 355 || hue < 10))) {
              colorGroups[range.name].push(color);
              break;
            }
          }
        }
      });

      // Sort each color group by brightness (dark to light)
      Object.keys(colorGroups).forEach(groupName => {
        colorGroups[groupName].sort((a, b) => {
          const brightnessA = getColorBrightness(a);
          const brightnessB = getColorBrightness(b);
          return brightnessA - brightnessB; // Dark to light
        });
      });

      // Create a new sorted array with all colors grouped by hue and sorted by brightness
      const sortedColors: string[] = [];
      
      // Add grayscale colors first (from black to white)
      sortedColors.push(...colorGroups["grayscale"]);
      
      // Then add all other color groups in spectrum order
      const colorOrder = ["red", "orange", "yellow", "green", "cyan", "blue", "purple", "magenta", "pink"];
      colorOrder.forEach(groupName => {
        sortedColors.push(...colorGroups[groupName]);
      });
      
      // Replace the original colors array with our sorted version
      styleData.colors = sortedColors;
      
      const colorsSection = figma.createFrame();

      colorsSection.name = "Colors Section";
      colorsSection.layoutMode = "VERTICAL";
      colorsSection.primaryAxisSizingMode = "AUTO";
      colorsSection.counterAxisSizingMode = "AUTO";
      colorsSection.verticalPadding = 64;
      colorsSection.horizontalPadding = 64;
      colorsSection.itemSpacing = 24;
      colorsSection.x = 0;
      colorsSection.y = currentY; // Position below the previous section
      colorsSection.fills = [];
      colorsSection.strokes = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 }, opacity: 0.12 }];
      colorsSection.strokeWeight = 1;
      colorsSection.strokeAlign = "INSIDE";

      // Add a new frame named Heading with w: 1072 h: 56 vertical gap: 24 x: 64 y: 64
      const heading = figma.createFrame();
      heading.name = "Heading";
      heading.resize(1072, 56);
      heading.x = 64;
      heading.y = 64;
      heading.itemSpacing = 4;
      heading.fills = [];
      colorsSection.appendChild(heading);

      // Add two text elements inside the Heading
      const headingText = figma.createText();
      headingText.characters = "Color Palette";
      headingText.fontSize = 20;
      headingText.fontName = { family: "Inter", style: "Medium" };
      headingText.x = 0;
      headingText.y = 0;
      headingText.resize(1072, 28)
      headingText.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
      headingText.lineHeight = { value: 28, unit: "PIXELS" };
      headingText.textAlignVertical = "CENTER";
      headingText.textAlignHorizontal = "LEFT";

      heading.appendChild(headingText);

      const headingText2 = figma.createText();
      headingText2.characters = `${styleData.colors.length} found colors`;
      headingText2.fontSize = 16;
      headingText2.fontName = { family: "Inter", style: "Regular" };
      headingText2.lineHeight = { value: 24, unit: "PIXELS" };
      headingText2.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 }, opacity: 0.56 }];
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
        colorCard.resize(200, 200);
        colorCard.cornerRadius = 16;
        colorCard.strokes = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 }, opacity: 0.08 }];
        colorCard.strokeWeight = 1;
        colorCard.strokeAlign = "OUTSIDE";
        colorCard.fills = [];

        // Add color sample
        const colorSample = figma.createFrame();
        colorSample.name = `Color Sample ${i + 1}`;
        colorSample.resize(200, 136);
        colorSample.x = 0;
        colorSample.y = 0;
        colorSample.itemSpacing = 8;
        colorSample.cornerRadius = 12;
        colorSample.strokes = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 }, opacity: 0.12 }];
        colorSample.strokeWeight = 1;
        colorSample.strokeAlign = "OUTSIDE";
        colorSample.layoutAlign = "STRETCH";
        colorSample.primaryAxisAlignItems = "CENTER";
        colorSample.counterAxisAlignItems = "CENTER";
        
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

        const rgbColorTextFrame = figma.createFrame();
        rgbColorTextFrame.name = "RGB Color Text Frame";
        rgbColorTextFrame.resize(200, 24);
        rgbColorTextFrame.fills = [];
        rgbColorTextFrame.verticalPadding = 4;
        rgbColorTextFrame.horizontalPadding = 10;
        rgbColorTextFrame.fills = [{ type: 'SOLID', color: { r: 0.1176, g: 0.1176, b: 0.1176 }, opacity: 0.56 }];
        rgbColorTextFrame.layoutAlign = "CENTER";
        rgbColorTextFrame.primaryAxisAlignItems = "CENTER";
        rgbColorTextFrame.counterAxisAlignItems = "CENTER";
        rgbColorTextFrame.layoutMode = "VERTICAL";
        rgbColorTextFrame.primaryAxisSizingMode = "AUTO";
        rgbColorTextFrame.counterAxisSizingMode = "AUTO";
        rgbColorTextFrame.cornerRadius = 12;
        rgbColorTextFrame.clipsContent = true;
        rgbColorTextFrame.effects = [{ type: 'INNER_SHADOW', color: {
            r: 1, g: 1, b: 1,
            a: 0.08
          }, offset: { x: 0, y: 2 }, radius: 4.7, spread: 0, visible: true, blendMode: 'NORMAL' },
          { type: 'BACKGROUND_BLUR', radius: 29.9, visible: true },
          { type: 'DROP_SHADOW', color: {
            r: 0.06, g: 0.1, b: 0.14,
            a: 0.05
          }, offset: { x: 0, y: 1 }, radius: 1, spread: 0, visible: true, blendMode: 'NORMAL' },
          { type: 'DROP_SHADOW', color: {
            r: 0, g: 0, b: 0,
            a: 0.12
          }, offset: { x: 0, y: 0 }, radius: 0, spread: 1, visible: true, blendMode: 'NORMAL' },
          { type: 'DROP_SHADOW', color: {
            r: 0.06, g: 0.1, b: 0.14,
            a: 0.05
          }, offset: { x: 0, y: 2 }, radius: 3, spread: 0, visible: true, blendMode: 'NORMAL' }
        ];
        rgbColorTextFrame.clipsContent = true;
        rgbColorTextFrame.layoutAlign = "STRETCH";
        rgbColorTextFrame.primaryAxisAlignItems = "CENTER";
        rgbColorTextFrame.counterAxisAlignItems = "CENTER";

        const rgbColorText = figma.createText();
        
        // Get the hex color value
        const hexValue = hexColorValue || rgbToHex(colorFill.r, colorFill.g, colorFill.b);
        
        // Convert hex to RGB for display
        const r = Math.round(colorFill.r * 255);
        const g = Math.round(colorFill.g * 255);
        const b = Math.round(colorFill.b * 255);
        
        // Set the RGB text dynamically
        rgbColorText.characters = `RGB(${r}, ${g}, ${b})`;
        
        rgbColorText.fontSize = 12;
        rgbColorText.fontName = { family: "Inter", style: "Regular" };
        rgbColorText.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
        rgbColorText.lineHeight = { value: 16, unit: "PIXELS" };
        rgbColorText.resize(rgbColorText.width, 16);
        rgbColorText.textAlignHorizontal = "CENTER";
        rgbColorText.textAlignVertical = "CENTER";
        rgbColorText.textAutoResize = "WIDTH_AND_HEIGHT";
        rgbColorText.textTruncation = "DISABLED";

        rgbColorTextFrame.appendChild(rgbColorText);
        colorSample.appendChild(rgbColorTextFrame);
        
        // Center the rgbColorTextFrame in the colorSample
        rgbColorTextFrame.x = (colorSample.width - rgbColorTextFrame.width) / 2;
        rgbColorTextFrame.y = (colorSample.height - rgbColorTextFrame.height) / 2;
        
        // Get the color name from the hex code
        const colorName = getColorName(hexValue);

        const colorNameFrame = figma.createFrame();
        colorNameFrame.name = "Color Name Frame";
        colorNameFrame.resize(200, 64);
        colorNameFrame.y = 136;
        colorNameFrame.fills = [];
        colorNameFrame.itemSpacing = 2;
        colorNameFrame.horizontalPadding = 16;
        colorNameFrame.verticalPadding = 12;
        colorNameFrame.clipsContent = false;
        colorNameFrame.layoutMode = "HORIZONTAL";
        colorCard.appendChild(colorNameFrame);

        // create a frame for the color name
        const colorNameFrame2 = figma.createFrame();
        colorNameFrame2.name = "Color Name Frame";
        colorNameFrame2.x = 16;
        colorNameFrame2.y = 12;
        colorNameFrame2.resize(168, 40);
        colorNameFrame2.itemSpacing = 8;
        colorNameFrame.clipsContent = false;
        colorNameFrame2.fills = [];
        colorNameFrame.appendChild(colorNameFrame2);

        // create a frame for the color value
        const colorValueFrame = figma.createFrame();
        colorValueFrame.name = "Color Value Frame";
        colorValueFrame.x = 0;
        colorValueFrame.y = 0;
        colorValueFrame.resize(168, 40);
        colorValueFrame.itemSpacing = 2;
        colorValueFrame.clipsContent = false;
        colorValueFrame.layoutMode = "VERTICAL";
        colorValueFrame.fills = [];

        colorNameFrame2.appendChild(colorValueFrame);
        
        // Add text showing the color name
        const colorNameText = figma.createText();
        colorNameText.characters = colorName;
        colorNameText.fontSize = 14;
        colorNameText.fontName = { family: "Inter", style: "Medium" };
        colorNameText.x = 0;
        colorNameText.y = 0;
        colorNameText.textAlignHorizontal = "LEFT";
        colorNameText.lineHeight = { value: 22, unit: "PIXELS" };
        colorNameText.letterSpacing = { value: -0.6, unit: "PERCENT" };
        colorNameText.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
        colorValueFrame.appendChild(colorNameText);
        
        // Add text showing the color value in HEX format
        const colorText = figma.createText();
        colorText.characters = hexValue;
        colorText.fontSize = 12;
        colorText.fontName = { family: "Inter", style: "Regular" };
        colorText.x = 0;
        colorText.y = 24;
        colorText.textAlignHorizontal = "LEFT";
        colorText.lineHeight = { value: 16, unit: "PIXELS" };
        colorText.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 }, opacity: 0.56 }];

        colorValueFrame.appendChild(colorText);
        colorNameFrame2.appendChild(colorValueFrame);
        colorCardsSection.appendChild(colorCard);
      }
      
      colorCardsSection.resize(1072, colorCardsSection.height);
      colorCardsSection.counterAxisSizingMode = "AUTO";
      colorsSection.resize(1200, colorsSection.height);
      mainFrame.appendChild(colorsSection);
      
      // Update Y position
      currentY += colorsSection.height;
    }

    // Create section for gradient cards
    if (styleData.gradients.length > 0) {
      // Group gradients by type (linear, radial)
      const gradientGroups: { [key: string]: string[] } = {
        linear: [],
        radial: []
      };
      
      // Group gradients by type
      styleData.gradients.forEach(gradient => {
        if (gradient.includes('linear-gradient')) {
          gradientGroups.linear.push(gradient);
        } else if (gradient.includes('radial-gradient')) {
          gradientGroups.radial.push(gradient);
        }
      });
      
      const gradientsSection = figma.createFrame();

      gradientsSection.name = "Gradients Section";
      gradientsSection.layoutMode = "VERTICAL";
      gradientsSection.primaryAxisSizingMode = "AUTO";
      gradientsSection.counterAxisSizingMode = "AUTO";
      gradientsSection.verticalPadding = 64;
      gradientsSection.horizontalPadding = 64;
      gradientsSection.itemSpacing = 24;
      gradientsSection.x = 0;
      gradientsSection.y = currentY; // Position below the previous section
      gradientsSection.fills = [];
      gradientsSection.strokes = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 }, opacity: 0.12 }];
      gradientsSection.strokeWeight = 1;
      gradientsSection.strokeAlign = "INSIDE";

      mainFrame.appendChild(gradientsSection);

      // Add a new frame named Heading with w: 1072 h: 56 vertical gap: 24 x: 64 y: 64
      const heading = figma.createFrame();
      heading.name = "Heading";
      heading.resize(1072, 56);
      heading.x = 64;
      heading.y = 64;
      heading.itemSpacing = 4;
      heading.fills = [];
      gradientsSection.appendChild(heading);

      // Add two text elements inside the Heading
      const headingText = figma.createText();
      headingText.characters = "Gradient Palette";
      headingText.fontSize = 20;
      headingText.fontName = { family: "Inter", style: "Medium" };
      headingText.x = 0;
      headingText.y = 0;
      headingText.resize(1072, 28)
      headingText.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
      headingText.lineHeight = { value: 28, unit: "PIXELS" };
      headingText.textAlignVertical = "CENTER";
      headingText.textAlignHorizontal = "LEFT";

      heading.appendChild(headingText);

      const headingText2 = figma.createText();
      headingText2.characters = `${styleData.gradients.length} found gradients`;
      headingText2.fontSize = 16;
      headingText2.fontName = { family: "Inter", style: "Regular" };
      headingText2.lineHeight = { value: 24, unit: "PIXELS" };
      headingText2.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 }, opacity: 0.56 }];
      headingText2.resize(1072, 24)
      headingText2.x = 0;
      headingText2.y = 32;
      headingText.textAlignVertical = "CENTER";
      headingText.textAlignHorizontal = "LEFT";
      
      heading.appendChild(headingText2);

      const gradientCardsSection = figma.createFrame();
      gradientCardsSection.name = "Gradient Cards Section";
      gradientCardsSection.x = 64;
      gradientCardsSection.y = 144;
      gradientCardsSection.layoutAlign = "STRETCH";
      gradientCardsSection.primaryAxisAlignItems = "MIN";
      gradientCardsSection.layoutMode = "HORIZONTAL";
      gradientCardsSection.itemSpacing = 18;
      gradientCardsSection.counterAxisSpacing = 18;
      gradientCardsSection.layoutWrap = "WRAP";
      gradientCardsSection.fills = [];
      gradientCardsSection.clipsContent = false;
      gradientCardsSection.resize(1072, gradientCardsSection.height);
      gradientsSection.appendChild(gradientCardsSection);

      // Create a card for each gradient
      for (let i = 0; i < styleData.gradients.length; i++) {
        const gradientCard = figma.createFrame();
        gradientCard.name = `Gradient Card ${i + 1}`;
        gradientCard.resize(200, 200);
        gradientCard.cornerRadius = 16;
        gradientCard.strokes = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 }, opacity: 0.08 }];
        gradientCard.strokeWeight = 1;
        gradientCard.strokeAlign = "OUTSIDE";
        gradientCard.fills = [];
        gradientCardsSection.appendChild(gradientCard);
        // Add gradient sample
        const gradientSample = figma.createFrame();
        gradientSample.name = `Gradient Sample ${i + 1}`;
        gradientSample.resize(200, 136);
        gradientSample.x = 0;
        gradientSample.y = 0;
        gradientSample.itemSpacing = 8;
        gradientSample.cornerRadius = 12;
        gradientSample.strokes = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 }, opacity: 0.12 }];
        gradientSample.strokeWeight = 1;
        gradientSample.strokeAlign = "OUTSIDE";
        gradientSample.layoutAlign = "STRETCH";
        gradientSample.primaryAxisAlignItems = "CENTER";
        gradientSample.counterAxisAlignItems = "CENTER";

        gradientCard.appendChild(gradientSample);
        
        // Get the gradient value
        const gradientValue = styleData.gradients[i];
        
        // Process the gradient string to get properly formatted hex colors
        const { firstColor: firstColorHex, secondColor: secondColorHex } = processGradientString(gradientValue);
        
        // Extract colors from the gradient (for the gradient fill)
        const extractedGradientColors = extractGradientColors(gradientValue);
        
        // If we have at least 2 gradient colors, create a visual representation
        if (extractedGradientColors.length >= 2) {
          // Parse colors for gradient representation
          const colorStops: ColorStop[] = [];
          
          // Process up to 5 colors for the gradient
          const maxColors = Math.min(extractedGradientColors.length, 5);
          for (let j = 0; j < maxColors; j++) {
            const colorValue = extractedGradientColors[j];
            let colorFill: RGB = { r: 0.95, g: 0.98, b: 0.99 }; // Default color
            
            // If it's a HEX color code
            if (colorValue.startsWith('#')) {
              const hex = colorValue.replace('#', '');
              if (hex.length === 3) {
                const r = parseInt(hex[0] + hex[0], 16) / 255;
                const g = parseInt(hex[1] + hex[1], 16) / 255;
                const b = parseInt(hex[2] + hex[2], 16) / 255;
                colorFill = { r, g, b };
              } else if (hex.length === 6) {
                const r = parseInt(hex.slice(0, 2), 16) / 255;
                const g = parseInt(hex.slice(2, 4), 16) / 255;
                const b = parseInt(hex.slice(4, 6), 16) / 255;
                colorFill = { r, g, b };
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
              }
            }
            
            // Calculate position based on index
            const position = j / (maxColors - 1);
            // For gradient stops, we need to add the alpha channel
            colorStops.push({ color: { ...colorFill, a: 1 }, position });
          }
          
          // Create a gradient fill
          if (colorStops.length >= 2) {
            const isLinear = gradientValue.includes('linear-gradient');
            
            if (isLinear) {
              // Apply linear gradient directly to gradientSample
              gradientSample.fills = [{
                type: 'GRADIENT_LINEAR',
                gradientTransform: [
                  [1, 0, 0],
                  [0, 0, 1]
                ],
                gradientStops: colorStops
              }];
            } else {
              // Apply radial gradient directly to gradientSample
              gradientSample.fills = [{
                type: 'GRADIENT_RADIAL',
                gradientTransform: [
                  [0.5, 0, 0.5],
                  [0, 0.5, 0.5]
                ],
                gradientStops: colorStops
              }];
            }
          } else {
            // If we don't have enough colors for a gradient, use a default fill
            gradientSample.fills = [{ type: 'SOLID', color: { r: 0.95, g: 0.98, b: 0.99 } }];
          }

          // Determine gradient type and color information
          const isLinear = gradientValue.includes('linear-gradient');
          
          // Get the color name from the first gradient color
          const firstGradientColor = extractedGradientColors.length > 0 ? extractedGradientColors[0] : '#FFFFFF';
          // Convert to hex if it's in rgba format
          const firstGradientColorHex = firstGradientColor.startsWith('rgb') ? rgbaToHex(firstGradientColor) : firstGradientColor;
          const gradientColorName = getColorName(firstGradientColorHex);
          
          const gradientNameFrame = figma.createFrame();
          gradientNameFrame.name = "Gradient Name Frame";
          gradientNameFrame.resize(200, 64);
          gradientNameFrame.y = 136;
          gradientNameFrame.fills = [];
          gradientNameFrame.itemSpacing = 2;
          gradientNameFrame.horizontalPadding = 16;
          gradientNameFrame.verticalPadding = 12;
          gradientNameFrame.clipsContent = false;
          gradientNameFrame.layoutMode = "HORIZONTAL";
          gradientCard.appendChild(gradientNameFrame);

          // create a frame for the color name
          const gradientTypeFrame = figma.createFrame();
          gradientTypeFrame.name = "Gradient Type Frame";
          gradientTypeFrame.x = 16;
          gradientTypeFrame.y = 12;
          gradientTypeFrame.resize(168, 40);
          gradientTypeFrame.itemSpacing = 8;
          gradientTypeFrame.clipsContent = false;
          gradientTypeFrame.fills = [];
          gradientNameFrame.appendChild(gradientTypeFrame);

          // create a frame for the color value
          const gradientInfoFrame = figma.createFrame();
          gradientInfoFrame.name = "Gradient Info Frame";
          gradientInfoFrame.x = 0;
          gradientInfoFrame.y = 0;
          gradientInfoFrame.resize(168, 40);
          gradientInfoFrame.itemSpacing = 2;
          gradientInfoFrame.clipsContent = false;
          gradientInfoFrame.layoutMode = "VERTICAL";
          gradientInfoFrame.fills = [];

          gradientTypeFrame.appendChild(gradientInfoFrame);
          
          // Add text showing the color name
          const gradientTypeText = figma.createText();
          gradientTypeText.characters = gradientColorName;
          gradientTypeText.fontSize = 14;
          gradientTypeText.fontName = { family: "Inter", style: "Medium" };
          gradientTypeText.x = 0;
          gradientTypeText.y = 0;
          gradientTypeText.textAlignHorizontal = "LEFT";
          gradientTypeText.lineHeight = { value: 22, unit: "PIXELS" };
          gradientTypeText.letterSpacing = { value: -0.6, unit: "PERCENT" };
          gradientTypeText.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
          gradientInfoFrame.appendChild(gradientTypeText);
          
          // Create a frame for the hex codes
          const hexCodesFrame = figma.createFrame();
          hexCodesFrame.name = "Hex Codes Frame";
          hexCodesFrame.x = 16;
          hexCodesFrame.y = 36;
          hexCodesFrame.resize(168, 16);
          hexCodesFrame.itemSpacing = 8;
          hexCodesFrame.layoutMode = "HORIZONTAL";
          hexCodesFrame.fills = [];
          
          // Get hex codes from colorStops if available, otherwise use the processed gradient string
          let startHexColor = firstColorHex;
          let endHexColor = secondColorHex;
          
          // If we have colorStops, use them for more accurate hex values
          if (extractedGradientColors.length >= 2 && colorStops && colorStops.length >= 2) {
            // Convert the first colorStop to hex
            startHexColor = rgbToHex(
              Math.round(colorStops[0].color.r * 255),
              Math.round(colorStops[0].color.g * 255),
              Math.round(colorStops[0].color.b * 255)
            );
            
            // Convert the last colorStop to hex
            endHexColor = rgbToHex(
              Math.round(colorStops[colorStops.length - 1].color.r * 255),
              Math.round(colorStops[colorStops.length - 1].color.g * 255),
              Math.round(colorStops[colorStops.length - 1].color.b * 255)
            );
          }
          
          // First color hex text
          const firstColorText = figma.createText();
          firstColorText.characters = startHexColor;
          firstColorText.fontSize = 12;
          firstColorText.fontName = { family: "Inter", style: "Regular" };
          firstColorText.lineHeight = { value: 16, unit: "PIXELS" };
          firstColorText.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 }, opacity: 0.56 }];
          hexCodesFrame.appendChild(firstColorText);
          
          // Second color hex text
          const secondColorText = figma.createText();
          secondColorText.characters = endHexColor;
          secondColorText.fontSize = 12;
          secondColorText.fontName = { family: "Inter", style: "Regular" };
          secondColorText.lineHeight = { value: 16, unit: "PIXELS" };
          secondColorText.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 }, opacity: 0.56 }];
          hexCodesFrame.appendChild(secondColorText);
          
          gradientInfoFrame.appendChild(hexCodesFrame);
          gradientCardsSection.appendChild(gradientCard);
        }
      }
      
      gradientCardsSection.resize(1072, gradientCardsSection.height);
      gradientCardsSection.counterAxisSizingMode = "AUTO";
      gradientsSection.resize(1200, gradientsSection.height);
      mainFrame.appendChild(gradientsSection);
      
      // Update Y position
      currentY += gradientsSection.height;
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

// Function to check if a color is grayscale (very low saturation)
function isGrayscaleColor(hexColor: string): boolean {
  // Ensure the hex color is in the correct format
  hexColor = ensureHexUppercase(hexColor);
  
  // Extract RGB components
  let r, g, b;
  
  if (hexColor.startsWith('#')) {
    const hex = hexColor.replace('#', '');
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16) / 255;
      g = parseInt(hex[1] + hex[1], 16) / 255;
      b = parseInt(hex[2] + hex[2], 16) / 255;
    } else if (hex.length === 6) {
      r = parseInt(hex.slice(0, 2), 16) / 255;
      g = parseInt(hex.slice(2, 4), 16) / 255;
      b = parseInt(hex.slice(4, 6), 16) / 255;
    } else {
      return false; // Invalid hex
    }
  } else if (hexColor.startsWith('rgb')) {
    const rgbMatch = hexColor.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i);
    if (rgbMatch) {
      r = parseInt(rgbMatch[1], 10) / 255;
      g = parseInt(rgbMatch[2], 10) / 255;
      b = parseInt(rgbMatch[3], 10) / 255;
    } else {
      return false; // Invalid rgb
    }
  } else {
    return false; // Unknown format
  }
  
  // Calculate saturation
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  
  // If max and min are very close, it's a shade of gray
  if (max === min) {
    return true;
  }
  
  const l = (max + min) / 2;
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  
  // If saturation is very low, consider it grayscale
  return s < 0.1;
}

/**
 * Extracts color stops from a gradient string
 * @param gradientStr The gradient string (linear-gradient or radial-gradient)
 * @returns Array of color stops
 */
function extractGradientColors(gradientStr: string): string[] {
  // Extract the content inside the parentheses
  const match = gradientStr.match(/gradient\((.*)\)/i);
  if (!match || !match[1]) return [];
  
  const content = match[1];
  
  // Split by commas, but not those inside color functions like rgb(), rgba(), etc.
  const parts: string[] = [];
  let currentPart = '';
  let parenCount = 0;
  
  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    if (char === '(') parenCount++;
    if (char === ')') parenCount--;
    
    if (char === ',' && parenCount === 0) {
      parts.push(currentPart.trim());
      currentPart = '';
    } else {
      currentPart += char;
    }
  }
  
  if (currentPart.trim()) {
    parts.push(currentPart.trim());
  }
  
  // Filter out angle/position parameters and keep only color stops
  const colorStops = parts.filter(part => {
    // Skip parts that are likely to be directions or positions
    const isDirection = /^to\s+(top|bottom|left|right)|^\d+deg|^\d+rad|^\d+turn|^ellipse|^circle|^closest-side|^closest-corner|^farthest-side|^farthest-corner/.test(part);
    
    // Check if the part contains a color
    const hasColor = /(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|[a-zA-Z]+\s+\d+%|[a-zA-Z]+)/.test(part);
    
    return !isDirection && hasColor;
  });

  console.log(colorStops);
  
  // Extract just the color part from each stop
  return colorStops.map(stop => {
    // Extract color from "color position" format (e.g., "red 10%")
    const colorMatch = stop.match(/(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|[a-zA-Z]+)(?:\s+\d+%)?/);
    const colorValue = colorMatch ? colorMatch[1] : stop;
    
    // Convert to hex if it's in rgba format
    if (colorValue.toLowerCase().startsWith('rgb')) {
      try {
      console.log(colorValue);
        return rgbaToHex(colorValue);
      } catch (e) {
        console.log('Error converting RGB to hex:', colorValue);
        return '#FFFFFF'; // Default to white if conversion fails
      }
    }
    return colorValue;
  });
}

// Helper function to process gradient strings and ensure proper hex conversion
function processGradientString(gradientStr: string): { firstColor: string, secondColor: string } {
  // Extract the content inside the parentheses
  const match = gradientStr.match(/gradient\((.*)\)/i);
  if (!match || !match[1]) return { firstColor: '#FFFFFF', secondColor: '#FFFFFF' };
  
  const content = match[1];
  
  // Split by commas, but not those inside color functions like rgb(), rgba(), etc.
  const parts: string[] = [];
  let currentPart = '';
  let parenCount = 0;
  
  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    if (char === '(') parenCount++;
    if (char === ')') parenCount--;
    
    if (char === ',' && parenCount === 0) {
      parts.push(currentPart.trim());
      currentPart = '';
    } else {
      currentPart += char;
    }
  }
  
  if (currentPart.trim()) {
    parts.push(currentPart.trim());
  }
  
  // Filter out direction/position parameters
  const colorParts = parts.filter(part => {
    // Skip parts that are likely to be directions or positions
    const isDirection = /^to\s+(top|bottom|left|right)|^\d+deg|^\d+rad|^\d+turn|^ellipse|^circle|^closest-side|^closest-corner|^farthest-side|^farthest-corner/.test(part);
    
    // Check if the part contains a color
    const hasColor = /(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|[a-zA-Z]+\s+\d+%|[a-zA-Z]+)/.test(part);
    
    return !isDirection && hasColor;
  });
  
  // Extract color values
  let firstColor = '#FFFFFF';
  let secondColor = '#FFFFFF';
  
  if (colorParts.length >= 1) {
    // Process first color
    const firstColorMatch = colorParts[0].match(/(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|[a-zA-Z]+)(?:\s+\d+%)?/);
    const firstColorValue = firstColorMatch ? firstColorMatch[1] : colorParts[0];
    
    // Convert to hex if needed
    if (firstColorValue.toLowerCase().startsWith('rgb')) {
      firstColor = rgbaToHex(firstColorValue);
    } else {
      firstColor = firstColorValue;
    }
  }
  
  if (colorParts.length >= 2) {
    // Process second color
    const secondColorMatch = colorParts[1].match(/(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|[a-zA-Z]+)(?:\s+\d+%)?/);
    const secondColorValue = secondColorMatch ? secondColorMatch[1] : colorParts[1];
    
    // Convert to hex if needed
    if (secondColorValue.toLowerCase().startsWith('rgb')) {
      secondColor = rgbaToHex(secondColorValue);
    } else {
      secondColor = secondColorValue;
    }
  }
  
  // Ensure both colors are in proper hex format
  if (firstColor.startsWith('#')) {
    firstColor = ensureHexUppercase(firstColor);
  }
  
  if (secondColor.startsWith('#')) {
    secondColor = ensureHexUppercase(secondColor);
  }
  
  return { firstColor, secondColor };
}