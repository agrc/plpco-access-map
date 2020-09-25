import React from 'react';
import loadModules from './esriModules';


const Feature = ({ feature, mapView }) => {
  const node = React.useRef();
  const featureWidget = React.useRef();

  React.useEffect(() => {
    const init = async () => {
      console.log('Feature.init');

      const { Feature } = await loadModules();

      featureWidget.current = new Feature({
        container: node.current,
        map: mapView.map,
        graphic: { popupTemplate: { content: 'click on a road for more information' } },
        spatialReference: mapView.spatialReference
      });
    };

    if (mapView) {
      init();
    }
  }, [mapView]);

  React.useEffect(() => {
    if (featureWidget.current) {
      console.log('set feature');

      featureWidget.current.graphic = feature;
    }
  }, [feature]);

  return (
    <div ref={node}></div>
  );
};

export default Feature;
