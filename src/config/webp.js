module.exports = {
  alphaQuality: 100, // 0 – 100 (best)
  autoFilter: false, // Adjust filter strength automatically.
  filter: undefined, // Set deblocking filter strength between `0` (off) and `100`.
  lossless: false, // Encode images losslessly.
  method: 4, // Specify the compression method to use, between `0` (fastest) and `6` (slowest). This parameter controls the trade off between encoding speed and the compressed file size and quality.
  nearLossless: 100, // Encode losslessly with an additional [lossy pre-processing step](https://groups.google.com/a/webmproject.org/forum/#!msg/webp-discuss/0GmxDmlexek/3ggyYsaYdFEJ), with a quality factor between `0` (maximum pre-processing) and `100` (same as `lossless`).
  preset: 'default', // Specify 'default', `default`, `photo`, `picture`, `drawing`, `icon`, or `text`.
  quality: 70, // 0 – 100 (best)
  sharpness: 0, // Set filter sharpness between `0` (sharpest) and `7` (least sharp).
  size: undefined, // Set target size in bytes.
  sns: 80, // Set the amplitude of spatial noise shaping between `0` and `100`.
};
