import React from 'react';
import { AvatarData } from '../types';

interface AvatarProps {
  avatar: AvatarData;
  size?: number;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ avatar, size = 48, className = '' }) => {
  const { color = '#f59e0b', eyes = 1, mouth = 1 } = avatar || {};

  // Render SVG eyes based on index 0..4
  const renderEyes = () => {
    switch (eyes % 5) {
      case 0: // Normal big dots
        return (
          <>
            <circle cx="35" cy="42" r="5" fill="#1e293b" />
            <circle cx="65" cy="42" r="5" fill="#1e293b" />
            <circle cx="36" cy="40" r="1.5" fill="#ffffff" />
            <circle cx="66" cy="40" r="1.5" fill="#ffffff" />
          </>
        );
      case 1: // Happy arcs
        return (
          <>
            <path d="M 28 44 Q 35 34 42 44" stroke="#1e293b" strokeWidth="3.5" strokeLinecap="round" fill="none" />
            <path d="M 58 44 Q 65 34 72 44" stroke="#1e293b" strokeWidth="3.5" strokeLinecap="round" fill="none" />
          </>
        );
      case 2: // Glasses / cool shades
        return (
          <>
            <rect x="24" y="36" width="22" height="15" rx="3" fill="#0f172a" />
            <rect x="54" y="36" width="22" height="15" rx="3" fill="#0f172a" />
            <line x1="46" y1="42" x2="54" y2="42" stroke="#0f172a" strokeWidth="3" />
            <line x1="26" y1="38" x2="38" y2="48" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
            <line x1="56" y1="38" x2="68" y2="48" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
          </>
        );
      case 3: // Wink / playful
        return (
          <>
            <path d="M 28 43 Q 35 36 42 43" stroke="#1e293b" strokeWidth="3.5" strokeLinecap="round" fill="none" />
            <circle cx="65" cy="42" r="5.5" fill="#1e293b" />
            <circle cx="66" cy="40" r="1.5" fill="#ffffff" />
          </>
        );
      case 4: // Anime sparkle / stars
      default:
        return (
          <>
            <circle cx="35" cy="42" r="6" fill="#1e293b" />
            <circle cx="65" cy="42" r="6" fill="#1e293b" />
            <circle cx="33" cy="39" r="2.5" fill="#ffffff" />
            <circle cx="63" cy="39" r="2.5" fill="#ffffff" />
            <circle cx="37" cy="44" r="1.2" fill="#ffffff" />
            <circle cx="67" cy="44" r="1.2" fill="#ffffff" />
          </>
        );
    }
  };

  // Render SVG mouth based on index 0..4
  const renderMouth = () => {
    switch (mouth % 5) {
      case 0: // Normal smile
        return <path d="M 36 62 Q 50 74 64 62" stroke="#1e293b" strokeWidth="3.5" strokeLinecap="round" fill="none" />;
      case 1: // Big happy open mouth with tongue
        return (
          <g>
            <path d="M 33 60 Q 50 82 67 60 Z" fill="#991b1b" stroke="#1e293b" strokeWidth="3" />
            <path d="M 42 68 Q 50 80 58 68 Z" fill="#f43f5e" />
          </g>
        );
      case 2: // Cheeky tongue out
        return (
          <g>
            <path d="M 36 62 Q 50 72 64 62" stroke="#1e293b" strokeWidth="3.5" strokeLinecap="round" fill="none" />
            <path d="M 44 65 Q 44 76 50 76 Q 56 76 56 65 Z" fill="#f43f5e" stroke="#1e293b" strokeWidth="2" />
          </g>
        );
      case 3: // Grinning teeth
        return (
          <g>
            <rect x="34" y="60" width="32" height="12" rx="6" fill="#ffffff" stroke="#1e293b" strokeWidth="2.5" />
            <line x1="50" y1="60" x2="50" y2="72" stroke="#1e293b" strokeWidth="1.5" />
            <line x1="42" y1="60" x2="42" y2="72" stroke="#1e293b" strokeWidth="1.5" />
            <line x1="58" y1="60" x2="58" y2="72" stroke="#1e293b" strokeWidth="1.5" />
          </g>
        );
      case 4: // Surprised 'O' mouth
      default:
        return <circle cx="50" cy="65" r="7" fill="#1e293b" />;
    }
  };

  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 rounded-full transition-transform hover:scale-105 select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 100 100" width="100%" height="100%" className="drop-shadow-sm">
        {/* Outer Head */}
        <circle cx="50" cy="50" r="46" fill={color} stroke="#1e293b" strokeWidth="4.5" />
        
        {/* Soft highlight */}
        <ellipse cx="36" cy="24" rx="14" ry="7" fill="#ffffff" opacity="0.35" transform="rotate(-25 36 24)" />

        {/* Blush cheeks */}
        <circle cx="22" cy="54" r="5" fill="#f43f5e" opacity="0.4" />
        <circle cx="78" cy="54" r="5" fill="#f43f5e" opacity="0.4" />

        {/* Features */}
        {renderEyes()}
        {renderMouth()}
      </svg>
    </div>
  );
};
