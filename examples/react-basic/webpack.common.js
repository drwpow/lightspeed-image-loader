const path = require('path');

module.exports = {
  entry: {main: './index.js'},
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
        },
      },
    ],
  },
  resolveLoader: {
    alias: {'optimize-image-loader': path.resolve(__dirname, '..', '..')},
  },
};
