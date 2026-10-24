import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { GameOverData } from '../types';
import { Avatar } from './Avatar';
import { Trophy, Medal, RotateCcw } from 'lucide-react';
import { sounds } from '../audio';

interface GameOverModalProps {
  data: GameOverData;
  isHost: boolean;
  onReturnToLobby: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({ data, isHost, onReturnToLobby }) => {
  const { leaderboard, winner } = data;

  useEffect(() => {
    sounds.playGameOver();

    // Trigger confetti cannon
    const duration = 3 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#f59e0b', '#3b82f6', '#10b981', '#ef4444']
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#f59e0b', '#3b82f6', '#10b981', '#ef4444']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  const first = leaderboard[0];
  const second = leaderboard[1];
  const third = leaderboard[2];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border-4 border-amber-400 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl text-center animate-pop-in">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-400/20 text-amber-400 rounded-full mb-3 border-2 border-amber-400/40">
          <Trophy className="w-9 h-9" />
        </div>

        <h2 className="text-3xl sm:text-4xl font-black text-white mb-1">
          Game Over!
        </h2>
        <p className="text-amber-400 font-bold text-lg mb-6">
          🎉 {winner?.name || 'Everyone'} takes the crown!
        </p>

        {/* Podium visualization */}
        <div className="flex items-end justify-center gap-3 sm:gap-4 mb-6 pt-6">
          {/* 2nd Place */}
          {second && (
            <div className="flex flex-col items-center flex-1">
              <Avatar avatar={second.avatar} size={50} />
              <span className="font-bold text-xs text-slate-300 mt-1 truncate max-w-[90px]">
                {second.name}
              </span>
              <span className="text-[11px] font-bold text-amber-400">{second.score} pts</span>
              <div className="w-full bg-slate-700 h-24 rounded-t-xl flex items-center justify-center border-t-2 border-slate-400 text-slate-300 font-black text-xl mt-1 shadow-md">
                2
              </div>
            </div>
          )}

          {/* 1st Place */}
          {first && (
            <div className="flex flex-col items-center flex-1">
              <div className="relative">
                <Trophy className="w-6 h-6 text-amber-400 absolute -top-5 left-1/2 -translate-x-1/2 animate-bounce" />
                <Avatar avatar={first.avatar} size={64} className="ring-4 ring-amber-400 shadow-xl" />
              </div>
              <span className="font-bold text-sm text-amber-300 mt-1 truncate max-w-[100px]">
                {first.name}
              </span>
              <span className="text-xs font-black text-amber-400">{first.score} pts</span>
              <div className="w-full bg-amber-500 h-32 rounded-t-xl flex items-center justify-center border-t-2 border-amber-300 text-slate-900 font-black text-2xl mt-1 shadow-lg">
                1
              </div>
            </div>
          )}

          {/* 3rd Place */}
          {third && (
            <div className="flex flex-col items-center flex-1">
              <Avatar avatar={third.avatar} size={44} />
              <span className="font-bold text-xs text-slate-300 mt-1 truncate max-w-[90px]">
                {third.name}
              </span>
              <span className="text-[11px] font-bold text-amber-400">{third.score} pts</span>
              <div className="w-full bg-amber-900/80 h-16 rounded-t-xl flex items-center justify-center border-t-2 border-amber-700 text-amber-200 font-black text-lg mt-1 shadow-md">
                3
              </div>
            </div>
          )}
        </div>

        {/* Full scores list */}
        <div className="bg-slate-950/60 rounded-2xl p-3 border border-slate-800 max-h-44 overflow-y-auto space-y-1.5 mb-6 text-sm">
          {leaderboard.map((player, idx) => (
            <div
              key={player.id}
              className="flex items-center justify-between px-3 py-1.5 bg-slate-800/40 rounded-xl border border-slate-700/50"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-bold w-4">#{idx + 1}</span>
                <Avatar avatar={player.avatar} size={24} />
                <span className="font-bold text-slate-200">{player.name}</span>
              </div>
              <span className="font-bold text-amber-400">{player.score} pts</span>
            </div>
          ))}
        </div>

        {/* Return to Lobby */}
        {isHost ? (
          <button
            type="button"
            onClick={onReturnToLobby}
            className="w-full py-3.5 px-6 bg-amber-400 hover:bg-amber-300 text-slate-900 font-black text-lg rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            <span>Play Again (Return to Lobby)</span>
          </button>
        ) : (
          <p className="text-sm text-slate-400 font-semibold animate-pulse">
            Waiting for host to start another match...
          </p>
        )}
      </div>
    </div>
  );
};
