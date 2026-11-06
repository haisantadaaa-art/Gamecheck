import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Lobby } from './components/Lobby';
import { AuthModal } from './components/AuthModal';
import { RegistrationModal } from './components/RegistrationModal';
import { CreateRoomModal } from './components/CreateRoomModal';
import { DailyRewardModal } from './components/DailyRewardModal';
import { LiveVoiceModal } from './components/LiveVoiceModal';
import { TrendingNewsModal } from './components/TrendingNewsModal';
import { VercelDeployGuideModal } from './components/VercelDeployGuideModal';
import { FriendsAndTransferModal } from './components/FriendsAndTransferModal';
import { CommunityFeedModal } from './components/CommunityFeedModal';
import { RoomChat } from './components/RoomChat';

// 6 Interactive Games
import { CaroGame } from './components/games/CaroGame';
import { BauCuaGame } from './components/games/BauCuaGame';
import { TienLenGame } from './components/games/TienLenGame';
import { CaNguaGame } from './components/games/CaNguaGame';
import { OAnQuanGame } from './components/games/OAnQuanGame';
import { TriviaGame } from './components/games/TriviaGame';

import { GameRoom, GameType, RoomPlayer, ChatMessage } from './types';
import { gameSocket } from './services/socket';
import { soundManager } from './services/audio';
import { Home, Users, MessageSquare, Gift, PlusCircle, User, Bot, Play } from 'lucide-react';

