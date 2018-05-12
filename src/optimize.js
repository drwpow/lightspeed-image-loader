const fs = require('fs');
const imagemin = require('imagemin');
const imageminGifsicle = require('imagemin-gifsicle');
const imageminMozjpeg = require('imagemin-mozjpeg');
const imageminOptiPng = require('imagemin-optipng');
const imageminPngQuant = require('imagemin-pngquant');
const imageminSVGO = require('imagemin-svgo');
const imageminWebP = require('imagemin-webp');

module.exports = (
  source,
  {optimize: {gifsicle, mozjpeg, pngquant, optipng, svgo, webp}}
) => {
  const plugins = [
    imageminGifsicle(gifsicle), // GIF
    imageminMozjpeg(mozjpeg), // JPG
    imageminPngQuant(pngquant), // PNG step 1
    imageminOptiPng(optipng), // PNG step 2
    imageminSVGO(svgo), // SVG
    imageminWebP(webp), // WebP
  ];
  if (typeof source.toBuffer === 'function') {
    return source
      .toBuffer()
      .then((buffered) => imagemin.buffer(buffered, {plugins}));
  }

  return imagemin.buffer(fs.readFileSync(source), {plugins});
};
