const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlInlineScriptPlugin = require('html-inline-script-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

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
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader'
        ]
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg)$/,
        type: 'asset/resource',
        generator: {
          filename: 'images/[name][ext]'
        }
      },
      {
        test: /\.svg$/,
        type: 'asset/source'
      },
    ]
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
    publicPath: ''
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/ui.html',
      filename: 'ui.html',
      inject: 'body',
      minify: false,
      chunks: ['ui']
    }),
    new MiniCssExtractPlugin({
      filename: '[name].css'
    }),
    new HtmlInlineScriptPlugin({
      tests: [/ui\.js$/]
    }),
    new CopyWebpackPlugin({
      patterns: [
        { 
          from: 'src/assets', 
          to: 'assets' 
        }
      ]
    })
  ],
  devtool: 'source-map',
  mode: 'production'
};