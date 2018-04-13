module.exports = {
  arithmetic: false, // Use arithmetic coding (https://en.wikipedia.org/wiki/Arithmetic_coding)
  dcScanOpt: 1, // Set DC scan optimization mode. 0: 1 scan for all components / 1: 1 scan per component / 2: Optimize between 1 scan for all components and 1 scan for 1st component plus 1 scan for remaining components
  dct: 'int', // `int` Use integer DCT / `fast` Use fast integer DCT (less accurate) / `float` Use floating-point DCT
  fastCrush: false, // Disable progressive scan optimization.
  overshoot: true, // Black-on-white deringing via overshoot.
  maxMemory: undefined, // Set the maximum memory to use in kilobytes.
  progressive: true, // `false` creates baseline JPEG file.
  quality: 70, // Number from 0 (worst) to 100 (best).
  quantBaseline: false, // Use 8-bit quantization table entries for baseline JPEG compatibility.
  quantTable: 2, // Specify a Quantization Table (see mozjpeg options for explanation).
  revert: false, // Revert to standard defaults instead of mozjpeg defaults.
  sample: ['1x1'], // Set component sampling factors.
  smooth: undefined, // Set the strength of smooth dithered input. (1...100)
  targa: false, // Input file is Targa format (usually not needed).
  trellis: true, // Enable Trellis quantization (https://en.wikipedia.org/wiki/Trellis_quantization)
  trellisDC: true, // Trellis optimization of DC coefficients.
  tune: 'hvs-psnr', // Set Trellis optimization method. Available methods: `psnr`, `hvs-psnr`, `ssim`, `ms-ssim`
};
