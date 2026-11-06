import React, { useState } from 'react';
import { X, Users, Lock, Sparkles, Swords } from 'lucide-react';
import { GameType } from '../types';
import { soundManager } from '../services/audio';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateRoom: (params: {
    name: string;
    gameType: GameType;
    maxPlayers: number;
    isPrivate: boolean;
    stakes?: number;
  }) => void;
}

const GAME_OPTIONS: Array<{
  type: GameType;
  title: string;
  icon: string;
  desc: string;
  minPlayers: number;
  maxPlayers: number;
  badge: string;
}> = [
  {
    type: 'caro',
    title: 'Cờ Caro (Gomoku)',
    icon: '⭕',
    desc: 'Đấu trí 1v1 trên bàn cờ 15x15 kinh điển, 5 quân thẳng hàng giành chiến thắng.',
    minPlayers: 2,
    maxPlayers: 2,
    badge: '1v1 Cực Căng',
  },
  {
    type: 'baucua',
    title: 'Bầu Cua Tôm Cá',
    icon: '🎲',
    desc: 'Trò chơi dân gian quốc dân cực vui, lắc bát úp mở hồi hộp cùng nhiều người chơi.',
    minPlayers: 2,
    maxPlayers: 8,
    badge: '2-8 Người',
  },
  {
    type: 'tienlen',
    title: 'Tiến Lên Miền Nam',
    icon: '🃏',
    desc: 'Bài 13 lá luật chuẩn miền Nam: chặt heo, 3 đôi thông, tứ quý, tới trắng.',
    minPlayers: 2,
    maxPlayers: 4,
    badge: '2-4 Người',
  },
  {
    type: 'cangua',
    title: 'Cờ Cá Ngựa',
    icon: '🐴',
    desc: 'Đổ xúc xắc ra quân, đá ngựa đối thủ và đua 4 chú ngựa về chuồng an toàn.',
    minPlayers: 2,
    maxPlayers: 4,
    badge: '2-4 Người',
  },
  {
    type: 'oanquan',
    title: 'Ô Ăn Quan Dân Gian',
    icon: '🪨',
    desc: 'Trí tuệ dân gian tuyệt đỉnh: 10 ô dân, 2 ô quan, rải sỏi và ăn quan bội phần.',
    minPlayers: 2,
    maxPlayers: 2,
    badge: 'Dân Gian 1v1',
  },
  {
    type: 'trivia',
    title: 'Vua Tiếng Việt & Đố Vui',
    icon: '🏆',
    desc: 'Thử tài ca dao tục ngữ, kiến thức văn hóa Việt Nam đếm ngược tốc độ.',
    minPlayers: 2,
    maxPlayers: 4,
    badge: '2-4 Người',
  },
];

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({ isOpen, onClose, onCreateRoom }) => {
  const [selectedGame, setSelectedGame] = useState<GameType>('caro');
  const [roomName, setRoomName] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(2);
  const [isPrivate, setIsPrivate] = useState(false);
  const [stakes, setStakes] = useState(1000);

  if (!isOpen) return null;

  const currentOption = GAME_OPTIONS.find((g) => g.type === selectedGame)!;

  const handleSelectGame = (type: GameType) => {
    soundManager.playClick();
    setSelectedGame(type);
    const opt = GAME_OPTIONS.find((g) => g.type === type)!;
    setMaxPlayers(opt.maxPlayers);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    soundManager.playClick();
    const finalName = roomName.trim() || `Phòng ${currentOption.title} - Huỳnh Âu Arena`;
    onCreateRoom({
      name: finalName,
      gameType: selectedGame,
      maxPlayers,
      isPrivate,
      stakes,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 max-h-[90vh] flex flex-col">
        <button
          onClick={() => {
            soundManager.playClick();
            onClose();
          }}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Swords className="w-3.5 h-3.5" />
            <span>Mở Bàn Đấu Huỳnh Âu Arena</span>
          </div>
          <h2 className="text-xl font-black text-white tracking-tight">Tạo Phòng Chơi Mới</h2>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Game Selection Cards */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Chọn Trò Chơi (6 Tựa Game)</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {GAME_OPTIONS.map((game) => (
                <button
                  key={game.type}
                  type="button"
                  onClick={() => handleSelectGame(game.type)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    selectedGame === game.type
                      ? 'bg-gradient-to-br from-amber-500/20 to-red-500/10 border-amber-500 shadow-md shadow-amber-500/10 scale-[1.02]'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-2xl">{game.icon}</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-800 text-amber-400 border border-slate-700">
                      {game.badge}
                    </span>
                  </div>
                  <h3 className="font-bold text-xs text-slate-100 truncate">{game.title}</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">{game.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Room Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Tên Bàn Chơi</label>
            <input
              type="text"
              placeholder="Ví dụ: Cao Thủ Giao Lưu, Bầu Cua Tất Tay..."
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              maxLength={30}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 text-xs"
            />
          </div>

          {/* Stakes & Players */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Mức Cược / Tiền Bàn</label>
              <select
                value={stakes}
                onChange={(e) => setStakes(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-amber-500"
              >
                <option value={500}>🪙 500 Xu (Giao lưu)</option>
                <option value={1000}>🪙 1.000 Xu</option>
                <option value={2000}>🪙 2.000 Xu</option>
                <option value={5000}>🪙 5.000 Xu (Cao thủ)</option>
                <option value={10000}>🪙 10.000 Xu</option>
                <option value={50000}>🪙 50.000 Xu (Đại gia)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Số Người Chơi</label>
              <select
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-amber-500"
              >
                {(selectedGame === 'caro' || selectedGame === 'oanquan') && <option value={2}>2 Người (1v1)</option>}
                {selectedGame === 'baucua' && (
                  <>
                    <option value={2}>2 Người</option>
                    <option value={4}>4 Người</option>
                    <option value={8}>8 Người (Đầy đủ)</option>
                  </>
                )}
                {(selectedGame === 'tienlen' || selectedGame === 'cangua' || selectedGame === 'trivia') && (
                  <>
                    <option value={2}>2 Người</option>
                    <option value={3}>3 Người</option>
                    <option value={4}>4 Người</option>
                  </>
                )}
              </select>
            </div>
          </div>

          {/* Private Room Checkbox */}
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 select-none">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 bg-slate-900 border-slate-700"
              />
              <span className="flex items-center gap-1 font-semibold">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                Phòng Riêng Tư (Chỉ vào bằng mã PIN)
              </span>
            </label>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/20 transition cursor-pointer flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Mở Bàn Chơi Ngay</span>
          </button>
        </form>
      </div>
    </div>
  );
};
