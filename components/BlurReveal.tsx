'use client';

import styles from "./BlurReveal.module.scss";

const DEFAULT_BLUR = 10;
const DEFAULT_DURATION = 2000;

export function BlurReveal({
  children,
  duration = DEFAULT_DURATION,
  blur = DEFAULT_BLUR,
}: {
  children: React.ReactNode;
  blur?: number;
  duration?: number;
}) {
  return (
    <div
      className={styles.root}
      style={
        {
          "--duration-clip": duration + "ms",
          "--duration": duration + duration / 2 + "ms",
          "--blur": blur + "px",
        } as React.CSSProperties
      }
    >
      <div className={styles.banner}>{children}</div>
      <Effects />
    </div>
  );
}

function Effects() {
  return (
    <div className="grid-stack absolute inset-0">
      <div aria-hidden className={styles.blur}></div>
      <svg className={styles.noise}>
        <filter id="blur-noise">
          <feTurbulence
            baseFrequency="1"
            numOctaves="4"
            stitchTiles="stitch"
            type="fractalNoise"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect filter="url(#blur-noise)" height="100%" width="100%" />
      </svg>
    </div>
  );
}
