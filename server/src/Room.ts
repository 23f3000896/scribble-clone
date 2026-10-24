import { Server, Socket } from 'socket.io';
import { Player } from './Player.js';
import { Game } from './Game.js';
import { RoomSettings, DrawStroke, ChatMessage, PlayerData, RoundResultData, GameOverData } from './types.js';

export class Room {
  public id: string;
  public hostId: string;
  public players: Map<string, Player> = new Map();
  public settings: RoomSettings;
  public game: Game;
  public chatHistory: ChatMessage[] = [];
  private io: Server;

  constructor(id: string, hostPlayer: Player, settings: Partial<RoomSettings>, io: Server) {
    this.id = id;
    this.hostId = hostPlayer.id;
    this.io = io;

    this.settings = {
      maxPlayers: settings.maxPlayers ?? 8,
      rounds: settings.rounds ?? 3,
      drawTime: settings.drawTime ?? 80,
      wordCount: settings.wordCount ?? 3,
      hintsCount: settings.hintsCount ?? 2,
      category: settings.category ?? 'All',
      customWords: settings.customWords ?? [],
      isPrivate: settings.isPrivate ?? false
    };

    this.players.set(hostPlayer.id, hostPlayer);

    this.game = new Game(this.settings, this.players, {
      onPhaseChange: (phase) => {
        this.io.to(this.id).emit('game_phase', {
          phase,
          round: this.game.currentRound,
          totalRounds: this.game.totalRounds,
          drawerId: this.game.currentDrawerId
        });
      },
      onTimerTick: (timeLeft) => {
        this.io.to(this.id).emit('timer_tick', { timeLeft });
      },
      onWordOptions: (drawerId, words) => {
        this.io.to(drawerId).emit('word_options', { words });
        // Notify others that drawer is choosing
        const drawer = this.players.get(drawerId);
        this.io.to(this.id).emit('drawer_choosing', {
          drawerId,
          drawerName: drawer?.name || 'Someone'
        });
      },
      onRoundStart: (drawerId, hintString, drawTime) => {
        const drawer = this.players.get(drawerId);
        // Drawer sees the actual word
        this.io.to(drawerId).emit('round_started', {
          drawerId,
          drawerName: drawer?.name || 'Someone',
          word: this.game.currentWord,
          isDrawer: true,
          drawTime
        });

        // Non-drawers see the masked hint blanks
        for (const [pid] of this.players) {
          if (pid !== drawerId) {
            this.io.to(pid).emit('round_started', {
              drawerId,
              drawerName: drawer?.name || 'Someone',
              word: hintString,
              isDrawer: false,
              drawTime
            });
          }
        }

        this.broadcastSystemMessage(`${drawer?.name || 'Drawer'} is drawing now!`);
      },
      onHintUpdate: (hintString) => {
        // Send hint to non-drawers who haven't guessed yet
        for (const [pid, player] of this.players) {
          if (pid !== this.game.currentDrawerId && !player.hasGuessed) {
            this.io.to(pid).emit('hint_updated', { hint: hintString });
          }
        }
      },
      onPlayerGuessed: (player, points) => {
        // Notify room
        this.broadcastSystemMessage(`🎉 ${player.name} guessed the word! (+${points} pts)`);
        
        // Notify the player with exact points and reveal actual word to them
        this.io.to(player.id).emit('guess_success', {
          word: this.game.currentWord,
          points
        });

        // Broadcast updated player states
        this.broadcastPlayerList();
      },
      onCloseGuess: (playerId) => {
        this.io.to(playerId).emit('close_guess');
      },
      onRoundEnd: (data: RoundResultData) => {
        this.broadcastSystemMessage(`Round over! The word was "${data.word}"`);
        this.io.to(this.id).emit('round_ended', data);
        this.broadcastPlayerList();
      },
      onGameOver: (data: GameOverData) => {
        this.broadcastSystemMessage(`🏆 Game Over! Winner is ${data.winner?.name || 'Nobody'}!`);
        this.io.to(this.id).emit('game_over', data);
        this.broadcastPlayerList();
      },
      onChatMessage: (msg) => {
        this.io.to(this.id).emit('chat_message', msg);
      }
    });
  }

