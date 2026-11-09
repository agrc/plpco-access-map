import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import VideoOrientationControls, { type OrientationPlayer } from './VideoOrientationControls';

describe('VideoOrientationControls', () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;
  let pad: HTMLButtonElement;
  let reset: HTMLButtonElement;
  let animationCallback: FrameRequestCallback;
  const player = {
    getSphericalProperties: vi.fn<OrientationPlayer['getSphericalProperties']>(),
    setSphericalProperties: vi.fn(),
  };
  const getPlayer = vi.fn<() => OrientationPlayer | null>();

  beforeEach(async () => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn((callback: FrameRequestCallback) => {
        animationCallback = callback;

        return 1;
      }),
    );
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    getPlayer.mockReturnValue(player);
    player.getSphericalProperties.mockReturnValue({ yaw: 0, pitch: 0 });
    container = document.createElement('div');
    root = createRoot(container);
    await act(async () => root.render(createElement(VideoOrientationControls, { getPlayer })));
    const [padButton, resetButton] = container.querySelectorAll('button');
    if (!padButton || !resetButton) throw new Error('Look-around controls were not rendered');
    pad = padButton;
    reset = resetButton;
    pad.setPointerCapture = vi.fn();
    pad.releasePointerCapture = vi.fn();
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  const pointer = async (type: string, x = 0, y = 0, pointerId = 1, button = 0) => {
    await act(async () => {
      pad.dispatchEvent(new PointerEvent(type, { bubbles: true, clientX: x, clientY: y, pointerId, button }));
    });
  };

  const key = async (value: string) => {
    const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: value });
    await act(async () => {
      pad.dispatchEvent(event);
    });

    return event;
  };

  it('coalesces drag updates into one animation frame using the initial orientation', async () => {
    player.getSphericalProperties.mockReturnValue({ yaw: 10, pitch: 20 });
    await pointer('pointerdown', 100, 100);
    await pointer('pointermove', 120, 110);
    await pointer('pointermove', 140, 80);
    expect(pad.setPointerCapture).toHaveBeenCalledWith(1);
    expect(window.requestAnimationFrame).toHaveBeenCalledTimes(1);
    expect(player.setSphericalProperties).not.toHaveBeenCalled();
    await act(async () => animationCallback(0));
    expect(player.setSphericalProperties).toHaveBeenCalledExactlyOnceWith({ yaw: 350, pitch: 30 });
  });

  it.each([
    [-1000, -1000, 140, 90],
    [1000, 1000, 220, -90],
  ])('wraps yaw and clamps pitch for drag to (%s, %s)', async (x, y, yaw, pitch) => {
    await pointer('pointerdown');
    await pointer('pointermove', x, y);
    await act(async () => animationCallback(0));
    expect(player.setSphericalProperties).toHaveBeenCalledWith({ yaw, pitch });
  });

  it('flushes the release position and stops dragging', async () => {
    await pointer('pointerdown');
    await pointer('pointermove', 10, 10);
    await pointer('pointerup', 40, 20);
    expect(player.setSphericalProperties).toHaveBeenCalledExactlyOnceWith({ yaw: 340, pitch: -10 });
    expect(pad.releasePointerCapture).toHaveBeenCalledWith(1);
    expect(window.cancelAnimationFrame).toHaveBeenCalledWith(1);
    await pointer('pointermove', 80, 80);
    expect(player.setSphericalProperties).toHaveBeenCalledTimes(1);
  });

  it.each(['pointercancel', 'lostpointercapture'])('stops queued updates on %s', async (event) => {
    await pointer('pointerdown');
    await pointer('pointermove', 20, 20);
    await pointer(event);
    await act(async () => animationCallback(0));
    await pointer('pointermove', 40, 40);
    expect(player.setSphericalProperties).not.toHaveBeenCalled();
    expect(window.cancelAnimationFrame).toHaveBeenCalledWith(1);
  });

  it('ignores secondary buttons and other pointers', async () => {
    await pointer('pointerdown', 0, 0, 1, 2);
    expect(pad.setPointerCapture).not.toHaveBeenCalled();
    await pointer('pointerdown');
    await pointer('pointerdown', 30, 30, 2);
    await pointer('pointermove', 30, 30, 2);
    await pointer('pointerup', 30, 30, 2);
    expect(player.setSphericalProperties).not.toHaveBeenCalled();
    await pointer('pointerup', 20, 0);
    expect(player.setSphericalProperties).toHaveBeenCalledWith({ yaw: 350, pitch: 0 });
  });

  it.each([
    ['ArrowLeft', 5, 0],
    ['ArrowRight', 355, 0],
    ['ArrowUp', 0, 5],
    ['ArrowDown', 0, -5],
  ])('supports %s without scrolling the page', async (value, yaw, pitch) => {
    expect((await key(value)).defaultPrevented).toBe(true);
    expect(player.setSphericalProperties).toHaveBeenCalledWith({ yaw, pitch });
  });

  it('leaves unrelated keys alone', async () => {
    expect((await key('Tab')).defaultPrevented).toBe(false);
    expect(player.setSphericalProperties).not.toHaveBeenCalled();
  });

  it('resets the view and cancels pending dragging', async () => {
    await pointer('pointerdown');
    await pointer('pointermove', 50, 50);
    await act(async () => reset.click());
    await act(async () => animationCallback(0));
    expect(player.setSphericalProperties).toHaveBeenCalledExactlyOnceWith({ yaw: 0, pitch: 0 });
  });

  it('reports a player that is not ready', async () => {
    getPlayer.mockReturnValue(null);
    await pointer('pointerdown');
    expect(container.textContent).toContain('Play the video first');
    expect(pad.setPointerCapture).not.toHaveBeenCalled();
  });

  it.each([{}, { yaw: NaN, pitch: 0 }, { yaw: 0, pitch: Infinity }])(
    'reports unsupported spherical properties %s',
    async (properties) => {
      player.getSphericalProperties.mockReturnValue(properties);
      await act(async () => reset.click());
      expect(container.textContent).toContain('360 orientation is unavailable');
      expect(player.setSphericalProperties).not.toHaveBeenCalled();
    },
  );

  it('clears errors after orientation becomes available', async () => {
    getPlayer.mockReturnValue(null);
    await act(async () => reset.click());
    getPlayer.mockReturnValue(player);
    await act(async () => reset.click());
    expect(container.querySelector('[role="status"]')?.textContent).toBe('');
  });

  it('cancels a queued frame on unmount', async () => {
    await pointer('pointerdown');
    await pointer('pointermove', 20, 20);
    await act(async () => root.unmount());
    await act(async () => animationCallback(0));
    expect(player.setSphericalProperties).not.toHaveBeenCalled();
    expect(window.cancelAnimationFrame).toHaveBeenCalledWith(1);
  });
});
