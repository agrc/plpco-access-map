/* global YT */
import React from 'react';
import loadModules from './esriModules';


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
const symbol = {
  type: 'picture-marker',
  url: `${process.env.PUBLIC_URL}/marker.svg`,
  width: 30,
  height: 30,
  angle: 0
};

const Video = ({ GPS_Track_ID, Date_Time, URL, pointsLayer, mapView }) => {
  const playerDiv = React.useRef();
  const pointsLookup = React.useRef({});
  const intervalId = React.useRef();
  const graphic = React.useRef();
  const [ videoAngle, setVideoAngle ] = React.useState(0)
  const [ angleOfSegment, setAngleOfSegment ] = React.useState(0);

  const onPlayerStateChange = React.useCallback(event => {
    if (intervalId.current) {
      window.clearInterval(intervalId.current);
    }

    if (event.data === YT.PlayerState.PLAYING) {
      const player = event.target;
      intervalId.current = window.setInterval(() => {
        const currentTime = Math.round(player.getCurrentTime()).toString();
        const position = pointsLookup.current[currentTime];

        if (position) {
          const keys = Object.keys(pointsLookup.current);
          const lastPosition = pointsLookup.current[keys[keys.indexOf(currentTime) - 1]]
          const nextPosition = pointsLookup.current[keys[keys.indexOf(currentTime) + 1]];
          const yDiff = nextPosition.y - lastPosition.y;
          const xDiff = nextPosition.x - lastPosition.x;
          setAngleOfSegment(90 - (Math.atan2(yDiff, xDiff) * 180) / Math.PI);

          mapView.goTo(position);
          graphic.current.geometry = position;
        }
      }, 1000);
    }
  }, [mapView]);

  React.useEffect(() => {
    if (graphic.current) {
      graphic.current.symbol = {
        ...symbol,
        angle: angleOfSegment - videoAngle
      };
    }
  }, [videoAngle, angleOfSegment]);

  React.useEffect(() => {
    let player;
    const updateVideoAngle = () => {
      if (player && player.getSphericalProperties) {
        const properties = player.getSphericalProperties();

        setVideoAngle(properties.yaw);
      }

      window.requestAnimationFrame(updateVideoAngle);
    };

    const giddyUp = async () => {
      const { Graphic } = await loadModules();
      graphic.current = new Graphic({ symbol });
      mapView.graphics.add(graphic.current);

      player = new YT.Player(playerDiv.current, {
        height: '200',
        width: '100%',
        videoId: getIDFromUrl(URL),
        events: {
          onStateChange: onPlayerStateChange
        }
      });

      updateVideoAngle();

      const queryForPoints = async (start=null, num=null) => {
        console.log('queryForPoints', start, num);

        const results = await pointsLayer.queryFeatures({
          where: `GPS_Track_ID = '${GPS_Track_ID}'`,
          outFields: '*',
          returnGeometry: true,
          orderByFields: 'Date_Time ASC',
          outSpatialReference: {
            wkid: 3857
          },
          start,
          num
        });

        if (results.exceededTransferLimit) {

          return results.features.concat(await queryForPoints(start + results.features.length + 1, results.features.length));
        }

        return results.features;
      }

      const features = await queryForPoints(null);

      if (features.length) {
        console.log('final features length', features.length);

        pointsLookup.current = parsePoints(features);
      }
    };

    giddyUp();

    return () => {
      if (graphic.current) {
        mapView.graphics.remove(graphic.current);
      }

      if (intervalId.current) {
        window.clearInterval(intervalId.current);
      }

      player.destroy();
    };
  }, [URL, pointsLayer, GPS_Track_ID, onPlayerStateChange, mapView]);

  return (
    <div>
      {new Date(Date_Time).toLocaleDateString()}
      <div ref={playerDiv}></div>
    </div>
  );
};

export default Video;
