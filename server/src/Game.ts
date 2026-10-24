import { GamePhase, DrawStroke, RoomSettings, RoundResultData, GameOverData } from './types.js';
import { Player } from './Player.js';
import { getRandomWords } from './words.js';

export interface GameEventCallbacks {
  onPhaseChange: (phase: GamePhase) => void;
  onTimerTick: (timeLeft: number) => void;
  onWordOptions: (drawerId: string, words: string[]) => void;
  onRoundStart: (drawerId: string, hintString: string, drawTime: number) => void;
  onHintUpdate: (hintString: string) => void;
  onRoundEnd: (data: RoundResultData) => void;
  onGameOver: (data: GameOverData) => void;
  onPlayerGuessed: (player: Player, points: number) => void;
  onCloseGuess: (playerId: string) => void;
  onChatMessage: (message: any, recipientIds?: string[]) => void;
}

export class Game {
  public phase: GamePhase = 'LOBBY';
  public currentRound: number = 0;
  public totalRounds: number = 3;
  public currentTurnIndex: number = 0;
  public turnOrder: string[] = []; // player IDs
  public currentDrawerId: string | null = null;
  public wordOptions: string[] = [];
  public currentWord: string = '';
  public revealedIndices: Set<number> = new Set();
  public timeLeft: number = 0;
  public strokes: DrawStroke[] = [];

  private timer: NodeJS.Timeout | null = null;
  private settings: RoomSettings;
  private playersMap: Map<string, Player>;
  private callbacks: GameEventCallbacks;

  constructor(settings: RoomSettings, players: Map<string, Player>, callbacks: GameEventCallbacks) {
    this.settings = settings;
    this.totalRounds = settings.rounds;
    this.playersMap = players;
    this.callbacks = callbacks;
  }

  public updateSettings(newSettings: RoomSettings) {
    this.settings = newSettings;
    this.totalRounds = newSettings.rounds;
  }

  public start() {
    this.clearTimer();
    this.currentRound = 1;
    this.currentTurnIndex = 0;
    this.strokes = [];
    
    // Reset all players
    for (const player of this.playersMap.values()) {
      player.resetGame();
    }

    // Set turn order from active players
    this.turnOrder = Array.from(this.playersMap.keys());
    if (this.turnOrder.length === 0) return;

    this.startTurn();
  }

  private startTurn() {
    this.clearTimer();
    this.strokes = [];

    // Filter turn order to existing players
    this.turnOrder = this.turnOrder.filter(id => this.playersMap.has(id));
    if (this.turnOrder.length === 0) {
      this.endGame();
      return;
    }

    if (this.currentTurnIndex >= this.turnOrder.length) {
      this.currentTurnIndex = 0;
      this.currentRound++;
      if (this.currentRound > this.totalRounds) {
        this.endGame();
        return;
      }
    }

    this.currentDrawerId = this.turnOrder[this.currentTurnIndex];
    const drawer = this.playersMap.get(this.currentDrawerId);
    if (!drawer) {
      this.nextTurn();
      return;
    }

    // Reset round states
    for (const p of this.playersMap.values()) {
      p.resetRound();
    }

    this.phase = 'SELECTING_WORD';
    this.callbacks.onPhaseChange(this.phase);

    // Pick 3 words (or setting-defined count)
    this.wordOptions = getRandomWords(this.settings.wordCount || 3, this.settings.category, this.settings.customWords);
    this.callbacks.onWordOptions(this.currentDrawerId, this.wordOptions);

    // 15 seconds to choose
    this.timeLeft = 15;
    this.callbacks.onTimerTick(this.timeLeft);

    this.timer = setInterval(() => {
      this.timeLeft--;
      this.callbacks.onTimerTick(this.timeLeft);

      if (this.timeLeft <= 0) {
        this.clearTimer();
        // Auto-select first word if drawer didn't choose
        const word = this.wordOptions[0] || 'apple';
        this.selectWord(this.currentDrawerId!, word);
      }
    }, 1000);
  }

  public selectWord(playerId: string, word: string) {
    if (this.phase !== 'SELECTING_WORD' || this.currentDrawerId !== playerId) return;
    this.clearTimer();

    this.currentWord = word.trim().toLowerCase();
    this.revealedIndices.clear();
    this.phase = 'DRAWING';
    this.callbacks.onPhaseChange(this.phase);

    const initialHint = this.getMaskedWord();
    this.timeLeft = this.settings.drawTime || 80;
    this.callbacks.onRoundStart(this.currentDrawerId, initialHint, this.timeLeft);
    this.callbacks.onTimerTick(this.timeLeft);

    // Set up hint reveal milestones
    const totalHints = Math.min(this.settings.hintsCount, Math.max(0, this.currentWord.replace(/\s+/g, '').length - 1));
    const revealTimes: number[] = [];
    if (totalHints > 0) {
      const interval = Math.floor(this.timeLeft / (totalHints + 1));
      for (let i = 1; i <= totalHints; i++) {
        revealTimes.push(this.timeLeft - interval * i);
      }
    }

    this.timer = setInterval(() => {
      this.timeLeft--;
      this.callbacks.onTimerTick(this.timeLeft);

      // Check if hint should be revealed
      if (revealTimes.includes(this.timeLeft)) {
        this.revealRandomLetter();
      }

      if (this.timeLeft <= 0) {
        this.clearTimer();
        this.endRound();
      }
    }, 1000);
  }

