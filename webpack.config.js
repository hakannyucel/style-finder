const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    code: './src/code.ts',
    ui: './src/ui.ts'
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist')
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: './src/ui.html', to: './ui.html' },
        { from: './src/header.jpg', to: './header.jpg' }
      ]
    })
  ]
};