import React, { useState } from 'react';
import { X, Users, UserPlus, Send, Gift, Search, Sparkles, Check, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { soundManager } from '../services/audio';
import { api } from '../services/api';

interface FriendsAndTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInviteFriend?: (friendUsername: string) => void;
}

export const FriendsAndTransferModal: React.FC<FriendsAndTransferModalProps> = ({
  isOpen,
  onClose,
  onInviteFriend,
}) => {
  const { user, friends, addFriend, transferCoins } = useAuth();
  const [tab, setTab] = useState<'friends' | 'transfer'>('friends');

  // Add friend state
  const [newFriendName, setNewFriendName] = useState('');
  const [addSuccessMsg, setAddSuccessMsg] = useState('');

  // Transfer coins state
  const [selectedRecipient, setSelectedRecipient] = useState('');
  const [transferAmount, setTransferAmount] = useState<number>(5000);
  const [transferMessage, setTransferMessage] = useState('Tặng bạn hiền ít vốn quẩy game Huỳnh Âu!');
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferSuccess, setTransferSuccess] = useState(false);

  if (!isOpen) return null;

  const handleAddFriend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFriendName.trim()) return;
    const ok = addFriend(newFriendName);
    if (ok) {
      setAddSuccessMsg(`Đã kết bạn thành công với ${newFriendName}!`);
      setNewFriendName('');
      setTimeout(() => setAddSuccessMsg(''), 3000);
    } else {
      alert('Người chơi này đã có trong danh sách bạn bè hoặc tên không hợp lệ.');
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecipient.trim()) {
      alert('Vui lòng chọn hoặc nhập tên bạn bè nhận Xu!');
      return;
    }
    if (transferAmount <= 0) {
      alert('Số lượng Xu không hợp lệ!');
      return;
    }

    setTransferLoading(true);
    soundManager.playChip();
    try {
      const ok = await transferCoins(selectedRecipient, transferAmount, transferMessage);
      if (ok) {
        // Record on server API
        await api.transferCoins(user?.username || 'Bạn bè', selectedRecipient, transferAmount, transferMessage);
        setTransferSuccess(true);
        setTimeout(() => {
          setTransferSuccess(false);
          setTab('friends');
        }, 2000);
      }
    } catch {
      alert('Lỗi chuyển tiền, vui lòng thử lại.');
    } finally {
      setTransferLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 max-h-[90vh] flex flex-col">
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
        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Users className="w-3.5 h-3.5" />
            <span>Bạn Bè & Chuyển Xu Huỳnh Âu</span>
          </div>
          <h2 className="text-xl font-black text-white">Kết Nối Bạn Bè & Tặng Xu</h2>
        </div>

        {/* Tabs */}
        <div className="flex p-1 bg-slate-950 rounded-2xl border border-slate-800 mb-4">
          <button
            onClick={() => {
              soundManager.playClick();
              setTab('friends');
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              tab === 'friends'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Danh Sách Bạn Bè ({friends.length})</span>
          </button>
          <button
            onClick={() => {
              soundManager.playClick();
              setTab('transfer');
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              tab === 'transfer'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Gift className="w-4 h-4" />
            <span>Chuyển Tiền / Tặng Xu</span>
          </button>
        </div>

        {/* Tab 1: Friends List */}
        {tab === 'friends' && (
          <div className="flex-1 flex flex-col overflow-hidden space-y-4">
            {/* Add Friend Input */}
            <form onSubmit={handleAddFriend} className="flex gap-2">
              <input
                type="text"
                placeholder="Nhập nickname bạn bè để kết bạn..."
                value={newFriendName}
                onChange={(e) => setNewFriendName(e.target.value)}
                maxLength={20}
                className="flex-1 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-amber-500"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs flex items-center gap-1 cursor-pointer shadow-md"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Thêm</span>
              </button>
            </form>

            {addSuccessMsg && (
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs text-center border border-emerald-500/30">
                {addSuccessMsg}
              </div>
            )}

            {/* Friends Cards */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {friends.map((f) => (
                <div
                  key={f.id}
                  className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between hover:border-slate-700 transition"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="relative">
                      <span className="text-2xl">{f.avatar}</span>
                      <span
                        className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-slate-950 ${
                          f.isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
                        }`}
                      ></span>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white">{f.username}</span>
                        <span className="text-[10px] text-amber-400 font-bold">Lv.{f.level}</span>
                      </div>
                      <p className="text-[10px] text-slate-400">{f.statusText || (f.isOnline ? 'Đang online' : 'Ngoại tuyến')}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        soundManager.playClick();
                        setSelectedRecipient(f.username);
                        setTab('transfer');
                      }}
                      className="px-2.5 py-1 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Gift className="w-3 h-3" />
                      <span>Tặng Xu</span>
                    </button>
                    {onInviteFriend && (
                      <button
                        onClick={() => {
                          soundManager.playClick();
                          onInviteFriend(f.username);
                        }}
                        className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
                      >
                        Mời Chơi
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Transfer Coins */}
        {tab === 'transfer' && (
          <form onSubmit={handleTransfer} className="space-y-4">
            {/* User Coin Balance Header */}
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400">Số dư VietCoins của bạn:</span>
              <span className="text-sm font-black text-amber-400">🪙 {user?.coins.toLocaleString()} Xu</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Người nhận (Chọn bạn bè hoặc gõ tên)
              </label>
              <input
                type="text"
                required
                placeholder="Nhập tên người nhận..."
                value={selectedRecipient}
                onChange={(e) => setSelectedRecipient(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-amber-500 font-semibold"
              />
            </div>

            {/* Quick Amount Options */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Số lượng Xu muốn tặng
              </label>
              <div className="grid grid-cols-4 gap-2 mb-2">
                {[1000, 5000, 10000, 50000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => {
                      soundManager.playClick();
                      setTransferAmount(amt);
                    }}
                    className={`py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                      transferAmount === amt
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-950 border border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    🪙 {amt >= 1000 ? `${amt / 1000}k` : amt}
                  </button>
                ))}
              </div>
              <input
                type="number"
                min={100}
                value={transferAmount}
                onChange={(e) => setTransferAmount(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            {/* Message */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Lời nhắn gửi kèm
              </label>
              <input
                type="text"
                value={transferMessage}
                onChange={(e) => setTransferMessage(e.target.value)}
                maxLength={60}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            {transferSuccess ? (
              <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-center text-xs font-bold flex items-center justify-center gap-1.5">
                <Check className="w-4 h-4" />
                <span>Đã chuyển thành công {transferAmount.toLocaleString()} Xu cho {selectedRecipient}!</span>
              </div>
            ) : (
              <button
                type="submit"
                disabled={transferLoading}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs transition cursor-pointer shadow-lg shadow-amber-500/20 flex items-center justify-center gap-1.5"
              >
                <Send className="w-4 h-4" />
                <span>Xác Nhận Tặng {transferAmount.toLocaleString()} Xu</span>
              </button>
            )}
          </form>
        )}
      </div>
    </div>
  );
};
