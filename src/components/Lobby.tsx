import React, { useState } from 'react';
import { Play, PlusCircle, Users, Trophy, Sparkles, Volume2, ShieldCheck, Flame, Globe2, Mic } from 'lucide-react';
import { GameType, GameRoom } from '../types';
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
    badge: 'Được chơi nhiều nhất',
    gradient: 'from-amber-600/30 via-red-900/20 to-slate-950',
    borderGlow: 'hover:border-amber-500/60',
  },
  {
    type: 'baucua',
    title: 'Bầu Cua Tôm Cá',
    tagline: 'Quốc dân dân gian! Lắc bát úp mở hồi hộp, cược vui nhận VietCoins bội phần.',
    icon: '🎲',
    playersLabel: '2-8 Người Cùng Bàn',
    badge: 'Hot Lễ Hội',
    gradient: 'from-rose-600/30 via-orange-900/20 to-slate-950',
    borderGlow: 'hover:border-rose-500/60',
  },
  {
    type: 'tienlen',
    title: 'Tiến Lên Miền Nam',
    tagline: '13 lá bài kịch tính, chặt heo, 3 đôi thông, tứ quý luật chuẩn Nam Bộ.',
    icon: '🃏',
    playersLabel: '2-4 Người Chơi',
    badge: 'Đấu Trí Chiến Thuật',
    gradient: 'from-emerald-600/30 via-teal-900/20 to-slate-950',
    borderGlow: 'hover:border-emerald-500/60',
  },
  {
    type: 'cangua',
    title: 'Cờ Cá Ngựa',
    tagline: 'Đổ xí ngầu xúc xắc, ra quân thần tốc, đá ngựa đối phương về đích.',
    icon: '🐴',
    playersLabel: '2-4 Người Chơi',
    badge: 'Ký Ức Tuổi Thơ',
    gradient: 'from-blue-600/30 via-indigo-900/20 to-slate-950',
    borderGlow: 'hover:border-blue-500/60',
  },
];

const LEADERBOARD_DATA = [
  { rank: 1, name: 'LạcLongQuân_VIP', avatar: '🐉', level: 28, coins: 890000, winRate: '78%' },
  { rank: 2, name: 'SơnTinh_BấtBại', avatar: '⚡', level: 25, coins: 640000, winRate: '75%' },
  { rank: 3, name: 'PhùĐổng_ThiênVương', avatar: '🔥', level: 22, coins: 510000, winRate: '71%' },
  { rank: 4, name: 'BáVương_CờCaro', avatar: '👑', level: 19, coins: 390000, winRate: '68%' },
  { rank: 5, name: 'Trùm_BầuCua_VN', avatar: '🎲', level: 17, coins: 310000, winRate: '65%' },
];

