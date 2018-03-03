# Optimize Image Loader

On-the-fly responsive image resizing, and A+ optimization. Uses
[JPEGOptim][jpegoptim], [GIFsicle][gifsicle], [OptiPNG][optipng], and
[SVGO][svgo], and even supports [WebP][webp]. Use this image loader to handle
all the following filetypes:

| Filetype | Resizing | Optimization | Converting to |
| :------- | :------: | :----------: | :-----------: |
| JPG      |    ✅    |      ✅      |      ✅       |
| PNG      |    ✅    |      ✅      |      ✅       |
| WebP     |    ✅    |      ✅      |      ✅       |
| SVG      |   N/A    |      ✅      |      N/A      |
| GIF      |          |      ✅      |               |

_Note: GIF resizing/conversion isn’t supported due to lack of support in
[sharp][sharp]. Overall, it’s a small price to pay for the build speed of the
sharp library._

## Installation

```
npm i --save-dev optimize-image-loader
```

## Usage

### Simple usage

In your **webpack config,** add the following:

```js
module: {
  rules: [
    {
      test: /(jpe?g|gif|png|svg)/i,
      use: 'optimize-image-loader'
    }
  ],
},
```

Then from your app, import image files normally. Specify specific
optimizations per each file:

```js
import imgSmall from './img/background-full.jpg?w=600&q=75'; /* 600px wide, 75% quality */
import imgLarge from './img/background-full.jpg?w=1200&q=50'; /* 1200px wide, 50% quality */
```

#### React

```jsx
<img src={imgSmall} srcset={`${imgSmall} 600w, ${imgLarge} 1200w`} />
```

#### Vue

```vue
<img :src="imgSmall" :srcset="`${imgSmall} 600w, ${imgLarge} 1200w`">
```

#### Styled Components

```js
const Header = styled.header`
  background-image: ${imgSmall};

  @media (min-width: 600px) {
    background-image: ${imgLarge};
  }
`;
```

## Settings

This loader was created to specify most options per-image. In practice,
setting global options is often more cumbersome, trying to find the right
balance of settings where the worst images aren’t too bad, and the best ones
are small enough.

But by setting options per-file, you can art direct each image to find the
best balance of quality and compression. You get the best of both worlds:
fine-tuned control, without having to really dig into your webpack config
much at all.

```js
import myImage from './large.jpg?q=50&w=1200&f=webp';
```

| Name      | Default       | Description                                                                                                                                                                    |
| :-------- | :------------ | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `width`   | (full width)  | Specify a number to downsize the image width to (in pixels). Height will scale automatically. Won’t upscale image. Ignored for SVG.                                            |
| `w`       |               | Shortcut for `width`.                                                                                                                                                          |
| `height`  | (full height) | Specify a number to downsize the image width to (in pixels). Width will scale automatically. Won’t upscale image. If `height` and `width` are specified, width takes priority. |
| `h`       |               | Shortcut for `height`.                                                                                                                                                         |
| `quality` | `75`          | Specify a number, `1`–`100`, to set the image’s quality. Set it as low as possible before degradation is noticable.                                                            |
| `q`       |               | Shortcut for `quality`.                                                                                                                                                        |
| `inline`  | `false`       | Set to `?inline` or `?inline=true` to return the individual image in base64 data URI, or raw SVG code 🎉.                                                                      |
| `format`  | (same)        | Specify `jpg`, `webp`, or `png` to convert formats. By default, no conversion will take place.                                                                                 |
| `f`       |               | Shortcut for `format`.                                                                                                                                                         |
| `svgo`    | (object)      | Override [SVGO][svgo] default settings.                                                                                                                                        |
| `svg`     |               | Alias of `svgo` (no other SVG options to set).                                                                                                                                 |
| `skip`    | `false`       | Set to `?skip` or `?skip=true` to bypass resizing & optimization entirely. Useful for problem images.                                                                          |

### WebP

Because WebP currently is only supported by Chrome, you’ll still need to
configure fallbacks. For that reason, you can only convert per-file:

