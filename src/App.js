import React from 'react';
import './App.scss';
import getModules from './esriModules';
import Feature from './Feature';
import VideosContainer from './VideosContainer';
import { Sherlock, MapServiceProvider } from '@agrc/sherlock';
import queryString from 'query-string';
import config from './config';


const FEATURE_SERVICE_URL = 'https://maps.publiclands.utah.gov/server/rest/services/RS2477/RS2477_Centerline_Secure/MapServer/0';
const SEARCH_FIELD = 'S_Name';
const URL_PARAM = 'rdid';

const getRdIdFromUrl = () => {
  const parameters = queryString.parse(document.location.hash);

  return parameters[URL_PARAM];
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
  const [ relatedRecords, setRelatedRecords ] = React.useState();
  const tableIdsLookup = React.useRef({});

  React.useEffect(() => {
    if (rdId && getRdIdFromUrl() !== rdId) {
      document.location.hash = queryString.stringify({ [URL_PARAM]: rdId });
    }
  }, [rdId]);

  React.useEffect(() => {
    const initMap = async () => {
      console.log('initMap');

      const esriModules = await getModules();
      const { esriConfig, MapView, WebMap, Legend, BasemapGallery, Expand } = esriModules;

      esriConfig.portalUrl = 'https://maps.publiclands.utah.gov/portal';

      const webMap = new WebMap({
        portalItem: {
          id: config.webMapId
        }
      });

      const view = new MapView({
        map: webMap,
        container: mapContainer.current,
        popup: null
      });

      await view.when();

      const basemapGallery = new BasemapGallery({ view });
      const expand = new Expand({
        view,
        content: basemapGallery
      })
      view.ui.add(expand, 'top-left');

      const legend = new Legend({
        view,
        container: document.createElement('div')
      });
      view.ui.add(legend, 'bottom-right');

      featureLayer.current = view.map.layers.find(layer => layer.title === 'RS2477 Centerlines');
      layerView.current = await view.whenLayerView(featureLayer.current);

      view.map.tables.forEach(table => {
        tableIdsLookup.current[table.url.split('/').pop()] = table;
      });
      const table = view.map.tables.find(table => table.title === 'Video Report');
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
        provider: new MapServiceProvider(FEATURE_SERVICE_URL, SEARCH_FIELD, esriModules, {
          outFields: ['*'],
          contextField: 'County'
        }),
        placeHolder: 'search by street name...',
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

    const getRelatedRecords = async () => {
      const records = [];
      const oid = selectedFeature.attributes.OBJECTID;

      for (const relationship of featureLayer.current.relationships) {
        const result = await featureLayer.current.queryRelatedFeatures({
          outFields: '*',
          relationshipId: relationship.id,
          objectIds: [oid]
        });

        if (result[oid]) {
          records.push({
            name: relationship.name,
            features: result[oid].features,
            table: tableIdsLookup.current[relationship.relatedTableId]
          });
        }
      };

      setRelatedRecords(records);
    };

    if (highlightedHandle.current) {
      highlightedHandle.current.remove();
    }

    if (selectedFeature) {
      getRdId();
      getRelatedRecords();

      highlightedHandle.current = layerView.current.highlight(selectedFeature.attributes.OBJECTID);
    } else {
      setRdId(null);
      setRelatedRecords(null);
    }
  }, [selectedFeature]);

  return (
    <div className="app">
      <div className="side-bar">
        <VideosContainer rdId={rdId} mapView={mapView} {...videoDataSources} />
        <Feature feature={selectedFeature} mapView={mapView} relatedRecords={relatedRecords} />
      </div>
      <div ref={mapContainer}>
        { (sherlockConfig) ? <Sherlock {...sherlockConfig} /> : null }
      </div>
    </div>
  );
}

export default App;
