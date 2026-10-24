import React from 'react';
import { PlayerData } from '../types';
import { Avatar } from './Avatar';
import { Crown, Pencil, CheckCircle2, UserX } from 'lucide-react';

interface PlayerListProps {
  players: PlayerData[];
  currentDrawerId: string | null;
  currentUserId: string;
  isHost: boolean;
  onKickPlayer: (playerId: string) => void;
}

export const PlayerList: React.FC<PlayerListProps> = ({
  players,
  currentDrawerId,
  currentUserId,
  isHost,
  onKickPlayer
}) => {
  // Sort players by score descending
  const sorted = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="flex flex-col h-full bg-slate-900/90 rounded-2xl border-4 border-slate-700/80 shadow-xl overflow-hidden backdrop-blur-md">
      <div className="px-4 py-2.5 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between">
        <span className="font-bold text-sm tracking-wide text-slate-200 uppercase">
          Players ({players.length})
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {sorted.map((player, idx) => {
          const isMe = player.id === currentUserId;
          const isDrawer = player.id === currentDrawerId;
          const hasGuessed = player.hasGuessed;

          return (
            <div
              key={player.id}
              className={`flex items-center justify-between p-2 rounded-xl border transition-all ${
                hasGuessed
                  ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                  : isDrawer
                  ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
                  : isMe
                  ? 'bg-slate-800 border-sky-500/40 text-slate-200'
                  : 'bg-slate-800/50 border-slate-700/60 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-xs font-bold text-slate-500 w-4 text-center">
                  #{idx + 1}
                </span>

                <Avatar avatar={player.avatar} size={38} />

                <div className="min-w-0 flex flex-col">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="font-bold text-sm truncate">
                      {player.name}
                      {isMe && <span className="text-xs text-sky-400 font-normal ml-1">(You)</span>}
                    </span>

                    {player.isHost && (
                      <span title="Host">
                        <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0 fill-amber-400" />
                      </span>
                    )}
                    {isDrawer && (
                      <span title="Drawing now">
                        <Pencil className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
                      </span>
                    )}
                    {hasGuessed && (
                      <span title="Guessed the word">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-400 font-medium">
                    {player.score} pts
                  </span>
                </div>
              </div>

              {/* Host kick option */}
              {isHost && !player.isHost && (
                <button
                  type="button"
                  onClick={() => onKickPlayer(player.id)}
                  title={`Kick ${player.name}`}
                  className="opacity-0 hover:opacity-100 group-hover:opacity-100 p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/50 rounded-lg transition-opacity"
                >
                  <UserX className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
