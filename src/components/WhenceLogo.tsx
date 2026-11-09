import React from 'react';

interface WhenceLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const WhenceLogo: React.FC<WhenceLogoProps> = ({
  size = 'md',
  showText = true,
}) => {
  // Calibrate icon dimensions to sit tightly next to the word like punctuation
  const iconSize = size === 'sm' ? 20 : size === 'lg' ? 38 : 26;
  const textSize = size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-4xl sm:text-5xl' : 'text-xl';

  return (
    <span className="inline-flex items-center select-none group">
      {/* 1. Wordmark on Left */}
      {showText && (
        <span
          style={{ fontFamily: 'var(--font-logo)' }}
          className={`${textSize} font-bold tracking-tight text-white leading-none`}
        >
          whence
        </span>
      )}

      {/* 2. Pulsing Cradled Question Emblem - Tightly integrated like sentence punctuation */}
      <span className="inline-flex items-center ml-0.5 sm:ml-1 animate-pulse shrink-0">
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 36 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="shrink-0"
        >
          {/* Cradling Open Blue Earth Arc (Painterly planetary horizon) */}
          <path
            d="M 8.5 15 C 6.5 22 10.5 29.5 18 31 C 24 32 28.5 29 31 24.5"
            stroke="#38BDF8"
            strokeWidth="3.2"
            strokeLinecap="round"
          />

          {/* Unmistakable Whimsical Golden Question Mark */}
          <path
            d="M 13.5 11 C 13.5 7.5 16 5.5 19.5 5.5 C 23.5 5.5 25.5 8.5 25.5 11.5 C 25.5 14.5 22.5 16.5 19.5 18 V 20.5"
            stroke="#F59E0B"
            strokeWidth="3.4"
            strokeLinecap="round"
          />

          {/* Painterly Golden Dot */}
          <circle
            cx="19.5"
            cy="25.5"
            r="2.5"
            fill="#F59E0B"
          />
        </svg>
      </span>
    </span>
  );
};