  public addPlayer(player: Player, socket: Socket): boolean {
    if (this.players.size >= this.settings.maxPlayers && !this.players.has(player.id)) {
      return false;
    }

    socket.join(this.id);
    this.players.set(player.id, player);

    // If host was removed or this is first player
    if (!this.players.has(this.hostId)) {
      this.hostId = player.id;
      player.isHost = true;
    }

    this.broadcastSystemMessage(`${player.name} joined the room.`);
    this.broadcastPlayerList();
    this.syncRoomState(socket, player.id);

    return true;
  }

  public removePlayer(playerId: string) {
    const player = this.players.get(playerId);
    if (!player) return;

    this.players.delete(playerId);
    this.broadcastSystemMessage(`${player.name} left the room.`);

    // If host left, assign new host
    if (this.hostId === playerId && this.players.size > 0) {
      const nextHost = this.players.values().next().value;
      if (nextHost) {
        this.hostId = nextHost.id;
        nextHost.isHost = true;
        this.broadcastSystemMessage(`${nextHost.name} is now the room host.`);
      }
    }

    this.game.removePlayer(playerId);
    this.broadcastPlayerList();

    // If no players remain, room can be cleaned up
  }

  public updateSettings(hostId: string, newSettings: Partial<RoomSettings>): boolean {
    if (this.hostId !== hostId || this.game.phase !== 'LOBBY') return false;

    this.settings = {
      ...this.settings,
      ...newSettings
    };
    this.game.updateSettings(this.settings);
    this.io.to(this.id).emit('settings_updated', this.settings);
    this.broadcastSystemMessage('Room settings were updated.');
    return true;
  }

  public toggleReady(playerId: string): boolean {
    const player = this.players.get(playerId);
    if (!player || this.game.phase !== 'LOBBY') return false;

    player.isReady = !player.isReady;
    this.broadcastPlayerList();
    return true;
  }

  public startGame(requesterId: string): boolean {
    if (this.hostId !== requesterId) return false;
    if (this.players.size < 2) {
      this.io.to(requesterId).emit('error_message', 'Need at least 2 players to start the game!');
      return false;
    }

    this.broadcastSystemMessage('Game is starting!');
    this.game.start();
    return true;
  }

  public returnToLobby(requesterId: string): boolean {
    if (this.hostId !== requesterId) return false;
    this.game.clearTimer();
    this.game.phase = 'LOBBY';
    this.game.strokes = [];

    for (const player of this.players.values()) {
      player.resetGame();
    }

    this.io.to(this.id).emit('returned_to_lobby', {
      settings: this.settings,
      players: this.getPlayerList()
    });
    this.broadcastSystemMessage('Host returned room to lobby.');
    return true;
  }

  public handleStroke(playerId: string, stroke: DrawStroke) {
    if (this.game.phase !== 'DRAWING' || this.game.currentDrawerId !== playerId) return;
    this.game.addStroke(stroke);
    this.io.to(this.id).emit('draw_stroke', stroke);
  }

  public handleUndo(playerId: string) {
    if (this.game.phase !== 'DRAWING' || this.game.currentDrawerId !== playerId) return;
    if (this.game.undoStroke()) {
      this.io.to(this.id).emit('draw_undo');
    }
  }

  public handleClear(playerId: string) {
    if (this.game.phase !== 'DRAWING' || this.game.currentDrawerId !== playerId) return;
    this.game.clearCanvas();
    this.io.to(this.id).emit('draw_clear');
  }

