import React from 'react';
import { RoundResultData } from '../types';
import { CheckCircle2, Trophy } from 'lucide-react';

interface RoundEndModalProps {
  data: RoundResultData;
}

export const RoundEndModal: React.FC<RoundEndModalProps> = ({ data }) => {
  const { word, scores, nextDrawerName } = data;

  // Sort by round score delta
  const sortedScores = [...scores].sort((a, b) => b.roundScore - a.roundScore);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border-4 border-slate-700 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl text-center animate-pop-in">
        <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Round Over</span>
        <h2 className="text-2xl sm:text-3xl font-black text-white mt-1 mb-2">
          The word was <span className="text-amber-400 underline decoration-amber-400/50">{word.toUpperCase()}</span>
        </h2>

        {nextDrawerName && (
          <p className="text-sm font-semibold text-slate-300 mb-6 bg-slate-800/80 py-1.5 px-4 rounded-full inline-block border border-slate-700">
            Next Drawer: <strong className="text-amber-400">{nextDrawerName}</strong>
          </p>
        )}

        <div className="bg-slate-950/60 rounded-2xl p-4 border border-slate-800 max-h-60 overflow-y-auto space-y-2 mb-4">
          {sortedScores.map((s, idx) => (
            <div
              key={s.playerId}
              className="flex items-center justify-between px-3 py-2 bg-slate-800/50 rounded-xl border border-slate-700/60 text-sm"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-bold w-4">#{idx + 1}</span>
                <span className="font-bold text-slate-200">{s.name}</span>
                {s.hasGuessed && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              </div>
              <div className="flex items-center gap-2">
                {s.roundScore > 0 ? (
                  <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    +{s.roundScore}
                  </span>
                ) : (
                  <span className="text-xs text-slate-500 font-semibold">+0</span>
                )}
                <span className="font-bold text-amber-400">{s.score} pts</span>
              </div>
            </div>
          ))}
        </div>

        <div className="text-xs text-slate-400 animate-pulse font-medium">
          Next turn starting shortly...
        </div>
      </div>
    </div>
  );
};
