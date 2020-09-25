import { loadModules } from 'esri-loader';


export default async () => {
  const requires = [
    'esri/config',
    'esri/WebMap',
    'esri/views/MapView',
    'esri/widgets/Feature'
  ];

  const [
    esriConfig,
    WebMap,
    MapView,
    Feature
  ] = await loadModules(requires, { version: '4.16', css: true });

  return {
    esriConfig,
    WebMap,
    MapView,
    Feature
  };
}
