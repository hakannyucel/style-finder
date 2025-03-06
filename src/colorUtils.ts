// Import the color names directly from the JSON file
import colornames from '../node_modules/color-name-list/dist/colornames.json';

/**
 * Calculate the Euclidean distance between two RGB colors
 * @param rgb1 First RGB color as [r, g, b]
 * @param rgb2 Second RGB color as [r, g, b]
 * @returns The distance between the colors
 */
function colorDistance(rgb1: [number, number, number], rgb2: [number, number, number]): number {
  const rDiff = rgb1[0] - rgb2[0];
  const gDiff = rgb1[1] - rgb2[1];
  const bDiff = rgb1[2] - rgb2[2];
  return Math.sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff);
}

/**
 * Convert a hex color code to RGB
 * @param hex The hex color code (with or without #)
 * @returns RGB values as [r, g, b]
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
 * @param hexCode The hex color code (with or without #)
 * @returns The color name or the original hex code if no name is found
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