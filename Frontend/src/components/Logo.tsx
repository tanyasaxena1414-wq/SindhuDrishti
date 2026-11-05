import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

export const Logo: React.FC<LogoProps> = ({ className = 'w-7 h-7', size = 28 }) => {
  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="transition-transform duration-300 hover:scale-105"
      >
        <defs>
          <linearGradient id="orbitGrad" x1="4" y1="6" x2="28" y2="26" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="50%" stopColor="#0284c7" />
            <stop offset="100%" stopColor="#1e3a8a" />
          </linearGradient>
          <linearGradient id="waveGrad" x1="6" y1="14" x2="26" y2="22" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#e0f2fe" />
            <stop offset="40%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#0369a1" />
          </linearGradient>
          <linearGradient id="coreGlow" x1="16" y1="8" x2="16" y2="24" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Ambient Orbit Track (Tilted ellipse representing satellite trajectory) */}
        <ellipse
          cx="16"
          cy="16"
          rx="12.5"
          ry="6"
          transform="rotate(-25 16 16)"
          stroke="url(#orbitGrad)"
          strokeWidth="1.5"
          strokeDasharray="2 2"
          className="opacity-75"
        />

        {/* Satellite Sensor Node (Orbital focal point) */}
        <circle
          cx="25.5"
          cy="11.5"
          r="2.2"
          fill="#38bdf8"
          className="shadow-sm"
        />
        <circle
          cx="25.5"
          cy="11.5"
          r="4"
          stroke="#7dd3fc"
          strokeWidth="0.8"
          strokeOpacity="0.6"
        />

        {/* Core Wave Crest (Water Flow / Sindhu River Metaphor) */}
        <path
          d="M6 18.5C8.5 15.5 12 14.5 15.5 17C18.5 19 22 18.5 25.5 15.5"
          stroke="url(#waveGrad)"
          strokeWidth="2.2"
          strokeLinecap="round"
        />

        {/* Secondary Lower Wave Layer */}
        <path
          d="M8.5 22.5C11 20 14 19.5 17 21C19.5 22.2 22 22 24.5 19.5"
          stroke="url(#waveGrad)"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeOpacity="0.75"
        />

        {/* Central Observation Optical Core */}
        <circle
          cx="16"
          cy="16"
          r="2.5"
          fill="#0284c7"
          fillOpacity="0.5"
        />
        <circle
          cx="16"
          cy="16"
          r="1"
          fill="#e0f2fe"
        />
      </svg>
    </div>
  );
};
