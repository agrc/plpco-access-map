import React from 'react';
import './App.css';
import getModules from './esriModules';

function App() {
  const mapContainer = React.useRef();

  const initMap = async () => {
    const { esriConfig, MapView, WebMap } = await getModules();

    esriConfig.portalUrl = 'https://maps.publiclands.utah.gov/portal';

    const webMap = new WebMap({
      portalItem: {
        id: 'ef84ebe3975d4431b0821f2feda538ad'
      }
    });

    const view = new MapView({
      map: webMap,
      container: mapContainer.current
    });
  };

  React.useEffect(() => {
    initMap();
  }, []);

  return (
    <div className="app">
      <div ref={mapContainer}></div>
    </div>
  );
}

export default App;
