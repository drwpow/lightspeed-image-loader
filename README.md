![optimize-image-loader latest version][version]
![Dependencies status][status]
![devDependencies status][status-dev]

# Optimize Image Loader

On-the-fly responsive image resizing and minification for webpack v4. Uses
[mozjpeg][mozjpeg], [GIFsicle][gifsicle], [OptiPNG][optipng], and
[SVGO][svgo], supports [WebP][webp], and can even generate Medium.com-style
low-quality image placeholders (LQIP) for loading.

### Support

| Filetype | Resizing | Optimization | Converting to |
| :------- | :------: | :----------: | :-----------: |
| JPG      |    ✅    |      ✅      |      ✅       |
| PNG      |    ✅    | ⚠️ **SLOW**  |  ⚠️ **SLOW**  |
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

In your **[production webpack config][webpack-prod],** add the following:

```js
module: {
  rules: [
    {
      test: /\.(jpe?g|gif|png|svg)/i,
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

#### Resizing pixel art

```js
import pixelArt from './pixel-art?w=2048&interpolation=nearest';
```

#### Blurry image placeholder while image loads (React)

```js
import image from './myimage.jpg?w=1200';
import placeholder from './myimage.jpg?placeholder';

<div style={{ backgroundImage: `url(${placeholder})` }}>
  <img src={image} />
