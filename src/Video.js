/* global YT */
import React from 'react';


export const getIDFromUrl = url => {
  if (url.indexOf('=') > 0) {
    return url.split('=').pop();
  }

  return url.split('/').pop();
};

export const parsePoints = features => {
  const lookup = {};
  let start;
  features.forEach(point => {
    const date = new Date(point.attributes.Date_Time);
    const seconds = Math.round(date.getTime() / 1000);
    if (start) {
      lookup[seconds - start] = point.geometry;
    } else {
      start = seconds;
      lookup[0] = point.geometry;
    }
  });

  return lookup;
};

const Video = ({ GPS_Track_ID, Date_Time, URL, pointsLayer, mapView }) => {
  const playerDiv = React.useRef();
  const pointsLookup = React.useRef({});
  const intervalId = React.useRef();

  const onPlayerStateChange = React.useCallback(event => {
    if (intervalId.current) {
      window.clearInterval(intervalId.current);
    }

    if (event.data === YT.PlayerState.PLAYING) {
      const player = event.target;
      intervalId.current = window.setInterval(() => {
        const position = pointsLookup.current[Math.round(player.getCurrentTime())];
        if (position) {
          console.log('updateVideoPosition', position);
          mapView.center = position.toJSON();
        }
      }, 1000);
    }
  }, [mapView]);

  React.useEffect(() => {
    const giddyUp = async () => {
      new YT.Player(playerDiv.current, {
        height: '200',
        width: '100%',
        videoId: getIDFromUrl(URL),
        events: {
          onStateChange: onPlayerStateChange
        }
      });

      const results = await pointsLayer.queryFeatures({
        where: `GPS_Track_ID = '${GPS_Track_ID}'`,
        outFields: '*',
        returnGeometry: true,
        orderByFields: 'Date_Time ASC',
        outSpatialReference: {
          wkid: 3857
        }
      });

      if (results.features.length) {
        pointsLookup.current = parsePoints(results.features);
      }
    };

    giddyUp();
  }, [URL, pointsLayer, GPS_Track_ID, onPlayerStateChange]);

  return (
    <div>
      {new Date(Date_Time).toLocaleDateString()}
      <div ref={playerDiv}></div>
    </div>
  );
};

export default Video;
