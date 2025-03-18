// Service for handling API requests
import { StyleData } from '../types/StyleData';

/**
 * Error response from API
 */
export interface ApiErrorResponse {
  status: string;
  code: string;
  message: string;
  details?: string;
  url?: string;
  timestamp?: string;
}

/**
 * Fetches style data from the API
 */
export async function fetchStyleData(url: string): Promise<{ styleData: StyleData, pageTitle: string }> {
  try {
    const apiUrl = `https://style-finder-api-x1ur.onrender.com/scrape?url=${encodeURIComponent(url)}`;
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    const apiData = await response.json();
    
    // Check if the response contains an error
    if (!response.ok || apiData.status === 'error') {
      // If we have a standard API error response
      if (apiData.status === 'error' && apiData.message) {
        throw new Error(apiData.message);
      }
      // Otherwise, throw a generic error
      throw new Error(`API error! Status: ${response.status}`);
    }
    
    // Get page title from API response
    const pageTitle = apiData.title || 'Untitled Page';
    
    // Process API data into StyleData format
    const styleData = processApiData(apiData);
    
    return {
      styleData,
      pageTitle
    };
  } catch (error) {
    console.error("Error fetching from API:", error);
    throw error;
  }
}

/**
 * Processes API response data into StyleData format
 */
function processApiData(apiData: any): StyleData {
  // Process colors from API - maintain the full color objects with name, hex, rgb, and count
  // If the colors are already in the correct format, use them directly
  let colors = [];
  
  if (apiData.colors && Array.isArray(apiData.colors)) {
    // Check if the colors are in the expected format
    if (apiData.colors.length > 0 && typeof apiData.colors[0] === 'object' && 'hex' in apiData.colors[0]) {
      // Colors are already in the right format with objects containing name, hex, rgb, count
      colors = apiData.colors.map((color: any) => ({
        name: color.name || 'Unnamed Color',
        hex: color.hex || '#000000',
        rgb: color.rgb || `rgb(0, 0, 0)`,
        count: color.count || 1
      }));
    } else {
      // If colors are in the old format (just strings), convert them
      colors = apiData.colors.map((color: string) => {
        // For backward compatibility with the old format
        return {
          name: `Color ${color.replace('#', '')}`,
          hex: color,
          rgb: hexToRgb(color),
          count: 1
        };
      });
    }
  }
  
  // Process gradients from API
  let gradients: string[] = [];
  
  if (apiData.gradients) {
    // Check if gradients are in the new format (with name, start, end properties)
    if (Array.isArray(apiData.gradients) && 
        apiData.gradients.length > 0 && 
        typeof apiData.gradients[0] === 'object' && 
        'start' in apiData.gradients[0] && 
        'end' in apiData.gradients[0]) {
      
      // New format with start and end colors
      gradients = apiData.gradients.map((gradient: any) => {
        const startColor = gradient.start || '#FFFFFF';
        const endColor = gradient.end || '#000000';
        const gradientName = gradient.name || 'Unnamed Gradient';
        
        // Create a linear gradient string format that includes the name as a comment
        return `/* Name: ${gradientName} */ linear-gradient(180deg, ${startColor}, ${endColor})`;
      });
    } else {
      // Process in the old format (type, colors, angle)
      gradients = (apiData.gradients || []).map((gradient: any) => {
        if (gradient.type === 'linear-gradient') {
          const colorStops = gradient.colors.map((stop: any) => 
            `${stop.color} ${stop.position || ''}`
          ).join(', ');
          
          const angle = gradient.angle || '180deg';
          return `linear-gradient(${angle}, ${colorStops})`;
        } else if (gradient.type === 'radial-gradient') {
          const colorStops = gradient.colors.map((stop: any) => 
            `${stop.color} ${stop.position || ''}`
          ).join(', ');
          
          return `radial-gradient(circle, ${colorStops})`;
        }
        
        return '';
      }).filter(Boolean);
    }
  }
  
  // Process typography items from API
  const typographyItems = apiData.typography || [];
  
  // Extract unique font families and sizes
  const fontFamilies: string[] = [];
  const fontSizes: string[] = [];
  const headings: StyleData['typography']['headings'] = [];
  const fontStyles: StyleData['typography']['fontStyles'] = [];
  
  typographyItems.forEach((item: any) => {
    if (item['font-family'] && !fontFamilies.includes(item['font-family'])) {
      fontFamilies.push(item['font-family']);
    }
    
    if (item['font-size'] && !fontSizes.includes(item['font-size'])) {
      fontSizes.push(item['font-size']);
    }
    
    // Convert API typography items to our headings format
    headings.push({
      tag: item.tag || 'div',
      fontFamily: item['font-family'] || 'Inter',
      fontWeight: item['font-weight'] || '400',
      fontSize: item['font-size'] || '16px',
      lineHeight: item['line-height'] || 'normal',
      letterSpacing: item['letter-spacing'] || 'normal'
    });
    
    // Also add to fontStyles if it's a unique combination
    const fontStyleExists = fontStyles.some(style => 
      style.fontFamily === item['font-family'] && 
      style.fontWeight === item['font-weight'] && 
      style.fontSize === item['font-size'] && 
      style.lineHeight === item['line-height'] && 
      style.letterSpacing === item['letter-spacing']
    );
    
    if (!fontStyleExists) {
      fontStyles.push({
        fontFamily: item['font-family'] || 'Inter',
        fontWeight: item['font-weight'] || '400',
        fontSize: item['font-size'] || '16px',
        lineHeight: item['line-height'] || 'normal',
        letterSpacing: item['letter-spacing'] || 'normal'
      });
    }
  });
  
  // Ensure we have at least one font family and size
  if (fontFamilies.length === 0) fontFamilies.push('Inter');
  if (fontSizes.length === 0) fontSizes.push('16px');
  
  // Sort headings and fontStyles by fontSize in descending order
  const sortByFontSize = (a: any, b: any) => {
    const sizeA = parseInt(a.fontSize) || 0;
    const sizeB = parseInt(b.fontSize) || 0;
    return sizeB - sizeA;
  };
  
  // Create typography object
  const typography = {
    fontFamilies,
    headings: headings.length > 0 ? headings.sort(sortByFontSize) : [
      {
        tag: 'h1',
        fontFamily: 'Inter',
        fontWeight: 'Medium',
        fontSize: '32px',
        lineHeight: '56px/64px',
        letterSpacing: '-1%'
      }
    ],
    fontStyles: fontStyles.length > 0 ? fontStyles.sort(sortByFontSize) : [
      {
        fontFamily: 'Inter',
        fontWeight: 'Regular',
        fontSize: '16px',
        lineHeight: 'normal',
        letterSpacing: 'normal'
      }
    ]
  };
  
  return {
    colors,
    fonts: fontFamilies,
    fontSizes,
    gradients,
    typography
  };
}

/**
 * Converts hex color to RGB string
 */
function hexToRgb(hex: string): string {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Parse the hex values
  let r, g, b;
  if (hex.length === 3) {
    r = parseInt(hex[0] + hex[0], 16);
    g = parseInt(hex[1] + hex[1], 16);
    b = parseInt(hex[2] + hex[2], 16);
  } else {
    r = parseInt(hex.substring(0, 2), 16);
    g = parseInt(hex.substring(2, 4), 16);
    b = parseInt(hex.substring(4, 6), 16);
  }
  
  // Return as rgb string
  return `rgb(${r}, ${g}, ${b})`;
} 