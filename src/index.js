const chalk = require('chalk');
const fs = require('fs');
const fileLoader = require('file-loader');
const imagemin = require('imagemin');
const imageminGifsicle = require('imagemin-gifsicle');
const imageminMozjpeg = require('imagemin-mozjpeg');
const imageminOptiPng = require('imagemin-optipng');
const imageminPngQuant = require('imagemin-pngquant');
const imageminSVGO = require('imagemin-svgo');
const imageminWebP = require('imagemin-webp');
const { getOptions, parseQuery, urlToRequest } = require('loader-utils');
const rawLoader = require('raw-loader');
const sharp = require('sharp');
const urlLoader = require('url-loader');
const validateOptions = require('schema-utils');

const loaderSchema = require('./loader-options.json');
const fileSchema = require('./file-options.json');

/* Settings */

const defaultQuality = 60;

/* Utils */

const normalizeExtension = filename =>
  typeof filename === 'string' ? filename.replace(/jpeg/i, 'jpg') : filename;

// Convert bits to seconds, assuming 1.5 Mb/s download
const bTo3G = kb => `${Math.ceil(10 * (kb / 1000000) / 1.5) / 10}s`;

const gifsicleQuality = q =>
  Math.min(1, Math.max(3, Math.ceil((100 - q) / (100 / 3))));

const mergeOptions = (source, loaderOptions, fileOptions) => {
  const extension = normalizeExtension(
    source.match(/\.[0-9a-z]+$/i)[0]
  ).replace('.', '');
  const filename = normalizeExtension(source.match(/[^\/]+$/)[0]);
  const newFormat =
    normalizeExtension(fileOptions.format || fileOptions.f) || null;
  const newExtension = newFormat || extension;
  let newQuality = defaultQuality;
  if (fileOptions.quality || fileOptions.q)
    newQuality = parseInt(fileOptions.quality || fileOptions.q, 10);
  else if (
    newExtension &&
    loaderOptions[newExtension] &&
    loaderOptions[newExtension].quality
  )
    newQuality = parseInt(loaderOptions[newExtension].quality, 10);

  let gifQuality = newQuality;
  if (gifQuality > 3) gifQuality = gifsicleQuality(newQuality);
  if (gifQuality < 1) gifQuality = 1;

  return {
    format: newFormat,
    extension: newExtension,
    inline: fileOptions.inline && fileOptions.inline.toString() !== 'false',
    filename,
    optimize: {
      gif: {
        ...loaderOptions.gif,
        optimizationLevel: gifQuality,
      },
      height: parseInt(fileOptions.height || fileOptions.h, 10) || null,
      jpg: {
        ...(loaderOptions.jpg || loaderOptions.jpeg),
        quality: newQuality,
      },
      png: { ...loaderOptions.png },
      quality: newQuality,
      skip: fileOptions.skip && fileOptions.skip.toString() !== 'false',
      svgo: { ...(loaderOptions.svgo || loaderOptions.svg) },
      webp: {
        ...loaderOptions.webp,
        quality: newQuality,
      },
      width: parseInt(fileOptions.width || fileOptions.w) || null,
    },
    sharp: {
      jpg: { progressive: true, quality: 100 },
      rezize: { kernel: fileOptions.interpolation || 'cubic' },
      webp: { ...loaderOptions.webp, quality: 100 },
    },
    pathname: source,
    ...loaderOptions,
  };
};

const reportSavings = ({ filename, extension }, newSize, oldSize) => {
  const sizeDiff = oldSize - newSize;
  const oldExt = filename.match(/\.[^.]+$/);
  const format = oldExt[0] !== `.${extension}` ? ` -> ${extension}` : '';
  const verb = sizeDiff >= 0 ? 'saved' : 'lost';
  const color = sizeDiff >= 0 ? chalk.green : chalk.red;

  return `${chalk.bold(`${filename}${format}`)}: ${verb} ${color(
    `${chalk.bold(`${Math.ceil(100 * sizeDiff / 1028) / 100} KB`)} (${Math.ceil(
      100 * (100 * sizeDiff / oldSize)
    ) / 100}% / ${bTo3G(sizeDiff)} on 3G)`
  )}`;
};

