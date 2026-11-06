import React, { useState } from 'react';
import { X, Users, Lock, Sparkles, Swords, Dice5, Trophy, Flag } from 'lucide-react';
import { GameType } from '../types';
import { soundManager } from '../services/audio';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateRoom: (params: { name: string; gameType: GameType; maxPlayers: number; isPrivate: boolean }) => void;
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
    badge: '1v1 Căng Thẳng',
  },
  {
    type: 'baucua',
    title: 'Bầu Cua Tôm Cá',
    icon: '🎲',
    desc: 'Trò chơi dân gian quốc dân cực vui, lắc bát úp mở hồi hộp cùng nhiều người chơi.',
    minPlayers: 2,
    maxPlayers: 8,
    badge: 'Đông Vui Nhất',
  },
  {
    type: 'tienlen',
    title: 'Tiến Lên Miền Nam',
    icon: '🃏',
    desc: 'Bài 13 lá luật chuẩn miền Nam: chặt heo, 3 đôi thông, tứ quý, tới trắng.',
    minPlayers: 2,
    maxPlayers: 4,
    badge: 'Chiến Thuật Cao',
  },
  {
    type: 'cangua',
    title: 'Cờ Cá Ngựa',
    icon: '🐴',
    desc: 'Đổ xúc xắc ra quân, đá ngựa đối thủ và đua 4 chú ngựa về chuồng an toàn.',
    minPlayers: 2,
    maxPlayers: 4,
    badge: 'Tuổi Thơ Ký Ức',
  },
];

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({ isOpen, onClose, onCreateRoom }) => {
  const [selectedGame, setSelectedGame] = useState<GameType>('caro');
  const [roomName, setRoomName] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(2);
  const [isPrivate, setIsPrivate] = useState(false);

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
    const finalName = roomName.trim() || `Phòng ${currentOption.title}`;
    onCreateRoom({
      name: finalName,
      gameType: selectedGame,
      maxPlayers,
      isPrivate,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6">
        <button
          onClick={() => {
            soundManager.playClick();
            onClose();
          }}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-5">
          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Swords className="w-3.5 h-3.5" />
            Tạo Bàn Đấu Mới
          </div>
          <h2 className="text-xl font-black text-white tracking-tight">Chọn Game & Thiết Lập Phòng Chơi</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Game Selection Cards */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Chọn Trò Chơi</label>
            <div className="grid grid-cols-2 gap-2">
              {GAME_OPTIONS.map((game) => (
                <button
                  key={game.type}
                  type="button"
                  onClick={() => handleSelectGame(game.type)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    selectedGame === game.type
                      ? 'bg-gradient-to-br from-amber-500/20 to-red-500/10 border-amber-500 shadow-md shadow-amber-500/10'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-2xl">{game.icon}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700">
                      {game.badge}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-slate-100">{game.title}</h3>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{game.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Room Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Tên Phòng Đấu</label>
            <input
              type="text"
              placeholder={`Ví dụ: Cao Thủ Giao Lưu, Đấu Cùng Bạn...`}
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              maxLength={30}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 text-sm"
            />
          </div>

          {/* Player Count & Privacy */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Số Người Chơi Tối Đa</label>
              <select
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:border-amber-500 text-sm"
              >
                {selectedGame === 'caro' && <option value={2}>2 Người (1v1)</option>}
                {selectedGame === 'baucua' && (
                  <>
                    <option value={2}>2 Người</option>
                    <option value={4}>4 Người</option>
                    <option value={6}>6 Người</option>
                    <option value={8}>8 Người (Đầy đủ)</option>
                  </>
                )}
                {selectedGame === 'tienlen' && (
                  <>
                    <option value={2}>2 Người</option>
                    <option value={3}>3 Người</option>
                    <option value={4}>4 Người (Chuẩn 4 tụ)</option>
                  </>
                )}
                {selectedGame === 'cangua' && (
                  <>
                    <option value={2}>2 Người</option>
                    <option value={4}>4 Người (4 Màu)</option>
                  </>
                )}
              </select>
            </div>

            <div className="flex items-center pt-6">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 select-none">
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-0 bg-slate-950 border-slate-700"
                />
                <span className="flex items-center gap-1 font-medium">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  Chỉ vào bằng mã PIN
                </span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/20 transition cursor-pointer flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Mở Phòng Ngay</span>
          </button>
        </form>
      </div>
    </div>
  );
};
