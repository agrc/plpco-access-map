/* global YT */
import type Point from '@arcgis/core/geometry/Point';
import type { GraphicProperties } from '@arcgis/core/Graphic';
import Graphic from '@arcgis/core/Graphic';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import type MapView from '@arcgis/core/views/MapView';
import PropTypes from 'prop-types';
import React from 'react';
import { createPortal } from 'react-dom';
import config from './config';
import markerUrl from './marker.svg';
import useIsMobile from './useIsMobile';
import './Video.scss';
import VideoOrientationControls, { type OrientationPlayer } from './VideoOrientationControls';

export const getIDFromUrl = (url: string) => {
  // check for valid URL
  new URL(url);

  if (url.indexOf('=') > 0) {
    return url.split('=').pop();
  }

  return url.split('/').pop();
};

type VideoPoint = { attributes: Record<string, string | number | null | undefined>; geometry?: Point | null };
type YouTubePlayer = OrientationPlayer & {
  getCurrentTime: () => number;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  pauseVideo: () => void;
  destroy: () => void;
};

export const parsePoints = (features: VideoPoint[]) => {
  const lookup: Record<number, Point> = {};
  let start: number | undefined;
  features.forEach((point) => {
    const date = new Date(point.attributes[config.fieldNames.videoRoutePoints.Date_Time] ?? '');
    const seconds = Math.round(date.getTime() / 1000);
    if (start) {
      if (point.geometry) {
        lookup[seconds - start] = point.geometry;
      }
    } else {
      start = seconds;
      if (point.geometry) {
        lookup[0] = point.geometry;
      }
    }
  });

  return lookup;
};
const symbol = {
  type: 'picture-marker',
  url: markerUrl,
  width: 30,
  height: 30,
  angle: 0,
};

export type VideoProps = {
  GPS_Track_ID?: string;
  Date_Time?: string | number;
  URL?: string;
  pointsLayer?: VideoPointsLayer;
  mapView?: VideoMapView;
  testWarningMessage?: string;
};

export type VideoMapView = {
  goTo?: MapView['goTo'];
  spatialReference?: MapView['spatialReference'];
  map?: { add: (layer: GraphicsLayer) => void; remove: (layer: GraphicsLayer) => void } | null;
};

export type VideoPointsLayer = {
  queryFeatures: (options: Record<string, unknown>) => Promise<{
    exceededTransferLimit: boolean;
    features: VideoPoint[];
  }>;
};

