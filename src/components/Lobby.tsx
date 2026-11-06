import React, { useState } from 'react';
import { Play, PlusCircle, Users, Trophy, Sparkles, Volume2, Flame, Globe2, Mic, Clock, Gift, MessageSquare, ChevronRight, Swords } from 'lucide-react';
import { GameType } from '../types';
import { soundManager } from '../services/audio';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface LobbyProps {
  onQuickPlay: (gameType: GameType) => void;
  onCreateRoom: () => void;
  onJoinRoomByCode: (code: string) => void;
  onOpenLiveVoice: () => void;
  onOpenTrending: () => void;
  onOpenDeployGuide: () => void;
  onOpenFriends: () => void;
  onOpenCommunity: () => void;
  onOpenDaily: () => void;
  roomList?: Array<{
    id: string;
    code: string;
    name: string;
    gameType: GameType;
    playersCount: number;
    maxPlayers: number;
    status: string;
    stakes: number;
  }>;
}

const FEATURED_GAMES: Array<{
  type: GameType;
  title: string;
  tagline: string;
  icon: string;
  playersLabel: string;
  badge: string;
  gradient: string;
  borderGlow: string;
}> = [
  {
    type: 'caro',
    title: 'Cờ Caro Đấu Trí',
    tagline: '15x15 Gomoku kinh điển, chặn tam hiểm hóc & 5 quân thẳng hàng.',
    icon: '⭕',
    playersLabel: '1v1 Online & Bot AI',
    badge: '1v1 Cực Căng',
    gradient: 'from-amber-600/30 via-red-900/20 to-slate-950',
    borderGlow: 'hover:border-amber-500/60',
  },
  {
    type: 'baucua',
    title: 'Bầu Cua Tôm Cá',
    tagline: 'Quốc dân dân gian! Lắc bát úp mở hồi hộp, cược vui nhận VietCoins bội phần.',
    icon: '🎲',
    playersLabel: '2-8 Người Cùng Bàn',
    badge: 'Hot Nhất',
    gradient: 'from-rose-600/30 via-orange-900/20 to-slate-950',
    borderGlow: 'hover:border-rose-500/60',
  },
  {
    type: 'tienlen',
    title: 'Tiến Lên Miền Nam',
    tagline: '13 lá bài kịch tính, chặt heo, 3 đôi thông, tứ quý luật chuẩn Nam Bộ.',
    icon: '🃏',
    playersLabel: '2-4 Người Chơi',
    badge: 'Chiến Thuật Cao',
    gradient: 'from-emerald-600/30 via-teal-900/20 to-slate-950',
    borderGlow: 'hover:border-emerald-500/60',
  },
  {
    type: 'cangua',
    title: 'Cờ Cá Ngựa',
    tagline: 'Đổ xí ngầu xúc xắc, ra quân thần tốc, đá ngựa đối phương về đích.',
    icon: '🐴',
    playersLabel: '2-4 Người Chơi',
    badge: 'Tuổi Thơ Ký Ức',
    gradient: 'from-blue-600/30 via-indigo-900/20 to-slate-950',
    borderGlow: 'hover:border-blue-500/60',
  },
  {
    type: 'oanquan',
    title: 'Ô Ăn Quan Dân Gian',
    tagline: 'Đỉnh cao trí tuệ truyền thống: 10 ô dân, 2 ô quan, rải sỏi ăn trọn bàn.',
    icon: '🪨',
    playersLabel: '1v1 Đấu Trí & Bot',
    badge: 'Trí Tuệ Việt',
    gradient: 'from-yellow-600/30 via-amber-900/20 to-slate-950',
    borderGlow: 'hover:border-yellow-500/60',
  },
  {
    type: 'trivia',
    title: 'Vua Tiếng Việt & Đố Vui',
    icon: '🏆',
    tagline: 'Thử tài ca dao tục ngữ và văn hóa dân gian Việt Nam đếm ngược tốc độ.',
    playersLabel: '2-4 Người Chơi',
    badge: 'Đấu Trường Tri Thức',
    gradient: 'from-purple-600/30 via-pink-900/20 to-slate-950',
    borderGlow: 'hover:border-purple-500/60',
  },
];

const LEADERBOARD_DATA = [
  { rank: 1, name: 'Huỳnh Âu (Developer)', avatar: '👑', level: 99, coins: 2500000, winRate: '92%' },
  { rank: 2, name: 'LạcLongQuân_VIP', avatar: '🐉', level: 32, coins: 1190000, winRate: '81%' },
  { rank: 3, name: 'SơnTinh_BấtBại', avatar: '⚡', level: 27, coins: 780000, winRate: '76%' },
  { rank: 4, name: 'PhùĐổng_ThiênVương', avatar: '🔥', level: 24, coins: 620000, winRate: '72%' },
  { rank: 5, name: 'BáVương_CờCaro', avatar: '🦁', level: 20, coins: 490000, winRate: '69%' },
];

