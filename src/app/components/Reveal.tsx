"use client";

import { ReactNode, useEffect, useRef, useState } from "react";

type RevealProps = {
  children: ReactNode;
  className?: string;
  once?: boolean;
};

export default function Reveal({ children, className = "", once = true }: RevealProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion || typeof IntersectionObserver === "undefined") {
      const id = window.requestAnimationFrame(() => setVisible(true));
      return () => window.cancelAnimationFrame(id);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          if (once) {
            observer.unobserve(entry.target);
          }
        } else if (!once) {
          setVisible(false);
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [once]);

  return (
    <div ref={ref} className={`reveal ${visible ? "visible" : ""} ${className}`.trim()}>
      {children}
    </div>
  );
}
