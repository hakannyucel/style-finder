// Interface defining the style data structure
export interface StyleData {
  colors: {
    name: string;
    hex: string;
    rgb: string;
    count: number;
  }[];
  fonts: string[];
  fontSizes: string[];
  gradients: string[];
  typography: {
    fontFamilies: string[];
    headings: {
      tag: string;
      fontFamily: string;
      fontWeight: string;
      fontSize: string;
      lineHeight: string;
      letterSpacing: string;
    }[];
    fontStyles: {
      fontFamily: string;
      fontWeight: string;
      fontSize: string;
      lineHeight: string;
      letterSpacing: string;
    }[];
  };
} 