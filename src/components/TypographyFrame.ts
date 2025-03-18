// Component for creating typography frames in Figma

import { StyleData } from '../types/StyleData';
import { tryLoadFont, trySetFont } from '../utils/fontUtils';

/**
 * Creates a frame with typography information
 */
export async function createTypographyFrame(mainFrame: FrameNode, styleData: StyleData, currentY: number): Promise<number> {
  
  // First try to load all fonts from the user's site
  const fontLoadPromises = styleData.typography.fontFamilies.map(async (fontFamily) => {
    try {
      await tryLoadFont(fontFamily);
    } catch (error) {
    }
  });
  
  // Wait for all font loading processes to complete
  await Promise.all(fontLoadPromises);
  
  // Also load default fonts (even if they are already loaded)
  await Promise.all([
    figma.loadFontAsync({ family: "Inter", style: "Regular" }),
    figma.loadFontAsync({ family: "Inter", style: "Medium" }),
    figma.loadFontAsync({ family: "Inter", style: "Bold" })
  ]);
  
  // Create main Typography Section Frame
  const typographySection = figma.createFrame();

  typographySection.name = "Typography Section";
  typographySection.layoutMode = "VERTICAL";
  typographySection.primaryAxisSizingMode = "AUTO";
  typographySection.counterAxisSizingMode = "AUTO";
  typographySection.verticalPadding = 64;
  typographySection.horizontalPadding = 64;
  typographySection.itemSpacing = 24;
  typographySection.x = 0;
  typographySection.y = currentY; // Position below the previous section
  typographySection.fills = [];
  typographySection.strokes = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 }, opacity: 0.12 }];
  typographySection.strokeWeight = 1;
  typographySection.strokeAlign = "INSIDE";

  mainFrame.appendChild(typographySection);

  // Add a heading frame
  const heading = figma.createFrame();
  heading.name = "Heading";
  heading.resize(1072, 56);
  heading.x = 64;
  heading.y = 64;
  heading.itemSpacing = 4;
  heading.fills = [];
  typographySection.appendChild(heading);

  // Add two text elements inside the Heading
  const headingText = figma.createText();
  headingText.characters = "Typography";
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

  // Get unique font families for the subtitle
  const uniqueFontFamilies = [...new Set(styleData.typography.fontFamilies)];
  const fontFamilyCount = uniqueFontFamilies.length > 0 ? uniqueFontFamilies.length : 2;
  const styleCount = styleData.typography.fontStyles.length > 0 ? styleData.typography.fontStyles.length : 25;

  const headingText2 = figma.createText();
  headingText2.characters = `${fontFamilyCount} different typeface & ${styleCount} style`;
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

  // Create a container for the typography content
  const typographyContent = figma.createFrame();
  typographyContent.name = "Typography Content";
  typographyContent.x = 64;
  typographyContent.y = 144;
  typographyContent.layoutMode = "VERTICAL";
  typographyContent.primaryAxisSizingMode = "AUTO";
  typographyContent.counterAxisSizingMode = "FIXED";
  typographyContent.itemSpacing = 32;
  typographyContent.fills = [];
  typographyContent.clipsContent = false;
  typographyContent.resize(1072, typographyContent.height);
  typographySection.appendChild(typographyContent);

  // Create font showcase section (Heading and Description)
  createFontShowcase(typographyContent, styleData);
  
  // Create heading examples (H1, H2, etc.)
  createHeadingExamples(typographyContent, styleData);

  typographyContent.resize(1072, typographyContent.height);
  typographyContent.counterAxisSizingMode = "AUTO";
  typographySection.resize(1200, typographySection.height);

  // Return the new Y position (after this section)
  return typographySection.y + typographySection.height;
}

/**
 * Creates the font showcase section with heading and description font cards
 */