  public handleChat(player: Player, text: string) {
    const cleanText = text.trim();
    if (!cleanText) return;

    // In drawing phase, check if guess
    if (this.game.phase === 'DRAWING') {
      const isDrawer = player.id === this.game.currentDrawerId;
      const cleanLower = cleanText.toLowerCase();
      const currentWordLower = this.game.currentWord.toLowerCase();

      // Drawer is forbidden from chatting the word or hints
      if (isDrawer) {
        if (cleanLower.includes(currentWordLower)) {
          this.io.to(player.id).emit('error_message', 'You cannot type the word or part of it in chat!');
          return;
        }
        // Send normal chat message
        this.broadcastUserMessage(player, cleanText);
        return;
      }

      // If player already guessed, their messages are only visible to other players who guessed and the drawer
      if (player.hasGuessed) {
        this.broadcastGuessedChatMessage(player, cleanText);
        return;
      }

      // Player hasn't guessed yet, process guess
      const result = this.game.handleGuess(player, cleanText);
      if (result.status === 'correct') {
        // Handled in onPlayerGuessed callback
        return;
      } else if (result.status === 'close') {
        // Handled in onCloseGuess callback
        return;
      }
    }

    // Normal chat message
    this.broadcastUserMessage(player, cleanText);
  }

  private broadcastUserMessage(player: Player, text: string) {
    const msg: ChatMessage = {
      id: Math.random().toString(36).substring(2, 9),
      senderId: player.id,
      senderName: player.name,
      text,
      type: 'chat',
      timestamp: Date.now()
    };
    this.chatHistory.push(msg);
    if (this.chatHistory.length > 100) this.chatHistory.shift();
    this.io.to(this.id).emit('chat_message', msg);
  }

  private broadcastGuessedChatMessage(player: Player, text: string) {
    const msg: ChatMessage = {
      id: Math.random().toString(36).substring(2, 9),
      senderId: player.id,
      senderName: player.name,
      text,
      type: 'chat',
      timestamp: Date.now()
    };

    // Send only to drawer and players who also guessed
    for (const [pid, p] of this.players) {
      if (pid === this.game.currentDrawerId || p.hasGuessed) {
        this.io.to(pid).emit('chat_message', msg);
      }
    }
  }

  public broadcastSystemMessage(text: string) {
    const msg: ChatMessage = {
      id: Math.random().toString(36).substring(2, 9),
      text,
      type: 'system',
      timestamp: Date.now()
    };
    this.chatHistory.push(msg);
    if (this.chatHistory.length > 100) this.chatHistory.shift();
    this.io.to(this.id).emit('chat_message', msg);
  }

  public getPlayerList(): PlayerData[] {
    return Array.from(this.players.values()).map(p => p.toJSON());
  }

  public broadcastPlayerList() {
    this.io.to(this.id).emit('player_list', this.getPlayerList());
  }

  public syncRoomState(socket: Socket, playerId: string) {
    const player = this.players.get(playerId);
    const isDrawer = this.game.currentDrawerId === playerId;

    socket.emit('room_joined', {
      roomId: this.id,
      playerId,
      hostId: this.hostId,
      settings: this.settings,
      players: this.getPlayerList(),
      phase: this.game.phase,
      currentRound: this.game.currentRound,
      totalRounds: this.game.totalRounds,
      drawerId: this.game.currentDrawerId,
      word: isDrawer || player?.hasGuessed || this.game.phase === 'ROUND_END' || this.game.phase === 'GAME_OVER'
        ? this.game.currentWord
        : this.game.getMaskedWord(),
      timeLeft: this.game.timeLeft,
      strokes: this.game.strokes,
      chatHistory: this.chatHistory.slice(-50)
    });
  }

  public kickPlayer(hostId: string, targetId: string): boolean {
    if (this.hostId !== hostId || targetId === hostId) return false;
    const targetSocket = this.io.sockets.sockets.get(targetId);
    if (targetSocket) {
      targetSocket.emit('kicked', 'You were removed from the room by the host.');
      targetSocket.leave(this.id);
    }
    this.removePlayer(targetId);
    return true;
  }

  public destroy() {
    this.game.destroy();
    this.players.clear();
    this.chatHistory = [];
  }
}
