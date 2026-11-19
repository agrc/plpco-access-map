import { test as base, expect } from '@playwright/test';
import { fileURLToPath } from 'node:url';

export const road = {
  OBJECTID: 1,
  rd_id: 'RD010015',
  S_Name: 'Elephant Canyon Road',
  CO_Unique: 'BEAVER-0015',
  County: 'Beaver',
};
export const otherRoad = {
  OBJECTID: 2,
  rd_id: 'RD010016',
  S_Name: road.S_Name,
  CO_Unique: 'KANE-0016',
  County: 'Kane',
};
const layerId = '1a1c1e19065-layer-15';
const layerUrl = 'https://search-test.invalid/arcgis/rest/services/Roads/FeatureServer/0';
const fields = Object.keys(road).map((name) => ({
  name,
  alias: name,
  type: name === 'OBJECTID' ? 'esriFieldTypeOID' : 'esriFieldTypeString',
}));
const geometry = {
  paths: [
    [
      [-12540000, 4650000],
      [-12539000, 4651000],
    ],
  ],
  spatialReference: { wkid: 3857 },
};

export const test = base.extend({
  page: async ({ page }, runPage) => {
    // Exercise native search without live feature services or deployment credentials.
    await page.route('**/*', (route) => {
      const { hostname } = new URL(route.request().url());
      return hostname === '127.0.0.1' || hostname === 'localhost' ? route.continue() : route.abort();
    });
    await page.route('https://js.arcgis.com/**', (route) => {
      const { pathname } = new URL(route.request().url());
      const mapAsset = pathname.match(/\/map-components\/assets\/(.+)/)?.[1];
      const coreAsset = pathname.match(/\/@arcgis\/core\/assets\/(.+)/)?.[1];
      const calciteAsset = pathname.match(/\/calcite-components\/[^/]+\/assets\/(.+)/)?.[1];
      const assetPath = mapAsset
        ? `@arcgis/map-components/dist/cdn/assets/${mapAsset}`
        : coreAsset
          ? `@arcgis/core/assets/${coreAsset}`
          : calciteAsset
            ? `@arcgis/core/assets/components/assets/${calciteAsset}`
            : null;
      return assetPath
        ? route.fulfill({ path: fileURLToPath(new URL(`../node_modules/${assetPath}`, import.meta.url)) })
        : route.abort();
    });
    await page.route('**/src/config.ts', (route) =>
      route.fulfill({
        contentType: 'application/javascript',
        body: `export default ${JSON.stringify({
          appTitle: 'Access Map',
          webMapId: '45e7f29dfe474cfbab419feacd99ddd5',
          maxMobileWidth: 600,
          showRelatedRecords: false,
          showEndPointPhotos: false,
          fieldNames: { roads: { RD_ID: 'rd_id', S_Name: 'S_Name', County: 'County' } },
        })}`,
      }),
    );
    await page.route('**/sharing/rest/**', (route) => {
      const url = new URL(route.request().url());
      if (url.pathname.endsWith('/data')) {
        return route.fulfill({
          json: {
            version: '2.30',
            baseMap: { baseMapLayers: [], title: 'Empty basemap' },
            operationalLayers: [
              {
                id: layerId,
                title: 'RS2477 Centerlines',
                layerType: 'ArcGISFeatureLayer',
                url: layerUrl,
                popupInfo: {
                  title: '{S_Name}',
                  fieldInfos: fields
                    .filter(({ name }) => name !== 'County')
                    .map(({ name }) => ({ fieldName: name, label: name, visible: true })),
                },
              },
            ],
            applicationProperties: {
              viewing: {
                search: {
                  enabled: true,
                  hintText: 'Search for Road',
                  layers: ['CO_Unique', 'S_Name', 'rd_id'].map((name) => ({
                    id: layerId,
                    field: { name, exactMatch: false, type: 'esriFieldTypeString' },
                  })),
                },
              },
            },
          },
        });
      }
      if (url.pathname.includes('/content/items/')) {
        return route.fulfill({
          json: {
            id: '45e7f29dfe474cfbab419feacd99ddd5',
            type: 'Web Map',
            title: 'Search test map',
            owner: 'test',
          },
        });
      }
      return route.fulfill({
        json: {
          currentVersion: '11.3',
          helperServices: {
            geocode: [
              {
                name: 'ArcGIS World Geocoding Service',
                url: 'https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer',
                singleLineFieldName: 'SingleLine',
              },
            ],
          },
        },
      });
    });
    await page.route('https://search-test.invalid/**', (route) => {
      const url = new URL(route.request().url());
      const parameters = new URLSearchParams(route.request().postData() ?? url.search);
      if (url.pathname.endsWith('/query')) {
        const where = parameters.get('where') ?? '';
        const objectIds = parameters.get('objectIds')?.split(',').map(Number);
        const outFields = parameters.get('outFields')?.split(',') ?? ['*'];
        const matches = [road, otherRoad].filter((attributes) =>
          objectIds
            ? objectIds.includes(attributes.OBJECTID)
            : where === '1=1' ||
              Object.entries(attributes).some(
                ([field, value]) =>
                  where.toLowerCase().includes(field.toLowerCase()) &&
                  String(value)
                    .toLowerCase()
                    .includes((where.match(/'%?(.*?)%?'/)?.[1] ?? '').replace(/%$/, '').toLowerCase()),
              ),
        );
        return route.fulfill({
          json: {
            objectIdFieldName: 'OBJECTID',
            geometryType: 'esriGeometryPolyline',
            spatialReference: { wkid: 3857 },
            fields,
            features: matches.map((attributes) => ({
              attributes: Object.fromEntries(
                Object.entries(attributes).filter(([field]) => outFields.includes('*') || outFields.includes(field)),
              ),
              geometry,
            })),
            exceededTransferLimit: false,
          },
        });
      }
      return route.fulfill({
        json: {
          id: 0,
          name: 'RS2477 Centerlines',
          type: 'Feature Layer',
          geometryType: 'esriGeometryPolyline',
          objectIdField: 'OBJECTID',
          displayField: 'S_Name',
          fields,
          extent: {
            xmin: -12540000,
            ymin: 4650000,
            xmax: -12539000,
            ymax: 4651000,
            spatialReference: { wkid: 3857 },
          },
          capabilities: 'Query',
          advancedQueryCapabilities: { supportsPagination: true, supportsOrderBy: true, supportsDistinct: true },
          drawingInfo: { renderer: { type: 'simple', symbol: { type: 'esriSLS', color: [0, 0, 0, 255], width: 1 } } },
          relationships: [],
        },
      });
    });
    await runPage(page);
  },
});

export { expect };
