import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { Send, Sparkles } from 'lucide-react';

interface ChatBoxProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isDrawer: boolean;
  hasGuessed: boolean;
  isDrawingPhase: boolean;
  closeNotification: boolean;
}

export const ChatBox: React.FC<ChatBoxProps> = ({
  messages,
  onSendMessage,
  isDrawer,
  hasGuessed,
  isDrawingPhase,
  closeNotification
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, closeNotification]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed) return;
    onSendMessage(trimmed);
    setInputText('');
  };

  // Determine placeholder
  let placeholder = 'Type a message...';
  if (isDrawingPhase) {
    if (isDrawer) {
      placeholder = 'You are drawing! Chat with others (don’t spoil word)';
    } else if (hasGuessed) {
      placeholder = 'You guessed! Chat with other guessers...';
    } else {
      placeholder = 'Type your guess here...';
    }
  }

  return (
    <div className="flex flex-col h-full bg-slate-900/90 rounded-2xl border-4 border-slate-700/80 shadow-xl overflow-hidden backdrop-blur-md">
      {/* Chat header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-800/90 border-b border-slate-700">
        <span className="font-bold text-sm tracking-wide text-slate-200 uppercase flex items-center gap-1.5">
          💬 Game Chat & Guesses
        </span>
        {hasGuessed && isDrawingPhase && (
          <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-0.5 rounded-full font-semibold border border-emerald-500/30 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Guessed!
          </span>
        )}
      </div>

      {/* Messages list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 text-sm">
        {messages.map((msg) => {
          if (msg.type === 'system') {
            const isCorrectGuess = msg.text.includes('guessed the word');
            const isRoundOver = msg.text.includes('Round over') || msg.text.includes('The word was');

            if (isCorrectGuess) {
              return (
                <div
                  key={msg.id}
                  className="bg-emerald-500/20 text-emerald-300 font-bold px-3 py-1.5 rounded-xl border border-emerald-500/30 text-center animate-pop-in shadow-sm"
                >
                  {msg.text}
                </div>
              );
            }

            if (isRoundOver) {
              return (
                <div
                  key={msg.id}
                  className="bg-amber-500/20 text-amber-300 font-semibold px-3 py-1.5 rounded-xl border border-amber-500/30 text-center shadow-sm"
                >
                  {msg.text}
                </div>
              );
            }

            return (
              <div key={msg.id} className="text-center text-xs text-slate-400 italic py-0.5">
                {msg.text}
              </div>
            );
          }

          // User chat message
          return (
            <div key={msg.id} className="leading-snug break-words">
              <span className="font-bold text-amber-400 mr-1.5">{msg.senderName}:</span>
              <span className="text-slate-100">{msg.text}</span>
            </div>
          );
        })}

        {/* Close guess flash alert */}
        {closeNotification && (
          <div className="bg-amber-400/20 text-amber-300 font-bold px-3 py-1.5 rounded-xl border border-amber-400/40 text-center animate-bounce">
            🔥 You are so close! Check your spelling!
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input box */}
      <form onSubmit={handleSubmit} className="p-2.5 bg-slate-800/80 border-t border-slate-700 flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={placeholder}
          maxLength={100}
          className="flex-1 bg-slate-950/70 border border-slate-600 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-slate-100 placeholder-slate-400 rounded-xl px-3.5 py-2 text-sm outline-none transition-colors"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="bg-amber-400 hover:bg-amber-300 disabled:opacity-40 disabled:hover:bg-amber-400 text-slate-900 p-2 rounded-xl transition-all font-bold shadow-md active:scale-95"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
