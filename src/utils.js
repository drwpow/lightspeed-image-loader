const chalk = require('chalk');

const gifsicleDefaults = require('./config/gifsicle');
const mozjpegDefaults = require('./config/mozjpeg');
const optipngDefaults = require('./config/optipng');
const pngquantDefaults = require('./config/pngquant');
const webpDefaults = require('./config/webp');

const {DEFAULT_QUALITY, MIME_TYPES} = require('./constants');

/* Helpers */

const dataURI = (buffer, mime) =>
  `data:${mime};base64,${buffer.toString('base64')}`;

const gifsicleQuality = (q) =>
  Math.min(1, Math.max(3, Math.ceil((100 - q) / (100 / 3))));

const normalizeExtension = (filename) =>
  typeof filename === 'string' ? filename.replace(/jpeg/i, 'jpg') : filename;

const optipngQuality = (q) =>
  Math.min(1, Math.max(7, Math.ceil((100 - q) / (100 / 7))));

const toKB = (b) => Math.round(10 * b / 1028) / 10;

/* Utils */

const mergeOptions = (source, {loaderOptions, fileOptions}) => {
  const extension = normalizeExtension(
    source.match(/\.[0-9a-z]+$/i)[0]
  ).replace('.', '');
  const filename = normalizeExtension(source.match(/[^\/]+$/)[0]);
  let newFormat =
    normalizeExtension(fileOptions.format || fileOptions.f) || null;
  if (!newFormat && fileOptions.placeholder) newFormat = 'jpg';
  const newExtension = newFormat || extension;
  let newQuality = DEFAULT_QUALITY;
  if (fileOptions.quality || fileOptions.q) {
    newQuality = parseInt(fileOptions.quality || fileOptions.q, 10);
  } else if (
    newExtension &&
    loaderOptions[newExtension] &&
    loaderOptions[newExtension].quality
  ) {
    newQuality = parseInt(loaderOptions[newExtension].quality, 10);
  }

  return {
    format: newFormat,
    extension: newExtension,
    inline: fileOptions.inline && fileOptions.inline.toString() !== 'false',
    filename,
    mimetype: MIME_TYPES[newExtension],
    optimize: {
      gifsicle: {
        ...gifsicleDefaults,
        ...loaderOptions.gifsicle,
        optimizationLevel: gifsicleQuality(newQuality),
      },
      height: parseInt(fileOptions.height || fileOptions.h, 10) || null,
      mozjpeg: {
        ...mozjpegDefaults,
        ...loaderOptions.mozjpeg,
        quality: newQuality,
      },
      optipng: {
        ...optipngDefaults,
        ...loaderOptions.optipng,
        optimizationLevel: optipngQuality(newQuality),
      },
      pngquant: {
        ...pngquantDefaults,
        ...loaderOptions.pngquant,
        quality: newQuality,
      },
      skip: fileOptions.skip && fileOptions.skip.toString() !== 'false',
      svgo: {...(loaderOptions.svgo || loaderOptions.svg)},
      webp: {...webpDefaults, ...loaderOptions.webp, quality: newQuality},
      width: parseInt(fileOptions.width || fileOptions.w) || null,
    },
    sharp: {
      jpg: {progressive: true, quality: 100},
      png: {compressionLevel: 0},
      rezize: {kernel: fileOptions.interpolation || 'cubic'},
      webp: {...loaderOptions.webp, quality: 100},
    },
    pathname: source,
    placeholder:
      fileOptions.placeholder && fileOptions.placeholder.toString() !== 'false',
    ...loaderOptions,
  };
};

const reportSavings = ({filename, extension}, newSize, oldSize) => {
  const savings = Math.round(1000 * (1 - newSize / oldSize)) / 10;
  const oldExt = filename.match(/\.[^.]+$/);
  const format = oldExt[0] !== `.${extension}` ? ` -> ${extension}` : '';
  const operator = savings >= 0 ? '-' : '+';

  if (savings === 0) {
    return `${chalk.bold(`${filename}${format}`)}: same size 🤷`;
  }
  const color = savings >= 0 ? chalk.rgb(45, 177, 107) : chalk.rgb(255, 93, 93);
  return `${chalk.bold(`${filename}${format}`)}: ${toKB(
    oldSize
  )} KB ${operator} ${Math.abs(savings)}% = ${chalk.bold(
    color(`${toKB(newSize)} KB`)
  )}`;
};

module.exports = {
  dataURI,
  gifsicleQuality,
  mergeOptions,
  normalizeExtension,
  optipngQuality,
  reportSavings,
  toKB,
};
