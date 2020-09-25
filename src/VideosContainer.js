import React from 'react';
import loadModules from './esriModules';
import Video from './Video';


const VideosContainer = ({ rdId, mapView, table, points }) => {
  const tableQueryTask = React.useRef();
  const [ videos, setVideos ] = React.useState([]);

  React.useEffect(() => {
    const initQueryTask = async () => {
      const { QueryTask } = await loadModules();

      tableQueryTask.current = new QueryTask({
        url: table.url
      });
    };

    if (table) {
      initQueryTask();
    }
  }, [table]);

  React.useEffect(() => {
    const giddyUp = async () => {
      const results = await tableQueryTask.current.execute({
        outFields: '*',
        where: `RD_ID = '${rdId}' AND URL IS NOT NULL`
      });

      if (results.features.length) {
        setVideos(results.features.map(feature => feature.attributes));
      }
    };

    if (rdId) {
      giddyUp();
    }
  }, [rdId]);

  return (
    <div>
      <h3>{rdId}</h3>
      { videos.map((video, index) => <Video key={index} {...video} pointsLayer={points} mapView={mapView} />) }
    </div>
  );
};

export default VideosContainer;