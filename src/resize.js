const sharp = require('sharp');

const {LQIP_WIDTH} = require('./constants');

module.exports = (source, {extension, optimize, placeholder}) => {
  // Return early if un-resizable
  if (extension === 'svg' || extension === 'gif') return source;
  // We might have skipped sharp() from previous step
  const img = typeof source.resize !== 'function' ? sharp(source) : source;
  const w = placeholder ? LQIP_WIDTH : optimize.width;
  const h = placeholder ? null : optimize.height;
  if (!w && !h) return img;
  return img.resize(w, h).withoutEnlargement(true);

  // .max() necessary if both width & height specified
  return w && h ? resized.max() : resized;
};
