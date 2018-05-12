const {dataURI} = require('./utils');
const {LQIP_WIDTH, MIME_TYPES} = require('./constants');

module.exports = (source, {width, height, mimetype, filename}) => {
  const id = `lqip-${filename.replace(/(\.|\s)/g, '-')}`;
  const lqip = dataURI(source, mimetype);
  const h = Math.round(LQIP_WIDTH * height / width);
  return dataURI(
    Buffer.from(
      `<svg viewBox="0 0 ${LQIP_WIDTH} ${h}" xmlns="http://www.w3.org/2000/svg"><filter id="${id}"><feGaussianBlur stdDeviation="2" /><feColorMatrix type="matrix" values="1 0 0 0 0, 0 1 0 0 0, 0 0 1 0 0, 0 0 0 9 0" /><feComposite in2="SourceGraphic" operator="in" /></filter><image filter="url(#${id})" height="${h}" width="${LQIP_WIDTH}" xlink:href="${lqip}" /></svg>`
    ),
    MIME_TYPES.svg
  );
};
