import React from 'react';
import './App.scss';
import getModules from './esriModules';
import Feature from './Feature';


function App() {
  const mapContainer = React.useRef();
  const [ mapView, setMapView ] = React.useState();
  const [ selectedFeature, setSelectedFeature ] = React.useState();

  React.useEffect(() => {
    const initMap = async () => {
      console.log('initMap');

      const { esriConfig, MapView, WebMap } = await getModules();

      esriConfig.portalUrl = 'https://maps.publiclands.utah.gov/portal';

      const webMap = new WebMap({
        portalItem: {
          id: 'ef84ebe3975d4431b0821f2feda538ad'
        }
      });

      const view = new MapView({
        map: webMap,
        container: mapContainer.current,
        popup: null
      });

      await view.when();

      const layer = view.map.layers.find(layer => layer.title === 'RS2477_Centerline_Secure - RS2477 Centerline');
      const layerView = await view.whenLayerView(layer);

      let highlightedHandle;
      view.on('click', async event => {
        if (highlightedHandle) {
          highlightedHandle.remove();
          setSelectedFeature(null);
        }

        const test = await view.hitTest(event);

        if (test.results.length) {
          const graphic = test.results[0].graphic;

          highlightedHandle = layerView.highlight(graphic);

          setSelectedFeature(test.results[0].graphic);
        }
      });

      setMapView(view);
    };

    initMap();
  }, []);

  return (
    <div className="app">
      <div className="side-bar">
        <Feature feature={selectedFeature} mapView={mapView} />
      </div>
      <div ref={mapContainer}></div>
    </div>
  );
}

export default App;
