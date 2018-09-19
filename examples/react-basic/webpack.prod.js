const CopyWebpackPlugin = require('copy-webpack-plugin');
const merge = require('webpack-merge');

const common = require('./webpack.common.js');

module.exports = merge(common, {
  mode: 'production',
  plugins: [new CopyWebpackPlugin(['./index.html'])],
});