  private revealRandomLetter() {
    const unrevealed: number[] = [];
    for (let i = 0; i < this.currentWord.length; i++) {
      if (this.currentWord[i] !== ' ' && !this.revealedIndices.has(i)) {
        unrevealed.push(i);
      }
    }

    if (unrevealed.length > 1) { // Leave at least 1 hidden letter
      const randomIndex = unrevealed[Math.floor(Math.random() * unrevealed.length)];
      this.revealedIndices.add(randomIndex);
      this.callbacks.onHintUpdate(this.getMaskedWord());
    }
  }

  public getMaskedWord(): string {
    return this.currentWord
      .split('')
      .map((char, index) => {
        if (char === ' ') return '  ';
        if (this.revealedIndices.has(index)) return char.toUpperCase();
        return '_';
      })
      .join(' ');
  }

  public handleGuess(player: Player, guessText: string): { status: 'correct' | 'close' | 'normal'; points?: number } {
    if (this.phase !== 'DRAWING') return { status: 'normal' };
    if (player.id === this.currentDrawerId) return { status: 'normal' };
    if (player.hasGuessed) return { status: 'normal' };

    const cleanGuess = guessText.trim().toLowerCase();
    const cleanWord = this.currentWord.trim().toLowerCase();

    // Check exact match
    if (cleanGuess === cleanWord) {
      player.hasGuessed = true;

      // Scoring formula: faster = more points (100 to 500)
      const maxDrawTime = this.settings.drawTime || 80;
      const timeRatio = Math.max(0.1, this.timeLeft / maxDrawTime);
      const points = Math.round(100 + 400 * timeRatio);
      player.addScore(points);

      // Award drawer points too
      const drawer = this.playersMap.get(this.currentDrawerId!);
      if (drawer) {
        const guessersCount = Math.max(1, this.playersMap.size - 1);
        const drawerPoints = Math.round(350 / guessersCount);
        drawer.addScore(drawerPoints);
      }

      this.callbacks.onPlayerGuessed(player, points);

      // Check if all active non-drawers guessed
      const nonDrawers = Array.from(this.playersMap.values()).filter(p => p.id !== this.currentDrawerId && !p.isDisconnected);
      const allGuessed = nonDrawers.length > 0 && nonDrawers.every(p => p.hasGuessed);

      if (allGuessed) {
        this.clearTimer();
        this.endRound();
      }

      return { status: 'correct', points };
    }

    // Check close guess (Levenshtein distance <= 1 for words >= 4 letters)
    if (cleanWord.length >= 4 && this.levenshteinDistance(cleanGuess, cleanWord) === 1) {
      this.callbacks.onCloseGuess(player.id);
      return { status: 'close' };
    }

    return { status: 'normal' };
  }

  private levenshteinDistance(a: string, b: string): number {
    const dp: number[][] = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
    for (let i = 0; i <= a.length; i++) dp[i][0] = i;
    for (let j = 0; j <= b.length; j++) dp[0][j] = j;

    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + cost
        );
      }
    }
    return dp[a.length][b.length];
  }

  public endRound() {
    this.clearTimer();
    this.phase = 'ROUND_END';
    this.callbacks.onPhaseChange(this.phase);

    const drawer = this.playersMap.get(this.currentDrawerId || '');
    const drawerName = drawer?.name || 'Someone';

    const scores = Array.from(this.playersMap.values()).map(p => ({
      playerId: p.id,
      name: p.name,
      score: p.score,
      roundScore: p.roundScore,
      hasGuessed: p.hasGuessed
    }));

    // Find next drawer name
    let nextDrawerName = '';
    const activeIds = this.turnOrder.filter(id => this.playersMap.has(id));
    const nextIdx = (this.currentTurnIndex + 1) % (activeIds.length || 1);
    const nextDrawer = this.playersMap.get(activeIds[nextIdx]);
    if (nextDrawer) {
      nextDrawerName = nextDrawer.name;
    }

    this.callbacks.onRoundEnd({
      word: this.currentWord,
      scores,
      drawerId: this.currentDrawerId || '',
      drawerName,
      nextDrawerName
    });

    // 5 seconds delay before next turn
    this.timer = setTimeout(() => {
      this.nextTurn();
    }, 5000);
  }

  private nextTurn() {
    this.currentTurnIndex++;
    this.startTurn();
  }

  public endGame() {
    this.clearTimer();
    this.phase = 'GAME_OVER';
    this.callbacks.onPhaseChange(this.phase);

    const sortedPlayers = Array.from(this.playersMap.values())
      .map(p => p.toJSON())
      .sort((a, b) => b.score - a.score);

    const winner = sortedPlayers[0] || null;

    this.callbacks.onGameOver({
      leaderboard: sortedPlayers,
      winner
    });
  }

  public addStroke(stroke: DrawStroke) {
    this.strokes.push(stroke);
  }

  public undoStroke(): boolean {
    if (this.strokes.length > 0) {
      this.strokes.pop();
      return true;
    }
    return false;
  }

  public clearCanvas() {
    this.strokes = [];
  }

  public removePlayer(playerId: string) {
    if (this.currentDrawerId === playerId && (this.phase === 'SELECTING_WORD' || this.phase === 'DRAWING')) {
      // Drawer left, end current round
      this.clearTimer();
      this.endRound();
    }
    this.turnOrder = this.turnOrder.filter(id => id !== playerId);
  }

  public clearTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  public destroy() {
    this.clearTimer();
    this.strokes = [];
  }
}
