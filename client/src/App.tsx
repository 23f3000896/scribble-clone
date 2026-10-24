import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { 
  PlayerData, 
  RoomSettings, 
  GamePhase, 
  DrawStroke, 
  ChatMessage, 
  RoundResultData, 
  GameOverData, 
  AvatarData 
} from './types';
import { sounds } from './audio';
import { Home } from './components/Home';
import { Lobby } from './components/Lobby';
import { Header } from './components/Header';
import { Canvas } from './components/Canvas';
import { ChatBox } from './components/ChatBox';
import { PlayerList } from './components/PlayerList';
import { WordModal } from './components/WordModal';
import { RoundEndModal } from './components/RoundEndModal';
import { GameOverModal } from './components/GameOverModal';

export const App: React.FC = () => {
  const socketRef = useRef<Socket | null>(null);

  // Connection & Room state
  const [connected, setConnected] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [roomId, setRoomId] = useState<string | null>(null);
  const [hostId, setHostId] = useState<string>('');
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [phase, setPhase] = useState<GamePhase>('LOBBY');
  const [settings, setSettings] = useState<RoomSettings>({
    maxPlayers: 8,
    rounds: 3,
    drawTime: 80,
    wordCount: 3,
    hintsCount: 2,
    category: 'All',
    customWords: [],
    isPrivate: false
  });

  // Gameplay state
  const [round, setRound] = useState(1);
  const [totalRounds, setTotalRounds] = useState(3);
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [drawerName, setDrawerName] = useState<string>('');
  const [word, setWord] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [strokes, setStrokes] = useState<DrawStroke[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [wordOptions, setWordOptions] = useState<string[]>([]);
  const [roundResult, setRoundResult] = useState<RoundResultData | null>(null);
  const [gameOverData, setGameOverData] = useState<GameOverData | null>(null);
  const [closeNotification, setCloseNotification] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Extract initial room code from URL ?room=ABC123
  const [urlRoomCode, setUrlRoomCode] = useState<string>('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('room');
    if (code) {
      setUrlRoomCode(code.toUpperCase());
    }

    // Connect socket
    // In dev: proxy handles /socket.io -> localhost:4000
    // In prod: connects directly to same origin
    const socket = io({
      transports: ['websocket', 'polling']
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      setCurrentUserId(socket.id || '');
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('error_message', (msg: string) => {
      setErrorMessage(msg);
      setTimeout(() => setErrorMessage(''), 4000);
    });

    socket.on('room_joined', (data: any) => {
      setRoomId(data.roomId);
      setCurrentUserId(data.playerId);
      setHostId(data.hostId);
      setSettings(data.settings);
      setPlayers(data.players);
      setPhase(data.phase);
      setRound(data.currentRound);
      setTotalRounds(data.totalRounds);
      setDrawerId(data.drawerId);
      setWord(data.word || '');
      setTimeLeft(data.timeLeft || 0);
      setStrokes(data.strokes || []);
      setMessages(data.chatHistory || []);
      setRoundResult(null);
      setGameOverData(null);
      setWordOptions([]);

      // Update URL query parameter without page reload
      const url = new URL(window.location.href);
      url.searchParams.set('room', data.roomId);
      window.history.replaceState({}, '', url.toString());
    });

    socket.on('player_list', (list: PlayerData[]) => {
      setPlayers(list);
    });

    socket.on('settings_updated', (newSettings: RoomSettings) => {
      setSettings(newSettings);
      setTotalRounds(newSettings.rounds);
    });

    socket.on('game_phase', (data: { phase: GamePhase; round: number; totalRounds: number; drawerId: string | null }) => {
      setPhase(data.phase);
      setRound(data.round);
      setTotalRounds(data.totalRounds);
      setDrawerId(data.drawerId);
      if (data.phase === 'DRAWING') {
        sounds.playRoundStart();
        setRoundResult(null);
      }
    });

    socket.on('timer_tick', (data: { timeLeft: number }) => {
      setTimeLeft(data.timeLeft);
      if (data.timeLeft <= 5 && data.timeLeft > 0) {
        sounds.playTick();
      }
    });

    socket.on('word_options', (data: { words: string[] }) => {
      setWordOptions(data.words);
    });

    socket.on('drawer_choosing', (data: { drawerId: string; drawerName: string }) => {
      setDrawerId(data.drawerId);
      setDrawerName(data.drawerName);
      setStrokes([]);
      setRoundResult(null);
    });

    socket.on('round_started', (data: { drawerId: string; drawerName: string; word: string; isDrawer: boolean; drawTime: number }) => {
      setDrawerId(data.drawerId);
      setDrawerName(data.drawerName);
      setWord(data.word);
      setTimeLeft(data.drawTime);
      setWordOptions([]);
      setStrokes([]);
      setRoundResult(null);
    });

    socket.on('hint_updated', (data: { hint: string }) => {
      setWord(data.hint);
    });

    socket.on('guess_success', (data: { word: string; points: number }) => {
      setWord(data.word);
      sounds.playCorrect();
    });

    socket.on('close_guess', () => {
      sounds.playClose();
      setCloseNotification(true);
      setTimeout(() => setCloseNotification(false), 2500);
    });

    socket.on('draw_stroke', (stroke: DrawStroke) => {
      setStrokes(prev => [...prev, stroke]);
    });

    socket.on('draw_undo', () => {
      setStrokes(prev => prev.slice(0, -1));
    });

    socket.on('draw_clear', () => {
      setStrokes([]);
    });

    socket.on('chat_message', (msg: ChatMessage) => {
      setMessages(prev => [...prev, msg]);
    });

    socket.on('round_ended', (data: RoundResultData) => {
      setRoundResult(data);
    });

    socket.on('game_over', (data: GameOverData) => {
      setGameOverData(data);
    });

    socket.on('returned_to_lobby', (data: any) => {
      setPhase('LOBBY');
      setSettings(data.settings);
      setPlayers(data.players);
      setStrokes([]);
      setRoundResult(null);
      setGameOverData(null);
      setWordOptions([]);
    });

    socket.on('kicked', (reason: string) => {
      alert(reason || 'You were kicked from the room.');
      handleLeaveRoom();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Home actions
  const handleJoinPublic = (name: string, avatar: AvatarData) => {
    socketRef.current?.emit('join_public', { playerName: name, avatar });
  };

  const handleCreatePrivate = (name: string, avatar: AvatarData) => {
    socketRef.current?.emit('create_room', {
      hostName: name,
      avatar,
      settings: { isPrivate: true }
    });
  };

  const handleJoinCode = (code: string, name: string, avatar: AvatarData) => {
    socketRef.current?.emit('join_room', {
      roomId: code,
      playerName: name,
      avatar
    });
  };

  // Lobby actions
  const handleStartGame = () => {
    socketRef.current?.emit('start_game');
  };

  const handleUpdateSettings = (newSettings: Partial<RoomSettings>) => {
    socketRef.current?.emit('update_settings', newSettings);
  };

  const handleToggleReady = () => {
    socketRef.current?.emit('toggle_ready');
  };

  const handleLeaveRoom = () => {
    setRoomId(null);
    setPhase('LOBBY');
    setMessages([]);
    setStrokes([]);
    const url = new URL(window.location.href);
    url.searchParams.delete('room');
    window.history.replaceState({}, '', url.toString());
    window.location.reload();
  };

  // Game actions
  const handleSelectWord = (selectedWord: string) => {
    socketRef.current?.emit('choose_word', { word: selectedWord });
    setWordOptions([]);
  };

  const handleEmitStroke = (stroke: DrawStroke) => {
    socketRef.current?.emit('draw_stroke', stroke);
  };

  const handleEmitUndo = () => {
    socketRef.current?.emit('draw_undo');
  };

  const handleEmitClear = () => {
    socketRef.current?.emit('draw_clear');
  };

  const handleSendMessage = (text: string) => {
    socketRef.current?.emit('chat_message', { text });
  };

  const handleReturnToLobby = () => {
    socketRef.current?.emit('return_to_lobby');
  };

  const handleKickPlayer = (targetId: string) => {
    socketRef.current?.emit('kick_player', { targetId });
  };

  // Current player derived states
  const isHost = hostId === currentUserId;
  const isDrawer = drawerId === currentUserId;
  const me = players.find(p => p.id === currentUserId);
  const hasGuessed = me?.hasGuessed ?? false;

  // View: Not in a room -> Home screen
  if (!roomId) {
    return (
      <Home
        onJoinPublic={handleJoinPublic}
        onCreatePrivate={handleCreatePrivate}
        onJoinCode={handleJoinCode}
        initialRoomCode={urlRoomCode}
        errorMessage={errorMessage}
      />
    );
  }

  // View: In Lobby
  if (phase === 'LOBBY') {
    return (
      <div className="min-h-screen py-6 px-4">
        <Lobby
          roomId={roomId}
          players={players}
          settings={settings}
          currentUserId={currentUserId}
          isHost={isHost}
          onStartGame={handleStartGame}
          onUpdateSettings={handleUpdateSettings}
          onToggleReady={handleToggleReady}
          onLeaveRoom={handleLeaveRoom}
        />
      </div>
    );
  }

  // View: In Active Game (Selecting, Drawing, Round End, Game Over)
  return (
    <div className="flex flex-col h-screen max-h-screen p-2 sm:p-4 gap-2 sm:gap-3 overflow-hidden select-none">
      {/* Top Header */}
      <Header
        roomId={roomId}
        round={round}
        totalRounds={totalRounds}
        timeLeft={timeLeft}
        word={word}
        isDrawer={isDrawer}
        hasGuessed={hasGuessed}
        drawerName={drawerName}
      />

      {/* Main Game Layout: Player List | Canvas | Chat */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-2 sm:gap-3 min-h-0 overflow-hidden">
        {/* Left Column: Player Leaderboard */}
        <div className="hidden md:block md:col-span-3 lg:col-span-2 h-full min-h-0">
          <PlayerList
            players={players}
            currentDrawerId={drawerId}
            currentUserId={currentUserId}
            isHost={isHost}
            onKickPlayer={handleKickPlayer}
          />
        </div>

        {/* Center Column: HTML5 Drawing Canvas */}
        <div className="col-span-1 md:col-span-6 lg:col-span-7 h-full min-h-0 flex flex-col">
          <Canvas
            isDrawer={isDrawer && phase === 'DRAWING'}
            strokes={strokes}
            onEmitStroke={handleEmitStroke}
            onEmitUndo={handleEmitUndo}
            onEmitClear={handleEmitClear}
          />
        </div>

        {/* Right Column: Chat & Guesses */}
        <div className="col-span-1 md:col-span-3 lg:col-span-3 h-full min-h-0">
          <ChatBox
            messages={messages}
            onSendMessage={handleSendMessage}
            isDrawer={isDrawer}
            hasGuessed={hasGuessed}
            isDrawingPhase={phase === 'DRAWING'}
            closeNotification={closeNotification}
          />
        </div>
      </div>

      {/* Word Selection Modal (Shown only to the drawer) */}
      {phase === 'SELECTING_WORD' && isDrawer && wordOptions.length > 0 && (
        <WordModal
          words={wordOptions}
          timeLeft={timeLeft}
          onSelectWord={handleSelectWord}
        />
      )}

      {/* Round End Modal */}
      {phase === 'ROUND_END' && roundResult && (
        <RoundEndModal data={roundResult} />
      )}

      {/* Game Over Modal */}
      {phase === 'GAME_OVER' && gameOverData && (
        <GameOverModal
          data={gameOverData}
          isHost={isHost}
          onReturnToLobby={handleReturnToLobby}
        />
      )}
    </div>
  );
};
