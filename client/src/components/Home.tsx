import React, { useState, useEffect } from 'react';
import { AvatarData } from '../types';
import { AvatarSelector } from './AvatarSelector';
import { Play, PlusCircle, LogIn, Sparkles } from 'lucide-react';

interface HomeProps {
  onJoinPublic: (name: string, avatar: AvatarData) => void;
  onCreatePrivate: (name: string, avatar: AvatarData) => void;
  onJoinCode: (code: string, name: string, avatar: AvatarData) => void;
  initialRoomCode?: string;
  errorMessage?: string;
}

export const Home: React.FC<HomeProps> = ({
  onJoinPublic,
  onCreatePrivate,
  onJoinCode,
  initialRoomCode = '',
  errorMessage
}) => {
  const [name, setName] = useState(() => localStorage.getItem('skribbl_name') || '');
  const [roomCode, setRoomCode] = useState(initialRoomCode);
  const [showJoinModal, setShowJoinModal] = useState(Boolean(initialRoomCode));
  const [avatar, setAvatar] = useState<AvatarData>(() => {
    const saved = localStorage.getItem('skribbl_avatar');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return {
      color: '#f59e0b',
      eyes: Math.floor(Math.random() * 5),
      mouth: Math.floor(Math.random() * 5)
    };
  });

  useEffect(() => {
    if (initialRoomCode) {
      setRoomCode(initialRoomCode);
      setShowJoinModal(true);
    }
  }, [initialRoomCode]);

  const saveProfile = () => {
    const cleanName = name.trim() || 'Player' + Math.floor(100 + Math.random() * 900);
    localStorage.setItem('skribbl_name', cleanName);
    localStorage.setItem('skribbl_avatar', JSON.stringify(avatar));
    return cleanName;
  };

  const handlePlayPublic = () => {
    const cleanName = saveProfile();
    onJoinPublic(cleanName, avatar);
  };

  const handleCreate = () => {
    const cleanName = saveProfile();
    onCreatePrivate(cleanName, avatar);
  };

  const handleJoinWithCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCode.trim()) return;
    const cleanName = saveProfile();
    onJoinCode(roomCode.trim().toUpperCase(), cleanName, avatar);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-8">
      {/* Game Logo */}
      <div className="flex flex-col items-center mb-6 text-center select-none">
        <div className="flex items-center gap-2">
          <span className="text-5xl sm:text-6xl animate-bounce">✏️</span>
          <h1 className="text-5xl sm:text-6xl font-black tracking-tight text-white drop-shadow-[0_5px_5px_rgba(0,0,0,0.5)]">
            skribbl<span className="text-amber-400">.io</span>
          </h1>
        </div>
        <p className="text-slate-300 font-semibold text-sm sm:text-base mt-1 drop-shadow">
          Free Online Multiplayer Drawing & Guessing Game
        </p>
      </div>

      {/* Main Card */}
      <div className="bg-slate-900/90 border-4 border-slate-700/90 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl backdrop-blur-md">
        {errorMessage && (
          <div className="mb-4 bg-rose-500/20 border border-rose-500/40 text-rose-300 px-4 py-2.5 rounded-2xl text-sm font-bold text-center">
            {errorMessage}
          </div>
        )}

        {/* Name input */}
        <div className="mb-5">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
            Your Name / Nickname
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name..."
            maxLength={18}
            className="w-full bg-slate-950/80 border-2 border-slate-700 focus:border-amber-400 text-white font-bold text-lg rounded-2xl px-4 py-3 outline-none transition-colors"
          />
        </div>

        {/* Avatar customizer */}
        <div className="mb-6">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
            Customize Avatar
          </label>
          <AvatarSelector avatar={avatar} onChange={setAvatar} />
        </div>

        {/* Play actions */}
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={handlePlayPublic}
            className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xl rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <Play className="w-6 h-6 fill-slate-950" />
            <span>Play Now! (Public Room)</span>
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleCreate}
              className="py-3 px-4 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm rounded-2xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Room</span>
            </button>

            <button
              type="button"
              onClick={() => setShowJoinModal(true)}
              className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-sm border-2 border-slate-700 rounded-2xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
            >
              <LogIn className="w-4 h-4 text-amber-400" />
              <span>Join with Code</span>
            </button>
          </div>
        </div>
      </div>

      {/* Join with code modal */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border-4 border-slate-700 rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-pop-in">
            <h3 className="text-xl font-black text-white mb-2 text-center">
              Join Room via Code
            </h3>
            <p className="text-xs text-slate-400 text-center mb-4">
              Enter the 6-character room code shared by your friend
            </p>

            <form onSubmit={handleJoinWithCode} className="flex flex-col gap-3">
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="e.g. ABC123"
                maxLength={8}
                className="w-full bg-slate-950 border-2 border-slate-700 focus:border-amber-400 text-amber-400 font-mono text-center font-black text-2xl tracking-widest rounded-2xl py-3 uppercase outline-none"
              />

              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-2xl transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!roomCode.trim()}
                  className="flex-1 py-3 bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-slate-950 font-black rounded-2xl shadow-md transition-all active:scale-95 text-sm"
                >
                  Join
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
