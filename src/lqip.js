const svgToMiniDataURI = require('mini-svg-data-uri');

const {dataURI} = require('./utils');
const {LQIP_WIDTH} = require('./constants');

module.exports = (source, {width, height, mimetype, filename}) => {
  const id = `lqip-${filename.replace(/(\.|\s)/g, '-')}`;
  const lqip = dataURI(source, mimetype);
  const h = Math.round(LQIP_WIDTH * height / width);
  const template = `<svg width="${LQIP_WIDTH}" height="${h}" viewBox="0 0 ${LQIP_WIDTH} ${h}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><filter id="${id}"><feGaussianBlur stdDeviation="2" /><feColorMatrix type="matrix" values="1 0 0 0 0, 0 1 0 0 0, 0 0 1 0 0, 0 0 0 9 0" /><feComposite in2="SourceGraphic" operator="in" /></filter><image filter="url(#${id})" height="100%" width="100%" xlink:href="${lqip}" /></svg>`;
  return svgToMiniDataURI(template);
};
