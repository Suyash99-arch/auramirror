import { memo, useEffect, useState } from "react";

type Props = { onComplete: () => void };

function CaptureCountdown({ onComplete }: Props) {
  const [remaining, setRemaining] = useState(3);

  useEffect(() => {
    let frame = 0;
    let startedAt: number | null = null;
    let lastShown = 3;

    const tick = (timestamp: number) => {
      if (startedAt === null) startedAt = timestamp;
      const elapsed = timestamp - startedAt;
      if (elapsed >= 3000) {
        onComplete();
        return;
      }

      const next = 3 - Math.floor(elapsed / 1000);
      if (next !== lastShown) {
        lastShown = next;
        setRemaining(next);
      }
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [onComplete]);

  return <div className="countdown">{remaining}</div>;
}

export default memo(CaptureCountdown);
