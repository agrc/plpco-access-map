import esriConfig from '@arcgis/core/config';
import type { ResourceHandle as Handle } from '@arcgis/core/core/Handles';
import Graphic from '@arcgis/core/Graphic';
import IdentityManager from '@arcgis/core/identity/IdentityManager';
import OAuthInfo from '@arcgis/core/identity/OAuthInfo';
import type FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import type Layer from '@arcgis/core/layers/Layer';
import type Map from '@arcgis/core/Map';
import type FeatureLayerView from '@arcgis/core/views/layers/FeatureLayerView';
import type MapView from '@arcgis/core/views/MapView';
import '@arcgis/map-components/components/arcgis-basemap-gallery';
import '@arcgis/map-components/components/arcgis-expand';
import '@arcgis/map-components/components/arcgis-layer-list';
import '@arcgis/map-components/components/arcgis-legend';
import '@arcgis/map-components/components/arcgis-map';
import type { ArcgisMap } from '@arcgis/map-components/components/arcgis-map';
import { clsx } from 'clsx';
import queryString from 'query-string';
import React from 'react';
import './App.scss';
import config from './config';
import EndPointPhoto from './EndPointPhoto';
import Feature from './Feature';
import logo from './PLPCO_Logo_2022.jpeg';
import { isPopupEnabledGraphic } from './popupSelection';
import { MapServiceProvider, Sherlock } from './Sherlock';
import SidebarToggler from './SidebarToggler';
import useIsMobile from './useIsMobile';
import type { VideoPointsLayer } from './Video';
import VideosContainer from './VideosContainer';

type MapElement = ArcgisMap & { view: MapView; map: Map };

const URL_PARAM = 'rdid';
const END_POINTS_LAYER_NAME = 'Video End Point';
const ROADS_LAYER_NAME = 'RS2477 Centerlines';
const VIDEO_REPORT_TABLE_NAME = 'Video Report';
const VIDEO_ROUTES_LAYER_NAME = 'Video_Routes - Video Route';
const PORTAL_URL = 'https://maps.publiclands.utah.gov/portal';

const showLayerListItem = (item: { layer?: { title?: string | null } | null }) =>
  Boolean(item.layer?.title) && item.layer?.title !== 'Untitled layer';

