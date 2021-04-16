/* global YT */
import React from 'react';
import loadModules from './esriModules';
import './Video.scss';
import config from './config';
import useIsMobile from './useIsMobile';


export const getIDFromUrl = url => {
  // check for valid URL
  new URL(url);

  if (url.indexOf('=') > 0) {
    return url.split('=').pop();
  }

  return url.split('/').pop();
};

export const parsePoints = features => {
  const lookup = {};
  let start;
  features.forEach(point => {
    const date = new Date(point.attributes[config.fieldNames.videoRoutePoints.Date_Time]);
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

const Video = ({ GPS_Track_ID, Date_Time, URL, pointsLayer, mapView, testWarningMessage }) => {
  const playerDiv = React.useRef();
  const pointsLookup = React.useRef({});
  const intervalId = React.useRef();
  const graphic = React.useRef();
  const [ videoAngle, setVideoAngle ] = React.useState(0)
  const [ angleOfSegment, setAngleOfSegment ] = React.useState(0);
  const player = React.useRef();
  const requestAnimationId = React.useRef();
  const [ errorMessage, setErrorMessage ] = React.useState();
  const [ warningMessage, setWarningMessage ] = React.useState(testWarningMessage);
  const isMobile = useIsMobile();

  const updateVideoAngle = React.useCallback((oldPlayerId) => {
    if (oldPlayerId) {
      window.cancelAnimationFrame(oldPlayerId);
    }

    if (player.current && player.current.getSphericalProperties) {
      const properties = player.current.getSphericalProperties();

      setVideoAngle(properties.yaw);
    }

    requestAnimationId.current = window.requestAnimationFrame(updateVideoAngle);
  }, []);

  const onPlayerStateChange = React.useCallback(event => {
    if (intervalId.current) {
      window.clearInterval(intervalId.current);
    }

    if (event.data === YT.PlayerState.PLAYING) {
      console.log('playing');

      player.current = event.target;

      updateVideoAngle(requestAnimationId.current);

      intervalId.current = window.setInterval(() => {
        const currentTime = Math.round(player.current.getCurrentTime()).toString();
        const position = pointsLookup.current[currentTime];

        if (position) {
          const keys = Object.keys(pointsLookup.current);
          const lastPosition = pointsLookup.current[keys[keys.indexOf(currentTime) - 1]];
          const nextPosition = pointsLookup.current[keys[keys.indexOf(currentTime) + 1]];

          if (lastPosition && nextPosition) {
            const yDiff = nextPosition.y - lastPosition.y;
            const xDiff = nextPosition.x - lastPosition.x;
            setAngleOfSegment(90 - (Math.atan2(yDiff, xDiff) * 180) / Math.PI);
          }

          mapView.goTo(position);
          graphic.current.geometry = position;
        }
      }, 1000);
    }
  }, [mapView, updateVideoAngle]);

  React.useEffect(() => {
    if (graphic.current) {
      graphic.current.symbol = {
        ...symbol,
        angle: angleOfSegment - videoAngle
      };
    }
  }, [videoAngle, angleOfSegment]);

  React.useEffect(() => {
    const giddyUp = async () => {
      const { Graphic } = await loadModules();
      graphic.current = new Graphic({ symbol });
      mapView.graphics.add(graphic.current);

      let videoId;
      try {
        videoId = getIDFromUrl(URL);
      } catch (e) {
        setErrorMessage(`Invalid Video URL: ${URL}`);

        return;
      }

      new YT.Player(playerDiv.current, {
        height: '250',
        width: '100%',
        videoId,
        events: {
          onStateChange: onPlayerStateChange
        }
      });

      const queryForPoints = async (start=null, num=null) => {
        console.log('queryForPoints', start, num);

        const results = await pointsLayer.queryFeatures({
          where: `UPPER(${config.fieldNames.videoRoutePoints.GPS_Track_ID}) = UPPER('${GPS_Track_ID}')`,
          outFields: '*',
          returnGeometry: true,
          orderByFields: `${config.fieldNames.videoRoutePoints.Date_Time} ASC`,
          outSpatialReference: mapView.spatialReference,
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
        pointsLookup.current = parsePoints(features);
      } else {
        setWarningMessage(`No points found for GPS_Track_ID: ${GPS_Track_ID}`);
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

      if (requestAnimationId.current) {
        window.cancelAnimationFrame(requestAnimationId.current);
      }

      if (player.current) {
        player.current.destroy();
      }
    };
  }, [URL, pointsLayer, GPS_Track_ID, onPlayerStateChange, mapView, updateVideoAngle, setErrorMessage, setWarningMessage]);

  const popOut = () => {
    console.log('popOut');

    if (player.current) {
      player.current.pauseVideo();
    }

    const popupWindow = window.open('', 'roadsVideo', 'width=640,height=390,location=0');

    const id = getIDFromUrl(URL);
    const iframe = popupWindow.document.createElement('iframe');
    iframe.style = 'border: none;';
    iframe.src = `https://www.youtube.com/embed/${id}?enablejsapi=1`;
    popupWindow.document.body.appendChild(iframe);

    const popupPlayer = new YT.Player(iframe, {
      events: {
        onStateChange: onPlayerStateChange,
        onReady: (event) => {
          if (player.current) {
            event.target.seekTo(player.current.getCurrentTime(), true);
          }
        }
      }
    });

    popupWindow.document.body.style.margin = 0;
    popupWindow.addEventListener('unload', () => {
        window.clearInterval(intervalId.current);
        popupPlayer.destroy();
        window.cancelAnimationFrame(requestAnimationId);
    });

    // close popup window if the main window is closed or reloaded
    window.addEventListener('unload', () => {
      popupWindow.close();
    });

    // need to wait a bit for the window to finish laying out
    // otherwise the iframe has 0 height
    window.setTimeout(() => {
      iframe.width = '100%';
      iframe.height = '100%';
    }, 500);
  };

  return (
    <div className="video">
        <div className="header">
          { // ref: https://icons.getbootstrap.com/icons/box-arrow-up-right/
          }
          { !isMobile ? <svg onClick={popOut} width="0.9em" height="0.9em" viewBox="0 0 16 16" className="bi bi-box-arrow-up-right" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M8.636 3.5a.5.5 0 0 0-.5-.5H1.5A1.5 1.5 0 0 0 0 4.5v10A1.5 1.5 0 0 0 1.5 16h10a1.5 1.5 0 0 0 1.5-1.5V7.864a.5.5 0 0 0-1 0V14.5a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h6.636a.5.5 0 0 0 .5-.5z"/>
            <path fillRule="evenodd" d="M16 .5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h3.793L6.146 9.146a.5.5 0 1 0 .708.708L15 1.707V5.5a.5.5 0 0 0 1 0v-5z"/>
          </svg> : null }
          <span>{new Date(Date_Time).toLocaleDateString()}</span>
        </div>
        { (errorMessage) ? <div className="alert alert-danger">{errorMessage}</div> :
          <div ref={playerDiv}></div>
        }
        { (warningMessage) ? <div className="alert alert-warning">{warningMessage}</div> : null }
    </div>
  );
};

export default Video;
