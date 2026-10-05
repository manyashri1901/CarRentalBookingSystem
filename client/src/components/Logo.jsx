import React from 'react';

/** Leaf-shaped badge with an electric bolt, plus the ECar-Ride wordmark. */
export function LogoMark({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="ecr-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#10b981" />
          <stop offset="1" stopColor="#0f766e" />
        </linearGradient>
      </defs>
      {/* leaf: two rounded corners, two sharp */}
      <path d="M8 56V32C8 18 18 8 32 8h24v24c0 14-10 24-24 24H8z" fill="url(#ecr-g)" />
      <path d="M35 14 20 35h10l-3 15 17-23H33z" fill="#fff" />
    </svg>
  );
}

export default function Logo() {
  return (
    <span className="logo">
      <LogoMark />
      <span className="wordmark">
        ECar<span className="wordmark-dash">-</span><span className="wordmark-accent">Ride</span>
      </span>
    </span>
  );
}