/* Methods */

const optimize = (source, { extension, optimize }) => {
  const plugins = [];
  switch (extension) {
    case 'jpg': {
      plugins.push(imageminMozjpeg(optimize.jpg));
      break;
    }
    case 'png': {
      plugins.push(imageminOptiPng(optimize.png));
      plugins.push(imageminPngQuant(optimize.png));
      break;
    }
    case 'gif': {
      plugins.push(imageminGifsicle(optimize.gif));
      break;
    }
    case 'svg': {
      plugins.push(imageminSVGO(optimize.svgo));
      break;
    }
    case 'webp': {
      plugins.push(imageminWebP(optimize.webp));
      break;
    }
  }
  if (typeof source.toBuffer === 'function')
    return source
      .toBuffer()
      .then(buffered => imagemin.buffer(buffered, { plugins }));

  return imagemin.buffer(fs.readFileSync(source), { plugins });
};

const format = ({ extension, format, pathname, ...options }, context) => {
  if (extension === 'svg' || extension === 'gif' || !format) return pathname;
  // Shim for file-loader renaming
  context.resourcePath = context.resourcePath.replace(
    /\.[^.]+$/,
    `.${extension}`
  );
  return sharp(pathname).toFormat(format, options.sharp[format]);
};

const resize = (
  source,
  { extension, optimize: { height, width }, ...options }
) => {
  // Return early if un-resizable
  if (extension === 'svg' || extension === 'gif') return source;
  // We might have skipped sharp() from previous step
  const img = typeof source.resize !== 'function' ? sharp(source) : source;
  if (!width && !height) return img;
  const resized = img
    .resize(width, height, options.sharp.resize)
    .withoutEnlargement(true);

  // .max() necessary if both width & height specified
  return width && height ? resized.max() : resized;
};

/* Loader */

module.exports = function loader(source) {
  // Let webpack know this loader is async
  const callback = this.async();

  // Enable webpack caching
  this.cacheable && this.cacheable();

  // Load file options & break if syntax error
  const fileOptions = this.resourceQuery ? parseQuery(this.resourceQuery) : {};
  if (Object.keys(fileOptions).length)
    validateOptions(fileSchema, fileOptions, 'Optimize Image Loader');

  // Get global fallback options & break if syntax error
  const loaderOptions = getOptions(this) || {};
  validateOptions(loaderSchema, loaderOptions, 'Optimize Image Loader');

  // Combine file & fallback options, giving file options priority
  const options = mergeOptions(this.resourcePath, loaderOptions, fileOptions);

  // Save size before optimization
  const sizeBefore = fs.statSync(this.resourcePath).size;

  // Our final function (accessible to loader scope)
  const complete = optimized => {
    if (options.optimize.skip || options.emitFile === false) {
      console.log(`${chalk.bold(options.filename)}: skipping…`);
      return callback(null, fileLoader.call(this, optimized));
    }
    console.log(reportSavings(options, optimized.byteLength, sizeBefore));

    if (options.inline && options.extension === 'svg')
      return callback(null, rawLoader.call(this, optimized.toString()));
    else if (options.inline)
      return callback(null, urlLoader.call(this, optimized));

    return callback(null, fileLoader.call(this, optimized));
  };

  // Path 1: complete (if skipping)
  if (options.optimize.skip || options.emitFile === false)
    return complete(source);

  // Path 2: format -> resize -> optimize -> complete
  const formatted = format(options, this);
  const resized = resize(formatted, options);
  return optimize(resized, options)
    .then(optimized => complete(optimized))
    .catch(error => callback(error));
};

module.exports.raw = true;
