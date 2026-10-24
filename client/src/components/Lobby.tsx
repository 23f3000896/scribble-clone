import React, { useState } from 'react';
import { PlayerData, RoomSettings } from '../types';
import { Avatar } from './Avatar';
import { 
  Play, 
  Crown, 
  Settings as SettingsIcon, 
  Copy, 
  Check, 
  Users, 
  Clock, 
  BookOpen, 
  Sparkles,
  CheckCircle,
  HelpCircle,
  LogOut
} from 'lucide-react';

interface LobbyProps {
  roomId: string;
  players: PlayerData[];
  settings: RoomSettings;
  currentUserId: string;
  isHost: boolean;
  onStartGame: () => void;
  onUpdateSettings: (settings: Partial<RoomSettings>) => void;
  onToggleReady: () => void;
  onLeaveRoom: () => void;
}

export const Lobby: React.FC<LobbyProps> = ({
  roomId,
  players,
  settings,
  currentUserId,
  isHost,
  onStartGame,
  onUpdateSettings,
  onToggleReady,
  onLeaveRoom
}) => {
  const [copied, setCopied] = useState(false);
  const [customWordsText, setCustomWordsText] = useState((settings.customWords || []).join(', '));
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveSettings = (newPartial: Partial<RoomSettings>) => {
    onUpdateSettings(newPartial);
  };

  const handleCustomWordsBlur = () => {
    const list = customWordsText
      .split(',')
      .map(w => w.trim().toLowerCase())
      .filter(w => w.length > 1);
    onUpdateSettings({ customWords: list });
  };

  const me = players.find(p => p.id === currentUserId);
  const canStart = players.length >= 2;

  return (
    <div className="max-w-4xl w-full mx-auto p-4 flex flex-col gap-5">
      {/* Lobby Top Banner */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/90 border-4 border-slate-700/80 p-5 rounded-3xl shadow-2xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-amber-400 text-slate-950 rounded-2xl flex items-center justify-center font-black text-2xl shadow-md">
            ✏️
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-wide">Game Lobby</h1>
            <p className="text-xs text-slate-400 font-semibold">
              Share the room code or invite link with your friends to play!
            </p>
          </div>
        </div>

        {/* Room Code & Invite Link */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="bg-slate-800 border-2 border-slate-700 px-4 py-2 rounded-2xl flex items-center gap-2">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Room Code:</span>
            <span className="font-mono text-lg font-black text-amber-400 tracking-wider">{roomId}</span>
          </div>

          <button
            type="button"
            onClick={handleCopyLink}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold px-4 py-2.5 rounded-2xl shadow-lg transition-all active:scale-95 text-sm"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-900" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Link Copied!' : 'Copy Link'}</span>
          </button>

          <button
            type="button"
            onClick={onLeaveRoom}
            title="Leave Room"
            className="p-2.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 rounded-2xl transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Players Area */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="bg-slate-900/90 border-4 border-slate-700/80 p-5 rounded-3xl shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-400" />
                <h2 className="text-lg font-bold text-white">
                  Players ({players.length}/{settings.maxPlayers})
                </h2>
              </div>
              {!canStart && (
                <span className="text-xs text-amber-400/90 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20 font-semibold animate-pulse">
                  Need at least 2 players to start
                </span>
              )}
            </div>

            {/* Players Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 min-h-[220px]">
              {players.map((p) => {
                const isMe = p.id === currentUserId;
                return (
                  <div
                    key={p.id}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all relative ${
                      p.isHost
                        ? 'bg-slate-800/90 border-amber-400/70 shadow-md'
                        : isMe
                        ? 'bg-slate-800/80 border-sky-400/60'
                        : 'bg-slate-800/40 border-slate-700/70'
                    }`}
                  >
                    {p.isHost && (
                      <span className="absolute top-2 right-2 bg-amber-400/20 text-amber-400 p-1 rounded-full border border-amber-400/30">
                        <Crown className="w-3.5 h-3.5 fill-amber-400" />
                      </span>
                    )}

                    <Avatar avatar={p.avatar} size={58} className="mb-2" />
                    <span className="font-bold text-slate-100 text-sm truncate max-w-[120px] text-center">
                      {p.name} {isMe && '(You)'}
                    </span>

                    <div className="mt-2 flex items-center gap-1 text-xs font-semibold">
                      {p.isReady || p.isHost ? (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> Ready
                        </span>
                      ) : (
                        <span className="text-slate-500">Not ready</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Action Bar */}
            <div className="mt-5 pt-4 border-t border-slate-700/80 flex flex-wrap items-center justify-between gap-3">
              {!isHost && (
                <button
                  type="button"
                  onClick={onToggleReady}
                  className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all text-sm shadow-md active:scale-95 ${
                    me?.isReady
                      ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                      : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                  }`}
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{me?.isReady ? 'Ready!' : 'Click when Ready'}</span>
                </button>
              )}

              {isHost && (
                <button
                  type="button"
                  onClick={onStartGame}
                  disabled={!canStart}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-300 disabled:opacity-40 disabled:hover:bg-amber-400 text-slate-950 font-black text-lg px-8 py-3.5 rounded-2xl shadow-xl transition-all active:scale-95 ml-auto"
                >
                  <Play className="w-5 h-5 fill-slate-950" />
                  <span>Start Game</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Room Settings Card */}
        <div className="bg-slate-900/90 border-4 border-slate-700/80 p-5 rounded-3xl shadow-xl backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <SettingsIcon className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-white text-base">Game Settings</h3>
              </div>
              {!isHost && (
                <span className="text-xs bg-slate-800 text-slate-400 px-2.5 py-1 rounded-full border border-slate-700">
                  Host only
                </span>
              )}
            </div>

            <div className="space-y-4 text-sm">
              {/* Max Players */}
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span className="font-semibold text-xs text-slate-400 uppercase">Max Players</span>
                  <span className="font-bold text-amber-400">{settings.maxPlayers}</span>
                </div>
                {isHost ? (
                  <input
                    type="range"
                    min="2"
                    max="16"
                    value={settings.maxPlayers}
                    onChange={(e) => handleSaveSettings({ maxPlayers: Number(e.target.value) })}
                    className="w-full accent-amber-400 cursor-pointer"
                  />
                ) : (
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400" style={{ width: `${(settings.maxPlayers / 16) * 100}%` }} />
                  </div>
                )}
              </div>

              {/* Rounds */}
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span className="font-semibold text-xs text-slate-400 uppercase">Rounds</span>
                  <span className="font-bold text-amber-400">{settings.rounds}</span>
                </div>
                {isHost ? (
                  <div className="grid grid-cols-4 gap-1.5">
                    {[2, 3, 5, 8].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => handleSaveSettings({ rounds: r })}
                        className={`py-1.5 text-xs font-bold rounded-xl border transition-all ${
                          settings.rounds === r
                            ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-sm'
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                ) : (
                  <span className="font-bold text-slate-200">{settings.rounds} rounds</span>
                )}
              </div>

              {/* Draw Time */}
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span className="font-semibold text-xs text-slate-400 uppercase">Draw Time</span>
                  <span className="font-bold text-amber-400">{settings.drawTime}s</span>
                </div>
                {isHost ? (
                  <div className="grid grid-cols-4 gap-1.5">
                    {[45, 60, 80, 100].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => handleSaveSettings({ drawTime: t })}
                        className={`py-1.5 text-xs font-bold rounded-xl border transition-all ${
                          settings.drawTime === t
                            ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-sm'
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                        }`}
                      >
                        {t}s
                      </button>
                    ))}
                  </div>
                ) : (
                  <span className="font-bold text-slate-200">{settings.drawTime} seconds</span>
                )}
              </div>

              {/* Word Count */}
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span className="font-semibold text-xs text-slate-400 uppercase">Word Choices</span>
                  <span className="font-bold text-amber-400">{settings.wordCount}</span>
                </div>
                {isHost ? (
                  <div className="grid grid-cols-3 gap-1.5">
                    {[2, 3, 5].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => handleSaveSettings({ wordCount: c })}
                        className={`py-1.5 text-xs font-bold rounded-xl border transition-all ${
                          settings.wordCount === c
                            ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-sm'
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                        }`}
                      >
                        {c} words
                      </button>
                    ))}
                  </div>
                ) : (
                  <span className="font-bold text-slate-200">{settings.wordCount} words</span>
                )}
              </div>

              {/* Categories */}
              <div>
                <span className="font-semibold text-xs text-slate-400 uppercase block mb-1.5">Category</span>
                {isHost ? (
                  <select
                    value={settings.category}
                    onChange={(e) => handleSaveSettings({ category: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:border-amber-400 outline-none"
                  >
                    <option value="All">All Categories (400+ words)</option>
                    <option value="animals">Animals</option>
                    <option value="objects">Objects & Tools</option>
                    <option value="food">Food & Drinks</option>
                    <option value="actions">Actions & Verbs</option>
                    <option value="places_nature">Places & Nature</option>
                    <option value="Custom">Custom Words Only</option>
                  </select>
                ) : (
                  <span className="font-bold text-slate-200 capitalize">{settings.category}</span>
                )}
              </div>

              {/* Custom words (Host only) */}
              {isHost && (
                <div>
                  <span className="font-semibold text-xs text-slate-400 uppercase block mb-1">
                    Custom Words (comma-separated)
                  </span>
                  <textarea
                    rows={2}
                    value={customWordsText}
                    onChange={(e) => setCustomWordsText(e.target.value)}
                    onBlur={handleCustomWordsBlur}
                    placeholder="e.g. pikachu, microwave, telescope"
                    className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-xl p-2 text-xs placeholder-slate-500 focus:border-amber-400 outline-none resize-none"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="text-[11px] text-slate-500 text-center mt-4">
            Rooms automatically clean up when all players disconnect.
          </div>
        </div>
      </div>
    </div>
  );
};
