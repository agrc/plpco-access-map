import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import Map from '@arcgis/core/Map';
import { act, createElement, Fragment } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, it, vi } from 'vitest';
import Video from './Video';

vi.mock('./useIsMobile', () => ({ default: () => false }));
vi.mock('./config', () => ({
  default: {
    fieldNames: { videoRoutePoints: { Date_Time: 'Date_Time', GPS_Track_ID: 'GPS_Track_ID' } },
  },
}));

afterEach(() => {
  vi.unstubAllGlobals();
});

it('keeps all viewpoints above later road layers and removes only their own layers when closed', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.stubGlobal('YT', {
    Player: vi.fn(function () {
      return { destroy: vi.fn() };
    }),
  });
  const roadLayer = new GraphicsLayer({ title: 'Selected road highlight' });
  const map = new Map({ layers: [roadLayer] });
  const pointsLayer = {
    queryFeatures: vi.fn().mockResolvedValue({ exceededTransferLimit: false, features: [] }),
  };
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  try {
    await act(async () => {
      root.render(
        createElement(
          Fragment,
          null,
          ...['track-one', 'track-two'].map((track) =>
            createElement(Video, {
              key: track,
              URL: 'https://youtu.be/example',
              GPS_Track_ID: track,
              pointsLayer,
              mapView: { map },
            }),
          ),
        ),
      );
    });

    const viewpoints = map.layers.toArray().filter((layer) => layer !== roadLayer);
    expect(viewpoints).toHaveLength(2);

    const laterRoadLayer = new GraphicsLayer({ title: 'Another selected road' });
    await act(async () => {
      map.add(laterRoadLayer);
    });
    await vi.waitFor(() => {
      expect(map.layers.toArray().slice(-2)).toEqual(expect.arrayContaining(viewpoints));
    });

    await act(async () => {
      map.reorder(roadLayer, map.layers.length - 1);
    });
    await vi.waitFor(() => {
      expect(map.layers.toArray().slice(-2)).toEqual(expect.arrayContaining(viewpoints));
    });

    await act(async () => root.render(null));

    expect(map.layers.toArray()).toEqual(expect.arrayContaining([roadLayer, laterRoadLayer]));
    expect(map.layers.length).toBe(2);
  } finally {
    await act(async () => root.unmount());
    container.remove();
  }
});
