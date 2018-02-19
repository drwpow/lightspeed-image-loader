import fs from 'fs';
import imagemin from 'imagemin';
import imageminGifsicle from 'imagemin-gifsicle';
import imageminJpegOptim from 'imagemin-jpegoptim';
import imageminOptiPng from 'imagemin-optipng';
import imageminPngQuant from 'imagemin-pngquant';
import imageminSVGO from 'imagemin-svgo';
import imageminWebP from 'imagemin-webp';
import { getOptions, parseQuery } from 'loader-utils';
import sharp from 'sharp';
import validateOptions from 'schema-utils';

import loaderSchema from './loader-options.json';
import fileSchema from './file-options.json';
import { networkInterfaces } from 'os';

/* Settings */

const defaultQuality = 75;

/* Utils */

const gifsicleQuality = q => Math.ceil((100 - q) / (100 / 3));

const reportSavings = (filename, newSize, oldSize) => {
  const sizeDiff = oldSize - newSize;
  console.log(
    `${filename}: saved ${sizeDiff / 1028} KB (${100 * sizeDiff / oldSize}%)}`
  );
};

/* Methods */

const optimize = (buffer, options) => {
  const plugins = [
    imageminGifsicle(options.gif),
    imageminJpegOptim(options.jpg),
    imageminOptiPng(options.png),
    imageminPngQuant(options.png),
    imageminSVGO(options.svgo),
  ];

  if (options.format === 'webp') plugins.push(imageminWebP(options.webp));

  return imagemin.buffer(buffer, { plugins });
};

const reformat = (buffer, options) => buffer.format(options.format);

const resize = (buffer, options) =>
  buffer.resize(options.width, options.height).withoutEnlargement(true);

/* Loader */

export default function loader(src) {
  const loaderOptions = getOptions(this) || {};
  validateOptions(loaderOptions, loaderOptions, 'Optimize Image Loader');
  const fileOptions = this.resourceQuery ? parseQuery(this.resourceQuery) : {};
  if (Object.keys(fileOptions).length)
    validateOptions(fileSchema, fileOptions, 'Optimize Image Loader');

  const filename = this.resourcePath.match(/[^\/]+$/)[0];

  if (fileOptions.skip && fileOptions.skip.toString() !== 'false') {
    console.log(`${filename}: skipping…`);
    return src;
  }

  const callback = this.async();

  const filetype = fileOptions.format
    ? fileOptions.format
    : this.resourcePath.match(/\.[0-9a-z]+$/i)[0];
  const oldSize = src.byteLength;

  const newQuality =
    parseInt(fileOptions['quality' || 'q'], 10) ||
    (loaderOptions[filetype]
      ? parseInt(loaderOptions[filetype]['quality' || 'q'], 10)
      : null) ||
    parseInt(loaderOptions['quality' || 'q'], 10) ||
    defaultQuality;

  const mergedOptions = {
    format: fileOptions.format || null,
    gif: {
      ...loaderOptions.gif,
      quality: gifsicleQuality(newQuality),
    },
    height: !fileOptions['width' || 'w'] ? fileOptions['height' || 'h'] : null, // Only set height if no width
    jpg: {
      ...loaderOptions['jpg' || 'jpeg'],
      max: newQuality,
    },
    png: { ...loaderOptions.png },
    quality: newQuality,
    svgo: { ...fileOptions['svgo' || 'svg'] },
    webp: { quality: newQuality },
    width: fileOptions['width' || 'w'],
  };

  const shouldSharp = mergedOptions.format
    ? mergedOptions.format !== 'gif' && mergedOptions.format !== 'svg'
    : filetype !== 'gif' && filetype !== 'svg';

  let newImage = src;

  /* Format & Resize, if supported by Sharp */

  if (shouldSharp) {
    newImage = sharp(newImage);
    if (mergedOptions.format) newImage = reformat(newImage, mergedOptions);
    if (mergedOptions.width || mergedOptions.height)
      newImage = resize(newImage, mergedOptions);

    /* Exit if skipping optimization (always skips in dev, for speed) */

    if (
      process.env.NODE_ENV === 'development' ||
      (mergedOptions.quality >= 100 && filetype !== 'svg')
    ) {
      return newImage
        .toBuffer()
        .then(data => {
          reportSavings(filename, data.byteLength, oldSize);
          callback(null, data);
        })
        .error(err => this.emitError(err));
    }
  }

  /* Optimize & Finish */

  optimize(newImage, mergedOptions)
    .then(data => {
      reportSavings(filename, data.byteLength, oldSize);
      callback(null, data);
    })
    .error(err => this.emitError(err));
}

export const raw = true;
