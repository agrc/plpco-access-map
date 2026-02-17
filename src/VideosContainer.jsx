import PropTypes from 'prop-types';
import React from 'react';
import config from './config';
import Video from './Video';
import './VideosContainer.scss';

const VideosContainer = ({ rdId, mapView, table, points }) => {
  const [videos, setVideos] = React.useState([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    const giddyUp = async () => {
      setLoading(true);
      const results = await table.queryFeatures({
        where: `UPPER(${config.fieldNames.videoReports.RD_ID}) = UPPER('${rdId}') AND URL IS NOT NULL`,
        outFields: '*',
      });

      if (results.features.length) {
        setVideos(results.features.map((feature) => feature.attributes));
      }
      setLoading(false);
    };

    if (rdId) {
      giddyUp();
    } else {
      setVideos([]);
    }
  }, [rdId, table]);

  return (
    <div className="videos-container">
      {rdId && <h3>{rdId}</h3>}
      {videos.map((video, index) => (
        <Video key={index} {...video} pointsLayer={points} mapView={mapView} />
      ))}
      {!loading && rdId && videos.length === 0 ? (
        <div className="alert alert-danger">No videos were found for this road.</div>
      ) : null}
    </div>
  );
};

VideosContainer.propTypes = {
  rdId: PropTypes.string,
  mapView: PropTypes.object,
  table: PropTypes.shape({
    queryFeatures: PropTypes.func.isRequired,
  }),
  points: PropTypes.object,
};

export default VideosContainer;
