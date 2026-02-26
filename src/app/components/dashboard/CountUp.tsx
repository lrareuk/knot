"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  value: number;
  durationMs?: number;
  render: (value: number) => string;
  className?: string;
};

function prefersReducedMotion() {
  if (typeof window === "undefined") {
    return true;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function CountUp({ value, durationMs = 600, render, className }: Props) {
  const [displayValue, setDisplayValue] = useState(value);
  const previousValueRef = useRef(value);

  useEffect(() => {
    if (prefersReducedMotion()) {
      previousValueRef.current = value;
      const frame = requestAnimationFrame(() => setDisplayValue(value));
      return () => cancelAnimationFrame(frame);
    }

    const start = performance.now();
    const initial = previousValueRef.current;
    const delta = value - initial;
    let frame = 0;

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / durationMs);
      const eased = 1 - (1 - progress) ** 3;
      setDisplayValue(initial + delta * eased);
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
        return;
      }
      previousValueRef.current = value;
      setDisplayValue(value);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [durationMs, value]);

  const rendered = useMemo(() => render(displayValue), [displayValue, render]);

  return <span className={className}>{rendered}</span>;
}
