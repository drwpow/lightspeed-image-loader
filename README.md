# Optimize Image Loader

Image optimization for webpack. Resizes images on-the-fly and optimizes them
using [JPEGOptim][jpegoptim], [GIFsicle][gifsicle], [OptiPNG][optipng], and
[SVGO][svgo]. Can also optionally generate [WebP][webp] files.

## Installation

```
yarn install --dev optimize-image-loader
```

## Usage

### Simple usage

In your **webpack config,** add the following:

```js
module: {
  rules: [
    {
      test: /(jpe?g|gif|png|svg|)/i,
      use: 'optimize-image-loader'
    }
  ],
},
```

Then from your app, import image files normally. Specify specific
optimizations per each file.

```js
import backgroundSmall from './img/background-full.jpg?w=600&q=75'; /* 600px wide, 75% quality */
import backgroundLarge from './img/background-full.jpg?w=1200&q=50'; /* 1200px wide, 50% quality */
```

#### React

```jsx
<img
  src={backgroundSmall}
  srcset={`${backgroundSmall} 600w, ${backgroundLarge} 1200w`}
/>
```

#### Vue

```vue
<img :src="backgroundSmall" :srcset="`${backgroundSmall} 600w, ${backgroundLarge} 1200w`">
```

#### Styled Components

```js
const Header = styled.header`
  background-image: ${backgroundSmall};

  @media (min-width: 600px) {
    background-image: ${backgroundLarge};
  }
`;
```

## Settings

The unique feature about this loader is the ability to set options per-image.

```js
import myImage from './largejpg?q=50&w=1200&format=webp';
```

| Name      | Default       | Description                                                                                                                                            |
| :-------- | :------------ | :----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `width`   | (full width)  | Specify a width, in pixels, to downsize the image to. Or leave blank for full-size. Won’t upscale image.                                               |
| `w`       |               | Alias of `width`.                                                                                                                                      |
| `height`  | (full height) | Specify a height, in pixels, to downsize the image to. Or leave blank for full-size. Won’t upscale image.                                              |
| `h`       |               | Alias of `height`.                                                                                                                                     |
| `quality` | `75`          | Specify a number, `1`–`100`, to reduce the image’s quality and filesize. **`100` skips optimization entirely** (technically, it’s not `100%` quality). |
| `q`       |               | Alias of `quality`.                                                                                                                                    |
| `format`  | (same)        | Specify `jpg`, `webp`, or `png` to convert formats. By default, no conversion will take place.                                                         |
| `f`       |               | Alias of `format`.                                                                                                                                     |
| `skip`    | `false`       | Set to `?skip` or `?skip=true` to bypass resizing & optimization entirely. Useful for problem images.                                                  |
| `svgo`    | (object)      | Override [SVGO][svgo] default settings.                                                                                                                |
| `svg`     |               | Alias of `svgo` (no other SVG options to set).                                                                                                         |

## Global Fallbacks

Global options can be declared on the webpack config. These only take effect
when omitted from individual `import` statements:

```js
module: {
  rules: [
    {
      test: /(jpe?g|gif|png|svg)$/i,
      use: {
        loader: 'optimize-image-loader',
        options: {
          quality: 75,
          jpg: {
            quality: 60,
          },
          png: {
            quality: 80,
          },
          webp: {
            quality: 80,
          },
        },
      },
    },
  ],
},
```

| Name         | Default       | Description                                                                                  |
| :----------- | :------------ | :------------------------------------------------------------------------------------------- |
| `quality`    | `75`          | Set the fallback quality level for all image types. **`100` skips optimization altogether.** |
| `q`          |               | Alias of `quality`.                                                                          |
| `outputPath` | `output.path` | Override webpack’s default output path for these images.                                     |
| `emitFile`   | `true`        | Set to `false` to skip processing file (for server-side rendering, e.g.).                    |
| `gif`        | (object)      | Specify [GIFsicle][gifsicle] options.                                                        |
| `jpg`        | (object)      | Specify [JpegOptim][jpegoptim] options.                                                      |
| `jpeg`       |               | Alias of `jpg`.                                                                              |
| `png`        | (object)      | Specify [OptiPNG][optipng] and [PNGquant][pngquant] options together.                        |
| `svgo`       | (object)      | Override [SVGO][svgo] default settings.                                                      |
| `svg`        |               | Alias of `svgo` (no other SVG options to set).                                               |

## Image Tools

Optimize image loader also comes with image tools for working with images:

```js
import imageTool from 'optimize-image-loader/tools';

import myImage from './images/my-image.jpg';

const myImageMeta = imageTool(myImage);

// returns:
//
// {
//   width: 1280,
//   height: 800,
//   placeholder: (inline placeholder image),
//   filesize: 1280  // in bytes
// }
```

### Placeholders

A significant part of the placeholders is generating Medium.com-style
background **placeholder** images while loading:

```
<div style={{ backgroundImage: myImageMeta.placeholder }}>
  <img src={myImage} />
</div>
```

The placeholder images are base-64-encoded, which means they are already
loaded and displaying as soon as the markup is loaded. They’ll be shown
instantly while the higher-resolution image loads.

## Methodology

This differs from many other webpack image loaders in that this demands
one `import` statement per output file, and this loader doesn’t write any
`<picture>` or `srcset` macros for you. That decision was made for the
following reasons:

1.  **You can specify higher-pixel-density files.** Is `1200w` for 1×, 2×, or 3× pixel density? With this loader, it doesn’t matter.
2.  **It’s futureproof.** Because this doesn’t shim `srcset`, it lets you use images in any way possible in your frontend code.
3.  **It simplifies development.** Each `import` statement returns a URL, and nothing more. Using `<img src={myImage} />` is much cleaner than `<img src={myImage.sizes['1200w']} />`.
4.  **It’s bulletproof.** Using one `import` per file generates errors at build-time on your files, rather than at run-time. Know as soon as your code fails.
5.  **It respects `import`.** `import` is meant for one file, and one file only. “Hacking” this limits the effectiveness of webpack and ESM in general.

[gifsicle]: https://github.com/imagemin/imagemin-gifsicle
[jpegoptim]: https://github.com/imagemin/imagemin-jpegoptim
[optipng]: https://github.com/imagemin/imagemin-optipng
[pngquant]: https://github.com/imagemin/imagemin-pngquant
[svgo]: https://github.com/svg/svgo
[webp]: https://github.com/imagemin/imagemin-webp
