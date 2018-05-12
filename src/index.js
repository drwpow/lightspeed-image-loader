const chalk = require('chalk');
const fs = require('fs');
const fileLoader = require('file-loader');
const {getOptions, parseQuery} = require('loader-utils');
const rawLoader = require('raw-loader');
const sharp = require('sharp');
const validateOptions = require('schema-utils');

const fileSchema = require('./config/file.json');
const loaderSchema = require('./config/loader.json');

const format = require('./format');
const lqip = require('./lqip');
const optimize = require('./optimize');
const resize = require('./resize');

const {dataURI, mergeOptions, reportSavings} = require('./utils');

// Output function
const complete = (
  output,
  {callback, context, sizeBefore, source, ...options}
) => {
  // Console output
  if (options.optimize.skip || options.emitFile === false) {
    console.log(`${chalk.bold(options.filename)}: skipping…`);
    return callback(null, fileLoader.call(context, output));
  } else if (!options.placeholder) {
    console.log(reportSavings(options, output.byteLength, sizeBefore));
  }

  // File Output
  if (options.extension === 'svg' && options.inline) {
    // 1. Inline SVGs (SVG code)
    return callback(null, rawLoader.call(context, output.toString()));
  } else if (options.placeholder) {
    // 2. LQIP
    return sharp(source)
      .metadata()
      .then(({height, width}) =>
        callback(
          null,
          rawLoader.call(context, lqip(output, {width, height, ...options}))
        )
      );
  } else if (options.inline) {
    // 3. Inlined (base64) images
    return callback(
      null,
      rawLoader.call(context, dataURI(output, options.mimetype))
    );
  }

  // 4. Optimized images (everything else)
  return callback(null, fileLoader.call(context, output));
};

module.exports = function loader(source) {
  // Let webpack know this loader is async
  const callback = this.async();

  // Load file options & break if syntax error
  const fileOptions = this.resourceQuery ? parseQuery(this.resourceQuery) : {};
  if (Object.keys(fileOptions).length) {
    validateOptions(fileSchema, fileOptions, '🚀 Lightspeed Image Loader');
  }

  // Get global fallback options & break if syntax error
  const loaderOptions = getOptions(this) || {};
  validateOptions(loaderSchema, loaderOptions, '🚀 Lightspeed Image Loader');

  // Combine file & fallback options, giving file options priority
  const options = mergeOptions(this.resourcePath, {
    loaderOptions,
    fileOptions,
  });

  // Save size before optimization
  const sizeBefore = fs.statSync(this.resourcePath).size;

  // Path 1: skip file
  if (options.optimize.skip || options.emitFile === false) {
    return complete(source, {context: this, callback, source, ...options});
  }

  // Path 2: format -> resize -> optimize -> complete
  const srcFormatted = format({context: this, ...options});
  const srcResized = resize(srcFormatted, options);
  return optimize(srcResized, options)
    .then((srcOptimized) =>
      complete(srcOptimized, {
        context: this,
        callback,
        sizeBefore,
        source,
        ...options,
      })
    )
    .catch((error) => callback(error));
};

module.exports.raw = true;
