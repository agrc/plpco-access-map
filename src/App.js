import React from 'react';
import './App.scss';
import getModules from './esriModules';
import Feature from './Feature';
import VideosContainer from './VideosContainer';


function App() {
  const mapContainer = React.useRef();
  const [ mapView, setMapView ] = React.useState();
  const [ selectedFeature, setSelectedFeature ] = React.useState();
  const [ videoDataSources, setVideoDataSources ] = React.useState({ table: null, points: null });
  const [ rdId, setRdId ] = React.useState();
  const featureLayer = React.useRef();

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

      featureLayer.current = view.map.layers.find(layer => layer.title === 'RS2477_Centerline_Secure - RS2477 Centerline');
      const layerView = await view.whenLayerView(featureLayer.current);

      const table = view.map.tables[0];
      const points = view.map.layers.find(layer => layer.title === 'Video_Routes - Video Route');
      setVideoDataSources({ table, points });

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

  React.useEffect(() => {
    const getRdId = async () => {
      const featureSet = await featureLayer.current.queryFeatures({
        where: `OBJECTID = ${selectedFeature.attributes.OBJECTID}`,
        returnGeometry: false,
        outFields: '*'
      });

      if (featureSet.features.length) {
        setRdId(featureSet.features[0].attributes.RD_ID);
      } else {
        setRdId(null);
      }
    };

    if (selectedFeature) {
      getRdId();
    } else {
      setRdId(null);
    }
  }, [selectedFeature]);

  return (
    <div className="app">
      <div className="side-bar">
        <VideosContainer rdId={rdId} mapView={mapView} {...videoDataSources} />
        <Feature feature={selectedFeature} mapView={mapView} />
      </div>
      <div ref={mapContainer}></div>
    </div>
  );
}

export default App;
