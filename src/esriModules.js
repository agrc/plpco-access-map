import { loadModules } from 'esri-loader';


export default async () => {
  const requires = [
    'esri/config',
    'esri/WebMap',
    'esri/views/MapView',
    'esri/widgets/Feature',
    'esri/tasks/QueryTask',
    'esri/Graphic',
    'esri/widgets/Legend'
  ];

  const [
    esriConfig,
    WebMap,
    MapView,
    Feature,
    QueryTask,
    Graphic,
    Legend
  ] = await loadModules(requires, { version: '4.16', css: true });

  return {
    esriConfig,
    WebMap,
    MapView,
    Feature,
    QueryTask,
    Graphic,
    Legend
  };
}
