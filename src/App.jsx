import esriConfig from '@arcgis/core/config';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import MapView from '@arcgis/core/views/MapView';
import WebMap from '@arcgis/core/WebMap';
import BasemapGallery from '@arcgis/core/widgets/BasemapGallery';
import Expand from '@arcgis/core/widgets/Expand';
import Legend from '@arcgis/core/widgets/Legend';
import clsx from 'clsx';
import queryString from 'query-string';
import React from 'react';
import { createRoot } from 'react-dom/client';
import './App.scss';
import config from './config';
import EndPointPhoto from './EndPointPhoto';
import Feature from './Feature';
import logo from './PLPCO_Logo_2022.jpeg';
import { MapServiceProvider, Sherlock } from './Sherlock';
import SidebarToggler from './SidebarToggler';
import useIsMobile from './useIsMobile';
import VideosContainer from './VideosContainer';
import WidgetToggle from './WidgetToggle';

const URL_PARAM = 'rdid';
const END_POINTS_LAYER_NAME = 'Video End Point';
const ROADS_LAYER_NAME = 'RS2477 Centerlines';
const VIDEO_REPORT_TABLE_NAME = 'Video Report';
const VIDEO_ROUTES_LAYER_NAME = 'Video_Routes - Video Route';

const getRdIdFromUrl = () => {
  const parameters = queryString.parse(document.location.hash);

  return parameters[URL_PARAM];
};

