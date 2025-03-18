// Main component for creating style finder frames

import { StyleData } from '../types/StyleData';
import { createColorFrame } from './ColorFrame';
import { createGradientFrame } from './GradientFrame';
import { createTypographyFrame } from './TypographyFrame';
import headerLogo from '../assets/header-logo.svg';
import headerBanner from '../assets/header-banner.svg';

async function loadFonts(): Promise<void> {
  await Promise.all([
    figma.loadFontAsync({ family: "Inter", style: "Regular" }),
    figma.loadFontAsync({ family: "Inter", style: "Medium" }),
    figma.loadFontAsync({ family: "Inter", style: "Bold" })
  ]);
}

/**
 * Creates the main style finder frames
 */
export async function createFramesFromStyles(styleData: StyleData, url: string, pageTitle: string): Promise<void> {
  try {
    await loadFonts();
    
    // Create the main frame that will contain all sections
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
    
    // Create header section
    const headerY = createHeaderSection(mainFrame, url, pageTitle);
    
    // Create color section
    let currentY = headerY;
    currentY = createColorFrame(mainFrame, styleData, currentY);
    
    // Create gradient section
    currentY = createGradientFrame(mainFrame, styleData, currentY);
    
    // Create typography section
    currentY = await createTypographyFrame(mainFrame, styleData, currentY);
    
    // Save the style data to the root node for later use
    figma.root.setPluginData('styleData', JSON.stringify(styleData));
    figma.root.setPluginData('url', url);
    figma.root.setPluginData('pageTitle', pageTitle);
    
    // Set viewport to show the created frames
    figma.viewport.scrollAndZoomIntoView([mainFrame]);
    
    console.log("Frames created successfully");
  } catch (error) {
    console.error("Error creating frames:", error);
    figma.notify("Error creating frames: " + (error as Error).message);
  }
}

/**
 * Creates the header section
 */
function createHeaderSection(mainFrame: FrameNode, url: string, pageTitle: string): number {
  // Create title section
  const titleSection = figma.createFrame();
  titleSection.name = "Title Section";
  titleSection.resize(1200, 246);
  titleSection.fills = [];
  titleSection.x = 0;
  titleSection.y = 0;
  titleSection.horizontalPadding = 8;
  titleSection.verticalPadding = 8;
  titleSection.itemSpacing = 8;
  mainFrame.appendChild(titleSection);

  // Create title container
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

  // Create title text container
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

  // Add logo
  var logoNode = figma.createNodeFromSvg(headerLogo);
  logoNode.fills = [];
  titleTextContainer.appendChild(logoNode);

  // Add banner
  var bannerNode = figma.createNodeFromSvg(headerBanner);
  bannerNode.fills = [];
  bannerNode.x = 594;
  bannerNode.y = 16;
  bannerNode.resize(526, 198);
  titleContainer.appendChild(bannerNode);

  titleContainer.appendChild(titleTextContainer);

  // Create second title text container
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

  // Add main title text
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

  // Add URL text
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
  
  // Return the new Y position (after the header)
  return titleSection.y + titleSection.height;
} 