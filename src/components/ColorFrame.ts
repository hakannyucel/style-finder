// Component for creating color frames in Figma

import { StyleData } from '../types/StyleData';
import { getColorBrightness, isGrayscaleColor } from '../utils/colorUtils';

/**
 * Creates a frame with color swatches
 */
export function createColorFrame(mainFrame: FrameNode, styleData: StyleData, currentY: number): number {
  // Create section for color palette
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
  headingText.resize(1072, 28);
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
  headingText2.resize(1072, 24);
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
  
  // Process and group colors
  let processedColors = prepareColorsForDisplay(styleData.colors);
  
  // Create a card for each color
  for (let i = 0; i < processedColors.length; i++) {
    const colorData = processedColors[i];
    createColorCard(colorCardsSection, colorData, i);
  }
  
  colorCardsSection.resize(1072, colorCardsSection.height);
  colorCardsSection.counterAxisSizingMode = "AUTO";
  colorsSection.resize(1200, colorsSection.height);
  mainFrame.appendChild(colorsSection);
  
  // Return the new Y position (after this section)
  return currentY + colorsSection.height;
}

/**
 * Prepares colors for display by deduplicating, sorting, and organizing them
 */
function prepareColorsForDisplay(colors: StyleData['colors']): StyleData['colors'] {
  // Remove duplicates based on hex values
  const uniqueColors = colors.filter((color, index, self) => 
    index === self.findIndex((c) => c.hex.toUpperCase() === color.hex.toUpperCase())
  );
  
  // Filter out colors that are too light (almost white) or too dark (almost black)
  const filteredColors = uniqueColors.filter(color => {
    const brightness = getColorBrightness(color.hex);
    return brightness > 15 && brightness < 240;
  });
  
  // Sort colors by grayscale first, then by brightness
  const result = [...filteredColors].sort((a, b) => {
    const aIsGray = isGrayscaleColor(a.hex);
    const bIsGray = isGrayscaleColor(b.hex);
    
    // Put grayscale colors first
    if (aIsGray && !bIsGray) return -1;
    if (!aIsGray && bIsGray) return 1;
    
    // For grayscale colors, sort by brightness
    if (aIsGray && bIsGray) {
      return getColorBrightness(b.hex) - getColorBrightness(a.hex);
    }
    
    // For colored pixels, sort by brightness
    return getColorBrightness(b.hex) - getColorBrightness(a.hex);
  });
  
  return result;
}

/**
 * Creates a single color card element with improved UI
 */
function createColorCard(parent: FrameNode, colorData: StyleData['colors'][0], index: number): void {
  const colorCard = figma.createFrame();
  colorCard.name = `Color Card ${index + 1}`;
  colorCard.resize(200, 200);
  colorCard.cornerRadius = 16;
  colorCard.strokes = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 }, opacity: 0.08 }];
  colorCard.strokeWeight = 1;
  colorCard.strokeAlign = "OUTSIDE";
  colorCard.fills = [];
  
  // Add color sample
  const colorSample = figma.createFrame();
  colorSample.name = `Color Sample ${index + 1}`;
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
  let colorFill: RGB = { r: 0.95, g: 0.98, b: 0.99 }; // Default color
  const hexColor = colorData.hex;
  
  // If it's a HEX color code
  if (hexColor.startsWith('#')) {
    const hex = hexColor.replace('#', '');
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
  else if (colorData.rgb && colorData.rgb.startsWith('rgb')) {
    const rgbMatch = colorData.rgb.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i);
    if (rgbMatch) {
      const r = parseInt(rgbMatch[1], 10) / 255;
      const g = parseInt(rgbMatch[2], 10) / 255;
      const b = parseInt(rgbMatch[3], 10) / 255;
      colorFill = { r, g, b };
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
  rgbColorTextFrame.effects = [
    { type: 'INNER_SHADOW', color: { r: 1, g: 1, b: 1, a: 0.08 }, offset: { x: 0, y: 2 }, radius: 4.7, spread: 0, visible: true, blendMode: 'NORMAL' },
    { type: 'BACKGROUND_BLUR', radius: 29.9, visible: true },
    { type: 'DROP_SHADOW', color: { r: 0.06, g: 0.1, b: 0.14, a: 0.05 }, offset: { x: 0, y: 1 }, radius: 1, spread: 0, visible: true, blendMode: 'NORMAL' },
    { type: 'DROP_SHADOW', color: { r: 0, g: 0, b: 0, a: 0.12 }, offset: { x: 0, y: 0 }, radius: 0, spread: 1, visible: true, blendMode: 'NORMAL' },
    { type: 'DROP_SHADOW', color: { r: 0.06, g: 0.1, b: 0.14, a: 0.05 }, offset: { x: 0, y: 2 }, radius: 3, spread: 0, visible: true, blendMode: 'NORMAL' }
  ];
  rgbColorTextFrame.clipsContent = true;
  rgbColorTextFrame.layoutAlign = "STRETCH";
  rgbColorTextFrame.primaryAxisAlignItems = "CENTER";
  rgbColorTextFrame.counterAxisAlignItems = "CENTER";
  
  const rgbColorText = figma.createText();
  
  // Use the RGB value directly from the data
  rgbColorText.characters = colorData.rgb || `RGB(${Math.round(colorFill.r * 255)}, ${Math.round(colorFill.g * 255)}, ${Math.round(colorFill.b * 255)})`;
  
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
  
  // Add text showing the color name from the colorData
  const colorNameText = figma.createText();
  colorNameText.characters = colorData.name || "Unnamed Color";
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
  colorText.characters = colorData.hex.toUpperCase();
  colorText.fontSize = 12;
  colorText.fontName = { family: "Inter", style: "Regular" };
  colorText.x = 0;
  colorText.y = 24;
  colorText.textAlignHorizontal = "LEFT";
  colorText.lineHeight = { value: 16, unit: "PIXELS" };
  colorText.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 }, opacity: 0.56 }];
  
  colorValueFrame.appendChild(colorText);
  colorNameFrame2.appendChild(colorValueFrame);
  parent.appendChild(colorCard);
}

/**
 * Converts RGB values to HEX format
 * Not used directly anymore since we're using the provided hex values
 * But kept for utility purposes
 */
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = Math.round(x).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('').toUpperCase();
} 