function createFontShowcase(parentFrame: FrameNode, styleData?: StyleData): void {
    // Create a section for font families showcase
    const fontShowcaseFrame = figma.createFrame();
    fontShowcaseFrame.name = "Font Showcase";
    fontShowcaseFrame.layoutMode = "HORIZONTAL";
    fontShowcaseFrame.primaryAxisSizingMode = "FIXED";
    fontShowcaseFrame.counterAxisSizingMode = "AUTO";
    fontShowcaseFrame.itemSpacing = 24;
    fontShowcaseFrame.fills = [];
    fontShowcaseFrame.resize(1072, 171);
    parentFrame.appendChild(fontShowcaseFrame);
  
    // Get font data directly from API
    let typographyData: StyleData['typography'] = {
      fontFamilies: [],
      headings: [],
      fontStyles: []
    };
    
    if (styleData && styleData.typography) {
      typographyData = styleData.typography;
    } else {
      // Fallback to plugin data if styleData is not provided
      const storedStyleData = figma.root.getPluginData('styleData');
      if (storedStyleData) {
        try {
          const parsedData = JSON.parse(storedStyleData) as StyleData;
          if (parsedData.typography) {
            typographyData = parsedData.typography;
          }
        } catch (error) {
          console.error('Error parsing style data:', error);
        }
      }
    }
  
    // Get font families directly from API
    if (!typographyData.fontFamilies || typographyData.fontFamilies.length === 0) {
      // Last resort fallback
      typographyData.fontFamilies = ['Inter'];
    }
  
    // Use heading and body fonts directly from API data
    const headingFontFull = typographyData.fontFamilies[0] || 'Inter';
    
    // For body font, try to find a different font than the heading font
    let bodyFontFull = typographyData.fontFamilies.find(font => font !== headingFontFull);
    
    // If no different font is found, use the same as heading font
    if (!bodyFontFull) {
      bodyFontFull = headingFontFull;
    }
  
    // Create left card for heading font
    const headingFontCard = figma.createFrame();
    headingFontCard.name = "Heading Font Card";
    headingFontCard.layoutMode = "VERTICAL";
    headingFontCard.primaryAxisSizingMode = "FIXED";
    headingFontCard.counterAxisSizingMode = "FIXED";
    headingFontCard.primaryAxisAlignItems = "CENTER";
    headingFontCard.counterAxisAlignItems = "CENTER";
    headingFontCard.itemSpacing = 16;
    headingFontCard.fills = [{ type: 'SOLID', color: { r: 0.0549, g: 0.0549, b: 0.0549 } }];
    headingFontCard.strokeWeight = 1;
    headingFontCard.cornerRadius = 8;
    headingFontCard.resize(524, 171);
    fontShowcaseFrame.appendChild(headingFontCard);
  
    // Create a container for the font name
    const headingFontNameContainer = figma.createFrame();
    headingFontNameContainer.name = "Heading Font Name Container";
    headingFontNameContainer.layoutMode = "VERTICAL";
    headingFontNameContainer.itemSpacing = 8;
    headingFontNameContainer.fills = [];
    headingFontNameContainer.resize(524, 80);
    headingFontNameContainer.x = 0;
    headingFontNameContainer.y = 40;
    headingFontNameContainer.primaryAxisSizingMode = "FIXED";
    headingFontNameContainer.counterAxisSizingMode = "FIXED";
    headingFontNameContainer.primaryAxisAlignItems = "CENTER";
    headingFontNameContainer.counterAxisAlignItems = "CENTER";
    headingFontCard.appendChild(headingFontNameContainer);
    // Add label for heading font
    const headingFontLabel = figma.createText();
    headingFontLabel.characters = "HEADING";
    headingFontLabel.fontSize = 11;
    headingFontLabel.fontName = { family: "Inter", style: "Medium" }; // Inter is our UI font
    headingFontLabel.fills = [{ type: 'SOLID', color: { r: 0.53, g: 0.53, b: 0.53 } }];
    headingFontLabel.x = 0;
    headingFontLabel.y = 0;
    headingFontLabel.textAlignHorizontal = "CENTER";
    headingFontLabel.lineHeight = { value: 16, unit: "PIXELS" };
    headingFontLabel.letterSpacing = { value: 4, unit: "PERCENT" };
    headingFontLabel.resize(524, 20);
  
    headingFontNameContainer.appendChild(headingFontLabel);
  
    // Add heading font name
    const headingFontName = figma.createText();
    headingFontName.characters = headingFontFull;
    headingFontName.fontSize = 32;
    
    // Try to use the actual font for display if possible, otherwise fallback to Inter
    if (!trySetFont(headingFontName, headingFontFull)) {
      console.log(`Could not use font ${headingFontFull} for display, using Inter instead`);
    }
    
    headingFontName.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
    headingFontName.textAlignHorizontal = "CENTER";
    headingFontName.lineHeight = { value: 40, unit: "PIXELS" };
    headingFontName.letterSpacing = { value: -1, unit: "PERCENT" };
    headingFontNameContainer.appendChild(headingFontName);
  
    const headingSizeText = figma.createText();
    headingSizeText.characters = "168 x 80 Hug";
    headingSizeText.fontSize = 12;
    headingSizeText.fontName = { family: "Inter", style: "Regular" };
    headingSizeText.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
  
    // Create right card for description font
    const descFontCard = figma.createFrame();
    descFontCard.name = "Description Font Card";
    descFontCard.layoutMode = "VERTICAL";
    descFontCard.primaryAxisSizingMode = "FIXED";
    descFontCard.counterAxisSizingMode = "FIXED";
    descFontCard.primaryAxisAlignItems = "CENTER";
    descFontCard.counterAxisAlignItems = "CENTER";
    descFontCard.itemSpacing = 16;
    descFontCard.fills = [{ type: 'SOLID', color: { r: 0.0549, g: 0.0549, b: 0.0549 } }];
    descFontCard.cornerRadius = 8;
    descFontCard.resize(524, 171);
    fontShowcaseFrame.appendChild(descFontCard);
  
    // Create container for description font name and label
    const descFontNameContainer = figma.createFrame();
    descFontNameContainer.name = "Description Font Name Container";
    descFontNameContainer.layoutMode = "VERTICAL";
    descFontNameContainer.fills = [];
    descFontNameContainer.resize(524, 80);
    descFontNameContainer.x = 0;
    descFontNameContainer.y = 40;
    descFontNameContainer.primaryAxisSizingMode = "FIXED";
    descFontNameContainer.counterAxisSizingMode = "FIXED";
    descFontNameContainer.primaryAxisAlignItems = "CENTER";
    descFontNameContainer.counterAxisAlignItems = "CENTER";
    descFontCard.appendChild(descFontNameContainer);
  
    // Add label for description font
    const descFontLabel = figma.createText();
    descFontLabel.characters = "DESCRIPTION";
    descFontLabel.fontSize = 11;
    descFontLabel.fontName = { family: "Inter", style: "Medium" }; // Inter is our UI font
    descFontLabel.fills = [{ type: 'SOLID', color: { r: 0.53, g: 0.53, b: 0.53 } }];
    descFontLabel.x = 0;
    descFontLabel.y = 0;
    descFontLabel.textAlignHorizontal = "CENTER";
    descFontLabel.lineHeight = { value: 16, unit: "PIXELS" };
    descFontLabel.letterSpacing = { value: 4, unit: "PERCENT" };
    descFontLabel.resize(524, 20);
    
    descFontNameContainer.appendChild(descFontLabel);
  
    // Add description font name
    const descFontName = figma.createText();
    descFontName.characters = bodyFontFull;
    descFontName.fontSize = 32;
    
    // Try to use the actual font for display if possible, otherwise fallback to Inter
    if (!trySetFont(descFontName, bodyFontFull)) {
      console.log(`Could not use font ${bodyFontFull} for display, using Inter instead`);
    }
    
    descFontName.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
    descFontName.textAlignHorizontal = "CENTER";
    descFontName.lineHeight = { value: 40, unit: "PIXELS" };
    descFontName.letterSpacing = { value: -1, unit: "PERCENT" };
    descFontNameContainer.appendChild(descFontName);
  }

