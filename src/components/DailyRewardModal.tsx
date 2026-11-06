import React, { useState } from 'react';
import { X, Gift, Sparkles, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { soundManager } from '../services/audio';

interface DailyRewardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DailyRewardModal: React.FC<DailyRewardModalProps> = ({ isOpen, onClose }) => {
  const { updateUserCoins } = useAuth();
  const [claimed, setClaimed] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [rewardAmount, setRewardAmount] = useState(10000);

  if (!isOpen) return null;

  const handleClaim = () => {
    if (claimed || spinning) return;
    setSpinning(true);
    soundManager.playDice();

    setTimeout(() => {
      // Random reward between 10k and 50k
      const rewards = [10000, 15000, 20000, 30000, 50000];
      const win = rewards[Math.floor(Math.random() * rewards.length)];
      setRewardAmount(win);
      updateUserCoins(win);
      setSpinning(false);
      setClaimed(true);
      soundManager.playVictory();

      // Trigger victory confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-sm bg-slate-900 border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden p-6 text-center">
        <button
          onClick={() => {
            soundManager.playClick();
            onClose();
          }}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 text-3xl shadow-xl shadow-amber-500/30 mb-4 animate-bounce">
          🎁
        </div>

        <h3 className="text-xl font-bold text-white mb-1">Rương Quà Điểm Danh</h3>
        <p className="text-xs text-slate-400 mb-6">Nhận miễn phí VietCoins mỗi ngày để thỏa sức so tài và cược vui Bầu Cua!</p>

        {claimed ? (
          <div className="py-6 px-4 bg-slate-950 rounded-xl border border-emerald-500/30 mb-4">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
            <div className="text-2xl font-black text-amber-400 mb-1">+{rewardAmount.toLocaleString()} Xu</div>
            <p className="text-xs text-slate-300">Đã cộng vào ví của bạn. Chúc bạn chơi game bách chiến bách thắng!</p>
          </div>
        ) : (
          <div className="py-6 px-4 bg-slate-950 rounded-xl border border-slate-800 mb-4">
            <div className="text-3xl font-extrabold text-amber-400 mb-2 tracking-wide">
              {spinning ? 'Đang mở...' : '10.000 ~ 50.000 Xu'}
            </div>
            <p className="text-xs text-slate-400">100% trúng thưởng VietCoins may mắn</p>
          </div>
        )}

        <button
          onClick={claimed ? onClose : handleClaim}
          disabled={spinning}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-amber-500/25 transition cursor-pointer flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          <span>{claimed ? 'Đóng' : spinning ? 'Đang Quay Rương...' : 'Mở Rương Ngay'}</span>
        </button>
      </div>
    </div>
  );
};
