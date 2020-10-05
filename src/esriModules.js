import { loadModules } from 'esri-loader';


export default async () => {
  const requires = [
    'esri/config',
    'esri/Graphic',
    'esri/tasks/QueryTask',
    'esri/tasks/support/Query',
    'esri/views/MapView',
    'esri/WebMap',
    'esri/widgets/Feature',
    'esri/widgets/Legend',
    'esri/PopupTemplate'
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
    PopupTemplate
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
    PopupTemplate
  };
}
