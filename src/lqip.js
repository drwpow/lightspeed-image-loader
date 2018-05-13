const svgToMiniDataURI = require('mini-svg-data-uri');

const {dataURI} = require('./utils');

module.exports = (source, {mimetype, filename}) => {
  const id = `lqip-${filename.replace(/(\.|\s)/g, '-')}`;
  const lqip = dataURI(source, mimetype);
  const template = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:x="http://www.w3.org/1999/xlink"><filter id="${id}"><feGaussianBlur stdDeviation="2"/><feColorMatrix type="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 2 0"/></filter><image height="100%" width="100%" x:href="${source}" preserveAspectRatio="xMidYMid slice" filter="url(#${id})"/></svg>`;
  return svgToMiniDataURI(template);
};
