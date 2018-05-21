const svgToMiniDataURI = require('mini-svg-data-uri');

const {dataURI} = require('./utils');

module.exports = (source, {mimetype, filename}) => {
  const id = `lqip-${filename.replace(/[\s.]/g, '-')}`;
  const lqip = dataURI(source, mimetype);
  const template = `
    <svg xmlns="http://www.w3.org/2000/svg" xmlns:x="http://www.w3.org/1999/xlink">
      <filter id="${id}">
        <feGaussianBlur stdDeviation="2"/>
        <feComponentTransfer>
          <feFuncA type="linear" slope="2"/>
        </feComponentTransfer>
      </filter>
      <image x:href="${lqip}" filter="url(#${id})"
        preserveAspectRatio="xMidYMid slice" height="100%" width="100%"/>
    </svg>`.replace(/\n\s+?</g, '<');
  return svgToMiniDataURI(template);
};
