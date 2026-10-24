import React from 'react';
import { AvatarData } from '../types';
import { Avatar } from './Avatar';
import { Dices, ChevronLeft, ChevronRight } from 'lucide-react';

interface AvatarSelectorProps {
  avatar: AvatarData;
  onChange: (avatar: AvatarData) => void;
}

const AVATAR_COLORS = [
  '#f59e0b', // Amber
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#ef4444', // Red
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#14b8a6', // Teal
  '#f97316', // Orange
  '#6366f1', // Indigo
  '#84cc16'  // Lime
];

export const AvatarSelector: React.FC<AvatarSelectorProps> = ({ avatar, onChange }) => {
  const randomize = () => {
    const randomColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
    const randomEyes = Math.floor(Math.random() * 5);
    const randomMouth = Math.floor(Math.random() * 5);
    onChange({
      color: randomColor,
      eyes: randomEyes,
      mouth: randomMouth
    });
  };

  const cycleEyes = (delta: number) => {
    const newEyes = (avatar.eyes + delta + 5) % 5;
    onChange({ ...avatar, eyes: newEyes });
  };

  const cycleMouth = (delta: number) => {
    const newMouth = (avatar.mouth + delta + 5) % 5;
    onChange({ ...avatar, mouth: newMouth });
  };

  return (
    <div className="flex flex-col items-center gap-4 bg-slate-800/80 p-5 rounded-2xl border-2 border-slate-700/80 shadow-inner">
      <div className="relative">
        <Avatar avatar={avatar} size={110} className="shadow-xl" />
        <button
          type="button"
          onClick={randomize}
          title="Randomize Avatar"
          className="absolute -bottom-2 -right-2 bg-amber-400 hover:bg-amber-300 text-slate-900 p-2 rounded-full shadow-lg border-2 border-slate-900 transition-transform active:scale-90"
        >
          <Dices className="w-5 h-5" />
        </button>
      </div>

      {/* Feature cyclers */}
      <div className="flex flex-col gap-2 w-full max-w-[240px]">
        {/* Eyes picker */}
        <div className="flex items-center justify-between bg-slate-900/60 px-3 py-1.5 rounded-xl border border-slate-700 text-sm text-slate-300">
          <span className="font-semibold text-xs tracking-wide uppercase text-slate-400">Eyes</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => cycleEyes(-1)}
              className="p-1 hover:bg-slate-700 rounded-lg text-slate-200 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="w-6 text-center font-bold text-amber-400">{avatar.eyes + 1}</span>
            <button
              type="button"
              onClick={() => cycleEyes(1)}
              className="p-1 hover:bg-slate-700 rounded-lg text-slate-200 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mouth picker */}
        <div className="flex items-center justify-between bg-slate-900/60 px-3 py-1.5 rounded-xl border border-slate-700 text-sm text-slate-300">
          <span className="font-semibold text-xs tracking-wide uppercase text-slate-400">Mouth</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => cycleMouth(-1)}
              className="p-1 hover:bg-slate-700 rounded-lg text-slate-200 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="w-6 text-center font-bold text-amber-400">{avatar.mouth + 1}</span>
            <button
              type="button"
              onClick={() => cycleMouth(1)}
              className="p-1 hover:bg-slate-700 rounded-lg text-slate-200 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Color Swatches */}
      <div className="grid grid-cols-5 gap-2 pt-1">
        {AVATAR_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onChange({ ...avatar, color: c })}
            className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${
              avatar.color === c ? 'border-white scale-110 shadow-md ring-2 ring-amber-400' : 'border-slate-900 opacity-80 hover:opacity-100'
            }`}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>
    </div>
  );
};
