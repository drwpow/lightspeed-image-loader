const sharp = require('sharp');

module.exports = ({context, extension, format, pathname, ...options}) => {
  if (extension === 'svg' || extension === 'gif' || !format) return pathname;
  // Shim for file-loader renaming
  context.resourcePath = context.resourcePath.replace(
    /\.[^.]+$/,
    `.${extension}`
  );
  return sharp(pathname).toFormat(format, options.sharp[format]);
};