const getRdIdFromUrl = (): string | null => {
  const parameters = queryString.parse(document.location.hash);
  const raw = parameters[URL_PARAM];

  if (typeof raw !== 'string' || raw.length === 0) return null;

  return raw.replace(/'/g, "''");
};

const authenticateInternalUser = async () => {
  const { clientId } = config.authentication ?? {};

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
  const mapElement = React.useRef<MapElement | null>(null);
  const [mapView, setMapView] = React.useState<MapView | null>(null);
  const [selectedFeature, setSelectedFeature] = React.useState<Graphic | null>(null);
  const [selectedRoadFeature, setSelectedRoadFeature] = React.useState<Graphic | null>(null);
  const [selectedEndPointFeature, setSelectedEndPointFeature] = React.useState<Graphic | null>(null);
  const [videoDataSources, setVideoDataSources] = React.useState({
    table: undefined as FeatureLayer | undefined,
    points: undefined as VideoPointsLayer | undefined,
  });
  const [rdId, setRdId] = React.useState<string | null>(null);
  const roadsFeatureLayer = React.useRef<FeatureLayer | null>(null);
  const endPointsFeatureLayer = React.useRef<FeatureLayer | null>(null);
  const [sherlockConfig, setSherlockConfig] = React.useState<{
    provider: MapServiceProvider;
    placeHolder: string;
    onSherlockMatch: (matches: Graphic[]) => void;
  } | null>(null);
  const highlightedHandle = React.useRef<Handle | null>(null);
  const selectedFeatureHighlightHandle = React.useRef<Handle | null>(null);
  const roadsLayerView = React.useRef<FeatureLayerView | null>(null);
  const endPointsLayerView = React.useRef<FeatureLayerView | null>(null);
  const [relatedRecords, setRelatedRecords] = React.useState<Array<{
    name: string;
    features: Graphic[];
    table: FeatureLayer;
  }> | null>(null);
  const tableIdsLookup = React.useRef<Record<number, FeatureLayer>>({});
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = React.useState(!isMobile);
  const [authenticationState, setAuthenticationState] = React.useState(config.authentication ? 'loading' : 'ready');
  const [authenticationError, setAuthenticationError] = React.useState<Error | null>(null);
  const [mapConfigured, setMapConfigured] = React.useState(false);

  React.useEffect(() => {
    if (rdId && getRdIdFromUrl() !== rdId) {
      document.location.hash = queryString.stringify({ [URL_PARAM]: rdId });
    }
  }, [rdId]);

  const highlightGraphicsLayer = React.useRef<GraphicsLayer | null>(null);
  React.useEffect(() => {
    const configureMap = async () => {
      try {
        esriConfig.portalUrl = PORTAL_URL;
        if (config.authentication) {
          await authenticateInternalUser();
        }
        setAuthenticationState('ready');
      } catch (error) {
        setAuthenticationError(error instanceof Error ? error : new Error(String(error)));
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
      if (!map || !map.map) return;

      map.extent = {
        xmax: -11762120.612131765,
        xmin: -13074391.513731329,
        ymax: 5225035.106177688,
        ymin: 4373832.359194187,
        spatialReference: {
          wkid: 3857,
        } as unknown as MapElement['view']['spatialReference'],
      } as unknown as MapElement['extent'];

      try {
        await map.viewOnReady();
      } catch (error) {
        console.error('Unable to load the Access Map web map.', error);
        setAuthenticationError(error instanceof Error ? error : new Error(String(error)));
        setAuthenticationState('error');
        return;
      }

      const view = map.view;

      highlightGraphicsLayer.current = new GraphicsLayer({
        listMode: 'hide',
        title: 'Selected road highlight',
      });
      map.map.add(highlightGraphicsLayer.current);

      map.map.allLayers.forEach((layer) => {
        if (!layer.title || layer.title === 'Untitled layer') {
          layer.listMode = 'hide';
        }
      });

      setMapView(view);

      if (!view.map) return;
      roadsFeatureLayer.current = view.map.layers.find((layer) => layer.title === ROADS_LAYER_NAME) as FeatureLayer;
      if (!roadsFeatureLayer.current) return;
      roadsLayerView.current = (await view.whenLayerView(roadsFeatureLayer.current)) as FeatureLayerView;

      if (config.showEndPointPhotos) {
        endPointsFeatureLayer.current = view.map.layers.find(
          (layer) => layer.title === END_POINTS_LAYER_NAME,
        ) as FeatureLayer;
        if (endPointsFeatureLayer.current) {
          endPointsLayerView.current = (await view.whenLayerView(endPointsFeatureLayer.current)) as FeatureLayerView;
        }
      }

      view.map.tables.forEach((table) => {
        const featureTable = table as FeatureLayer;
        tableIdsLookup.current[featureTable.layerId] = featureTable;
      });
      const table = view.map.tables.find((table) => table.title === VIDEO_REPORT_TABLE_NAME);
      const points = view.map.layers.find((layer) => layer.title === VIDEO_ROUTES_LAYER_NAME) as
        VideoPointsLayer | undefined;
      setVideoDataSources({ table: table as FeatureLayer | undefined, points });

      view.on('click', async (event) => {
        setSelectedFeature(null);
        setSelectedRoadFeature(null);
        setSelectedEndPointFeature(null);
        setRelatedRecords(null);

        const test = await view.hitTest(event);

        const selectedGraphic = test.results
          .filter((result): result is typeof result & { graphic: Graphic } => 'graphic' in result)
          .map((result) => result.graphic)
          .find(isPopupEnabledGraphic);

        if (selectedGraphic) {
          setSelectedFeature(selectedGraphic);

          if (selectedGraphic.layer?.title === ROADS_LAYER_NAME) {
            setSelectedRoadFeature(selectedGraphic);
          } else if (selectedGraphic.layer?.title === END_POINTS_LAYER_NAME) {
            setSelectedEndPointFeature(selectedGraphic);
          }
        }
      });

      const onSherlockMatch = async (matches: Graphic[]) => {
        setSelectedFeature(null);
        setSelectedRoadFeature(null);

        if (matches.length) {
          const graphic = matches[0];
          if (!graphic) return;
          view.goTo(graphic);

          if (roadsLayerView.current) {
            graphic.popupTemplate = roadsLayerView.current.layer.popupTemplate;
          }
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
      });

      const rdIdFromUrl = getRdIdFromUrl();
      if (rdIdFromUrl) {
        const featureSet = await roadsFeatureLayer.current.queryFeatures({
          where: `UPPER(${config.fieldNames.roads.RD_ID}) = UPPER('${rdIdFromUrl}')`,
          returnGeometry: true,
          outFields: ['*'],
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
    let cancelled = false;
    const highlightLayer = highlightGraphicsLayer.current;

    highlightLayer?.removeAll();

    if (!selectedRoadFeature || !roadsFeatureLayer.current || !highlightLayer) {
      setRdId(null);
      setRelatedRecords(null);
      return () => {
        cancelled = true;
      };
    }

    const roadsLayer = roadsFeatureLayer.current;

    const getRdId = async () => {
      if (selectedRoadFeature.attributes[config.fieldNames.roads.RD_ID]) {
        if (!cancelled) {
          setRdId(String(selectedRoadFeature.attributes[config.fieldNames.roads.RD_ID]));
        }

        return;
      }

      // query for RD_ID for features that come from map click (they only include the OBJECTID)
      const featureSet = await roadsLayer.queryFeatures({
        where: `${config.fieldNames.roads.OBJECTID} = ${
          selectedRoadFeature.attributes[config.fieldNames.roads.OBJECTID]
        }`,
        returnGeometry: false,
        outFields: ['*'],
      });

      if (featureSet.features.length) {
        const feature = featureSet.features[0];
        if (feature && !cancelled) setRdId(String(feature.attributes[config.fieldNames.roads.RD_ID]));
      } else {
        if (!cancelled) setRdId(null);
      }
    };

    const getRelatedRecords = async () => {
      const records = [];
      const oid = selectedRoadFeature.attributes[config.fieldNames.roads.OBJECTID];

      for (const relationship of roadsLayer.relationships ?? []) {
        const result = await roadsLayer.queryRelatedFeatures({
          outFields: ['*'],
          relationshipId: relationship.id,
          objectIds: [oid],
        });

        if (result[oid]) {
          records.push({
            name: relationship.name ?? '',
            features: result[oid].features,
            table: tableIdsLookup.current[relationship.relatedTableId],
          });
        }
      }

      if (selectedRoadFeature && !cancelled) {
        setRelatedRecords(
          records.filter((record): record is { name: string; features: Graphic[]; table: FeatureLayer } =>
            Boolean(record.table),
          ),
        );
      }
    };

    if (selectedRoadFeature) {
      getRdId();

      if (config.showRelatedRecords) {
        getRelatedRecords();
      }

      const highlightGraphic = selectedRoadFeature.clone();
      highlightGraphic.symbol = { type: 'simple-line', color: '#00FFFF', width: 7 };
      highlightLayer.add(highlightGraphic);
      setSidebarOpen(true);
    } else {
      setRdId(null);
      setRelatedRecords(null);
    }

    return () => {
      cancelled = true;
    };
  }, [selectedRoadFeature]);

  React.useEffect(() => {
    selectedFeatureHighlightHandle.current?.remove();
    selectedFeatureHighlightHandle.current = null;

    if (
      !selectedFeature ||
      !selectedFeature.layer ||
      !('popupEnabled' in selectedFeature.layer) ||
      selectedFeature.layer.title === ROADS_LAYER_NAME ||
      selectedFeature.layer.title === END_POINTS_LAYER_NAME
    ) {
      return;
    }

    let cancelled = false;

    const highlightSelectedFeature = async () => {
      if (!mapView) return;

      const layerView = (await mapView.whenLayerView(selectedFeature.layer as Layer)) as FeatureLayerView;

      if (!cancelled && layerView) {
        selectedFeatureHighlightHandle.current = layerView.highlight(selectedFeature);
      }
    };

    highlightSelectedFeature();

    return () => {
      cancelled = true;
      selectedFeatureHighlightHandle.current?.remove();
      selectedFeatureHighlightHandle.current = null;
    };
  }, [mapView, selectedFeature]);

  React.useEffect(() => {
    if (highlightedHandle.current) {
      highlightedHandle.current.remove();
    }

    if (selectedEndPointFeature) {
      const oid = selectedEndPointFeature.attributes[config.fieldNames.endPointPhotos.OBJECTID];
      console.log(`end point selected ${oid}`);

      if (endPointsLayerView.current) {
        highlightedHandle.current = endPointsLayerView.current.highlight(oid);
      }
      setSidebarOpen(true);
    }
  }, [selectedEndPointFeature]);

  const toggleSidebar = () => {
    setSidebarOpen((open) => !open);
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
          <VideosContainer rdId={rdId ?? undefined} mapView={mapView ?? undefined} {...videoDataSources} />
          <EndPointPhoto
            oid={selectedEndPointFeature?.attributes[config.fieldNames.endPointPhotos.OBJECTID]}
            featureLayer={endPointsFeatureLayer.current ?? undefined}
          />
          <Feature
            feature={selectedFeature || selectedRoadFeature || selectedEndPointFeature}
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
              <arcgis-expand expand-icon="layers" expand-tooltip="Show layer list" slot="top-left">
                <arcgis-layer-list filterPredicate={showLayerListItem} />
              </arcgis-expand>
              <arcgis-expand expand-icon="legend" expand-tooltip="Show legend" slot="bottom-right">
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
