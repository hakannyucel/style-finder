# StyleFinder

![StyleFinder Logo](src/assets/header-logo.svg)

> A Figma plugin that extracts style information from websites, enabling designers to capture colors, fonts, and other design elements for use in their projects.

## Features

- **Color Extraction**: Automatically identifies and extracts color palettes from websites
- **Typography Analysis**: Captures font families, sizes, weights, and styles used across the website
- **Gradient Detection**: Identifies and extracts gradient styles for use in designs
- **Visual Organization**: Creates neatly organized Figma frames containing all extracted style elements
- **User-Friendly Interface**: Simple UI that allows designers to enter any URL and extract styles with one click

## Installation

### For Users

1. Open Figma and go to the Community tab
2. Search for "StyleFinder"
3. Click "Install"

### For Developers

1. Clone this repository:
   ```bash
   git clone https://github.com/hakannyucel/style-finder.git
   cd style-finder
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the plugin:
   ```bash
   npm run build
   ```

4. To load the plugin in Figma:
   - Open Figma Desktop app
   - Go to Plugins > Development > Import plugin from manifest...
   - Select the `manifest.json` file from this project

## Usage

1. Select the StyleFinder plugin from your Figma plugins
2. Enter the URL of the website you want to extract styles from
3. Click "Extract Styles"
4. Wait for the extraction process to complete
5. StyleFinder will generate frames in your Figma document containing:
   - Color palette with hex and RGB values
   - Typography styles with font families and properties
   - Gradient styles if available

## Development

### Project Structure

```
style-finder/
├── dist/               # Compiled files
├── src/
│   ├── assets/         # Images and static assets
│   ├── components/     # Frame generation components
│   ├── services/       # API and data processing services
│   ├── types/          # TypeScript type definitions
│   ├── ui/             # UI components
│   ├── utils/          # Utility functions
│   ├── code.ts         # Main plugin code
│   ├── ui.html         # Plugin UI HTML
│   └── ui.ts           # UI logic
├── manifest.json       # Figma plugin manifest
├── package.json        # Node dependencies
├── tsconfig.json       # TypeScript configuration
└── webpack.config.js   # Webpack configuration
```

### Development Workflow

1. Make code changes
2. Run the development server:
   ```bash
   npm run dev
   ```
3. The plugin will be rebuilt automatically when files change

## Contributing

We welcome contributions to StyleFinder! Please follow these steps:

1. Fork the repository
2. Create a new branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Make your changes
4. Run tests (if applicable)
5. Commit your changes following the commit convention:
   ```
   <type>: <english description>
   ```
   Types: feat, fix, docs, style, refactor, test, chore
6. Push to your branch
7. Submit a Pull Request

Please ensure your code follows existing style conventions and includes appropriate comments.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

- Author: Hakan Yucel
- GitHub: [Your GitHub Profile](https://github.com/hakannyucel)

---

Made with ❤️ for designers who seek inspiration from the web 