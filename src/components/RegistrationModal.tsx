import React, { useState } from 'react';
import { Sparkles, Trophy, ShieldCheck, Flame, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { soundManager } from '../services/audio';

const AVATAR_LIST = [
  '🐉', '⚡', '🔥', '👑', '🦅', '🐯', '🦊', '🚀', '🥋', '🎯', '💎', '🎮', '🦄', '🦁', '🐺', '⚔️'
];

export const RegistrationModal: React.FC = () => {
  const { isRegistered, registerUser } = useAuth();
  const [nickname, setNickname] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('🐉');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);

  // If already registered, do not show
  if (isRegistered) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = nickname.trim() || `HiệpKhách_${Math.floor(1000 + Math.random() * 9000)}`;
    setLoading(true);
    soundManager.playClick();

    try {
      await registerUser(finalName, selectedAvatar, bio);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-gradient-to-b from-slate-900 via-slate-950 to-amber-950/40 border-2 border-amber-500/40 rounded-3xl shadow-2xl p-6 sm:p-8 text-center overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute -top-16 -left-16 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-red-600/20 rounded-full blur-3xl pointer-events-none"></div>

        {/* Developer Attribution Header */}
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-red-600/20 border border-amber-500/40 text-amber-400 text-xs font-bold uppercase tracking-wider mb-3">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Game được lập trình bởi Huỳnh Âu</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
          Khởi Tạo Hồ Sơ Hiệp Khách
        </h1>
        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
          Tạo tài khoản nhanh chóng để vào phòng đấu cùng bạn bè và nhận ngay gói quà tân thủ 50.000 Xu!
        </p>

        {/* Welcome Bonus Card */}
        <div className="my-5 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-left">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-2xl shadow-lg shadow-amber-500/30 animate-bounce">
              🎁
            </div>
            <div>
              <div className="text-xs font-black text-amber-400 uppercase tracking-wider">Quà Tân Thủ Huỳnh Âu</div>
              <div className="text-lg font-black text-white">+50.000 VietCoins</div>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black uppercase">
            Miễn Phí 100%
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {/* Avatar Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              1. Chọn Avatar Đại Diện
            </label>
            <div className="grid grid-cols-8 gap-1.5 p-2 bg-slate-950 rounded-2xl border border-slate-800 max-h-28 overflow-y-auto">
              {AVATAR_LIST.map((av) => (
                <button
                  key={av}
                  type="button"
                  onClick={() => {
                    soundManager.playClick();
                    setSelectedAvatar(av);
                  }}
                  className={`w-9 h-9 flex items-center justify-center rounded-xl text-lg transition-transform ${
                    selectedAvatar === av
                      ? 'bg-amber-500/30 border-2 border-amber-400 scale-110 shadow-md shadow-amber-500/20'
                      : 'bg-slate-900 hover:bg-slate-800'
                  }`}
                >
                  {av}
                </button>
              ))}
            </div>
          </div>

          {/* Nickname input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              2. Đặt Tên Nhân Vật Trong Game
            </label>
            <input
              type="text"
              required
              placeholder="Ví dụ: Rồng_Lửa_VN, Bé_Cá_Ngựa..."
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={20}
              className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 text-sm font-semibold"
            />
          </div>

          {/* Bio optional input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              3. Châm Ngôn Thi Đấu (Tùy chọn)
            </label>
            <input
              type="text"
              placeholder="Ví dụ: Đã chơi là phải thắng, giao lưu vui vẻ là chính!"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={60}
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 text-xs"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 hover:from-amber-400 hover:to-red-500 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/25 transition cursor-pointer flex items-center justify-center gap-2 mt-2"
          >
            <UserPlus className="w-5 h-5" />
            <span>Kích Hoạt Tài Khoản & Vào Chơi Game Ngay</span>
          </button>
        </form>

        <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-center gap-3 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Tài khoản lưu an toàn trên trình duyệt của bạn</span>
        </div>
      </div>
    </div>
  );
};
