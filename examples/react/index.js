import React from 'react';
import ReactDOM from 'react-dom';

import jpg from './original.jpg?quality=50&w=200';
import jpgDupe from './original.jpg?q=50&width=200';
import jpgLarge from './original.jpg?quality=80&w=1400';
import jpgInline from './original.jpg?inline&q=80&w=500';
import jpgToPNG from './original.jpg?f=png';
import jpgToWebP from './original.jpg?f=webp&w=1200';
import gif from './original.gif?h=20';
import png from './original.png?w=200';
import svg from './original.svg';
import svgInline from './original.svg?inline';
import skip from './original.jpg?skip';
import pixelArt from './pixel-art.png?w=500&interpolation=linear';
import placeholder from './original.jpg?placeholder';

const inlineSVG = () => ({__html: svgInline});

const App = () => (
  <div>
    <img src={jpg} />
    {/* jpgDupe should have same filename as jpg */}
    <img src={jpgDupe} />
    <div
      style={{
        backgroundImage: `url(${jpgInline})`,
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
        height: 200,
        width: 500,
      }}
    />
    <img src={jpgLarge} />
    <img src={jpgToPNG} />
    <img src={jpgToWebP} />
    <img src={gif} />
    <img src={png} />
    <img src={svg} />
    <div dangerouslySetInnerHTML={inlineSVG()} />
    <img src={skip} />
    <img src={pixelArt} />
    <div
      style={{
        backgroundImage: `url("${placeholder}")`
        height: 320,
        width: 320,
      }}
    />
  </div>
);

ReactDOM.render(<App />, document.querySelector('#app'));
