import React, { useState } from 'react';
import { Clock, Volume2, VolumeX, Copy, Check } from 'lucide-react';
import { sounds } from '../audio';

interface HeaderProps {
  roomId: string;
  round: number;
  totalRounds: number;
  timeLeft: number;
  word: string;
  isDrawer: boolean;
  hasGuessed: boolean;
  drawerName?: string;
}

export const Header: React.FC<HeaderProps> = ({
  roomId,
  round,
  totalRounds,
  timeLeft,
  word,
  isDrawer,
  hasGuessed,
  drawerName
}) => {
  const [copied, setCopied] = useState(false);
  const [muted, setMuted] = useState(sounds.isMuted());

  const handleCopyCode = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleMute = () => {
    const isNowMuted = sounds.toggleMute();
    setMuted(isNowMuted);
  };

  const isTimeCritical = timeLeft <= 10 && timeLeft > 0;

  return (
    <header className="flex items-center justify-between px-4 py-2 bg-slate-900/90 rounded-2xl border-4 border-slate-700/80 shadow-xl backdrop-blur-md">
      {/* Left: Timer & Round */}
      <div className="flex items-center gap-3">
        {/* Timer */}
        <div
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold text-lg border transition-all ${
            isTimeCritical
              ? 'bg-rose-500/20 border-rose-500/50 text-rose-400 animate-pulse'
              : 'bg-slate-800 border-slate-700 text-amber-400'
          }`}
        >
          <Clock className={`w-5 h-5 ${isTimeCritical ? 'animate-spin' : ''}`} />
          <span>{timeLeft}s</span>
        </div>

        {/* Round */}
        <div className="hidden sm:flex flex-col text-xs font-semibold text-slate-300">
          <span className="text-slate-400 uppercase tracking-wider text-[10px]">Round</span>
          <span className="text-amber-400 font-bold text-sm">
            {round} / {totalRounds}
          </span>
        </div>
      </div>

      {/* Center: Word or Hints */}
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        {isDrawer ? (
          <div className="flex flex-col items-center">
            <span className="text-xs uppercase tracking-wider text-amber-400 font-bold">You are drawing</span>
            <span className="text-xl sm:text-2xl font-black tracking-widest text-white uppercase drop-shadow-md">
              {word}
            </span>
          </div>
        ) : hasGuessed ? (
          <div className="flex flex-col items-center">
            <span className="text-xs uppercase tracking-wider text-emerald-400 font-bold">You guessed the word!</span>
            <span className="text-xl sm:text-2xl font-black tracking-widest text-emerald-300 uppercase drop-shadow-md">
              {word}
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <span className="text-xs text-slate-400 font-medium">
              {drawerName ? `${drawerName} is drawing` : 'Guess the word'}
            </span>
            <div className="text-xl sm:text-2xl font-mono font-black tracking-[0.25em] text-white drop-shadow-md">
              {word || '_ _ _'}
            </div>
          </div>
        )}
      </div>

      {/* Right: Room Code & Mute Audio */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleCopyCode}
          title="Copy Room Link"
          className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-xl border border-slate-700 text-xs font-bold transition-all active:scale-95"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-amber-400" />}
          <span className="hidden sm:inline font-mono">{roomId}</span>
          <span className="sm:hidden">{copied ? 'Copied' : 'Invite'}</span>
        </button>

        <button
          type="button"
          onClick={handleToggleMute}
          title={muted ? 'Unmute' : 'Mute'}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-colors"
        >
          {muted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
        </button>
      </div>
    </header>
  );
};