export const Lobby: React.FC<LobbyProps> = ({
  onQuickPlay,
  onCreateRoom,
  onJoinRoomByCode,
  onOpenLiveVoice,
  onOpenTrending,
  onOpenDeployGuide,
  onOpenFriends,
  onOpenCommunity,
  onOpenDaily,
  roomList = [],
}) => {
  const { user, onlineSeconds, claimedMilestones, claimOnlineReward } = useAuth();
  const [roomPin, setRoomPin] = useState('');
  const [isTtsTesting, setIsTtsTesting] = useState(false);
  const [activeVoicePhrase, setActiveVoicePhrase] = useState<string | null>(null);

  const handleJoinPin = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = roomPin.trim().replace(/^[#\s]+/, '');
    if (!clean) {
      alert('Vui lòng nhập mã phòng hợp lệ (ví dụ: 8888, 6666, 9999)');
      return;
    }
    soundManager.playClick();
    onJoinRoomByCode(clean);
  };

  const handlePlaySampleVoice = async (phrase: string) => {
    soundManager.playClick();
    if (isTtsTesting) return;
    setIsTtsTesting(true);
    setActiveVoicePhrase(phrase);
    try {
      const res = await api.textToSpeech(phrase, 'Hào hứng, sôi nổi, phong cách bình luận viên eSports Việt Nam', 'Puck');
      if (res.audioBase64) {
        await soundManager.playWavBase64(res.audioBase64);
      }
    } catch {
      // fallback
    } finally {
      setIsTtsTesting(false);
      setActiveVoicePhrase(null);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Hero Banner with Huỳnh Âu Attribution */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-amber-950/40 border border-amber-500/30 p-6 sm:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-red-600/20 border border-amber-500/40 text-amber-400 text-xs font-black uppercase tracking-wider mb-4 shadow-sm">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Game được lập trình bởi Huỳnh Âu</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight mb-4">
            Đấu Trường Game Việt <br />
            <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-red-500 bg-clip-text text-transparent">
              Nhiều Người Chơi & Trí Tuệ Dân Gian
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 mb-6 leading-relaxed">
            Hội tụ 6 tựa game đỉnh cao: Cờ Caro 15x15, Bầu Cua Tôm Cá, Tiến Lên Miền Nam, Cờ Cá Ngựa, Ô Ăn Quan và Vua Tiếng Việt. Tích hợp AI Game Master giọng nói trực tiếp, hệ thống kết bạn, chuyển tiền tặng Xu và điểm danh online nhận thưởng!
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                soundManager.playClick();
                onQuickPlay('baucua');
              }}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/25 transition cursor-pointer flex items-center gap-2"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>Chơi Nhanh Bầu Cua</span>
            </button>

            <button
              onClick={() => {
                soundManager.playClick();
                onCreateRoom();
              }}
              className="px-5 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-100 font-bold text-sm transition cursor-pointer flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4 text-amber-400" />
              <span>Tạo Phòng Mới</span>
            </button>

            {/* Quick PIN Join Form (Mobile Full-width friendly) */}
            <form onSubmit={handleJoinPin} className="w-full sm:w-auto flex items-center gap-1.5 bg-slate-950/90 p-1.5 rounded-2xl border border-amber-500/30 shadow-md">
              <span className="pl-2 text-amber-400 font-mono font-bold text-xs">#</span>
              <input
                type="text"
                placeholder="Mã phòng (ví dụ 8888)"
                value={roomPin}
                onChange={(e) => setRoomPin(e.target.value)}
                maxLength={8}
                className="flex-1 sm:w-44 px-2 py-2 bg-transparent text-slate-100 placeholder-slate-500 text-xs focus:outline-none font-semibold font-mono"
              />
              <button
                type="submit"
                disabled={!roomPin.trim()}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 disabled:opacity-40 text-slate-950 font-black text-xs transition cursor-pointer shadow-sm shrink-0"
              >
                Vào Bàn
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Online Duration Reward Tracker Bar */}
      <section className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-950 to-amber-950/30 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-xl">
            ⏱️
          </div>
          <div>
            <div className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1">
              <span>Thưởng Tích Lũy Thời Gian Online</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            </div>
            <p className="text-xs text-slate-300">
              Bạn đã online: <b className="font-mono text-white text-sm">{Math.floor(onlineSeconds / 60)} phút {onlineSeconds % 60}s</b>. Cứ mỗi mốc thời gian online nhận ngay hàng chục nghìn Xu!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {[
            { sec: 180, label: '3 Phút', reward: 3000 },
            { sec: 600, label: '10 Phút', reward: 10000 },
            { sec: 1800, label: '30 Phút', reward: 30000 },
          ].map((m) => {
            const isClaimed = claimedMilestones.includes(m.sec);
            const isReady = onlineSeconds >= m.sec;
            return (
              <button
                key={m.sec}
                onClick={() => isReady && !isClaimed && claimOnlineReward(m.sec, m.reward)}
                disabled={!isReady || isClaimed}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                  isClaimed
                    ? 'bg-slate-800 text-slate-500 opacity-60 cursor-not-allowed'
                    : isReady
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 animate-bounce shadow-md'
                    : 'bg-slate-950 border border-slate-800 text-slate-400'
                }`}
              >
                <span>{isClaimed ? '✓ Đã nhận' : `🎁 +${(m.reward / 1000)}k Xu`}</span>
                <span className="text-[10px] opacity-75">({m.label})</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 6 Featured Games Grid */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <span>Kho Trò Chơi Nổi Bật (6 Tựa Game)</span>
              <Flame className="w-6 h-6 text-orange-500" />
            </h2>
            <p className="text-xs text-slate-400">Tự động bổ sung Bot AI thông minh nếu phòng còn thiếu người chơi</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURED_GAMES.map((game) => (
            <div
              key={game.type}
              className={`p-5 rounded-3xl bg-gradient-to-b ${game.gradient} border border-slate-800 ${game.borderGlow} transition-all duration-300 shadow-xl flex flex-col justify-between group hover:-translate-y-1`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-4xl p-2.5 rounded-2xl bg-slate-950/70 border border-slate-800 shadow-inner group-hover:scale-110 transition-transform">
                    {game.icon}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    {game.badge}
                  </span>
                </div>

                <h3 className="text-lg font-black text-white group-hover:text-amber-400 transition-colors">
                  {game.title}
                </h3>

                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed min-h-[44px]">
                  {game.tagline}
                </p>

                <div className="text-[11px] text-slate-300 font-semibold mt-3 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-amber-400" />
                  <span>{game.playersLabel}</span>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-800/80 flex gap-2">
                <button
                  onClick={() => {
                    soundManager.playClick();
                    onQuickPlay(game.type);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-xs transition cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 fill-slate-950" />
                  <span>Vào Bàn Chơi</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Active Live Rooms List */}
      <section className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Swords className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-black text-white">Phòng Chơi Đang Mở (Ghép Nhanh)</h3>
          </div>
          <span className="text-xs text-slate-400">Tham gia phòng có sẵn hoặc so tài cùng cao thủ</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { code: '8888', name: '👑 Sảnh Vip Bầu Cua Huỳnh Âu', type: 'baucua' as GameType, players: '3/8', stakes: 1000 },
            { code: '6666', name: '⭕ Cờ Caro Giao Lưu 1v1', type: 'caro' as GameType, players: '1/2', stakes: 2000 },
            { code: '9999', name: '🃏 Tiến Lên Miền Nam Chặt Heo', type: 'tienlen' as GameType, players: '2/4', stakes: 5000 },
            { code: '5555', name: '🪨 Ô Ăn Quan Đấu Trí Dân Gian', type: 'oanquan' as GameType, players: '1/2', stakes: 1000 },
            { code: '7777', name: '🏆 Đấu Trường Vua Tiếng Việt', type: 'trivia' as GameType, players: '2/4', stakes: 1000 },
            { code: '3333', name: '🐴 Đua Cờ Cá Ngựa Sôi Động', type: 'cangua' as GameType, players: '2/4', stakes: 2000 },
          ].map((r) => (
            <div
              key={r.code}
              className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-mono font-bold text-amber-400">Mã: #{r.code}</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                    {r.players} người
                  </span>
                </div>
                <h4 className="font-bold text-sm text-slate-100 mb-1">{r.name}</h4>
                <div className="text-[11px] text-slate-400">Mức cược: 🪙 {r.stakes.toLocaleString()} Xu</div>
              </div>

              <button
                onClick={() => {
                  soundManager.playClick();
                  onJoinRoomByCode(r.code);
                }}
                className="mt-3 w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs border border-amber-500/30 transition flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>Vào Chơi Ngay</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Feature Showcase: Gemini AI Announcer & Google Search Grounding */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gemini 3.8 Flash TTS Voice Announcer Interactive Showcase */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900/90 border border-violet-500/30 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-violet-500/20 text-violet-400">
                <Mic className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Bình Luận Viên Giọng Nói AI (Gemini 3.8 Flash TTS)</h3>
                <p className="text-xs text-slate-400">Nghe thử giọng đọc truyền cảm, dí dỏm bằng tiếng Việt của AI Master Huỳnh Âu</p>
              </div>
            </div>

            <button
              onClick={onOpenLiveVoice}
              className="px-3.5 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
            >
              <span>Mở Live Voice</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-4">
            {[
              {
                title: 'Chào đón hiệp khách',
                phrase: 'Chào mừng các hiệp khách đến với VietPlay Arena được lập trình bởi Huỳnh Âu! Chúc anh em chơi vui thắng lớn!',
              },
              {
                title: 'Bình luận Cờ Caro',
                phrase: 'Một nước cờ chặn tam quá hiểm hóc! Thế trận đang đảo chiều ngoạn mục!',
              },
              {
                title: 'Mở bát Bầu Cua',
                phrase: 'Bầu Cua mở bát rồi anh em ơi! Hai Bầu một Tôm, đại gia thắng đậm!',
              },
              {
                title: 'Ăn Quan Dân Gian',
                phrase: 'Nước đi rải sỏi thần sầu! Ăn trọn cả ô quan lớn nhận điểm kỷ lục!',
              },
            ].map((item, idx) => (
              <button
                key={idx}
                onClick={() => handlePlaySampleVoice(item.phrase)}
                disabled={isTtsTesting}
                className={`p-3 rounded-2xl bg-slate-950 border text-left transition-all cursor-pointer ${
                  activeVoicePhrase === item.phrase
                    ? 'border-violet-500 bg-violet-950/40'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold text-violet-400 mb-1">
                  <span>{item.title}</span>
                  <Volume2 className={`w-3.5 h-3.5 ${activeVoicePhrase === item.phrase ? 'animate-pulse text-violet-300' : ''}`} />
                </div>
                <p className="text-[11px] text-slate-300 line-clamp-2 italic">"{item.phrase}"</p>
              </button>
            ))}
          </div>
        </div>

        {/* Real-time Search Grounding Banner */}
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-blue-500/30 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
                <Globe2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Bảng Tin Game Hot Việt Nam</h3>
                <p className="text-[11px] text-slate-400">Google Search Grounding (Gemini 3.8 Flash)</p>
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="font-bold text-blue-400 text-xs">🔥 eSports & Giải Đấu</div>
                <p className="text-[11px] text-slate-400 mt-0.5">Cập nhật tin tức ĐTDV Liên Quân, VCS LMHT và Meta hot nhất.</p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="font-bold text-amber-400 text-xs">🎮 Game Dân Gian Lên Ngôi</div>
                <p className="text-[11px] text-slate-400 mt-0.5">Cờ Caro, Bầu Cua và Ô Ăn Quan thu hút đông đảo người chơi.</p>
              </div>
            </div>
          </div>

          <button
            onClick={onOpenTrending}
            className="w-full mt-4 py-2.5 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/40 text-blue-300 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Globe2 className="w-3.5 h-3.5" />
            <span>Xem Chi Tiết Bảng Tin Hot</span>
          </button>
        </div>
      </section>

      {/* Leaderboard Table (Bảng Xếp Hạng Cao Thủ) */}
      <section className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-black text-white">Bảng Xếp Hạng Cao Thủ VietPlay</h3>
          </div>
          <span className="text-xs text-slate-400">Cập nhật liên tục theo ngày</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-slate-800">
                <th className="pb-3 font-semibold">Hạng</th>
                <th className="pb-3 font-semibold">Cao Thủ</th>
                <th className="pb-3 font-semibold">Cấp Độ</th>
                <th className="pb-3 font-semibold">VietCoins</th>
                <th className="pb-3 font-semibold text-right">Tỷ Lệ Thắng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {LEADERBOARD_DATA.map((player) => (
                <tr key={player.rank} className="hover:bg-slate-800/30 transition">
                  <td className="py-3">
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 rounded-lg font-bold text-xs ${
                        player.rank === 1
                          ? 'bg-amber-500 text-slate-950 font-black'
                          : player.rank === 2
                          ? 'bg-slate-300 text-slate-950 font-black'
                          : player.rank === 3
                          ? 'bg-amber-700 text-white font-black'
                          : 'text-slate-400'
                      }`}
                    >
                      {player.rank}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-2 font-bold text-slate-200">
                      <span className="text-lg">{player.avatar}</span>
                      <span>{player.name}</span>
                    </div>
                  </td>
                  <td className="py-3 text-blue-400 font-semibold">Lv.{player.level}</td>
                  <td className="py-3 text-amber-400 font-bold">🪙 {player.coins.toLocaleString()}</td>
                  <td className="py-3 text-right font-bold text-emerald-400">{player.winRate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  );
};
