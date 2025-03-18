// Helper functions for font operations

/**
 * Attempts to load a font
 */
export async function tryLoadFont(fontFamily: string): Promise<void> {
  try {
    // Normalize font family name
    const normalizedFontFamily = normalizeFontFamily(fontFamily);
    
    // Check if font is already available
    if (await isFontAvailable(normalizedFontFamily)) {
      return;
    }
    
    // Try to load from Google Fonts
    await figma.loadFontAsync({ family: normalizedFontFamily, style: 'Regular' })
      .then(() => console.log(`Loaded font: ${normalizedFontFamily} Regular`))
      .catch((error) => {
        // Try system fonts as fallback
        return tryLoadSystemFont(normalizedFontFamily);
      });
  } catch (error) {
  }
}

/**
 * Tries to set a font on a text node
 */
export function trySetFont(textNode: TextNode, fontFamily: string): boolean {
  try {
    // Normalize font family name
    const normalizedFontFamily = normalizeFontFamily(fontFamily);
    
    // Try to set the font
    textNode.fontName = { family: normalizedFontFamily, style: 'Regular' };
    return true;
  } catch (error) {
    
    // Try with a fallback font
    try {
      textNode.fontName = { family: 'Inter', style: 'Regular' };
      return true;
    } catch (secondError) {
      return false;
    }
  }
}

/**
 * Normalizes a font family name
 */
function normalizeFontFamily(fontFamily: string): string {
  // Remove quotes and extra spaces
  fontFamily = fontFamily.replace(/['"]/g, '').trim();
  
  // Special case for common fonts
  const fontMap: Record<string, string> = {
    'arial': 'Arial',
    'helvetica': 'Helvetica',
    'times new roman': 'Times New Roman',
    'times': 'Times New Roman',
    'courier new': 'Courier New',
    'courier': 'Courier New',
    'verdana': 'Verdana',
    'georgia': 'Georgia',
    'palatino': 'Palatino',
    'garamond': 'Garamond',
    'bookman': 'Bookman',
    'tahoma': 'Tahoma',
    'trebuchet ms': 'Trebuchet MS',
    'arial black': 'Arial Black',
    'impact': 'Impact',
    'roboto': 'Roboto',
    'open sans': 'Open Sans',
    'lato': 'Lato',
    'montserrat': 'Montserrat',
    'raleway': 'Raleway',
    'poppins': 'Poppins',
    'inter': 'Inter',
    'system-ui': 'Inter' // map system-ui to Inter as fallback
  };
  
  const lowerFontFamily = fontFamily.toLowerCase();
  if (fontMap[lowerFontFamily]) {
    return fontMap[lowerFontFamily];
  }
  
  // Return original with first letter capitalized
  return fontFamily.charAt(0).toUpperCase() + fontFamily.slice(1);
}

/**
 * Checks if a font is available
 */
async function isFontAvailable(fontFamily: string): Promise<boolean> {
  try {
    const fonts = await figma.listAvailableFontsAsync();
    return fonts.some(font => font.fontName.family === fontFamily);
  } catch (error) {
    console.error('Error checking font availability:', error);
    return false;
  }
}

/**
 * Tries to load a system font as fallback
 */
async function tryLoadSystemFont(fontFamily: string): Promise<void> {
  const systemFonts = ['Inter', 'Roboto', 'Arial', 'Helvetica', 'SF Pro', 'Segoe UI'];
  
  for (const font of systemFonts) {
    try {
      await figma.loadFontAsync({ family: font, style: 'Regular' });
      return;
    } catch (error) {
    }
  }
  
  throw new Error(`Failed to load any system font as fallback for ${fontFamily}`);
} 