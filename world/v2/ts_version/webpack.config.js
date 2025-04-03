// webpack.config.js
const path = require('path'); // Node.js module for working with file paths
const HtmlWebpackPlugin = require('html-webpack-plugin'); // Import the plugin

module.exports = {
  // 1. Entry Point: Where Webpack starts bundling
  entry: './src/main.ts', // Adjust if your main file is named differently or located elsewhere

  // 2. Mode: 'development' for easier debugging, 'production' for optimized builds
  mode: 'development', // Use 'production' when deploying

  // 3. Module Rules: How to handle different file types
  module: {
    rules: [
      {
        test: /\.tsx?$/, // Look for .ts or .tsx files
        use: 'ts-loader', // Use ts-loader to process them
        exclude: /node_modules/, // Don't process files in node_modules
      },
    ],
  },

  // 4. Resolve Extensions: Allows importing without specifying file extensions
  resolve: {
    extensions: ['.tsx', '.ts', '.js'], // Order matters
  },

  // 5. Output: Where to put the final bundled file
  output: {
    filename: 'bundle.js', // Name of the output file
    path: path.resolve(__dirname, 'dist'), // Output directory (creates 'dist' folder if it doesn't exist)
    clean: true, // Clean the output directory before each build
  },

  // 6. Devtool (Optional): Source maps for easier debugging
  devtool: 'inline-source-map', // Good for development

  // 7. Dev Server (Optional): For live reloading during development
    //  Requires installing webpack-dev-server: npm install --save-dev webpack-dev-server
  devServer: {
    static: './dist', // Serve files from the 'dist' directory
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html', // Use your existing index.html as a template
    }),
  ],
};