function createHeadingExamples(parentFrame: FrameNode, styleData?: StyleData): void {
    // Create a section for text examples
    const textExamplesFrame = figma.createFrame();
    textExamplesFrame.name = "Text Element Examples";
    textExamplesFrame.layoutMode = "VERTICAL";
    textExamplesFrame.primaryAxisSizingMode = "AUTO";
    textExamplesFrame.counterAxisSizingMode = "FIXED";
    textExamplesFrame.itemSpacing = 48;
    textExamplesFrame.fills = [];
    textExamplesFrame.resize(1072, textExamplesFrame.height);
    parentFrame.appendChild(textExamplesFrame);
  
    // Get typography data directly from API
    let typographyData: StyleData['typography'] = {
      fontFamilies: [],
      headings: [],
      fontStyles: []
    };
    
    // Use API data provided in styleData without additional processing
    if (styleData && styleData.typography) {
      typographyData = styleData.typography;
    } else {
      // Fallback to plugin data if styleData is not provided
      const storedStyleData = figma.root.getPluginData('styleData');
      if (storedStyleData) {
        try {
          const parsedData = JSON.parse(storedStyleData) as StyleData;
          if (parsedData.typography) {
            typographyData = parsedData.typography;
          }
        } catch (error) {
          console.error('Error parsing style data:', error);
        }
      }
    }
  
    // Get default font for fallback
    const defaultFont = typographyData.fontFamilies[0] || 'Inter';
    
    // Create individual examples for each text element from API data
    if (typographyData.headings && typographyData.headings.length > 0) {
      // Create separate frames for each heading element from API
      typographyData.headings.forEach(element => {
        createTextElementExample(
          textExamplesFrame,
          element,
          defaultFont
        );
      });
    } else {
      // Fallback to default elements if none are found
      const defaultElements = [
        {
          tag: 'h1',
          fontFamily: defaultFont,
          fontWeight: 'Medium',
          fontSize: '48px',
          lineHeight: '56px',
          letterSpacing: '-1%'
        },
        {
          tag: 'h2',
          fontFamily: defaultFont,
          fontWeight: 'Medium',
          fontSize: '36px',
          lineHeight: '44px',
          letterSpacing: '-1%'
        },
        {
          tag: 'p',
          fontFamily: defaultFont,
          fontWeight: 'Regular',
          fontSize: '16px',
          lineHeight: '24px',
          letterSpacing: '0%'
        },
        {
          tag: 'span',
          fontFamily: defaultFont,
          fontWeight: 'Regular',
          fontSize: '14px',
          lineHeight: '20px',
          letterSpacing: '0%'
        },
        {
          tag: 'button',
          fontFamily: defaultFont,
          fontWeight: 'Medium',
          fontSize: '14px',
          lineHeight: '20px',
          letterSpacing: '0%'
        }
      ];
      
      defaultElements.forEach(elementData => {
        createTextElementExample(textExamplesFrame, elementData, defaultFont);
      });
    }
  }

