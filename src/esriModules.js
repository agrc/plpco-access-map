import { loadModules } from 'esri-loader';


export default async function esriModules() {
  const requires = [
    'esri/config',
    'esri/Graphic',
    'esri/tasks/QueryTask',
    'esri/tasks/support/Query',
    'esri/views/MapView',
    'esri/WebMap',
    'esri/widgets/Feature',
    'esri/widgets/Legend',
    'esri/PopupTemplate',
    'esri/widgets/BasemapGallery',
    'esri/widgets/Expand'
  ];

  const [
    esriConfig,
    Graphic,
    QueryTask,
    Query,
    MapView,
    WebMap,
    Feature,
    Legend,
    PopupTemplate,
    BasemapGallery,
    Expand
  ] = await loadModules(requires, { version: '4.16', css: true });

  return {
    esriConfig,
    Graphic,
    QueryTask,
    Query,
    MapView,
    WebMap,
    Feature,
    Legend,
    PopupTemplate,
    BasemapGallery,
    Expand
  };
}
