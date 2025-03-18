// Helper functions for color operations

// Import the color names directly from the JSON file
import colornames from '../../node_modules/color-name-list/dist/colornames.json';

/**
 * Converts RGB color values to hex format
 */
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('').toUpperCase();
}

/**
 * Converts RGBA color string to hex format (ignoring alpha)
 */
function rgbaToHex(rgbaStr: string): string {
  const rgbaMatch = rgbaStr.match(/rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*[\d.]+\s*\)/i);
  if (rgbaMatch) {
    return rgbToHex(parseInt(rgbaMatch[1], 10), parseInt(rgbaMatch[2], 10), parseInt(rgbaMatch[3], 10));
  }
  return '';
}

/**
 * Converts hex color code to uppercase
 */
function ensureHexUppercase(hexColor: string): string {
  if (!hexColor || typeof hexColor !== 'string') return '';
  
  // Remove # prefix, convert to uppercase, then add # back
  return hexColor.replace(/^#/, '').toUpperCase().replace(/^/, '#');
}

/**
 * Calculates brightness of a hex color value
 */
export function getColorBrightness(hexColor: string): number {
  // Remove # symbol
  hexColor = hexColor.replace('#', '');
  
  // Convert 3-character hex to 6-character
  if (hexColor.length === 3) {
    hexColor = hexColor.split('').map(c => c + c).join('');
  }
  
  // Extract RGB values
  const r = parseInt(hexColor.substring(0, 2), 16);
  const g = parseInt(hexColor.substring(2, 4), 16);
  const b = parseInt(hexColor.substring(4, 6), 16);
  
  // Calculate brightness (0-255)
  return (r * 299 + g * 587 + b * 114) / 1000;
}

/**
 * Calculates hue value of a hex color
 */
export function getColorHue(hexColor: string): number {
  // Remove # symbol
  hexColor = hexColor.replace('#', '');
  
  // Convert 3-character hex to 6-character
  if (hexColor.length === 3) {
    hexColor = hexColor.split('').map(c => c + c).join('');
  }
  
  // Extract RGB values
  const r = parseInt(hexColor.substring(0, 2), 16) / 255;
  const g = parseInt(hexColor.substring(2, 4), 16) / 255;
  const b = parseInt(hexColor.substring(4, 6), 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  
  let hue = 0;
  const delta = max - min;
  
  if (delta === 0) {
    hue = 0;
  } else if (max === r) {
    hue = ((g - b) / delta) % 6;
  } else if (max === g) {
    hue = (b - r) / delta + 2;
  } else {
    hue = (r - g) / delta + 4;
  }
  
  hue = Math.round(hue * 60);
  if (hue < 0) hue += 360;
  
  return hue;
}

/**
 * Checks if a color is grayscale
 */
export function isGrayscaleColor(hexColor: string): boolean {
  // Remove # symbol
  hexColor = hexColor.replace('#', '');
  
  // Convert 3-character hex to 6-character
  if (hexColor.length === 3) {
    hexColor = hexColor.split('').map(c => c + c).join('');
  }
  
  // Extract RGB values
  const r = parseInt(hexColor.substring(0, 2), 16);
  const g = parseInt(hexColor.substring(2, 4), 16);
  const b = parseInt(hexColor.substring(4, 6), 16);
  
  // If R, G, B values are very close (difference < 10), consider it grayscale
  const tolerance = 10;
  return (
    Math.abs(r - g) <= tolerance &&
    Math.abs(g - b) <= tolerance &&
    Math.abs(r - b) <= tolerance
  );
}

/**
 * Extracts colors from a gradient string
 */
function extractGradientColors(gradientStr: string): string[] {
  const colorRegex = /#[0-9a-fA-F]{3,6}|rgba?\([^)]+\)/g;
  const matches = gradientStr.match(colorRegex) || [];
  
  // Convert RGB/RGBA colors to hex
  return matches.map(color => {
    if (color.startsWith('rgb')) {
      if (color.startsWith('rgba')) {
        return rgbaToHex(color);
      } else {
        const rgbMatch = color.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i);
        if (rgbMatch) {
          return rgbToHex(parseInt(rgbMatch[1], 10), parseInt(rgbMatch[2], 10), parseInt(rgbMatch[3], 10));
        }
      }
    }
    return ensureHexUppercase(color);
  }).filter(color => color !== ''); // Filter out empty values
}

/**
 * Processes gradient string and returns first and second colors
 */
export function processGradientString(gradientStr: string): { firstColor: string, secondColor: string } {
  const colors = extractGradientColors(gradientStr);
  
  return {
    firstColor: colors[0] || '#FFFFFF',
    secondColor: colors[colors.length - 1] || '#000000'
  };
}

/**
 * Calculate the Euclidean distance between two RGB colors
 */
function colorDistance(rgb1: [number, number, number], rgb2: [number, number, number]): number {
  const rDiff = rgb1[0] - rgb2[0];
  const gDiff = rgb1[1] - rgb2[1];
  const bDiff = rgb1[2] - rgb2[2];
  return Math.sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff);
}

/**
 * Convert a hex color code to RGB
 */
function hexToRgb(hex: string): [number, number, number] {
  // Ensure the hex code starts with #
  let formattedHex = hex.startsWith('#') ? hex : '#' + hex;
  
  // Convert 3-digit hex (#RGB) to 6-digit format (#RRGGBB)
  if (formattedHex.length === 4) {
    formattedHex = '#' + 
      formattedHex[1] + formattedHex[1] + 
      formattedHex[2] + formattedHex[2] + 
      formattedHex[3] + formattedHex[3];
  }
  
  const r = parseInt(formattedHex.substring(1, 3), 16);
  const g = parseInt(formattedHex.substring(3, 5), 16);
  const b = parseInt(formattedHex.substring(5, 7), 16);
  return [r, g, b];
}

/**
 * Get a human-readable color name from a hex code
 */
export function getColorName(hexCode: string): string {
  // Ensure format is consistent (with #)
  let formattedHex = hexCode.startsWith('#') ? hexCode : '#' + hexCode;
  
  // Convert 3-digit hex (#RGB) to 6-digit format (#RRGGBB)
  if (formattedHex.length === 4) {
    formattedHex = '#' + 
      formattedHex[1] + formattedHex[1] + 
      formattedHex[2] + formattedHex[2] + 
      formattedHex[3] + formattedHex[3];
  }
  
  // First try to find an exact match
  const exactMatch = colornames.find((color: { hex: string; name: string }) => 
    color.hex.toUpperCase() === formattedHex.toUpperCase()
  );

  if (exactMatch) {
    return exactMatch.name;
  }
  
  // If no exact match, find the closest color by RGB distance
  const inputRgb = hexToRgb(formattedHex);
  
  let closestColorName = 'Unknown Color';
  let smallestDistance = Infinity;
  
  // Compare with all colors in the list
  for (const color of colornames) {
    try {
      const colorRgb = hexToRgb(color.hex);
      const distance = colorDistance(inputRgb, colorRgb);
      
      // Select the color name with the smallest distance
      if (distance < smallestDistance) {
        smallestDistance = distance;
        closestColorName = color.name;
      }
    } catch (error) {
      // Skip invalid hex codes
      continue;
    }
  }
  
  return closestColorName;
} 