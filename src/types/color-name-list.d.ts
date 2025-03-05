declare module 'color-name-list' {
  interface ColorEntry {
    name: string;
    hex: string;
  }

  const colornames: ColorEntry[];
  export default colornames;
} 