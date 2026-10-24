export interface AvatarData {
  color: string;
  eyes: number;
  mouth: number;
}

export interface PlayerData {
  id: string;
  name: string;
  avatar: AvatarData;
  score: number;
  roundScore: number;
  hasGuessed: boolean;
  isHost: boolean;
  isReady: boolean;
}

export interface RoomSettings {
  maxPlayers: number;
  rounds: number;
  drawTime: number;
  wordCount: number;
  hintsCount: number;
  category: string;
  customWords: string[];
  isPrivate: boolean;
}

export type GamePhase = 'LOBBY' | 'SELECTING_WORD' | 'DRAWING' | 'ROUND_END' | 'GAME_OVER';

export interface DrawPoint {
  x: number; // Normalized coordinate 0.0 to 1.0 for resolution independence
  y: number;
}

export interface DrawStroke {
  id: string;
  type: 'brush' | 'eraser' | 'fill';
  color: string;
  size: number;
  points: DrawPoint[];
}

export interface ChatMessage {
  id: string;
  senderId?: string;
  senderName?: string;
  text: string;
  type: 'chat' | 'system' | 'correct' | 'close' | 'join' | 'leave';
  timestamp: number;
}

export interface RoundResultData {
  word: string;
  scores: { playerId: string; name: string; score: number; roundScore: number; hasGuessed: boolean }[];
  drawerId: string;
  drawerName: string;
  nextDrawerName?: string;
}

export interface GameOverData {
  leaderboard: PlayerData[];
  winner: PlayerData;
}
