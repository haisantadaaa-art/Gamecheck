import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Lobby } from './components/Lobby';
import { AuthModal } from './components/AuthModal';
import { CreateRoomModal } from './components/CreateRoomModal';
import { DailyRewardModal } from './components/DailyRewardModal';
import { LiveVoiceModal } from './components/LiveVoiceModal';
import { TrendingNewsModal } from './components/TrendingNewsModal';
import { VercelDeployGuideModal } from './components/VercelDeployGuideModal';
import { RoomChat } from './components/RoomChat';
import { CaroGame } from './components/games/CaroGame';
import { BauCuaGame } from './components/games/BauCuaGame';
import { TienLenGame } from './components/games/TienLenGame';
import { CaNguaGame } from './components/games/CaNguaGame';
import { GameRoom, GameType, RoomPlayer, ChatMessage } from './types';
import { gameSocket } from './services/socket';
import { soundManager } from './services/audio';

function GamePlatform() {
  const { user } = useAuth();

  // Modals state
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false);
  const [isDailyOpen, setIsDailyOpen] = useState(false);
  const [isLiveVoiceOpen, setIsLiveVoiceOpen] = useState(false);
  const [isTrendingOpen, setIsTrendingOpen] = useState(false);
  const [isDeployGuideOpen, setIsDeployGuideOpen] = useState(false);

  // Active Game Room State
  const [currentRoom, setCurrentRoom] = useState<GameRoom | null>(null);
  const [roomMessages, setRoomMessages] = useState<ChatMessage[]>([]);

  // Initialize socket connection
  useEffect(() => {
    gameSocket.connect();

    const unsubCreated = gameSocket.on('room_created', (data) => {
      setCurrentRoom(data.room);
    });

    const unsubJoined = gameSocket.on('room_joined', (data) => {
      setCurrentRoom(data.room);
    });

    const unsubUpdated = gameSocket.on('room_updated', (data) => {
      setCurrentRoom(data.room);
    });

    const unsubLeft = gameSocket.on('room_left', () => {
      setCurrentRoom(null);
      setRoomMessages([]);
    });

    const unsubChat = gameSocket.on('chat_message', (data) => {
      setRoomMessages((prev) => [...prev, data.message]);
    });

    return () => {
      unsubCreated();
      unsubJoined();
      unsubUpdated();
      unsubLeft();
      unsubChat();
    };
  }, []);

  // Quick play button
  const handleQuickPlay = (gameType: GameType) => {
    soundManager.playClick();
    if (!user) {
      setIsAuthOpen(true);
      return;
    }

    const player: RoomPlayer = {
      id: user.id,
      username: user.username,
      avatar: user.avatar,
      isHost: true,
      isReady: true,
    };

    // Auto create instant quick room
    const dummyRoom: GameRoom = {
      id: 'room_' + Date.now(),
      code: Math.floor(1000 + Math.random() * 9000).toString(),
      name: `Đấu Trường ${gameType.toUpperCase()}`,
      gameType,
      maxPlayers: gameType === 'caro' ? 2 : gameType === 'baucua' ? 8 : 4,
      players: [player],
      status: 'playing',
      hostId: user.id,
      isPrivate: false,
      gameState: null,
      createdAt: Date.now(),
    };

    setCurrentRoom(dummyRoom);
    gameSocket.createRoom({
      name: dummyRoom.name,
      gameType,
      maxPlayers: dummyRoom.maxPlayers,
      isPrivate: false,
      player,
    });
  };

  // Create Custom Room
  const handleCreateRoom = (params: { name: string; gameType: GameType; maxPlayers: number; isPrivate: boolean }) => {
    if (!user) {
      setIsAuthOpen(true);
      return;
    }

    const player: RoomPlayer = {
      id: user.id,
      username: user.username,
      avatar: user.avatar,
      isHost: true,
      isReady: true,
    };

    gameSocket.createRoom({
      ...params,
      player,
    });

    // Local instant room state
    const instantRoom: GameRoom = {
      id: 'room_' + Date.now(),
      code: Math.floor(1000 + Math.random() * 9000).toString(),
      name: params.name,
      gameType: params.gameType,
      maxPlayers: params.maxPlayers,
      players: [player],
      status: 'playing',
      hostId: user.id,
      isPrivate: params.isPrivate,
      gameState: null,
      createdAt: Date.now(),
    };
    setCurrentRoom(instantRoom);
  };

  // Join Room by 4-digit PIN code
  const handleJoinRoomByCode = (code: string) => {
    if (!user) {
      setIsAuthOpen(true);
      return;
    }

    const player: RoomPlayer = {
      id: user.id,
      username: user.username,
      avatar: user.avatar,
      isHost: false,
      isReady: true,
    };

    gameSocket.joinRoom({
      roomCode: code,
      player,
    });
  };

  // Leave active room
  const handleLeaveRoom = () => {
    soundManager.playClick();
    if (currentRoom && user) {
      gameSocket.leaveRoom({
        roomId: currentRoom.id,
        playerId: user.id,
      });
    }
    setCurrentRoom(null);
    setRoomMessages([]);
  };

  // Send in-game chat message
  const handleSendMessage = (text: string) => {
    if (!currentRoom || !user) return;
    const msg: ChatMessage = {
      id: 'msg_' + Date.now(),
      senderId: user.id,
      senderName: user.username,
      senderAvatar: user.avatar,
      text,
      timestamp: Date.now(),
    };
    setRoomMessages((prev) => [...prev, msg]);
    gameSocket.sendChat({
      roomId: currentRoom.id,
      message: msg,
    });
  };

  const currentPlayer: RoomPlayer = user
    ? {
        id: user.id,
        username: user.username,
        avatar: user.avatar,
        isHost: currentRoom ? currentRoom.hostId === user.id : true,
        isReady: true,
      }
    : {
        id: 'guest_me',
        username: 'ChiếnBinh',
        avatar: '🐉',
        isHost: true,
        isReady: true,
      };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Top Navigation */}
      <Navbar
        onOpenLiveVoice={() => setIsLiveVoiceOpen(true)}
        onOpenTrending={() => setIsTrendingOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenDaily={() => setIsDailyOpen(true)}
        onOpenDeployGuide={() => setIsDeployGuideOpen(true)}
        onCreateRoomClick={() => setIsCreateRoomOpen(true)}
        currentRoomCode={currentRoom?.code}
        onLeaveRoom={handleLeaveRoom}
      />

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-6">
        {currentRoom ? (
          <div className="space-y-4">
            {/* Active Room Sub-Header */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="flex items-center gap-3">
                <span className="text-xl">
                  {currentRoom.gameType === 'caro'
                    ? '⭕'
                    : currentRoom.gameType === 'baucua'
                    ? '🎲'
                    : currentRoom.gameType === 'tienlen'
                    ? '🃏'
                    : '🐴'}
                </span>
                <div>
                  <h2 className="text-sm font-black text-white">{currentRoom.name}</h2>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <span>Mã phòng: <b className="text-amber-400 font-mono">{currentRoom.code}</b></span>
                    <span>•</span>
                    <span>Số người: {currentRoom.players.length}/{currentRoom.maxPlayers}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleLeaveRoom}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
              >
                Rời Bàn Về Sảnh
              </button>
            </div>

            {/* Game Screen Rendering */}
            {currentRoom.gameType === 'caro' && (
              <CaroGame room={currentRoom} currentPlayer={currentPlayer} onLeave={handleLeaveRoom} />
            )}
            {currentRoom.gameType === 'baucua' && (
              <BauCuaGame room={currentRoom} currentPlayer={currentPlayer} onLeave={handleLeaveRoom} />
            )}
            {currentRoom.gameType === 'tienlen' && (
              <TienLenGame room={currentRoom} currentPlayer={currentPlayer} onLeave={handleLeaveRoom} />
            )}
            {currentRoom.gameType === 'cangua' && (
              <CaNguaGame room={currentRoom} currentPlayer={currentPlayer} onLeave={handleLeaveRoom} />
            )}

            {/* In-Game Live Chat Box */}
            <div className="max-w-4xl mx-auto h-48 mt-4">
              <RoomChat
                messages={roomMessages}
                onSendMessage={handleSendMessage}
                currentPlayerId={currentPlayer.id}
              />
            </div>
          </div>
        ) : (
          <Lobby
            onQuickPlay={handleQuickPlay}
            onCreateRoom={() => setIsCreateRoomOpen(true)}
            onJoinRoomByCode={handleJoinRoomByCode}
            onOpenLiveVoice={() => setIsLiveVoiceOpen(true)}
            onOpenTrending={() => setIsTrendingOpen(true)}
            onOpenDeployGuide={() => setIsDeployGuideOpen(true)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 VietPlay Arena - Đấu Trường Trò Chơi Trực Tuyến Việt Nam.</p>
          <div className="flex items-center gap-4 text-[11px]">
            <button onClick={() => setIsDeployGuideOpen(true)} className="hover:text-amber-400 transition cursor-pointer">
              Deploy Vercel & GitHub
            </button>
            <button onClick={() => setIsLiveVoiceOpen(true)} className="hover:text-amber-400 transition cursor-pointer">
              Gemini Live API
            </button>
            <button onClick={() => setIsTrendingOpen(true)} className="hover:text-amber-400 transition cursor-pointer">
              Google Search Grounding
            </button>
          </div>
        </div>
      </footer>

      {/* Global Modals */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      <CreateRoomModal
        isOpen={isCreateRoomOpen}
        onClose={() => setIsCreateRoomOpen(false)}
        onCreateRoom={handleCreateRoom}
      />
      <DailyRewardModal isOpen={isDailyOpen} onClose={() => setIsDailyOpen(false)} />
      <LiveVoiceModal isOpen={isLiveVoiceOpen} onClose={() => setIsLiveVoiceOpen(false)} />
      <TrendingNewsModal isOpen={isTrendingOpen} onClose={() => setIsTrendingOpen(false)} />
      <VercelDeployGuideModal isOpen={isDeployGuideOpen} onClose={() => setIsDeployGuideOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <GamePlatform />
    </AuthProvider>
  );
}
