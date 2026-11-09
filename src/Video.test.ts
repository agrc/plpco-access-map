import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Video, { getIDFromUrl } from './Video';

vi.mock('./useIsMobile', () => ({ default: () => false }));

describe('getIDFromUrl', () => {
  it('handles both types of URLs', () => {
    expect(getIDFromUrl('https://youtu.be/4VLg3nhoOBY')).toEqual('4VLg3nhoOBY');
    expect(getIDFromUrl('https://www.youtube.com/watch?v=FpZG97zHsX4')).toEqual('FpZG97zHsX4');
  });
  it('raises an error for bad URLs', () => {
    expect(() => getIDFromUrl('<Null>')).toThrow();
  });
});

describe('popup look-around controls', () => {
  const makePlayer = () => ({
    getSphericalProperties: () => ({ yaw: 10, pitch: 20 }),
    setSphericalProperties: vi.fn(),
    getCurrentTime: () => 42,
    seekTo: vi.fn(),
    pauseVideo: vi.fn(),
    destroy: vi.fn(),
  });
  type Player = ReturnType<typeof makePlayer>;
  type PlayerOptions = {
    events: {
      onReady: (event: { target: Player }) => void;
      onStateChange: (event: { data: number; target: Player }) => void;
    };
  };
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;
  let popup: Window;
  let iframe: HTMLIFrameElement;
  let stylesheet: HTMLStyleElement;
  let embedded: Player;
  let popped: Player;
  let options: PlayerOptions[];
  let popupFrame: FrameRequestCallback;

  beforeEach(async () => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn(() => 1),
    );
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    embedded = makePlayer();
    popped = makePlayer();
    options = [];
    vi.stubGlobal('YT', {
      PlayerState: { PLAYING: 1 },
      Player: vi.fn(function (_element: HTMLElement, config: PlayerOptions) {
        options.push(config);

        return options.length === 1 ? embedded : popped;
      }),
    });
    iframe = document.createElement('iframe');
    iframe.srcdoc = '<div id="player"></div><div id="controls"></div>';
    document.body.appendChild(iframe);
    if (!iframe.contentWindow) throw new Error('Popup test window is unavailable');
    popup = iframe.contentWindow;
    popup.document.body.innerHTML = '<div id="player"></div><div id="controls"></div>';
    vi.spyOn(popup, 'close').mockImplementation(() => {});
    vi.spyOn(popup, 'requestAnimationFrame').mockImplementation((callback) => {
      popupFrame = callback;

      return 2;
    });
    vi.spyOn(popup, 'cancelAnimationFrame').mockImplementation(() => {});
    vi.spyOn(window, 'open').mockReturnValue(popup);
    stylesheet = document.createElement('style');
    stylesheet.textContent = '.look-around-pad { min-height: 5rem; }';
    document.head.appendChild(stylesheet);
    container = document.createElement('div');
    root = createRoot(container);
    await act(async () =>
      root.render(
        createElement(Video, {
          URL: 'https://youtu.be/SPz3H5dPPTE',
          mapView: { map: { add: vi.fn(), remove: vi.fn() } },
          pointsLayer: { queryFeatures: async () => ({ exceededTransferLimit: false, features: [] }) },
        }),
      ),
    );
    await act(async () => options[0]?.events.onReady({ target: embedded }));
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    iframe.remove();
    stylesheet.remove();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  const openPopup = async () => {
    const icon = container.querySelector('svg');
    if (!icon) throw new Error('Popup icon is unavailable');
    await act(async () => icon.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    await act(async () => popup.dispatchEvent(new Event('unload')));
    await act(async () => popup.dispatchEvent(new Event('load')));
    const config = options.at(-1);
    if (!config || options.length < 2) throw new Error('Popup player was not created');
    await act(async () => config.events.onReady({ target: popped }));
  };

  const popupButton = (selector: string) => {
    const button = popup.document.querySelector<HTMLButtonElement>(selector);
    if (!button) throw new Error('Popup control is unavailable');

    return button;
  };

  it('renders styled controls in the popup and keeps the players independent', async () => {
    await openPopup();
    expect(popup.document.head.textContent).toContain('.look-around-pad');
    await act(async () =>
      popupButton('.look-around-pad').dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'ArrowLeft' })),
    );
    expect(popped.setSphericalProperties).toHaveBeenCalledWith({ yaw: 15, pitch: 20 });
    expect(embedded.setSphericalProperties).not.toHaveBeenCalled();
    const sidebarPad = container.querySelector('.look-around-pad');
    await act(async () =>
      sidebarPad?.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'ArrowRight' })),
    );
    expect(embedded.setSphericalProperties).toHaveBeenCalledWith({ yaw: 5, pitch: 20 });
    await act(async () => popupButton('.btn').click());
    expect(popped.setSphericalProperties).toHaveBeenLastCalledWith({ yaw: 0, pitch: 0 });
  });

  it('uses the popup animation clock for dragging and cancels it on close', async () => {
    await openPopup();
    const pad = popupButton('.look-around-pad');
    pad.setPointerCapture = vi.fn();
    await act(async () => {
      pad.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 1, button: 0 }));
      pad.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, pointerId: 1, clientX: 40, clientY: 20 }));
    });
    expect(popup.requestAnimationFrame).toHaveBeenCalledTimes(1);
    await act(async () => popupFrame(0));
    expect(popped.setSphericalProperties).toHaveBeenCalledWith({ yaw: 350, pitch: 10 });
    await act(async () =>
      pad.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, pointerId: 1, clientX: 80 })),
    );
    await act(async () => popup.dispatchEvent(new Event('unload')));
    expect(popup.cancelAnimationFrame).toHaveBeenCalledWith(2);
    expect(popped.destroy).toHaveBeenCalledTimes(1);
    expect(popup.document.querySelector('.look-around-pad')).toBeNull();
  });

  it('preserves playback time and closes the popup when the component unmounts', async () => {
    await act(async () => options[0]?.events.onStateChange({ data: 1, target: embedded }));
    await openPopup();
    expect(embedded.pauseVideo).toHaveBeenCalled();
    expect(popped.seekTo).toHaveBeenCalledWith(42, true);
    await act(async () => options[1]?.events.onStateChange({ data: 1, target: popped }));
    await act(async () => root.unmount());
    expect(popup.close).toHaveBeenCalledTimes(1);
    expect(popped.destroy).toHaveBeenCalledTimes(1);
    expect(embedded.destroy).toHaveBeenCalledTimes(1);
  });

  it('reports a blocked popup', async () => {
    vi.mocked(window.open).mockReturnValue(null);
    await act(async () => container.querySelector('svg')?.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    expect(container.textContent).toContain('The video popup was blocked');
  });

  const replaceVideo = async () => {
    await act(async () =>
      root.render(
        createElement(Video, {
          URL: 'https://youtu.be/4VLg3nhoOBY',
          mapView: { map: { add: vi.fn(), remove: vi.fn() } },
          pointsLayer: { queryFeatures: async () => ({ exceededTransferLimit: false, features: [] }) },
        }),
      ),
    );
    const [oldOptions, newOptions] = options;
    if (!oldOptions || !newOptions) throw new Error('Replacement player was not created');

    return { oldOptions, newOptions };
  };

  it('ignores late ready and state callbacks from the previous video', async () => {
    const { oldOptions, newOptions } = await replaceVideo();
    expect(embedded.destroy).toHaveBeenCalledTimes(1);
    await act(async () => newOptions.events.onReady({ target: popped }));
    await act(async () => {
      oldOptions.events.onReady({ target: embedded });
      oldOptions.events.onStateChange({ data: 1, target: embedded });
    });
    const pad = container.querySelector('.look-around-pad');
    await act(async () => pad?.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'ArrowLeft' })));
    expect(popped.setSphericalProperties).toHaveBeenCalledWith({ yaw: 15, pitch: 20 });
    expect(embedded.setSphericalProperties).not.toHaveBeenCalled();
    expect(window.requestAnimationFrame).not.toHaveBeenCalled();
    await act(async () => root.unmount());
    expect(embedded.destroy).toHaveBeenCalledTimes(1);
    expect(popped.destroy).toHaveBeenCalledTimes(1);
  });

  it('destroys a player that has not become ready and ignores callbacks after unmount', async () => {
    const { newOptions } = await replaceVideo();
    await act(async () => root.unmount());
    expect(popped.destroy).toHaveBeenCalledTimes(1);
    await act(async () => {
      newOptions.events.onReady({ target: popped });
      newOptions.events.onStateChange({ data: 1, target: popped });
    });
    expect(window.requestAnimationFrame).not.toHaveBeenCalled();
    expect(popped.destroy).toHaveBeenCalledTimes(1);
  });
});
