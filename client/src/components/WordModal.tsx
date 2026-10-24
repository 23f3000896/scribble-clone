import React from 'react';
import { Sparkles, Clock } from 'lucide-react';

interface WordModalProps {
  words: string[];
  timeLeft: number;
  onSelectWord: (word: string) => void;
}

export const WordModal: React.FC<WordModalProps> = ({ words, timeLeft, onSelectWord }) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border-4 border-amber-400/80 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center animate-pop-in">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-amber-400/20 text-amber-400 rounded-full mb-4 border border-amber-400/40">
          <Sparkles className="w-8 h-8" />
        </div>

        <h2 className="text-2xl font-black text-white mb-1 uppercase tracking-wide">
          Choose a Word to Draw!
        </h2>
        <div className="flex items-center justify-center gap-1.5 text-slate-400 text-sm mb-6 font-semibold">
          <Clock className="w-4 h-4 text-amber-400" />
          <span>Auto-selects in <strong className="text-amber-400">{timeLeft}s</strong></span>
        </div>

        <div className="flex flex-col gap-3">
          {words.map((word) => (
            <button
              key={word}
              type="button"
              onClick={() => onSelectWord(word)}
              className="w-full py-4 px-6 bg-slate-800 hover:bg-amber-400 text-slate-100 hover:text-slate-950 border-2 border-slate-700 hover:border-amber-400 rounded-2xl text-xl font-bold uppercase tracking-wider transition-all shadow-md hover:scale-102 active:scale-98"
            >
              {word}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
