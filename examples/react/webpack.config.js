const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: { main: './index.js' },
  module: {
    rules: [
      {
        test: /\.jsx?$/i,
        use: 'babel-loader',
      },
      {
        test: /\.(jpe?g|gif|png|svg)$/i,
        use: {
          loader: 'optimize-image-loader',
          options: {
            outputPath: '/assets',
          },
        },
      },
    ],
  },
  plugins: [new CopyWebpackPlugin(['./index.html'])],
  mode: 'development',
  resolveLoader: {
    alias: {
      'optimize-image-loader': path.resolve(__dirname, '..', '..'),
    },
  },
};
