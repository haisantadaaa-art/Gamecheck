import React, { useState } from 'react';
import { X, UserCheck, Sparkles, Shield, Trophy, Flame } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { soundManager } from '../services/audio';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AVATAR_OPTIONS = ['🐉', '⚡', '🔥', '⚔️', '👑', '🦅', '🐯', '🦊', '🚀', '🥋', '🎯', '💎', '🎮', '🦄', '🦁', '🐺'];

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { user, registerUser, updateProfile } = useAuth();
  const [nickname, setNickname] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar || '🐉');
  const [mode, setMode] = useState<'fast' | 'profile'>('fast');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleFastLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    soundManager.playClick();
    const finalName = nickname.trim() || user?.username || `HiệpKhách_${Math.floor(1000 + Math.random() * 9000)}`;
    if (!user) {
      await registerUser(finalName, selectedAvatar);
    } else {
      updateProfile({ username: finalName, avatar: selectedAvatar });
    }
    onClose();
  };

  const handleSaveAvatar = (av: string) => {
    setSelectedAvatar(av);
    soundManager.playClick();
    if (user) {
      updateProfile({ avatar: av });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6">
        {/* Close Button */}
        <button
          onClick={() => {
            soundManager.playClick();
            onClose();
          }}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-red-600 mb-3 shadow-lg shadow-amber-500/20 text-2xl">
            {selectedAvatar}
          </div>
          <h2 className="text-xl font-bold text-white">
            {user ? 'Hồ Sơ Hiệp Khách VietPlay' : 'Đăng Nhập Nhanh 1-Chạm'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Không cần thủ tục phức tạp, vào chơi game và tranh tài ngay lập tức!
          </p>
        </div>

        {/* User Stats Card if logged in */}
        {user && (
          <div className="mb-6 p-4 rounded-xl bg-slate-950 border border-slate-800/80">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-sm font-bold text-white">{user.username}</span>
                <span className="ml-2 px-2 py-0.5 text-[10px] rounded bg-amber-500/20 text-amber-400 font-semibold border border-amber-500/30">
                  {user.title}
                </span>
              </div>
              <div className="text-xs text-amber-400 font-bold flex items-center gap-1">
                <span>🪙</span>
                <span>{user.coins.toLocaleString()} Xu</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-slate-900">
              <div className="p-2 rounded-lg bg-slate-900">
                <div className="text-[11px] text-slate-400">Cấp độ</div>
                <div className="text-sm font-bold text-blue-400">Lv.{user.level}</div>
              </div>
              <div className="p-2 rounded-lg bg-slate-900">
                <div className="text-[11px] text-slate-400">Chiến thắng</div>
                <div className="text-sm font-bold text-emerald-400">{user.wins} trận</div>
              </div>
              <div className="p-2 rounded-lg bg-slate-900">
                <div className="text-[11px] text-slate-400">Tỷ lệ thắng</div>
                <div className="text-sm font-bold text-purple-400">
                  {user.wins + user.losses > 0
                    ? `${Math.round((user.wins / (user.wins + user.losses)) * 100)}%`
                    : '100%'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Avatar Selection Picker */}
        <div className="mb-5">
          <label className="block text-xs font-semibold text-slate-300 mb-2">Chọn Linh Vật / Avatar Đại Diện</label>
          <div className="grid grid-cols-8 gap-1.5 p-2 bg-slate-950 rounded-xl border border-slate-800 max-h-28 overflow-y-auto">
            {AVATAR_OPTIONS.map((av) => (
              <button
                key={av}
                type="button"
                onClick={() => handleSaveAvatar(av)}
                className={`w-9 h-9 flex items-center justify-center rounded-lg text-lg transition-transform ${
                  selectedAvatar === av
                    ? 'bg-amber-500/20 border-2 border-amber-500 scale-110 shadow-sm'
                    : 'bg-slate-900 hover:bg-slate-800'
                }`}
              >
                {av}
              </button>
            ))}
          </div>
        </div>

        {/* Nickname Form */}
        <form onSubmit={handleFastLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Tên nhân vật / Biệt danh trong game
            </label>
            <input
              type="text"
              placeholder={user?.username || 'Ví dụ: Rồng_Lửa_VN, Bé_Cá_Ngựa...'}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={20}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 text-sm"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition cursor-pointer flex items-center justify-center gap-2"
            >
              <UserCheck className="w-4 h-4" />
              <span>{user ? 'Cập Nhật Tên & Avatar' : 'Vào Chơi Nhanh (+20k Xu)'}</span>
            </button>
          </div>
        </form>

        {/* Benefits notice */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-center gap-4 text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Tặng 20.000 Xu Tân Thủ
          </span>
          <span className="flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            Lưu tự động vào trình duyệt
          </span>
        </div>
      </div>
    </div>
  );
};