</div>;
```

_Note: placeholders can’t be generated for SVGs_

## Options

Specifying options per-image is the preferred method of this loader. By
setting options per-file, you can fine-tune each image to find the best
balance of quality and compression. Plus, you don’t have to touch your
webpack config as your images change.

### Query Options

| Name            | Default     | Description                                                                                                                                                                                                                                                                                                                                |
| :-------------- | :---------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `width`         | (original)  | Set image width (in pixels). Leave `height` blank to auto-scale. Specify `width` and `height` to ensure image is smaller than both.                                                                                                                                                                                                        |
| `w`             |             | Shortcut for `width`.                                                                                                                                                                                                                                                                                                                      |
| `height`        | (original)  | Scale image height (in pixels). Leave `width` blank to auto-scale. Specify `width` and `height` to ensure image is smaller than both.                                                                                                                                                                                                      |
| `h`             |             | Shortcut for `height`.                                                                                                                                                                                                                                                                                                                     |
| `quality`       | `75` or `1` | JPEG & WebP: specify `1`–`100`, to set the image’s quality. GIF: specify `1` for least compressed, `3` for most compressed<sup>†</sup>. Compress as much as possible before degradation is noticable.                                                                                                                                      |
| `q`             |             | Shortcut for `quality`.                                                                                                                                                                                                                                                                                                                    |
| `interpolation` | `'cubic'`   | When scaling, specify `'nearest'` for nearest-neighbor (pixel art), `'cubic'` for cubic interpolation, or `'lanczos2'` or `'lanczos3'` for [Lanczos][lanczos] with `a=2` or `a=3`. `'cubic'` is this loader’s default (because it’s what most are used to), as opposed to`'lanczos3'` which is sharp’s default (present for other loaders) |
| `inline`        | `false`     | Set to `?inline` or `?inline=true` to return the individual image in base64 data URI, or raw SVG code 🎉.                                                                                                                                                                                                                                  |
| `format`        | (same)      | Specify `jpg`, `webp`, or `png` to convert format from the original.                                                                                                                                                                                                                                                                       |
| `f`             |             | Shortcut for `format`.                                                                                                                                                                                                                                                                                                                     |
| `placeholder`   | `false`     | Specify `?placeholder` to return a low-quality image placeholder (technically this can be used alongside other options, but it’s not advised).                                                                                                                                                                                             |
| `skip`          | `false`     | Set to `?skip` to bypass resizing & optimization entirely. This is particularly useful for SVGs that don’t optimize well.                                                                                                                                                                                                                  |

_<sup>†</sup> [GIFsicle][gifsicle] uses a different `1`–`3` scale for
compression, where `1` is least compressed and `3` is most, compared to other
optimizers’ percentage quality scale. For GIFs, if you specify `q=4` or
greater, it will convert the percentage for you (`4`–`33` is most compressed,
`34`–`66` is medium compression, and `67`–`100` is light compression).
Apologies if you really were trying to optimize your GIF to 1–3% quality._

#### Example

```js
import myImage from './large.jpg?q=50&w=1200&f=webp'; // Convert to WebP, 50% quality, and 1200px wide
```

_Note: this loader **will not** upscale images because it increases file size
without improving image quality. If you need to upscale pixel art, do it in
CSS with `image-rendering: crisp-edges`._

### Loader options

The main advantage of this loader is being able to specify quality and width
inline, but there are some settings which make sense to set globally, such as
[SVGO][svgo] settings, or a fallback quality. In these cases, pass options to
the loader as usual:

| Name         | Default       | Description                                                                                        |
| :----------- | :------------ | :------------------------------------------------------------------------------------------------- |
| `outputPath` | `output.path` | Override webpack’s default output path for these images (setting from [file-loader][file-loader]). |
| `emitFile`   | `true`        | Set to `false` to skip processing file (setting from [file-loader][file-loader]).                  |
| `gif`        | (object)      | Specify [GIFsicle][gifsicle] options.                                                              |
| `jpg`        | (object)      | Specify [mozjpeg][mozjpeg] options.                                                                |
| `jpeg`       |               | Alias of `jpg`.                                                                                    |
| `png`        | (object)      | Specify [OptiPNG][optipng] and [PNGquant][pngquant] options together.                              |
| `svgo`       | (object)      | Override [SVGO][svgo] default settings.                                                            |
| `svg`        |               | Alias of `svgo` (no other SVG options to set).                                                     |

_Note: because this loader passes images on to [file-loader][file-loader], or
[raw-loader][raw-loader], the same is true of loader options! You should be
able to use any options from those loaders within this config. However,
**don’t use this loader for anything other than images!** You’ll still need
those loaders for all other file types._

#### Example

```js
module: {
  rules: [
    {
      test: /(jpe?g|gif|png|svg)$/i,
      use: {
        loader: 'optimize-image-loader',
        options: {
          jpg: {
            quality: 60, // 1 – 100, higher is heavier
          },
          png: {
            optimizationLevel: 5, // 0 = light; 7 = heavy compression
          },
          svgo: {
            addClassesToSVGElement: true,
            mergePaths: true,
            removeStyleElement: true,
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

## WebP

Because WebP currently is only supported by Chrome, you’ll still need to
configure fallbacks. For that reason, you can only convert per-file:

```js
import webP from './original.jpg?f=webp';
import fallback from './original.jpg';
```

For tips on using WebP effectively, read this [CSS Tricks article][csstricks].

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
`npm config set python /path/to/python2` or
`yarn config set python /path/to/python2`

## FAQ

### Why do I have to use one `import` per size?

There are several advantages to this method:

* **Control**: You can declare options per-size, and fix issues where a particular image size requires different settings.
* **Speed**: Specifying options per-file keeps the loader fast by only applying operations you specify (e.g., a placeholder image isn’t needlessly generated if you don’t specify one—this can severely slow down build times with many images)
* **Simplicity**: There’s no syntax to memorize; one reference = one image URL or data-URI

### Why doesn’t this loader chain nicely with others?

Two reasons: first, image optimization / resizing has a particular order that
needs to be kept: resizing first, then optimization. Always. If there’s only
one proper order for images, and if one loader does it all, why chain?

Second, and more importantly, webpack only lets you select a loader based on
a module’s filename. So you couldn’t configure any combination of loaders
that let you conditionally output a URL, data URI, SVG code, and/or
placeholders via query strings.

## Special Thanks

This loader wouldn’t be possible without the significant achievements of:

* [@kevva][@kevva] for [imagemin][imagemin]
* [@sokra][@sokra], [@d3viant0ne][@d3viant0ne], and [@michael-ciniawsky][@michael-ciniawsky] for [file-loader][file-loader] and [raw-loader][raw-loader]
* [@lovell][@lovell] for [sharp][sharp]

[@d3viant0ne]: https://github.com/d3viant0ne
[@kevva]: https://github.com/kevva
[@lovell]: https://github.com/lovell
[@michael-ciniawsky]: https://github.com/michael-ciniawsky
[@sokra]: https://github.com/sokra
[csstricks]: https://css-tricks.com/using-webp-images/
[file-loader]: https://github.com/webpack-contrib/file-loader
[gifsicle]: https://github.com/imagemin/imagemin-gifsicle
[homebrew]: https://brew.sh/
[imagemin]: https://github.com/imagemin/imagemin
[lanczos]: https://en.wikipedia.org/wiki/Lanczos_resampling
[mozjpeg]: https://github.com/imagemin/imagemin-mozjpeg
[node-gyp]: https://github.com/nodejs/node-gyp/issues/1337
[optipng]: https://github.com/imagemin/imagemin-optipng
[pngquant]: https://github.com/imagemin/imagemin-pngquant
[raw-loader]: https://github.com/webpack-contrib/raw-loader
[sharp]: https://github.com/lovell/sharp
[status-dev]: https://david-dm.org/dangodev/optimize-image-loader/dev-status.svg
[status]: https://david-dm.org/dangodev/optimize-image-loader/status.svg
[svgo]: https://github.com/svg/svgo
[version]: https://badge.fury.io/js/optimize-image-loader.svg
[webp]: https://github.com/imagemin/imagemin-webp
[webpack-prod]: https://webpack.js.org/guides/production/