```js
import webP from './original.jpg?f=webp';
import fallback from './original.jpg';
```

For tips on using WebP effectively, read this [CSS Tricks article][csstricks].

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

| Name         | Default       | Description                                                                    |
| :----------- | :------------ | :----------------------------------------------------------------------------- |
| `quality`    | `75`          | Specify a number, `1`–`100`, to set the fallback quality if none is specified. |
| `q`          |               | Alias of `quality`.                                                            |
| `outputPath` | `output.path` | Override webpack’s default output path for these images.                       |
| `emitFile`   | `true`        | Set to `false` to skip processing file (for server-side rendering, e.g.).      |
| `gif`        | (object)      | Specify [GIFsicle][gifsicle] options.                                          |
| `jpg`        | (object)      | Specify [JpegOptim][jpegoptim] options.                                        |
| `jpeg`       |               | Alias of `jpg`.                                                                |
| `png`        | (object)      | Specify [OptiPNG][optipng] and [PNGquant][pngquant] options together.          |
| `svgo`       | (object)      | Override [SVGO][svgo] default settings.                                        |
| `svg`        |               | Alias of `svgo` (no other SVG options to set).                                 |

## Troubleshooting

If `python --version` returns ^3 on your system, you’ll likely encounter the
[frequently-discussed node-gyp][node-gyp] error:

```
Error: Python executable \"/usr/local/bin/python\" is v3.x.x, which is not supported by gyp.
```

If `which python2.7` works on your system, run
`npm config set python python2.7` (or `yarn config set python python2.7` if
using yarn).

If your machine doesn’t have `python2.7`, install Python 2.x using
[Homebrew][homebrew] or some other means, and set that executable with
`npm config set python /path/to/python2` or `yarn config set python /path/to/python2`

## How is this different from all the other webpack image loaders?

1.  It’s the only image loader that handles resizing _and_ optimization in one step. Often these need to be performed together. Chaining loaders for this type of work is problematic because there are so many opportunities for misconfiguration.
1.  It’s the only image loader where you can specify options per-file. Images are wildly different, and respond to compression differently. So they should be able to be optimized independently.
1.  It’s the only image loader that handles raster formats, SVGs, and the ability to return a URL, base64 data URI, or SVG code on-the-fly.
1.  There’s no syntax to memorize. Every `import` statement returns a URL—nothing more. No confusing `myImage.sizes['1200w']` to remember.
1.  The API is flexible for modern frontend needs. You have full control over `srcset` queries (including 1x, 2x, and 3x pixel densities), `<picture>` element fallbacks, and just about everywhere your app uses images.
1.  It follows best-practices for image optimization. The optimization plugins used here are the best combination of tools available for tiny images—if you’re going to crunch your images, you might as well do it as good as possible.

## Special Thanks

This loader wouldn’t be possible without the significant achievements of:

* @kevva for [imagemin][imagemin]
* @sokra, @d3viant0ne, and @michael-ciniawsky for [file-loader][fileloader], [url-loader][urlloader], and [raw-loader][rawloader]
* @lovell for [sharp][sharp]

[csstricks]: https://css-tricks.com/using-webp-images/
[gifsicle]: https://github.com/imagemin/imagemin-gifsicle
[fileloader]: https://github.com/webpack-contrib/file-loader
[homebrew]: https://brew.sh/
[imagemin]: https://github.com/imagemin/imagemin
[jpegoptim]: https://github.com/imagemin/imagemin-jpegoptim
[node-gyp]: https://github.com/nodejs/node-gyp/issues/1337
[optipng]: https://github.com/imagemin/imagemin-optipng
[pngquant]: https://github.com/imagemin/imagemin-pngquant
[rawloader]: https://github.com/webpack-contrib/raw-loader
[sharp]: https://github.com/lovell/sharp
[svgo]: https://github.com/svg/svgo
[urlloader]: https://github.com/webpack-contrib/url-loader
[webp]: https://github.com/imagemin/imagemin-webp
