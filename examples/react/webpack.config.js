const path = require('path');

module.exports = {
  module: {
    rules: [
      {
        test: /\.jsx?$/i,
        use: 'babel-loader',
      },
      {
        test: /(jpe?g|gif|png|svg)$/i,
        use: {
          loader: 'optimize-image-loader',
          options: {
            outputPath: '/assets',
          },
        },
      },
    ],
  },
  resolveLoader: {
    alias: {
      'optimize-image-loader': path.resolve(__dirname, '..', '..'),
    },
  },
};
