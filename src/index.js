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
const {getOptions, parseQuery} = require('loader-utils');
const rawLoader = require('raw-loader');
const sharp = require('sharp');
const validateOptions = require('schema-utils');

const loaderSchema = require('./config/loader.json');
const fileSchema = require('./config/file.json');
const mozjpegDefaults = require('./config/mozjpeg');
const optipngDefaults = require('./config/optipng');
const pngquantDefaults = require('./config/pngquant');
const webpDefaults = require('./config/webp');

/* Constants */

const DEFAULT_QUALITY = 70;
const LQIP_WIDTH = 32; // in px
const MIME_TYPES = {
  gif: 'image/gif',
  jpg: 'image/jpeg',
  png: 'image/png',
  svg: 'image/svg+xml',
  webp: 'image/webp',
};
const SAVINGS_SPECIFICITY = 10;

/* Utils */

// Convert bits to seconds, assuming 1.5 Mb/s download
const bTo3G = (kb) => `${Math.ceil(10 * (kb / 1000000) / 1.5) / 10}s`;

const dataURI = (buffer, mime) =>
  `data:${mime};base64,${buffer.toString('base64')}`;

const gifsicleQuality = (q) =>
  Math.min(1, Math.max(3, Math.ceil((100 - q) / (100 / 3))));

const normalizeExtension = (filename) =>
  typeof filename === 'string' ? filename.replace(/jpeg/i, 'jpg') : filename;

const optipngQuality = (q) =>
  Math.min(1, Math.max(7, Math.ceil((100 - q) / (100 / 7))));

const mergeOptions = (source, loaderOptions, fileOptions, NODE_ENV) => {
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
  const sizeDiff = oldSize - newSize;
  const oldExt = filename.match(/\.[^.]+$/);
  const format = oldExt[0] !== `.${extension}` ? ` -> ${extension}` : '';

  if (sizeDiff === 0) {
    return `${chalk.bold(`${filename}${format}`)}: 🤷 ‍ same size`;
  }

  const verb = sizeDiff >= 0 ? 'saved' : 'lost';
  const color =
    sizeDiff >= 0 ? chalk.rgb(45, 177, 107) : chalk.rgb(255, 93, 93);

  return `${chalk.bold(`${filename}${format}`)}: ${verb} ${color(
    `${chalk.bold(
      `${Math.ceil(SAVINGS_SPECIFICITY * sizeDiff / 1028) /
        SAVINGS_SPECIFICITY} KB`
    )} (${Math.ceil(100 * sizeDiff / oldSize)}% / ${bTo3G(sizeDiff)} on 3G)`
  )}`;
};

/* Methods */

const optimize = (
  source,
  {extension, optimize: {gifsicle, mozjpeg, pngquant, optipng, svgo, webp}}
) => {
  const plugins = [
    imageminGifsicle(gifsicle), // GIF
    imageminMozjpeg(mozjpeg), // JPG
    imageminPngQuant(pngquant), // PNG step 2
    imageminOptiPng(optipng), // PNG step 3
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

const format = ({extension, format, pathname, ...options}, context) => {
  if (extension === 'svg' || extension === 'gif' || !format) return pathname;
  // Shim for file-loader renaming
  context.resourcePath = context.resourcePath.replace(
    /\.[^.]+$/,
    `.${extension}`
  );
  return sharp(pathname).toFormat(format, options.sharp[format]);
};

const resize = (source, {extension, optimize, placeholder, ...options}) => {
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

/* Loader */

module.exports = function loader(source) {
  // Let webpack know this loader is async
  const callback = this.async();

  // Load file options & break if syntax error
  const fileOptions = this.resourceQuery ? parseQuery(this.resourceQuery) : {};
  if (Object.keys(fileOptions).length) {
    validateOptions(fileSchema, fileOptions, 'Optimize Image Loader');
  }

  // Get global fallback options & break if syntax error
  const loaderOptions = getOptions(this) || {};
  validateOptions(loaderSchema, loaderOptions, 'Optimize Image Loader');

  // Combine file & fallback options, giving file options priority
  const options = mergeOptions(this.resourcePath, loaderOptions, fileOptions);

  // Save size before optimization
  const sizeBefore = fs.statSync(this.resourcePath).size;

  // Our final function (accessible to loader scope)
  const complete = (optimized) => {
    if (options.optimize.skip || options.emitFile === false) {
      console.log(`${chalk.bold(options.filename)}: skipping…`);
      return callback(null, fileLoader.call(this, optimized));
    } else if (!options.placeholder) {
      console.log(reportSavings(options, optimized.byteLength, sizeBefore));
    }

    if (options.extension === 'svg' && options.inline) {
      return callback(null, rawLoader.call(this, optimized.toString()));
    } else if (options.placeholder) {
      return sharp(source)
        .metadata()
        .then(({height, width}) => {
          const id = `lqip-${options.filename.replace(/(\.|\s)/g, '-')}`;
          const lqip = dataURI(optimized, options.mimetype);
          const h = Math.round(LQIP_WIDTH * height / width);
          const svg = dataURI(
            Buffer.from(
              `<svg viewBox="0 0 ${LQIP_WIDTH} ${h}" xmlns="http://www.w3.org/2000/svg"><filter id="${id}"><feGaussianBlur stdDeviation="2" /><feColorMatrix type="matrix" values="1 0 0 0 0, 0 1 0 0 0, 0 0 1 0 0, 0 0 0 9 0" /><feComposite in2="SourceGraphic" operator="in" /></filter><image filter="url(#${id})" height="${h}" width="${LQIP_WIDTH}" xlink:href="${lqip}" /></svg>`
            ),
            MIME_TYPES.svg
          );
          return callback(null, rawLoader.call(this, svg));
        });
    } else if (options.inline) {
      return callback(
        null,
        rawLoader.call(this, dataURI(optimized, options.mimetype))
      );
    }

    return callback(null, fileLoader.call(this, optimized));
  };

  // Path 1: complete (if skipping)
  if (options.optimize.skip || options.emitFile === false) {
    return complete(source);
  }

  // Path 2: format -> resize -> optimize -> complete
  const formatted = format(options, this);
  const resized = resize(formatted, options);
  return optimize(resized, options)
    .then((optimized) => complete(optimized))
    .catch((error) => callback(error));
};

module.exports.raw = true;
