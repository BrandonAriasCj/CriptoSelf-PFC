import React from 'react';

interface LogoMarkProps {
  size?: number;
  className?: string;
}

export function LogoMark({ size = 42, className = '' }: LogoMarkProps) {
  const iconSize = Math.round(size * 0.58);
  const radius = Math.round(size * 0.28);

  return (
    <div
      className={`logo-mark ${className}`.trim()}
      style={{ width: size, height: size, borderRadius: radius }}
      aria-hidden="true"
    >
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M17.5 7.2A7 7 0 1 0 17.5 16.8"
          stroke="#ffffff"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
        <path
          d="M13.5 11.5 L18.2 6.8"
          stroke="#ffffff"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <path
          d="M18.2 6.8 H14.4 M18.2 6.8 V10.6"
          stroke="#ffffff"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
