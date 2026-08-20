/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import esriConfig from '@arcgis/core/config';
import IdentityManager from '@arcgis/core/identity/IdentityManager';
import OAuthInfo from '@arcgis/core/identity/OAuthInfo';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import '@arcgis/map-components/components/arcgis-basemap-gallery';
import '@arcgis/map-components/components/arcgis-expand';
import '@arcgis/map-components/components/arcgis-legend';
import '@arcgis/map-components/components/arcgis-map';
import { clsx } from 'clsx';
import queryString from 'query-string';
import React from 'react';
import './App.scss';
import config from './config';
import EndPointPhoto from './EndPointPhoto';
import Feature from './Feature';
import logo from './PLPCO_Logo_2022.jpeg';
import { MapServiceProvider, Sherlock } from './Sherlock';
import SidebarToggler from './SidebarToggler';
import useIsMobile from './useIsMobile';
import VideosContainer from './VideosContainer';

const URL_PARAM = 'rdid';
const END_POINTS_LAYER_NAME = 'Video End Point';
const ROADS_LAYER_NAME = 'RS2477 Centerlines';
const VIDEO_REPORT_TABLE_NAME = 'Video Report';
const VIDEO_ROUTES_LAYER_NAME = 'Video_Routes - Video Route';
const PORTAL_URL = 'https://maps.publiclands.utah.gov/portal';

const getRdIdFromUrl = () => {
  const parameters = queryString.parse(document.location.hash);

  return parameters[URL_PARAM];
};

const authenticateInternalUser = async () => {
  const { clientId } = config.authentication;

  if (!clientId) {
    throw new Error('Missing OAuth client ID. Please set VITE_APP_OAUTH_CLIENT_ID.');
  }

  const portalSharingUrl = `${PORTAL_URL}/sharing`;

  IdentityManager.registerOAuthInfos([
    new OAuthInfo({
      appId: clientId,
      portalUrl: PORTAL_URL,
      popup: false,
    }),
  ]);

  try {
    await IdentityManager.checkSignInStatus(portalSharingUrl);
  } catch {
    await IdentityManager.getCredential(portalSharingUrl);
  }
};

function App() {
  const mapElement = React.useRef();
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
  const [authenticationState, setAuthenticationState] = React.useState(config.authentication ? 'loading' : 'ready');
  const [authenticationError, setAuthenticationError] = React.useState();
  const [mapConfigured, setMapConfigured] = React.useState(false);

  React.useEffect(() => {
    if (rdId && getRdIdFromUrl() !== rdId) {
      document.location.hash = queryString.stringify({ [URL_PARAM]: rdId });
    }
  }, [rdId]);

  const highlightGraphicsLayer = React.useRef();
  React.useEffect(() => {
    const configureMap = async () => {
      try {
        esriConfig.portalUrl = PORTAL_URL;
        if (config.authentication) {
          await authenticateInternalUser();
        }
        setAuthenticationState('ready');
      } catch (error) {
        setAuthenticationError(error);
        setAuthenticationState('error');
        return;
      }

      setMapConfigured(true);
    };

    configureMap();
  }, []);

  React.useEffect(() => {
    if (!mapConfigured || !mapElement.current) {
      return;
    }

    const initMap = async () => {
      const map = mapElement.current;

      map.extent = {
        xmax: -11762120.612131765,
        xmin: -13074391.513731329,
        ymax: 5225035.106177688,
        ymin: 4373832.359194187,
        spatialReference: {
          wkid: 3857,
        },
      };

      try {
        await map.viewOnReady();
      } catch (error) {
        console.error('Unable to load the Access Map web map.', error);
        setAuthenticationError(error);
        setAuthenticationState('error');
        return;
      }

      const view = map.view;

      highlightGraphicsLayer.current = new GraphicsLayer();
      map.map.add(highlightGraphicsLayer.current);

      setMapView(view);

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
  }, [mapConfigured]);

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

    if (!highlightGraphicsLayer.current) {
      return;
    }

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
    <>
      {authenticationState === 'loading' ? (
        <div
          className="position-absolute top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
          role="status"
        >
          Signing in...
        </div>
      ) : null}
      {authenticationState === 'error' ? (
        <div className="position-absolute top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center">
          <div className="alert alert-danger w-75" role="alert">
            Unable to initialize the Access Map.
            {authenticationError?.message ? <div className="mt-2">{authenticationError.message}</div> : null}
          </div>
        </div>
      ) : null}
      <main className="app" id="main-content">
        <h1 className="visually-hidden">{config.appTitle}</h1>
        <div aria-label="Road details and media" className={clsx('side-bar', sidebarOpen && 'open')} id="app-sidebar">
          <a href="https://publiclands.utah.gov/public-lands/access-map-360/">
            <img src={logo} alt="PLPCO logo" className="logo" style={{ width: 'calc(275px / 2)' }} />
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
        <div className="map-container">
          {mapConfigured ? (
            <arcgis-map
              aria-label="Interactive map"
              item-id={config.webMapId}
              popup-disabled
              ref={mapElement}
              role="region"
            >
              <arcgis-expand slot="top-left">
                <arcgis-basemap-gallery />
              </arcgis-expand>
              <arcgis-expand expand-icon="legend" expand-tooltip="Show legend" slot="bottom-right" expanded={true}>
                <arcgis-legend heading-level="2" />
              </arcgis-expand>
            </arcgis-map>
          ) : null}
          <SidebarToggler sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
          {sherlockConfig ? <Sherlock {...sherlockConfig} /> : null}
        </div>
      </main>
    </>
  );
}

export default App;
