import React from 'react';
import { Volume2, VolumeX, Mic, Globe2, Sparkles, User, Github, Gift, PlusCircle, Users, MessageSquare, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { soundManager } from '../services/audio';

interface NavbarProps {
  onOpenLiveVoice: () => void;
  onOpenTrending: () => void;
  onOpenAuth: () => void;
  onOpenDaily: () => void;
  onOpenDeployGuide: () => void;
  onOpenFriends: () => void;
  onOpenCommunity: () => void;
  onCreateRoomClick: () => void;
  currentRoomCode?: string;
  onLeaveRoom?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenLiveVoice,
  onOpenTrending,
  onOpenAuth,
  onOpenDaily,
  onOpenDeployGuide,
  onOpenFriends,
  onOpenCommunity,
  onCreateRoomClick,
  currentRoomCode,
  onLeaveRoom,
}) => {
  const { user, soundEnabled, toggleSound, onlineSeconds, claimedMilestones, claimOnlineReward } = useAuth();

  const handleToggleSound = () => {
    soundManager.playClick();
    toggleSound();
    soundManager.setMuted(!soundEnabled);
  };

  // Next online milestone (180s = 3m, 600s = 10m, 1800s = 30m)
  const milestones = [
    { sec: 180, label: '3 phút', reward: 3000 },
    { sec: 600, label: '10 phút', reward: 10000 },
    { sec: 1800, label: '30 phút', reward: 30000 },
  ];
  const nextTarget = milestones.find((m) => !claimedMilestones.includes(m.sec));
  const canClaim = nextTarget && onlineSeconds >= nextTarget.sec;

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-slate-950/85 border-b border-amber-500/20 shadow-lg shadow-black/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2">
        {/* Brand Logo & Developer Attribution */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (currentRoomCode && onLeaveRoom) {
                if (window.confirm('Bạn có muốn rời phòng chơi hiện tại?')) {
                  onLeaveRoom();
                }
              }
            }}
            className="flex items-center gap-2.5 group text-left cursor-pointer"
          >
            <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 via-red-600 to-rose-700 p-0.5 shadow-md shadow-amber-500/25 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <span className="text-xl">🇻🇳</span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg sm:text-xl font-extrabold tracking-tight bg-gradient-to-r from-amber-400 via-orange-300 to-red-400 bg-clip-text text-transparent">
                  VietPlay
                </span>
                <span className="px-1.5 py-0.2 text-[9px] font-black uppercase tracking-wider rounded bg-red-600/30 text-red-400 border border-red-500/30">
                  Arena
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] font-bold text-amber-400/90 hidden xs:block truncate">
                🎮 Lập trình bởi Huỳnh Âu
              </p>
            </div>
          </button>
        </div>

        {/* Action Center */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Online Time Reward Tracker Pill */}
          {nextTarget && (
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900 border border-amber-500/30 text-xs">
              <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" />
              <span className="text-slate-300 font-mono text-[11px]">
                {formatTime(onlineSeconds)} / {formatTime(nextTarget.sec)}
              </span>
              {canClaim ? (
                <button
                  onClick={() => claimOnlineReward(nextTarget.sec, nextTarget.reward)}
                  className="px-2 py-0.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[10px] animate-bounce cursor-pointer shadow-sm"
                >
                  Nhận +{nextTarget.reward.toLocaleString()} Xu!
                </button>
              ) : (
                <span className="text-[10px] text-amber-400 font-semibold">(+{nextTarget.reward.toLocaleString()} Xu)</span>
              )}
            </div>
          )}

          {/* Quick Create Room */}
          {!currentRoomCode && (
            <button
              onClick={() => {
                soundManager.playClick();
                onCreateRoomClick();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold text-xs sm:text-sm shadow-md shadow-amber-500/20 transition cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Tạo Phòng</span>
            </button>
          )}

          {/* Friends & Coin Transfer */}
          <button
            onClick={() => {
              soundManager.playClick();
              onOpenFriends();
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 text-xs font-semibold transition cursor-pointer"
            title="Bạn bè & Chuyển Xu"
          >
            <Users className="w-4 h-4 text-emerald-400" />
            <span className="hidden md:inline">Bạn Bè</span>
          </button>

          {/* Community Feed */}
          <button
            onClick={() => {
              soundManager.playClick();
              onOpenCommunity();
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 text-xs font-semibold transition cursor-pointer"
            title="Cộng đồng trò chuyện & chia sẻ"
          >
            <MessageSquare className="w-4 h-4 text-blue-400" />
            <span className="hidden md:inline">Cộng Đồng</span>
          </button>

          {/* Gemini Live Voice AI Button */}
          <button
            onClick={() => {
              soundManager.playClick();
              onOpenLiveVoice();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-violet-600/30 to-fuchsia-600/30 hover:from-violet-600/50 hover:to-fuchsia-600/50 border border-violet-500/40 text-violet-300 text-xs sm:text-sm font-semibold transition cursor-pointer shadow-sm shadow-violet-500/20"
            title="Trợ lý bình luận viên giọng nói trực tiếp (Gemini Live & TTS)"
          >
            <Mic className="w-4 h-4 text-violet-400 animate-pulse" />
            <span className="hidden xl:inline">Live AI Master</span>
            <span className="px-1 py-0.2 text-[9px] bg-violet-500 text-white rounded font-bold uppercase">Live</span>
          </button>

          {/* Trending Games Search Grounding */}
          <button
            onClick={() => {
              soundManager.playClick();
              onOpenTrending();
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 text-xs font-semibold transition cursor-pointer"
            title="Tin game hot & eSports Việt Nam (Google Search Grounding)"
          >
            <Globe2 className="w-4 h-4 text-blue-400" />
            <span className="hidden 2xl:inline">Tin Hot</span>
          </button>

          {/* Daily Reward Spin */}
          <button
            onClick={() => {
              soundManager.playClick();
              onOpenDaily();
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 text-xs font-semibold transition cursor-pointer"
            title="Điểm danh nhận quà"
          >
            <Gift className="w-4 h-4 text-amber-400 animate-bounce" />
            <span className="hidden lg:inline">Quà Tặng</span>
          </button>

          {/* Sound Mute Toggle */}
          <button
            onClick={handleToggleSound}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          {/* User Profile / Coins */}
          {user ? (
            <button
              onClick={() => {
                soundManager.playClick();
                onOpenAuth();
              }}
              className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-900/90 border border-amber-500/30 hover:border-amber-500/60 transition cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-sm border border-slate-700">
                {user.avatar}
              </div>
              <div className="text-left hidden sm:block">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-slate-200 max-w-[80px] truncate">{user.username}</span>
                  <span className="text-[10px] text-amber-400 font-semibold">Lv.{user.level}</span>
                </div>
                <div className="text-[10px] font-bold text-amber-400 flex items-center gap-0.5">
                  <span>🪙</span>
                  <span>{user.coins.toLocaleString()}</span>
                </div>
              </div>
            </button>
          ) : (
            <button
              onClick={() => {
                soundManager.playClick();
                onOpenAuth();
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 hover:bg-amber-400 text-xs font-bold cursor-pointer"
            >
              <User className="w-4 h-4" />
              <span>Đăng Ký</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