export const Lobby: React.FC<LobbyProps> = ({
  onQuickPlay,
  onCreateRoom,
  onJoinRoomByCode,
  onOpenLiveVoice,
  onOpenTrending,
  onOpenDeployGuide,
}) => {
  const { user } = useAuth();
  const [roomPin, setRoomPin] = useState('');
  const [isTtsTesting, setIsTtsTesting] = useState(false);
  const [activeVoicePhrase, setActiveVoicePhrase] = useState<string | null>(null);

  const handleJoinPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomPin.trim()) return;
    soundManager.playClick();
    onJoinRoomByCode(roomPin.trim());
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
    } catch (e) {
      console.warn('TTS sample error:', e);
    } finally {
      setIsTtsTesting(false);
      setActiveVoicePhrase(null);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-amber-950/40 border border-amber-500/30 p-6 sm:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider mb-4">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Cổng Game Nhiều Người Việt Nam Hiện Đại</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight mb-4">
            Thỏa Sức So Tài Cùng <br />
            <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-red-500 bg-clip-text text-transparent">
              Tuyệt Phẩm Game Dân Gian & Hot Nhất
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 mb-6 leading-relaxed">
            Đấu Cờ Caro 15x15 căng thẳng, lắc Bầu Cua Tôm Cá rộn ràng, chặt heo Tiến Lên Miền Nam đỉnh cao, và đua ngựa Cờ Cá Ngựa tuổi thơ. Tích hợp Bình Luận Viên ảo bằng giọng nói trực tiếp và tin tức game thời sự!
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                soundManager.playClick();
                onQuickPlay('caro');
              }}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/25 transition cursor-pointer flex items-center gap-2"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>Chơi Ngay Cờ Caro</span>
            </button>

            <button
              onClick={() => {
                soundManager.playClick();
                onCreateRoom();
              }}
              className="px-5 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-100 font-bold text-sm transition cursor-pointer flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4 text-amber-400" />
              <span>Tạo Bàn Chơi Mới</span>
            </button>

            {/* Quick PIN Join Form */}
            <form onSubmit={handleJoinPin} className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-2xl border border-slate-800">
              <input
                type="text"
                placeholder="Nhập mã phòng (ví dụ 1234)"
                value={roomPin}
                onChange={(e) => setRoomPin(e.target.value)}
                maxLength={6}
                className="w-44 px-3 py-2 bg-transparent text-slate-100 placeholder-slate-500 text-xs focus:outline-none"
              />
              <button
                type="submit"
                disabled={!roomPin.trim()}
                className="px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 font-bold text-xs border border-amber-500/30 transition cursor-pointer"
              >
                Vào Phòng
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* 4 Main Game Cards Grid */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <span>Đấu Trường Trò Chơi Nổi Bật</span>
              <Flame className="w-6 h-6 text-orange-500" />
            </h2>
            <p className="text-xs text-slate-400">Chọn tựa game bạn yêu thích để vào bàn chơi trực tuyến hoặc luyện tập cùng AI</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURED_GAMES.map((game) => (
            <div
              key={game.type}
              className={`p-5 rounded-3xl bg-gradient-to-b ${game.gradient} border border-slate-800 ${game.borderGlow} transition-all duration-300 shadow-xl flex flex-col justify-between group hover:-translate-y-1`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-4xl p-2.5 rounded-2xl bg-slate-950/60 border border-slate-800 shadow-inner group-hover:scale-110 transition-transform">
                    {game.icon}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    {game.badge}
                  </span>
                </div>

                <h3 className="text-lg font-black text-white group-hover:text-amber-400 transition-colors">
                  {game.title}
                </h3>

                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed min-h-[48px]">
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
                  <span>Chơi Ngay</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Feature Showcase: Gemini AI Announcer (TTS) & Google Search Trends */}
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
                <p className="text-xs text-slate-400">Nghe thử giọng đọc truyền cảm, dí dỏm bằng tiếng Việt của AI Master</p>
              </div>
            </div>

            <button
              onClick={onOpenLiveVoice}
              className="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
            >
              <span>Mở Live Voice</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-4">
            {[
              {
                title: 'Chào đón tân thủ',
                phrase: 'Chào mừng các hiệp khách đến với đấu trường VietPlay! Chúc các bạn có những phút giây so tài nghẹt thở!',
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
                title: 'Chặt Heo Tiến Lên',
                phrase: 'Bất ngờ chưa! Tứ quý xuất kích chặt đứt đôi heo cơ! Cú lật kèo ngoạn mục!',
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

        {/* Live Search Grounding Preview Banner */}
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-blue-500/30 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
                <Globe2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Tin Game Hot Việt Nam</h3>
                <p className="text-[11px] text-slate-400">Google Search Grounding (Gemini 3.8 Flash)</p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="font-bold text-blue-400 text-xs">🔥 eSports & Giải Đấu</div>
                <p className="text-[11px] text-slate-400 mt-0.5">Cập nhật tin tức ĐTDV Liên Quân, VCS LMHT và Meta hot nhất.</p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="font-bold text-amber-400 text-xs">🎮 Game Dân Gian Lên Ngôi</div>
                <p className="text-[11px] text-slate-400 mt-0.5">Cờ Caro và Bầu Cua tiếp tục thu hút hàng triệu game thủ mọi lứa tuổi.</p>
              </div>
            </div>
          </div>

          <button
            onClick={onOpenTrending}
            className="w-full mt-4 py-2.5 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/40 text-blue-300 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Globe2 className="w-3.5 h-3.5" />
            <span>Xem Toàn Bộ Bảng Tin Hot</span>
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

      {/* GitHub & Vercel Custom Domain Banner */}
      <section className="p-6 rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950/40 border border-emerald-500/30 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Sẵn Sàng Cho Tên Miền Riêng Của Bạn</span>
          </div>
          <h4 className="text-base font-bold text-white">Bạn đã có tên miền riêng? Đưa lên GitHub & Chạy trên Vercel ngay hôm nay</h4>
          <p className="text-xs text-slate-400 mt-0.5">Đầy đủ file vercel.json, Vite build siêu tốc, chứng chỉ SSL miễn phí và kết nối domain 1-click.</p>
        </div>

        <button
          onClick={onOpenDeployGuide}
          className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition cursor-pointer shadow-md whitespace-nowrap"
        >
          Xem Hướng Dẫn Triển Khai
        </button>
      </section>
    </div>
  );
};
