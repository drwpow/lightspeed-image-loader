![optimize-image-loader latest version][version]
![Dependencies status][status]
![devDependencies status][status-dev]

# Optimize Image Loader

On-the-fly responsive image resizing, and A+ optimization. Uses
[mozjpeg][mozjpeg], [GIFsicle][gifsicle], [OptiPNG][optipng], and
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

### Examples

#### Responsive (React)

```js
import small from './myimage.jpg?w=600&q=80';
import medium from './myimage.jpg?w=1200&q=75';
import large from './myimage.jpg?w=1800&q=65';

..

<img
  srcset={`${medium} 1200w, ${large} 1800w, ${medium} 2x, ${large} 3x`}
  src={small}
  alt="image description"
/>
```

#### WebP (React)

```js
import webP from './myimage.jpg?f=webp';
import fallback from './myimage.jpg';

...

<picture>
  <source srcset={webP} type="image/webp" />
  <source srcset={fallback} type="image/jpeg" />
  <img src={fallback} alt="image description" />
</picture>
```

#### Base64 inlined image (Styled Components)

```js
import inlineBg from './myimage.jpg?inline';

...

const Wrapper = styled.div`
  background-image: url(${inlineBg});
`;
```

#### Inline SVG (React)

```js
import inlineSVG from './myimage.svg?inline';

...

<div dangerouslySetInnerHtml={{ __html: inlineSVG }} />
```

## All Options

Specifying options per-image is the preferred method of this loader. By
setting options per-file, you can fine-tune each image to find the best
balance of quality and compression. Plus, you don’t have to touch your
webpack config as your images change.

```js
import myImage from './large.jpg?q=50&w=1200&f=webp';
```

| Name            | Default    | Description                                                                                                                                                                                                                  |
| :-------------- | :--------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `width`         | (original) | Set image width (in pixels). Leave `height` blank to auto-scale. Specify `width` and `height` to ensure image is smaller than both.                                                                                          |
| `w`             |            | Shortcut for `width`.                                                                                                                                                                                                        |
| `height`        | (original) | Scale image height (in pixels). Leave `width` blank to auto-scale. Specify `width` and `height` to ensure image is smaller than both.                                                                                        |
| `h`             |            | Shortcut for `height`.                                                                                                                                                                                                       |
| `quality`       | `75`       | Specify a number, `1`–`100`, to set the image’s quality. Set it as low as possible before degradation is noticable.                                                                                                          |
| `q`             |            | Shortcut for `quality`.                                                                                                                                                                                                      |
| `interpolation` | `'cubic'`  | When scaling, specify `'nearest'` for nearest-neighbor (pixel art), `'cubic'` for cubic interpolation (default), or `'lanczos2'` or `'lanczos3'` for [Lanczos][lanczos] with `a=2` or `a=3`. (`'lanczos3'` is sharp default) |
| `inline`        | `false`    | Set to `?inline` or `?inline=true` to return the individual image in base64 data URI, or raw SVG code 🎉.                                                                                                                    |
| `format`        | (same)     | Specify `jpg`, `webp`, or `png` to convert format from the original.                                                                                                                                                         |
| `f`             |            | Shortcut for `format`.                                                                                                                                                                                                       |
| `svgo`          | (object)   | Override [SVGO][svgo] default settings.                                                                                                                                                                                      |
| `svg`           |            | Alias of `svgo` (no other SVG options to set).                                                                                                                                                                               |
| `skip`          | `false`    | Set to `?skip` or `?skip=true` to bypass resizing & optimization entirely. This is particularly useful for SVGs that don’t optimize well.                                                                                    |

### WebP

Because WebP currently is only supported by Chrome, you’ll still need to
configure fallbacks. For that reason, you can only convert per-file:

```js
import webP from './original.jpg?f=webp';
import fallback from './original.jpg';
```

For tips on using WebP effectively, read this [CSS Tricks article][csstricks].

## Global Fallbacks

**Global fallbacks are discouraged** in favor of file-specific settings.
However, if there are cases where you need to enforce sane defaults, you can
provide loader options if needed.

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
| `jpg`        | (object)      | Specify [mozjpeg][mozjpeg] options.                                            |
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

## Is this image loader for me?

If you:

* want to handle resizing & optimization in the same step (this is the only loader that does that)
* need to optimize & resize every image differently
* prefer writing `srcset` manually for complete control
* have a good understanding on image formats & optimization in general

Then this loader was made for you!

## Special Thanks

This loader wouldn’t be possible without the significant achievements of:

* [@kevva][@kevva] for [imagemin][imagemin]
* [@sokra][@sokra], [@d3viant0ne][@d3viant0ne], and [@michael-ciniawsky][@michael-ciniawsky] for [file-loader][fileloader], [url-loader][urlloader], and [raw-loader][rawloader]
* [@lovell][@lovell] for [sharp][sharp]

[@d3viant0ne]: https://github.com/d3viant0ne
[@kevva]: https://github.com/kevva
[@lovell]: https://github.com/@lovell
[@michael-ciniawsky]: https://github.com/@michael-ciniawsky
[@sokra]: https://github.com/sokra
[csstricks]: https://css-tricks.com/using-webp-images/
[gifsicle]: https://github.com/imagemin/imagemin-gifsicle
[fileloader]: https://github.com/webpack-contrib/file-loader
[homebrew]: https://brew.sh/
[imagemin]: https://github.com/imagemin/imagemin
[lanczos]: https://en.wikipedia.org/wiki/Lanczos_resampling
[mozjpeg]: https://github.com/imagemin/imagemin-mozjpeg
[node-gyp]: https://github.com/nodejs/node-gyp/issues/1337
[optipng]: https://github.com/imagemin/imagemin-optipng
[pngquant]: https://github.com/imagemin/imagemin-pngquant
[rawloader]: https://github.com/webpack-contrib/raw-loader
[sharp]: https://github.com/lovell/sharp
[status]: https://david-dm.org/dangodev/optimize-image-loader/status.svg
[status-dev]: https://david-dm.org/dangodev/optimize-image-loader/dev-status.svg
[svgo]: https://github.com/svg/svgo
[urlloader]: https://github.com/webpack-contrib/url-loader
[version]: https://badge.fury.io/js/optimize-image-loader.svg
[webp]: https://github.com/imagemin/imagemin-webp
