import { AvatarData, PlayerData } from './types.js';

export class Player {
  public id: string;
  public name: string;
  public avatar: AvatarData;
  public score: number = 0;
  public roundScore: number = 0;
  public hasGuessed: boolean = false;
  public isHost: boolean = false;
  public isReady: boolean = false;
  public isDisconnected: boolean = false;
  public disconnectTimeout: NodeJS.Timeout | null = null;

  constructor(id: string, name: string, avatar: AvatarData, isHost: boolean = false) {
    this.id = id;
    this.name = name.trim().slice(0, 20) || 'Anonymous';
    this.avatar = avatar;
    this.isHost = isHost;
  }

  public resetRound() {
    this.hasGuessed = false;
    this.roundScore = 0;
  }

  public resetGame() {
    this.score = 0;
    this.roundScore = 0;
    this.hasGuessed = false;
    this.isReady = false;
  }

  public addScore(points: number) {
    this.roundScore += points;
    this.score += points;
  }

  public toJSON(): PlayerData {
    return {
      id: this.id,
      name: this.name,
      avatar: this.avatar,
      score: this.score,
      roundScore: this.roundScore,
      hasGuessed: this.hasGuessed,
      isHost: this.isHost,
      isReady: this.isReady
    };
  }
}