const Video = ({ GPS_Track_ID, Date_Time, URL, pointsLayer, mapView, testWarningMessage }: VideoProps) => {
  const playerDiv = React.useRef<HTMLDivElement | null>(null);
  const pointsLookup = React.useRef<Record<number, Point>>({});
  const intervalId = React.useRef<number | undefined>(undefined);
  const graphic = React.useRef<Graphic | null>(null);
  const [videoAngle, setVideoAngle] = React.useState(0);
  const [angleOfSegment, setAngleOfSegment] = React.useState(0);
  const player = React.useRef<YouTubePlayer | null>(null);
  const embeddedPlayer = React.useRef<YouTubePlayer | null>(null);
  const popupCleanup = React.useRef<(() => void) | null>(null);
  const [popupControls, setPopupControls] = React.useState<{
    container: HTMLElement;
    player: YouTubePlayer;
  } | null>(null);
  const requestAnimationId = React.useRef<number | undefined>(undefined);
  const [errorMessage, setErrorMessage] = React.useState<string | undefined>();
  const [warningMessage, setWarningMessage] = React.useState(testWarningMessage);
  const isMobile = useIsMobile();

  const updateVideoAngle = React.useCallback((oldPlayerId?: number) => {
    if (oldPlayerId) {
      window.cancelAnimationFrame(oldPlayerId);
    }

    if (player.current && player.current.getSphericalProperties) {
      const properties = player.current.getSphericalProperties();

      if (typeof properties.yaw === 'number' && Number.isFinite(properties.yaw)) {
        setVideoAngle(properties.yaw);
      }
    }

    requestAnimationId.current = window.requestAnimationFrame(updateVideoAngle);
  }, []);

  const onPlayerStateChange = React.useCallback(
    (event: { data: number; target: YouTubePlayer }) => {
      if (intervalId.current) {
        window.clearInterval(intervalId.current);
      }

      if (event.data === YT.PlayerState.PLAYING) {
        console.log('playing');

        player.current = event.target;

        updateVideoAngle(requestAnimationId.current);

        intervalId.current = window.setInterval(() => {
          const currentPlayer = player.current;
          if (!currentPlayer) return;
          const currentTime = Math.round(currentPlayer.getCurrentTime());
          const position = pointsLookup.current[currentTime];

          if (position) {
            const keys = Object.keys(pointsLookup.current);
            const currentIndex = keys.indexOf(String(currentTime));
            const lastPosition = pointsLookup.current[Number(keys[currentIndex - 1])];
            const nextPosition = pointsLookup.current[Number(keys[currentIndex + 1])];

            if (lastPosition && nextPosition) {
              const yDiff = nextPosition.y - lastPosition.y;
              const xDiff = nextPosition.x - lastPosition.x;
              setAngleOfSegment(90 - (Math.atan2(yDiff, xDiff) * 180) / Math.PI);
            }

            mapView?.goTo?.(position);
            if (graphic.current) {
              graphic.current.geometry = position;
            }
          }
        }, 1000);
      }
    },
    [mapView, updateVideoAngle],
  );

  React.useEffect(() => {
    if (graphic.current) {
      graphic.current.symbol = {
        ...(symbol as unknown as GraphicProperties['symbol']),
        angle: angleOfSegment - videoAngle,
      } as unknown as GraphicProperties['symbol'];
    }
  }, [videoAngle, angleOfSegment]);

  React.useEffect(() => {
    let active = true;
    let effectPlayer: YouTubePlayer | undefined;
    let graphicsLayer: GraphicsLayer | undefined;
    const giddyUp = async () => {
      if (!mapView?.map || !pointsLayer || !URL) return;

      graphic.current = new Graphic({ symbol: symbol as unknown as GraphicProperties['symbol'] });
      graphicsLayer = new GraphicsLayer();
      graphicsLayer.add(graphic.current);

      mapView.map.add(graphicsLayer);

      let videoId;
      try {
        videoId = getIDFromUrl(URL);
      } catch {
        setErrorMessage(`Invalid Video URL: ${URL}`);

        return;
      }

      if (isMobile) return;

      effectPlayer = new YT.Player(playerDiv.current, {
        height: '250',
        width: '100%',
        videoId,
        // https://developers.google.com/youtube/player_parameters
        playerVars: {
          enablejsapi: 1,
          origin: window.location.origin,
          rel: 0,
        },
        events: {
          onReady: (event: { target: YouTubePlayer }) => {
            if (!active) return;
            embeddedPlayer.current = event.target;
          },
          onStateChange: (event: { data: number; target: YouTubePlayer }) => {
            if (!active) return;
            onPlayerStateChange(event);
          },
        },
      });

      const queryForPoints = async (start: number | null = null, num: number | null = null): Promise<VideoPoint[]> => {
        console.log('queryForPoints', start, num);

        const results = await pointsLayer.queryFeatures({
          where: `UPPER(${config.fieldNames.videoRoutePoints.GPS_Track_ID}) = UPPER('${GPS_Track_ID}')`,
          outFields: ['*'],
          returnGeometry: true,
          orderByFields: [`${config.fieldNames.videoRoutePoints.Date_Time} ASC`],
          outSpatialReference: mapView.spatialReference,
          start: start ?? undefined,
          num: num ?? undefined,
        });

        if (results.exceededTransferLimit) {
          return results.features.concat(
            await queryForPoints((start ?? 0) + results.features.length + 1, results.features.length),
          );
        }

        return results.features as VideoPoint[];
      };

      const features = await queryForPoints(null);
      if (!active) return;

      if (features.length) {
        pointsLookup.current = parsePoints(features);
      } else {
        setWarningMessage(`No points found for GPS_Track_ID: ${GPS_Track_ID}`);
      }
    };

    giddyUp();

    return () => {
      active = false;
      popupCleanup.current?.();
      if (graphicsLayer) {
        mapView?.map?.remove(graphicsLayer);
      }

      if (intervalId.current) {
        window.clearInterval(intervalId.current);
      }

      if (requestAnimationId.current) {
        window.cancelAnimationFrame(requestAnimationId.current);
      }

      if (player.current && player.current !== effectPlayer) {
        player.current.destroy();
      }
      effectPlayer?.destroy();
      embeddedPlayer.current = null;
      player.current = null;
    };
  }, [
    URL,
    pointsLayer,
    GPS_Track_ID,
    onPlayerStateChange,
    mapView,
    updateVideoAngle,
    setErrorMessage,
    setWarningMessage,
    isMobile,
  ]);

  React.useEffect(() => () => popupCleanup.current?.(), [URL]);

  const popOut = () => {
    console.log('popOut');

    if (!URL) return;

    popupCleanup.current?.();

    if (player.current) {
      player.current.pauseVideo();
    }

    const popupUrl = new window.URL(`${import.meta.env.BASE_URL}video-popup.html`, window.location.href);
    const popupWindow = window.open(popupUrl, 'roadsVideo', 'width=640,height=540,location=0');

    if (!popupWindow) {
      setWarningMessage('The video popup was blocked. Allow popups for this site and try again.');

      return;
    }

    const id = getIDFromUrl(URL);
    let popupPlayer: YouTubePlayer | undefined;
    const initializePopupPlayer = () => {
      popupWindow.addEventListener('unload', dispose);
      document.querySelectorAll('style, link[rel="stylesheet"]').forEach((stylesheet) => {
        const clone = stylesheet.cloneNode(true);
        if (clone instanceof HTMLLinkElement && stylesheet instanceof HTMLLinkElement) {
          clone.href = stylesheet.href;
        }
        popupWindow.document.head.appendChild(clone);
      });

      popupPlayer = new YT.Player(popupWindow.document.getElementById('player'), {
        height: '100%',
        width: '100%',
        videoId: id,
        // https://developers.google.com/youtube/player_parameters
        playerVars: {
          enablejsapi: 1,
          origin: window.location.origin,
          widget_referrer: window.location.href,
          rel: 0,
        },
        events: {
          onStateChange: onPlayerStateChange,
          onReady: (event: { target: YouTubePlayer }) => {
            if (player.current) {
              event.target.seekTo(player.current.getCurrentTime(), true);
            }
            const container = popupWindow.document.getElementById('controls');
            if (!container) {
              setWarningMessage('The video popup could not load its look-around controls.');

              return;
            }
            setPopupControls({ container, player: event.target });
          },
        },
      });
    };

    popupWindow.addEventListener('load', initializePopupPlayer, { once: true });

    const dispose = () => {
      popupWindow.removeEventListener('load', initializePopupPlayer);
      popupWindow.removeEventListener('unload', dispose);
      window.removeEventListener('unload', closePopup);
      setPopupControls(null);
      if (player.current === popupPlayer) {
        window.clearInterval(intervalId.current);
        if (requestAnimationId.current !== undefined) {
          window.cancelAnimationFrame(requestAnimationId.current);
        }
        player.current = embeddedPlayer.current;
      }
      popupPlayer?.destroy();
      popupCleanup.current = null;
    };
    const closePopup = () => {
      dispose();
      popupWindow.close();
    };
    // close popup window if the main window is closed or reloaded
    window.addEventListener('unload', closePopup);
    popupCleanup.current = closePopup;
  };

  return (
    <div className="video">
      <div className="header">
        {
          // ref: https://icons.getbootstrap.com/icons/box-arrow-up-right/
        }
        {!isMobile ? (
          <svg
            onClick={popOut}
            width="0.9em"
            height="0.9em"
            viewBox="0 0 16 16"
            className="bi bi-box-arrow-up-right"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              d="M8.636 3.5a.5.5 0 0 0-.5-.5H1.5A1.5 1.5 0 0 0 0 4.5v10A1.5 1.5 0 0 0 1.5 16h10a1.5 1.5 0 0 0 1.5-1.5V7.864a.5.5 0 0 0-1 0V14.5a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h6.636a.5.5 0 0 0 .5-.5z"
            />
            <path
              fillRule="evenodd"
              d="M16 .5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h3.793L6.146 9.146a.5.5 0 1 0 .708.708L15 1.707V5.5a.5.5 0 0 0 1 0v-5z"
            />
          </svg>
        ) : null}
        <span>{new Date(Date_Time ?? '').toLocaleDateString()}</span>
      </div>
      {errorMessage ? (
        <div className="alert alert-danger">{errorMessage}</div>
      ) : isMobile ? (
        <a href={URL} className="btn btn-primary btn-lg" target="_blank" rel="noopener noreferrer">
          Watch Video on YouTube
        </a>
      ) : (
        <>
          <div ref={playerDiv}></div>
          <VideoOrientationControls key={URL} getPlayer={() => embeddedPlayer.current} />
        </>
      )}
      {warningMessage ? <div className="alert alert-warning">{warningMessage}</div> : null}
      {popupControls
        ? createPortal(<VideoOrientationControls getPlayer={() => popupControls.player} />, popupControls.container)
        : null}
    </div>
  );
};

Video.propTypes = {
  GPS_Track_ID: PropTypes.string,
  Date_Time: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  URL: PropTypes.string,
  pointsLayer: PropTypes.shape({
    queryFeatures: PropTypes.func.isRequired,
  }),
  mapView: PropTypes.shape({
    goTo: PropTypes.func.isRequired,
    map: PropTypes.shape({
      add: PropTypes.func.isRequired,
      remove: PropTypes.func.isRequired,
    }).isRequired,
    spatialReference: PropTypes.object.isRequired,
  }),
  testWarningMessage: PropTypes.string,
};

export default Video;
