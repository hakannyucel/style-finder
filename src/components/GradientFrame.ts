// Component for creating gradient frames in Figma

import { StyleData } from '../types/StyleData';
import { processGradientString } from '../utils/colorUtils';

/**
 * Creates a frame with gradient swatches
 */
export function createGradientFrame(mainFrame: FrameNode, styleData: StyleData, currentY: number): number {
  // If no gradients found, return current Y position
  if (!styleData.gradients || styleData.gradients.length === 0) {
    return currentY;
  }
  
  // Create section for gradients
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

  // Add heading frame
  const heading = figma.createFrame();
  heading.name = "Heading";
  heading.resize(1072, 56);
  heading.x = 64;
  heading.y = 64;
  heading.itemSpacing = 4;
  heading.fills = [];
  gradientsSection.appendChild(heading);
  
  // Add title text
  const headingText = figma.createText();
  headingText.characters = "Gradient Palette";
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
  
  // Add subtitle with gradient count
  const headingText2 = figma.createText();
  headingText2.characters = `${styleData.gradients.length} found gradients`;
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
  
  // Create container for gradient cards
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
    
    // Check if this is a linear gradient string which may include a name comment
    let gradientName = "";
    // Try to extract gradient name from the string if it's in the format: /* Name: Gradient Name */
    const nameMatch = gradientValue.match(/\/\*\s*Name:\s*(.*?)\s*\*\//);
    if (nameMatch && nameMatch[1]) {
      gradientName = nameMatch[1].trim();
    }
    
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
      
      // Use extracted name or fallback to color name
      const displayName = gradientName || getColorName(firstGradientColorHex);
      
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
      gradientTypeText.characters = displayName;
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
  
  // Return the new Y position (after this section)
  return currentY + gradientsSection.height;
}

/**
 * Helper function for extracting gradient colors from CSS gradient string
 */
function extractGradientColors(gradientStr: string): string[] {
  const colors: string[] = [];
  const colorRegex = /(#[a-f0-9]{3,8}|rgba?\([^)]+\))/gi;
  
  let match;
  while ((match = colorRegex.exec(gradientStr)) !== null) {
    colors.push(match[0]);
  }
  
  return colors;
}

/**
 * Helper function to convert RGB values to Hex
 */
function rgbToHex(r: number, g: number, b: number): string {
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
}

/**
 * Helper function to convert RGBA string to Hex
 */
function rgbaToHex(rgba: string): string {
  const rgbaMatch = rgba.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*[\d.]+\s*)?\)/i);
  if (rgbaMatch) {
    const r = parseInt(rgbaMatch[1], 10);
    const g = parseInt(rgbaMatch[2], 10);
    const b = parseInt(rgbaMatch[3], 10);
    return rgbToHex(r, g, b);
  }
  return '#FFFFFF'; // Default fallback
}

/**
 * Helper function to get color name from hex value
 * This is a simplified implementation, a real one would use a color dictionary
 */
function getColorName(hex: string): string {
  // A very simple implementation that returns basic colors
  // In a real implementation, you would compare the hex with known colors
  // and return the closest match
  
  // Remove hash if it exists
  hex = hex.replace('#', '');
  
  // Convert to RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Simple color naming based on RGB values
  if (r > 200 && g > 200 && b > 200) return "Light";
  if (r < 50 && g < 50 && b < 50) return "Dark";
  
  if (r > 200 && g < 100 && b < 100) return "Red";
  if (r < 100 && g > 200 && b < 100) return "Green";
  if (r < 100 && g < 100 && b > 200) return "Blue";
  
  if (r > 200 && g > 200 && b < 100) return "Yellow";
  if (r > 200 && g < 100 && b > 200) return "Magenta";
  if (r < 100 && g > 200 && b > 200) return "Cyan";
  
  if (r > g && r > b) return "Red-ish";
  if (g > r && g > b) return "Green-ish";
  if (b > r && b > g) return "Blue-ish";
  
  return "Mixed";
} 