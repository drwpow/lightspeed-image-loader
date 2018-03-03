import fs from 'fs';
import fileLoader from 'file-loader';
import imagemin from 'imagemin';
import imageminGifsicle from 'imagemin-gifsicle';
import imageminJpegOptim from 'imagemin-jpegoptim';
import imageminOptiPng from 'imagemin-optipng';
import imageminPngQuant from 'imagemin-pngquant';
import imageminSVGO from 'imagemin-svgo';
import imageminWebP from 'imagemin-webp';
import { getOptions, parseQuery } from 'loader-utils';
import rawLoader from 'raw-loader';
import sharp from 'sharp';
import urlLoader from 'url-loader';
import validateOptions from 'schema-utils';

import loaderSchema from './loader-options.json';
import fileSchema from './file-options.json';

/* Settings */

const defaultQuality = 60;

/* Utils */

const normalizeExtension = filename =>
  typeof filename === 'string' ? filename.replace(/jpeg/i, 'jpg') : filename;

const gifsicleQuality = q => Math.ceil((100 - q) / (100 / 3));

const mergeOptions = (source, fileOptions, loaderOptions) => {
  const extension = normalizeExtension(
    this.resourcePath.match(/\.[0-9a-z]+$/i)[0]
  );
  const filename = normalizeExtension(this.resourcePath.match(/[^\/]+$/)[0]);
  const newFormat = normalizeExtension(fileOptions['format' || 'f']) || null;
  const newExtension = newFormat ? newFormat : extension;
  let newQuality = defaultQuality;
  if (fileOptions['quality' || 'q'])
    newQuality = parseInt(fileOptions['quality' || 'q'], 10);
  else if (newExtension && loaderOptions[newExtension]['quality' || 'q'])
    newQuality = parseInt(loaderOptions[newExtension]['quality' || 'q'], 10);
  else if (loaderOptions['quality' || 'q'])
    newQuality = loaderOptions['quality' || 'q'];

  const outputPath =
    typeof loaderOptions.outputPath === 'function'
      ? loaderOptions.outputPath(filename)
      : loaderOptions.outputPath + filename;

  return {
    format: newFormat,
    emitFile: options.emitFile === false ? false : true,
    extension: newExtension,
    inline: fileOptions.inline && fileOptions.inline.toString() !== 'false',
    filename,
    outputPath,
    optimize: {
      gif: {
        ...loaderOptions.gif,
        quality: gifsicleQuality(newQuality),
      },
      height: !fileOptions['width' || 'w']
        ? fileOptions['height' || 'h']
        : null, // Only set height if no width
      jpg: {
        ...loaderOptions['jpg' || 'jpeg'],
        max: newQuality,
      },
      png: { ...loaderOptions.png, quality: newQuality },
      quality: newQuality,
      skip: fileOptions.skip && fileOptions.skip.toString() !== 'false',
      svgo: { ...fileOptions['svgo' || 'svg'] },
      webp: { quality: newQuality },
      width: fileOptions['width' || 'w'],
    },
    pathname: resourcePath,
  };
};

const reportSavings = (filename, newSize, oldSize) => {
  const sizeDiff = newSize - oldSize;
  return `${filename}: ${sizeDiff / 1028} KB (${-100 * sizeDiff / oldSize}%)}`;
};

/* Methods */

const complete = (source, options, oldSize, callback) => {
  const message = options.skip
    ? `${options.filename}: skipping…`
    : reportSavings(options.filename, source.byteLength, oldSize);

  if (options.inline && options.output === 'svg')
    return callback(message, rawLoader.call(this, source));
  else if (options.inline)
    return callback(message, urlLoader.call(this, source));

  return callback(message, fileLoader.call(this, source));
};

const optimize = (source, { extension, optimize }) => {
  const plugins = [
    imageminGifsicle(optimize.gif),
    imageminJpegOptim(optimize.jpg),
    imageminOptiPng(optimize.png),
    imageminPngQuant(optimize.png),
    imageminSVGO(optimize.svgo),
  ];
  if (extension === 'webp') plugins.push(imageminWebP(optimize.webp));
  return imagemin.buffer(source, { plugins });
};

const format = (source, { extension, optimize: { format } }) => {
  if (extension === 'svg' || extension === 'gif') {
    return Promise(source);
  }
  const buffer = sharp(source).toBuffer();
  return format ? buffer.format(format) : buffer;
};

const resize = (source, { extension, optimize: { height, width } }) => {
  if (extension === 'svg' || extension === 'gif') {
    return Promise(source);
  } else if (width || height) {
    return source.resize(width, height).withoutEnlargement(true);
  }
  return Promise(source);
};

/* Loader */

module.exports = function loader(source) {
  /* Let webpack know this loader is async */
  const callback = this.async();

  /* Load file options & break if syntax error */
  const fileOptions = this.resourceQuery ? parseQuery(this.resourceQuery) : {};
  if (Object.keys(fileOptions).length)
    validateOptions(fileSchema, fileOptions, 'Optimize Image Loader');

  /* Get global fallback options & break if syntax error */
  const loaderOptions = getOptions(this) || {};
  validateOptions(loaderSchema, loaderOptions, 'Optimize Image Loader');

  /* Combine file & fallback options, giving file options priority */
  const options = mergeOptions(this.resourcePath, fileOptions, loaderOptions);

  /* Return early if skipping file */
  if (options.skip || options.emitFile === false) {
    complete(source, options, sizeBefore, callback);
  }

  const sizeBefore = source.byteLength;

  format(source, options).then(data =>
    resize(data, options).then(data =>
      optimize(data, options).then(data =>
        complete(data, options, sizeBefore, callback)
      )
    )
  );
};