function App() {
  const mapContainer = React.useRef();
  const [mapView, setMapView] = React.useState();
  const [selectedRoadFeature, setSelectedRoadFeature] = React.useState();
  const [selectedEndPointFeature, setSelectedEndPointFeature] = React.useState();
  const [videoDataSources, setVideoDataSources] = React.useState({
    table: null,
    points: null,
  });
  const [rdId, setRdId] = React.useState();
  const roadsFeatureLayer = React.useRef();
  const endPointsFeatureLayer = React.useRef();
  const [sherlockConfig, setSherlockConfig] = React.useState();
  const highlightedHandle = React.useRef();
  const roadsLayerView = React.useRef();
  const endPointsLayerView = React.useRef();
  const [relatedRecords, setRelatedRecords] = React.useState();
  const tableIdsLookup = React.useRef({});
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = React.useState(!isMobile);

  React.useEffect(() => {
    if (rdId && getRdIdFromUrl() !== rdId) {
      document.location.hash = queryString.stringify({ [URL_PARAM]: rdId });
    }
  }, [rdId]);

  const highlightGraphicsLayer = React.useRef();
  React.useEffect(() => {
    const initMap = async () => {
      console.log('initMap');

      esriConfig.portalUrl = 'https://maps.publiclands.utah.gov/portal';

      const webMap = new WebMap({
        portalItem: {
          id: config.webMapId,
        },
      });

      highlightGraphicsLayer.current = new GraphicsLayer();
      webMap.add(highlightGraphicsLayer.current);

      const view = new MapView({
        map: webMap,
        container: mapContainer.current,
        extent: {
          xmax: -11762120.612131765,
          xmin: -13074391.513731329,
          ymax: 5225035.106177688,
          ymin: 4373832.359194187,
          spatialReference: {
            wkid: 3857,
          },
        },
      });
      view.popup = null;

      setMapView(view);

      await view.when();

      const basemapGallery = new BasemapGallery({ view });
      const expand = new Expand({
        view,
        content: basemapGallery,
      });
      view.ui.add(expand, 'top-left');

      const legend = new Legend({
        view,
        container: document.createElement('div'),
      });
      const toggleContainer = document.createElement('div');
      createRoot(toggleContainer).render(<WidgetToggle widget={legend} />);

      view.ui.add(toggleContainer, 'bottom-right');

      roadsFeatureLayer.current = view.map.layers.find((layer) => layer.title === ROADS_LAYER_NAME);
      roadsLayerView.current = await view.whenLayerView(roadsFeatureLayer.current);

      if (config.showEndPointPhotos) {
        endPointsFeatureLayer.current = view.map.layers.find((layer) => layer.title === END_POINTS_LAYER_NAME);
        endPointsLayerView.current = await view.whenLayerView(endPointsFeatureLayer.current);
      }

      view.map.tables.forEach((table) => {
        tableIdsLookup.current[table.layerId] = table;
      });
      const table = view.map.tables.find((table) => table.title === VIDEO_REPORT_TABLE_NAME);
      const points = view.map.layers.find((layer) => layer.title === VIDEO_ROUTES_LAYER_NAME);
      setVideoDataSources({ table, points });

      view.on('click', async (event) => {
        setSelectedRoadFeature(null);
        setSelectedEndPointFeature(null);
        setRelatedRecords(null);

        const test = await view.hitTest(event);

        if (test.results.length) {
          const selectedGraphic = test.results[0].graphic;

          if (selectedGraphic.layer.title === ROADS_LAYER_NAME) {
            setSelectedRoadFeature(selectedGraphic);
          } else if (selectedGraphic.layer.title === END_POINTS_LAYER_NAME) {
            setSelectedEndPointFeature(selectedGraphic);
          }
        }
      });

      const onSherlockMatch = async (matches) => {
        setSelectedRoadFeature(null);

        if (matches.length) {
          const graphic = matches[0];
          view.goTo(graphic);

          graphic.popupTemplate = roadsLayerView.current.layer.popupTemplate;
          setSelectedRoadFeature(graphic);
        }
      };

      setSherlockConfig({
        provider: new MapServiceProvider(`${roadsFeatureLayer.current.url}/0`, config.fieldNames.roads.S_Name, {
          outFields: ['*'],
          contextField: config.fieldNames.roads.County,
        }),
        placeHolder: 'search by street name...',
        onSherlockMatch,
        mapView: view,
        position: 'top-right',
      });

      const rdIdFromUrl = getRdIdFromUrl();
      if (rdIdFromUrl) {
        const featureSet = await roadsFeatureLayer.current.queryFeatures({
          where: `UPPER(${config.fieldNames.roads.RD_ID}) = UPPER('${rdIdFromUrl}')`,
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
      if (selectedRoadFeature.attributes[config.fieldNames.roads.RD_ID]) {
        setRdId(selectedRoadFeature.attributes[config.fieldNames.roads.RD_ID]);

        return;
      }

      // query for RD_ID for features that come from map click (they only include the OBJECTID)
      const featureSet = await roadsFeatureLayer.current.queryFeatures({
        where: `${config.fieldNames.roads.OBJECTID} = ${
          selectedRoadFeature.attributes[config.fieldNames.roads.OBJECTID]
        }`,
        returnGeometry: false,
        outFields: '*',
      });

      if (featureSet.features.length) {
        setRdId(featureSet.features[0].attributes[config.fieldNames.roads.RD_ID]);
      } else {
        setRdId(null);
      }
    };

    const getRelatedRecords = async () => {
      const records = [];
      const oid = selectedRoadFeature.attributes[config.fieldNames.roads.OBJECTID];

      for (const relationship of roadsFeatureLayer.current.relationships) {
        const result = await roadsFeatureLayer.current.queryRelatedFeatures({
          outFields: '*',
          relationshipId: relationship.id,
          objectIds: [oid],
        });

        if (result[oid]) {
          records.push({
            name: relationship.name,
            features: result[oid].features,
            table: tableIdsLookup.current[relationship.relatedTableId],
          });
        }
      }

      if (selectedRoadFeature) {
        setRelatedRecords(records);
      }
    };

    highlightGraphicsLayer.current.removeAll();

    if (selectedRoadFeature) {
      getRdId();

      if (config.showRelatedRecords) {
        getRelatedRecords();
      }

      const highlightGraphic = selectedRoadFeature.clone();
      highlightGraphic.symbol = { type: 'simple-line', color: '#00FFFF', width: 7 };
      highlightGraphicsLayer.current.add(highlightGraphic);
      setSidebarOpen(true);
    } else {
      setRdId(null);
      setRelatedRecords(null);
    }
  }, [selectedRoadFeature]);

  React.useEffect(() => {
    if (highlightedHandle.current) {
      highlightedHandle.current.remove();
    }

    if (selectedEndPointFeature) {
      const oid = selectedEndPointFeature.attributes[config.fieldNames.endPointPhotos.OBJECTID];
      console.log(`end point selected ${oid}`);

      highlightedHandle.current = endPointsLayerView.current.highlight(oid);
      setSidebarOpen(true);
    }
  }, [selectedEndPointFeature]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="app">
      <div className={clsx('side-bar', sidebarOpen && 'open')}>
        <a href="https://publiclands.utah.gov/public-lands/access-map-360/">
          <img src={logo} alt="logo" className="logo" style={{ width: 'calc(275px / 2)' }} />
        </a>
        <VideosContainer rdId={rdId} mapView={mapView} {...videoDataSources} />
        <EndPointPhoto
          oid={selectedEndPointFeature?.attributes[config.fieldNames.endPointPhotos.OBJECTID]}
          featureLayer={endPointsFeatureLayer.current}
        />
        <Feature
          feature={selectedRoadFeature || selectedEndPointFeature}
          mapView={mapView}
          relatedRecords={relatedRecords}
        />
      </div>
      <div ref={mapContainer}>
        <SidebarToggler sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
        {sherlockConfig ? <Sherlock {...sherlockConfig} /> : null}
      </div>
    </div>
  );
}

export default App;
