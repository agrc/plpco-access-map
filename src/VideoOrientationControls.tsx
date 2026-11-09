import React from 'react';

type Orientation = { yaw: number; pitch: number };
export type OrientationPlayer = {
  getSphericalProperties: () => Partial<Orientation>;
  setSphericalProperties: (orientation: Orientation) => void;
};

const normalize = ({ yaw, pitch }: Orientation): Orientation => ({
  yaw: ((yaw % 360) + 360) % 360,
  pitch: Math.max(-90, Math.min(90, pitch)),
});

const VideoOrientationControls = ({ getPlayer }: { getPlayer: () => OrientationPlayer | null }) => {
  const [message, setMessage] = React.useState<string>();
  const drag = React.useRef<{
    pointerId: number;
    x: number;
    y: number;
    orientation: Orientation;
    player: OrientationPlayer;
  } | null>(null);
  const pending = React.useRef<{ player: OrientationPlayer; orientation: Orientation } | null>(null);
  const frame = React.useRef<number | undefined>(undefined);
  const animationWindow = React.useRef<Window>(window);

  const cancel = React.useCallback(() => {
    if (frame.current !== undefined) {
      animationWindow.current.cancelAnimationFrame(frame.current);
      frame.current = undefined;
    }
    pending.current = null;
    drag.current = null;
  }, []);

  React.useEffect(() => cancel, [cancel]);

  const readOrientation = () => {
    const player = getPlayer();
    if (!player) {
      setMessage('Play the video first, then try looking around.');

      return;
    }
    const { yaw, pitch } = player.getSphericalProperties();
    if (typeof yaw !== 'number' || !Number.isFinite(yaw) || typeof pitch !== 'number' || !Number.isFinite(pitch)) {
      setMessage('360 orientation is unavailable. Play the video and try again, or watch it on YouTube.');

      return;
    }
    setMessage(undefined);

    return { player, orientation: { yaw, pitch } };
  };

  const flush = () => {
    frame.current = undefined;
    if (pending.current) {
      const { player, orientation } = pending.current;
      pending.current = null;
      player.setSphericalProperties(normalize(orientation));
    }
  };

  const onPointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0 || drag.current) return;
    const current = readOrientation();
    if (!current) return;
    animationWindow.current = event.currentTarget.ownerDocument.defaultView ?? window;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      ...current,
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
    };
  };

  const onPointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const current = drag.current;
    if (!current || current.pointerId !== event.pointerId) return;
    pending.current = {
      player: current.player,
      orientation: {
        yaw: current.orientation.yaw - (event.clientX - current.x) * 0.5,
        pitch: current.orientation.pitch - (event.clientY - current.y) * 0.5,
      },
    };
    if (frame.current === undefined) {
      frame.current = animationWindow.current.requestAnimationFrame(flush);
    }
  };

  const onPointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (drag.current?.pointerId !== event.pointerId) return;
    onPointerMove(event);
    if (frame.current !== undefined) {
      animationWindow.current.cancelAnimationFrame(frame.current);
    }
    flush();
    cancel();
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    const offsets: Record<string, Orientation> = {
      ArrowLeft: { yaw: 5, pitch: 0 },
      ArrowRight: { yaw: -5, pitch: 0 },
      ArrowUp: { yaw: 0, pitch: 5 },
      ArrowDown: { yaw: 0, pitch: -5 },
    };
    const offset = offsets[event.key];
    if (!offset) return;
    event.preventDefault();
    cancel();
    const current = readOrientation();
    if (!current) return;
    current.player.setSphericalProperties(
      normalize({ yaw: current.orientation.yaw + offset.yaw, pitch: current.orientation.pitch + offset.pitch }),
    );
  };

  const reset = () => {
    cancel();
    const current = readOrientation();
    if (current) {
      current.player.setSphericalProperties({ yaw: 0, pitch: 0 });
    }
  };

  return (
    <div className="orientation-controls">
      <button
        type="button"
        className="look-around-pad"
        aria-label="Look around: drag or use the arrow keys"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={(event) => {
          if (drag.current?.pointerId === event.pointerId) cancel();
        }}
        onLostPointerCapture={cancel}
        onBlur={cancel}
        onKeyDown={onKeyDown}
      >
        Look around
        <span>Drag here or use arrow keys</span>
      </button>
      <button type="button" className="btn btn-secondary btn-sm" onClick={reset}>
        Reset view
      </button>
      <div role="status" className="small mt-1">
        {message}
      </div>
    </div>
  );
};

export default VideoOrientationControls;