/**
 * Creates a typography example for a single text element directly from API data
 */
function createTextElementExample(parentFrame: FrameNode, elementData: StyleData['typography']['headings'][0], defaultFont: string): void {
    // Create container for this text element example
    const elementExample = figma.createFrame();
    
    // Use tag directly from API data
    const tag = elementData.tag ? elementData.tag.toLowerCase() : 'text';
    
    elementExample.name = `${tag.toUpperCase()} Example`;
    elementExample.layoutMode = "VERTICAL";
    elementExample.primaryAxisSizingMode = "AUTO";
    elementExample.counterAxisSizingMode = "FIXED";
    elementExample.itemSpacing = 16;
    elementExample.fills = [];
    elementExample.resize(1072, elementExample.height);
    parentFrame.appendChild(elementExample);
  
    // Add element tag label
    const elementLabel = figma.createText();
    elementLabel.characters = tag.toUpperCase();
    elementLabel.fontSize = 14;
    elementLabel.fontName = { family: "Inter", style: "Regular" };
    elementLabel.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 }, opacity: 0.5 }];
    elementExample.appendChild(elementLabel);
  
    // Add element text
    const elementText = figma.createText();
    elementText.characters = "Jumpy frogs vex bad wizards.";
    
    // Use fontSize directly from API
    let fontSize = 16;
    if (elementData.fontSize) {
      const match = elementData.fontSize.match(/(\d+)/);
      if (match && match[1]) {
        fontSize = parseInt(match[1]);
      }
    }
    elementText.fontSize = fontSize;
    
    // Try to use the specified font directly
    try {
      // Get font directly from API data
      const fontFamily = elementData.fontFamily || defaultFont;
      
      // Use helper function to set the font
      if (!trySetFont(elementText, fontFamily)) {
        console.log(`Could not use font ${fontFamily} for ${tag} display, using Inter instead`);
      }
    } catch (e) {
      console.log(`Font error, using Inter as fallback: ${e}`);
      elementText.fontName = { family: "Inter", style: "Medium" };
    }
    
    elementText.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
    
    // Use lineHeight directly from API
    let lineHeight = 24;
    if (elementData.lineHeight) {
      const match = elementData.lineHeight.match(/(\d+)/);
      if (match && match[1]) {
        lineHeight = parseInt(match[1]);
      }
    }
    elementText.lineHeight = { value: lineHeight, unit: "PIXELS" };
    
    // Use letterSpacing directly from API
    let letterSpacing = 0;
    if (elementData.letterSpacing) {
      const match = elementData.letterSpacing.match(/(-?\d+)/);
      if (match && match[1]) {
        letterSpacing = parseInt(match[1]);
      }
    }
    elementText.letterSpacing = { value: letterSpacing, unit: "PERCENT" };
    elementExample.appendChild(elementText);
  
    // Add properties frame
    const propertiesFrame = figma.createFrame();
    propertiesFrame.name = `${tag.toUpperCase()} Properties`;
    propertiesFrame.layoutMode = "HORIZONTAL";
    propertiesFrame.primaryAxisSizingMode = "AUTO";
    propertiesFrame.counterAxisSizingMode = "AUTO";
    propertiesFrame.itemSpacing = 12;
    propertiesFrame.fills = [];
    propertiesFrame.layoutWrap = "WRAP";
    elementExample.appendChild(propertiesFrame);
  
    // Add Font Weight property
    const fontWeightProperty = figma.createFrame();
    fontWeightProperty.name = "Font Weight Property";
    fontWeightProperty.fills = [{ type: 'SOLID', color: { r: 0.0549, g: 0.0549, b: 0.0549 } }];
    fontWeightProperty.cornerRadius = 8;
    fontWeightProperty.verticalPadding = 6;
    fontWeightProperty.horizontalPadding = 12;
    fontWeightProperty.strokeWeight = 1;
    fontWeightProperty.strokeAlign = "INSIDE";
    fontWeightProperty.strokes = [{ type: 'SOLID', color: { r: 0.176, g: 0.176, b: 0.176 } }];
    fontWeightProperty.clipsContent = true;
    propertiesFrame.appendChild(fontWeightProperty);
  
    const fontWeightText = figma.createText();
    // Use fontWeight directly from API
    const fontWeight = elementData.fontWeight || "Regular";
    fontWeightText.characters = `Font Weight: ${fontWeight}`;
    fontWeightText.fontSize = 12;
    fontWeightText.fontName = { family: "Inter", style: "Medium" };
    fontWeightText.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
    fontWeightText.lineHeight = { value: 16, unit: "PIXELS" };
    fontWeightText.textAlignHorizontal = "CENTER";
    fontWeightText.textAlignVertical = "CENTER";
  
    fontWeightProperty.appendChild(fontWeightText);
    fontWeightProperty.resize(fontWeightText.width + 24, fontWeightText.height + 12);
    fontWeightText.x = (fontWeightProperty.width - fontWeightText.width) / 2;
    fontWeightText.y = (fontWeightProperty.height - fontWeightText.height) / 2;
  
    // Add Line Height property
    const lineHeightProperty = figma.createFrame();
    lineHeightProperty.name = "Line Height Property";
    lineHeightProperty.fills = [{ type: 'SOLID', color: { r: 0.0549, g: 0.0549, b: 0.0549 } }];
    lineHeightProperty.cornerRadius = 8;
    lineHeightProperty.verticalPadding = 6;
    lineHeightProperty.horizontalPadding = 12;
    lineHeightProperty.strokeWeight = 1;
    lineHeightProperty.strokeAlign = "INSIDE";
    lineHeightProperty.strokes = [{ type: 'SOLID', color: { r: 0.176, g: 0.176, b: 0.176 } }];
    lineHeightProperty.clipsContent = true;
    propertiesFrame.appendChild(lineHeightProperty);
  
    const lineHeightText = figma.createText();
    // Use lineHeight directly from API
    lineHeightText.characters = `Line Height: ${elementData.lineHeight || "24px"}`;
    lineHeightText.fontSize = 12;
    lineHeightText.fontName = { family: "Inter", style: "Medium" };
    lineHeightText.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
    lineHeightText.lineHeight = { value: 16, unit: "PIXELS" };
    lineHeightText.textAlignHorizontal = "CENTER";
    lineHeightText.textAlignVertical = "CENTER";
  
    lineHeightProperty.appendChild(lineHeightText);
    lineHeightProperty.resize(lineHeightText.width + 24, lineHeightText.height + 12);
    lineHeightText.x = (lineHeightProperty.width - lineHeightText.width) / 2;
    lineHeightText.y = (lineHeightProperty.height - lineHeightText.height) / 2;
  
    // Add Letter Spacing property
    const letterSpacingProperty = figma.createFrame();
    letterSpacingProperty.name = "Letter Spacing Property";
    letterSpacingProperty.fills = [{ type: 'SOLID', color: { r: 0.0549, g: 0.0549, b: 0.0549 } }];
    letterSpacingProperty.cornerRadius = 8;
    letterSpacingProperty.verticalPadding = 6;
    letterSpacingProperty.horizontalPadding = 12;
    letterSpacingProperty.strokeWeight = 1;
    letterSpacingProperty.strokeAlign = "INSIDE";
    letterSpacingProperty.strokes = [{ type: 'SOLID', color: { r: 0.176, g: 0.176, b: 0.176 } }];
    letterSpacingProperty.clipsContent = true;
    propertiesFrame.appendChild(letterSpacingProperty);
  
    const letterSpacingText = figma.createText();
    // Use letterSpacing directly from API
    letterSpacingText.characters = `Letter Spacing: ${elementData.letterSpacing || "0%"}`;
    letterSpacingText.fontSize = 12;
    letterSpacingText.fontName = { family: "Inter", style: "Medium" };
    letterSpacingText.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
    letterSpacingText.lineHeight = { value: 16, unit: "PIXELS" };
    letterSpacingText.textAlignHorizontal = "CENTER";
    letterSpacingText.textAlignVertical = "CENTER";
  
    letterSpacingProperty.appendChild(letterSpacingText);
    letterSpacingProperty.resize(letterSpacingText.width + 24, letterSpacingText.height + 12);
    letterSpacingText.x = (letterSpacingProperty.width - letterSpacingText.width) / 2;
    letterSpacingText.y = (letterSpacingProperty.height - letterSpacingText.height) / 2;
  
    // Add Font Size property
    const fontSizeProperty = figma.createFrame();
    fontSizeProperty.name = "Font Size Property";
    fontSizeProperty.fills = [{ type: 'SOLID', color: { r: 0.0549, g: 0.0549, b: 0.0549 } }];
    fontSizeProperty.cornerRadius = 8;
    fontSizeProperty.verticalPadding = 6;
    fontSizeProperty.horizontalPadding = 12;
    fontSizeProperty.strokeWeight = 1;
    fontSizeProperty.strokeAlign = "INSIDE";
    fontSizeProperty.strokes = [{ type: 'SOLID', color: { r: 0.176, g: 0.176, b: 0.176 } }];
    fontSizeProperty.clipsContent = true;
    propertiesFrame.appendChild(fontSizeProperty);
  
    const fontSizeText = figma.createText();
    // Use fontSize directly from API
    fontSizeText.characters = `Font Size: ${elementData.fontSize || "16px"}`;
    fontSizeText.fontSize = 12;
    fontSizeText.fontName = { family: "Inter", style: "Medium" };
    fontSizeText.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
    fontSizeText.lineHeight = { value: 16, unit: "PIXELS" };
    fontSizeText.textAlignHorizontal = "CENTER";
    fontSizeText.textAlignVertical = "CENTER";
  
    fontSizeProperty.appendChild(fontSizeText);
    fontSizeProperty.resize(fontSizeText.width + 24, fontSizeText.height + 12);
    fontSizeText.x = (fontSizeProperty.width - fontSizeText.width) / 2;
    fontSizeText.y = (fontSizeProperty.height - fontSizeText.height) / 2;
  
    // Add Font Family property
    const fontFamilyProperty = figma.createFrame();
    fontFamilyProperty.name = "Font Family Property";
    fontFamilyProperty.fills = [{ type: 'SOLID', color: { r: 0.0549, g: 0.0549, b: 0.0549 } }];
    fontFamilyProperty.cornerRadius = 8;
    fontFamilyProperty.verticalPadding = 6;
    fontFamilyProperty.horizontalPadding = 12;
    fontFamilyProperty.strokeWeight = 1;
    fontFamilyProperty.strokeAlign = "INSIDE";
    fontFamilyProperty.strokes = [{ type: 'SOLID', color: { r: 0.176, g: 0.176, b: 0.176 } }];
    fontFamilyProperty.clipsContent = true;
    propertiesFrame.appendChild(fontFamilyProperty);
  
    const fontFamilyText = figma.createText();
    // Use fontFamily directly from API
    fontFamilyText.characters = `Font Family: ${elementData.fontFamily || defaultFont}`;
    fontFamilyText.fontSize = 12;
    fontFamilyText.fontName = { family: "Inter", style: "Medium" };
    fontFamilyText.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
    fontFamilyText.lineHeight = { value: 16, unit: "PIXELS" };
    fontFamilyText.textAlignHorizontal = "CENTER";
    fontFamilyText.textAlignVertical = "CENTER";
  
    fontFamilyProperty.appendChild(fontFamilyText);
    fontFamilyProperty.resize(fontFamilyText.width + 24, fontFamilyText.height + 12);
    fontFamilyText.x = (fontFamilyProperty.width - fontFamilyText.width) / 2;
    fontFamilyText.y = (fontFamilyProperty.height - fontFamilyText.height) / 2;
  }