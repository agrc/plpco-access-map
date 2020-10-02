import React from 'react';
import './App.scss';
import getModules from './esriModules';
import Feature from './Feature';
import VideosContainer from './VideosContainer';
import { Sherlock, MapServiceProvider } from '@agrc/sherlock';
import queryString from 'query-string';


const FEATURE_SERVICE_URL = 'https://maps.publiclands.utah.gov/server/rest/services/RS2477/RS2477_Centerline_Secure/MapServer/0';
const SEARCH_FIELD = 'RD_ID';

const getRdIdFromUrl = () => {
  const parameters = queryString.parse(document.location.search);

  return parameters.rdid;
};

function App() {
  const mapContainer = React.useRef();
  const [ mapView, setMapView ] = React.useState();
  const [ selectedFeature, setSelectedFeature ] = React.useState();
  const [ videoDataSources, setVideoDataSources ] = React.useState({ table: null, points: null });
  const [ rdId, setRdId ] = React.useState();
  const featureLayer = React.useRef();
  const [ sherlockConfig, setSherlockConfig ] = React.useState();
  const highlightedHandle = React.useRef();
  const layerView = React.useRef();

  React.useEffect(() => {
    const initMap = async () => {
      console.log('initMap');

      const esriModules = await getModules();
      const { esriConfig, MapView, WebMap, Legend } = esriModules;

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

      const legend = new Legend({
        view,
        container: document.createElement('div')
      });
      view.ui.add(legend, 'bottom-right');

      featureLayer.current = view.map.layers.find(layer => layer.title === 'RS2477 Centerlines');
      layerView.current = await view.whenLayerView(featureLayer.current);

      const table = view.map.tables[0];
      const points = view.map.layers.find(layer => layer.title === 'Video_Routes - Video Route');
      setVideoDataSources({ table, points });

      view.on('click', async event => {
        setSelectedFeature(null);

        const test = await view.hitTest(event);

        if (test.results.length) {
          setSelectedFeature(test.results[0].graphic);
        }
      });

      setMapView(view);

      const onSherlockMatch = async matches => {
        setSelectedFeature(null);

        if (matches.length) {
          const graphic = matches[0];
          view.goTo(graphic);

          graphic.popupTemplate = layerView.current.layer.popupTemplate;
          setSelectedFeature(graphic);
        }
      };

      setSherlockConfig({
        provider: new MapServiceProvider(FEATURE_SERVICE_URL, SEARCH_FIELD, esriModules, { outFields: ['*'] }),
        placeHolder: 'search by RDID...',
        onSherlockMatch,
        modules: esriModules,
        mapView: view,
        position: 'top-right'
      });

      const rdIdFromUrl = getRdIdFromUrl();
      if (rdIdFromUrl) {
        const featureSet = await featureLayer.current.queryFeatures({
          where: `UPPER(RD_ID) = UPPER('${rdIdFromUrl}')`,
          returnGeometry: true,
          outFields: '*',
          outSpatialReference: view.spatialReference,
        });

        if (featureSet.features.length) {
          onSherlockMatch(featureSet.features);
        } else {
          console.error(`No feature found for RD_ID: ${rdIdFromUrl}`);
        }
      }
    };

    initMap();
  }, []);

  React.useEffect(() => {
    const getRdId = async () => {
      if (selectedFeature.attributes.RD_ID) {
        setRdId(selectedFeature.attributes.RD_ID);

        return;
      }

      // query for RD_ID for features that come from map click (they only include the OBJECTID)
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

    if (highlightedHandle.current) {
      highlightedHandle.current.remove();
    }

    if (selectedFeature) {
      getRdId();

      highlightedHandle.current = layerView.current.highlight(selectedFeature.attributes.OBJECTID);
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
      <div ref={mapContainer}>
        { (sherlockConfig) ? <Sherlock {...sherlockConfig} /> : null }
      </div>
    </div>
  );
}

export default App;