function GamePlatform() {
  const { user, isRegistered } = useAuth();

  // Modals state
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false);
  const [isDailyOpen, setIsDailyOpen] = useState(false);
  const [isLiveVoiceOpen, setIsLiveVoiceOpen] = useState(false);
  const [isTrendingOpen, setIsTrendingOpen] = useState(false);
  const [isDeployGuideOpen, setIsDeployGuideOpen] = useState(false);
  const [isFriendsOpen, setIsFriendsOpen] = useState(false);
  const [isCommunityOpen, setIsCommunityOpen] = useState(false);

  // Active Game Room State
  const [currentRoom, setCurrentRoom] = useState<GameRoom | null>(null);
  const [roomMessages, setRoomMessages] = useState<ChatMessage[]>([]);
  const [activeRoomsList, setActiveRoomsList] = useState<any[]>([]);

  // Socket sync
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

    const unsubRoomList = gameSocket.on('room_list', (data) => {
      if (data.rooms) setActiveRoomsList(data.rooms);
    });

    const unsubLeft = gameSocket.on('room_left', () => {
      setCurrentRoom(null);
      setRoomMessages([]);
    });

    const unsubChat = gameSocket.on('chat_message', (data) => {
      setRoomMessages((prev) => [...prev, data.message]);
    });

    const unsubError = gameSocket.on('error', (data) => {
      alert(data.message || 'Có lỗi xảy ra khi vào phòng chơi!');
    });

    return () => {
      unsubCreated();
      unsubJoined();
      unsubUpdated();
      unsubRoomList();
      unsubLeft();
      unsubChat();
      unsubError();
    };
  }, []);

  // Quick Play handler
  const handleQuickPlay = (gameType: GameType) => {
    soundManager.playClick();
    if (!isRegistered) {
      return; // Registration modal will appear
    }

    const player: RoomPlayer = {
      id: user?.id || 'guest',
      username: user?.username || 'Hiệp Khách',
      avatar: user?.avatar || '🐉',
      isHost: true,
      isReady: true,
    };

    const maxP = gameType === 'caro' || gameType === 'oanquan' ? 2 : gameType === 'baucua' ? 8 : 4;
    const dummyRoom: GameRoom = {
      id: 'room_' + Date.now(),
      code: Math.floor(1000 + Math.random() * 9000).toString(),
      name: `Đấu Trường ${gameType.toUpperCase()} - Huỳnh Âu`,
      gameType,
      maxPlayers: maxP,
      players: [player],
      status: 'playing',
      hostId: player.id,
      isPrivate: false,
      stakes: 1000,
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

  // Create custom room
  const handleCreateRoom = (params: {
    name: string;
    gameType: GameType;
    maxPlayers: number;
    isPrivate: boolean;
    stakes?: number;
  }) => {
    if (!isRegistered) return;

    const player: RoomPlayer = {
      id: user?.id || 'guest',
      username: user?.username || 'Hiệp Khách',
      avatar: user?.avatar || '🐉',
      isHost: true,
      isReady: true,
    };

    gameSocket.createRoom({
      ...params,
      player,
    });

    const instantRoom: GameRoom = {
      id: 'room_' + Date.now(),
      code: Math.floor(1000 + Math.random() * 9000).toString(),
      name: params.name,
      gameType: params.gameType,
      maxPlayers: params.maxPlayers,
      players: [player],
      status: 'playing',
      hostId: player.id,
      isPrivate: params.isPrivate,
      stakes: params.stakes || 1000,
      gameState: null,
      createdAt: Date.now(),
    };
    setCurrentRoom(instantRoom);
  };

  // Join Room by Code (Sanitized & Instant)
  const handleJoinRoomByCode = (code: string) => {
    if (!isRegistered) {
      alert('Vui lòng tạo tài khoản hiệp khách trước khi vào phòng chơi!');
      return;
    }

    const cleanCode = (code || '').toString().trim().replace(/^[#\s]+/, '');
    if (!cleanCode) {
      alert('Vui lòng nhập mã phòng hợp lệ!');
      return;
    }

    soundManager.playClick();

    const player: RoomPlayer = {
      id: user?.id || 'guest',
      username: user?.username || 'Hiệp Khách',
      avatar: user?.avatar || '🐉',
      isHost: false,
      isReady: true,
    };

    // Pre-check if matching an existing room in activeRoomsList or featured list
    const foundRoom = activeRoomsList.find(
      (r) => r.code?.toLowerCase() === cleanCode.toLowerCase() || r.id === cleanCode
    );

    gameSocket.joinRoom({
      roomCode: cleanCode,
      player,
    });

    if (foundRoom) {
      const optRoom: GameRoom = {
        id: foundRoom.id,
        code: foundRoom.code,
        name: foundRoom.name,
        gameType: foundRoom.gameType,
        maxPlayers: foundRoom.maxPlayers,
        players: [{ ...player, isHost: false, isReady: true }],
        status: 'playing',
        hostId: 'host',
        isPrivate: false,
        stakes: foundRoom.stakes || 1000,
        gameState: null,
        createdAt: Date.now(),
      };
      setCurrentRoom(optRoom);
    }
  };

  // Add Bot to current room
  const handleAddBotToRoom = () => {
    soundManager.playClick();
    if (!currentRoom) return;

    if (currentRoom.players.length >= currentRoom.maxPlayers) {
      alert('Phòng đã đầy người chơi!');
      return;
    }

    const botNames = ['Bot Huỳnh Âu', 'Kỳ Thủ Sài Gòn', 'Chiến Binh Hà Nội', 'Thần Bài Cần Thơ', 'Đại Gia Bầu Cua'];
    const botAvatars = ['🤖', '⚡', '🐉', '👑', '🔥'];
    const rand = Math.floor(Math.random() * botNames.length);

    const newBot: RoomPlayer = {
      id: 'bot_' + Math.random().toString(36).substring(2, 7),
      username: botNames[rand] + ' (AI)',
      avatar: botAvatars[rand],
      isHost: false,
      isReady: true,
      isBot: true,
    };

    const updatedPlayers = [...currentRoom.players, newBot];
    setCurrentRoom({
      ...currentRoom,
      players: updatedPlayers,
    });

    gameSocket.send('add_bot', { roomId: currentRoom.id });
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

  // Send Chat Message
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

  // Invite Friend
  const handleInviteFriend = (friendName: string) => {
    if (currentRoom) {
      alert(`Đã gửi lời mời tham gia phòng #${currentRoom.code} đến ${friendName}!`);
    } else {
      alert(`Hãy tạo phòng hoặc vào bàn trước để mời ${friendName} chơi cùng!`);
    }
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
      {/* Mandatory Account Registration Modal */}
      <RegistrationModal />

      {/* Top Navigation Bar */}
      <Navbar
        onOpenLiveVoice={() => setIsLiveVoiceOpen(true)}
        onOpenTrending={() => setIsTrendingOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenDaily={() => setIsDailyOpen(true)}
        onOpenDeployGuide={() => setIsDeployGuideOpen(true)}
        onOpenFriends={() => setIsFriendsOpen(true)}
        onOpenCommunity={() => setIsCommunityOpen(true)}
        onCreateRoomClick={() => setIsCreateRoomOpen(true)}
        currentRoomCode={currentRoom?.code}
        onLeaveRoom={handleLeaveRoom}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-5 pb-20 sm:pb-6">
        {currentRoom ? (
          <div className="space-y-4">
            {/* Active Room Sub-Header with Add Bot & Leave buttons */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
              <div className="flex items-center gap-3">
                <span className="text-2xl">
                  {currentRoom.gameType === 'caro'
                    ? '⭕'
                    : currentRoom.gameType === 'baucua'
                    ? '🎲'
                    : currentRoom.gameType === 'tienlen'
                    ? '🃏'
                    : currentRoom.gameType === 'cangua'
                    ? '🐴'
                    : currentRoom.gameType === 'oanquan'
                    ? '🪨'
                    : '🏆'}
                </span>
                <div>
                  <h2 className="text-sm font-black text-white">{currentRoom.name}</h2>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <span>
                      Mã phòng: <b className="text-amber-400 font-mono">#{currentRoom.code}</b>
                    </span>
                    <span>•</span>
                    <span>
                      Người chơi: {currentRoom.players.length}/{currentRoom.maxPlayers}
                    </span>
                    <span>•</span>
                    <span className="text-emerald-400 font-semibold">🪙 {currentRoom.stakes || 1000} Xu</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {currentRoom.players.length < currentRoom.maxPlayers && (
                  <button
                    onClick={handleAddBotToRoom}
                    className="px-3 py-1.5 rounded-xl bg-violet-600/30 hover:bg-violet-600/50 border border-violet-500/40 text-violet-300 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    title="Thêm Bot thông minh vào chơi cùng khi thiếu người"
                  >
                    <Bot className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">+ Thêm Bot</span>
                  </button>
                )}

                <button
                  onClick={handleLeaveRoom}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
                >
                  Rời Bàn
                </button>
              </div>
            </div>

            {/* 6 Interactive Games Rendering */}
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
            {currentRoom.gameType === 'oanquan' && (
              <OAnQuanGame room={currentRoom} currentPlayer={currentPlayer} onLeave={handleLeaveRoom} />
            )}
            {currentRoom.gameType === 'trivia' && (
              <TriviaGame room={currentRoom} currentPlayer={currentPlayer} onLeave={handleLeaveRoom} />
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
            onOpenFriends={() => setIsFriendsOpen(true)}
            onOpenCommunity={() => setIsCommunityOpen(true)}
            onOpenDaily={() => setIsDailyOpen(true)}
            roomList={activeRoomsList}
          />
        )}
      </main>

      {/* Mobile Bottom Dock Navigation (Smooth on Phones) */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 px-3 py-2 flex items-center justify-around shadow-2xl">
        <button
          onClick={() => {
            soundManager.playClick();
            if (currentRoom) handleLeaveRoom();
          }}
          className="flex flex-col items-center text-[10px] text-amber-400 font-bold"
        >
          <Home className="w-4 h-4 mb-0.5" />
          <span>Sảnh</span>
        </button>
        <button
          onClick={() => {
            soundManager.playClick();
            setIsCreateRoomOpen(true);
          }}
          className="flex flex-col items-center text-[10px] text-slate-400 hover:text-white"
        >
          <PlusCircle className="w-4 h-4 mb-0.5 text-amber-500" />
          <span>Tạo Bàn</span>
        </button>
        <button
          onClick={() => {
            soundManager.playClick();
            setIsFriendsOpen(true);
          }}
          className="flex flex-col items-center text-[10px] text-slate-400 hover:text-white"
        >
          <Users className="w-4 h-4 mb-0.5 text-emerald-400" />
          <span>Bạn Bè</span>
        </button>
        <button
          onClick={() => {
            soundManager.playClick();
            setIsCommunityOpen(true);
          }}
          className="flex flex-col items-center text-[10px] text-slate-400 hover:text-white"
        >
          <MessageSquare className="w-4 h-4 mb-0.5 text-blue-400" />
          <span>Cộng Đồng</span>
        </button>
        <button
          onClick={() => {
            soundManager.playClick();
            setIsDailyOpen(true);
          }}
          className="flex flex-col items-center text-[10px] text-slate-400 hover:text-white"
        >
          <Gift className="w-4 h-4 mb-0.5 text-orange-400" />
          <span>Quà Tặng</span>
        </button>
        <button
          onClick={() => {
            soundManager.playClick();
            setIsAuthOpen(true);
          }}
          className="flex flex-col items-center text-[10px] text-slate-400 hover:text-white"
        >
          <User className="w-4 h-4 mb-0.5 text-purple-400" />
          <span>Hồ Sơ</span>
        </button>
      </div>

      {/* Footer with Huỳnh Âu Developer Attribution */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-semibold text-slate-400">
            © 2026 VietPlay Arena - <span className="text-amber-400 font-bold">Game được lập trình bởi Huỳnh Âu</span>.
          </p>
          <div className="flex items-center gap-4 text-[11px]">
            <button onClick={() => setIsLiveVoiceOpen(true)} className="hover:text-amber-400 transition cursor-pointer">
              Live AI Master (Huỳnh Âu)
            </button>
            <button onClick={() => setIsTrendingOpen(true)} className="hover:text-amber-400 transition cursor-pointer">
              Bảng Tin eSports Google Search
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
      <LiveVoiceModal
        isOpen={isLiveVoiceOpen}
        onClose={() => setIsLiveVoiceOpen(false)}
        gameContext={currentRoom ? { gameType: currentRoom.gameType, stakes: currentRoom.stakes } : null}
      />
      <TrendingNewsModal isOpen={isTrendingOpen} onClose={() => setIsTrendingOpen(false)} />
      <VercelDeployGuideModal isOpen={isDeployGuideOpen} onClose={() => setIsDeployGuideOpen(false)} />
      <FriendsAndTransferModal
        isOpen={isFriendsOpen}
        onClose={() => setIsFriendsOpen(false)}
        onInviteFriend={handleInviteFriend}
      />
      <CommunityFeedModal isOpen={isCommunityOpen} onClose={() => setIsCommunityOpen(false)} />
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
