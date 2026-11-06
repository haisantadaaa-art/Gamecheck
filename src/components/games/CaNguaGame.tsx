import React, { useState, useEffect } from 'react';
import { Volume2, Sparkles, Trophy, RotateCcw, Dices, Flag } from 'lucide-react';
import confetti from 'canvas-confetti';
import { GameRoom, HorseColor, HorsePiece, RoomPlayer } from '../../types';
import { soundManager } from '../../services/audio';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface CaNguaGameProps {
  room: GameRoom;
  currentPlayer: RoomPlayer;
  onLeave: () => void;
}

const COLOR_CONFIGS: {
  [k in HorseColor]: { name: string; bg: string; text: string; border: string; icon: string };
} = {
  red: { name: 'Đỏ', bg: 'bg-red-500', text: 'text-red-400', border: 'border-red-500', icon: '🔴' },
  blue: { name: 'Xanh Dương', bg: 'bg-blue-500', text: 'text-blue-400', border: 'border-blue-500', icon: '🔵' },
  yellow: { name: 'Vàng', bg: 'bg-yellow-400', text: 'text-yellow-400', border: 'border-yellow-400', icon: '🟡' },
  green: { name: 'Xanh Lá', bg: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500', icon: '🟢' },
};

export const CaNguaGame: React.FC<CaNguaGameProps> = ({ room, currentPlayer, onLeave }) => {
  const { updateUserCoins, recordGameResult } = useAuth();
  const [currentTurn, setCurrentTurn] = useState<HorseColor>('red');
  const [diceValue, setDiceValue] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [horses, setHorses] = useState<{ [color in HorseColor]: HorsePiece[] }>({
    red: [0, 1, 2, 3].map((i) => ({ id: `red_${i}`, color: 'red', index: i, position: -1 })),
    blue: [0, 1, 2, 3].map((i) => ({ id: `blue_${i}`, color: 'blue', index: i, position: -1 })),
    yellow: [0, 1, 2, 3].map((i) => ({ id: `yellow_${i}`, color: 'yellow', index: i, position: -1 })),
    green: [0, 1, 2, 3].map((i) => ({ id: `green_${i}`, color: 'green', index: i, position: -1 })),
  });
  const [winner, setWinner] = useState<HorseColor | null>(null);
  const [commentary, setCommentary] = useState<string>('Trận đua Cờ Cá Ngựa bắt đầu! Hãy đổ xúc xắc để ra quân.');
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Human controls Red, bots control Blue, Yellow, Green in solo mode
  const myColor: HorseColor = 'red';

  // Roll dice
  const handleRollDice = () => {
    if (isRolling || winner || currentTurn !== myColor) return;
    setIsRolling(true);
    soundManager.playDice();

    setTimeout(() => {
      const rolled = Math.floor(1 + Math.random() * 6);
      setDiceValue(rolled);
      setIsRolling(false);

      if (rolled === 1 || rolled === 6) {
        speakCommentary(`Đổ được ${rolled}! Bạn có quyền ra quân hoặc phi nước đại!`);
      } else {
        speakCommentary(`Đổ được ${rolled}! Chọn chú ngựa để di chuyển.`);
      }

      // Check if player has any valid moves
      const myHorses = horses[myColor];
      const canMove = myHorses.some((h) => (h.position === -1 && (rolled === 1 || rolled === 6)) || h.position >= 0);
      if (!canMove) {
        // Pass to next bot turn
        setTimeout(() => nextTurn(), 1200);
      }
    }, 800);
  };

  // Move horse
  const handleMoveHorse = (horse: HorsePiece) => {
    if (!diceValue || currentTurn !== myColor || winner) return;

    soundManager.playCard();
    const updated = { ...horses };

    if (horse.position === -1) {
      if (diceValue === 1 || diceValue === 6) {
        horse.position = 0; // enter track
      } else {
        return; // can't deploy
      }
    } else {
      horse.position += diceValue;
      if (horse.position >= 56) {
        // entered barn!
        horse.position = 100;
        soundManager.playVictory();
      }
    }

    setHorses(updated);

    // Check win condition
    const finishedCount = horses[myColor].filter((h) => h.position >= 100).length;
    if (finishedCount >= 2) {
      setWinner(myColor);
      soundManager.playVictory();
      recordGameResult(true);
      updateUserCoins(3000);
      confetti({ particleCount: 70, spread: 60 });
      speakCommentary('Tuyệt vời! Chúc mừng chú ngựa của bạn đã về chuồng đại thắng!');
      return;
    }

    // Next turn unless rolled 6
    if (diceValue !== 6) {
      nextTurn();
    } else {
      setDiceValue(null);
    }
  };

  const nextTurn = () => {
    setDiceValue(null);
    const order: HorseColor[] = ['red', 'blue', 'yellow', 'green'];
    const nextIdx = (order.indexOf(currentTurn) + 1) % order.length;
    const nextColor = order[nextIdx];
    setCurrentTurn(nextColor);

    if (nextColor !== myColor) {
      // Simulate Bot Turn
      setTimeout(() => {
        const botRoll = Math.floor(1 + Math.random() * 6);
        soundManager.playDice();

        // Bot moves first available horse
        const botHorses = horses[nextColor];
        const deployable = botHorses.find((h) => h.position === -1 && (botRoll === 1 || botRoll === 6));
        const moveable = botHorses.find((h) => h.position >= 0 && h.position < 100);

        if (deployable) {
          deployable.position = 0;
        } else if (moveable) {
          moveable.position += botRoll;
        }
        setHorses({ ...horses });

        // Cycle to next or back to human
        if (nextColor === 'green') {
          setCurrentTurn('red');
        } else {
          nextTurn();
        }
      }, 1000);
    }
  };

  const speakCommentary = async (text: string) => {
    try {
      setIsSpeaking(true);
      setCommentary(text);
      const res = await api.textToSpeech(text, 'Hào hứng, cổ vũ sôi động như trường đua Cờ Cá Ngựa', 'Puck');
      if (res.audioBase64) {
        await soundManager.playWavBase64(res.audioBase64);
      }
    } catch {
      // fallback
    } finally {
      setIsSpeaking(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 max-w-6xl mx-auto py-2">
      {/* Game Board */}
      <div className="flex-1 flex flex-col items-center">
        {/* Board Frame */}
        <div className="w-full max-w-xl bg-slate-900 border-4 border-amber-600/40 rounded-3xl p-4 sm:p-6 shadow-2xl relative">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-black text-amber-400 flex items-center gap-1.5">
              <span>🐴 Trường Đua Cá Ngựa</span>
              <span className={`px-2 py-0.5 rounded-full ${COLOR_CONFIGS[currentTurn].bg} text-white font-bold`}>
                Lượt: {COLOR_CONFIGS[currentTurn].name}
              </span>
            </span>

            {/* Dice Roller Button */}
            <button
              onClick={handleRollDice}
              disabled={isRolling || currentTurn !== myColor || !!diceValue}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 disabled:opacity-40 text-slate-950 font-black text-xs transition cursor-pointer shadow-md"
            >
              <Dices className="w-4 h-4" />
              <span>{isRolling ? 'Đang Lắc...' : diceValue ? `Số: ${diceValue}` : 'Đổ Xúc Xắc'}</span>
            </button>
          </div>

          {/* 4 Stables (Chuồng Ngựa) Grid */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            {(['red', 'blue', 'yellow', 'green'] as HorseColor[]).map((col) => {
              const cfg = COLOR_CONFIGS[col];
              const colHorses = horses[col];
              const isMyTurn = currentTurn === col;
              return (
                <div
                  key={col}
                  className={`p-3 rounded-2xl bg-slate-950 border-2 ${cfg.border} flex flex-col justify-between min-h-[120px] transition-all ${
                    isMyTurn ? 'ring-2 ring-amber-400 shadow-md' : 'opacity-85'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-white flex items-center gap-1">
                      <span>{cfg.icon}</span>
                      <span>Chuồng {cfg.name}</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">
                      {col === myColor ? '(Bạn)' : '(Bot)'}
                    </span>
                  </div>

                  {/* 4 Horses in Stable */}
                  <div className="grid grid-cols-4 gap-1.5">
                    {colHorses.map((h) => {
                      const inStable = h.position === -1;
                      const finished = h.position >= 100;
                      return (
                        <button
                          key={h.id}
                          onClick={() => col === myColor && handleMoveHorse(h)}
                          disabled={col !== myColor || !diceValue}
                          className={`p-1.5 rounded-xl border flex flex-col items-center justify-center transition cursor-pointer ${
                            inStable
                              ? `${cfg.bg}/20 border-slate-700 hover:border-amber-400`
                              : finished
                              ? 'bg-amber-500/30 border-amber-400 text-amber-300'
                              : `${cfg.bg} border-white text-white font-bold scale-105 shadow-md`
                          }`}
                        >
                          <span className="text-xl">🐴</span>
                          <span className="text-[9px] font-bold mt-0.5">
                            {inStable ? 'Chờ' : finished ? 'Về' : `+${h.position}`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Central Track Mini Map */}
          <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 text-center">
            <div className="text-[11px] text-slate-400 mb-1 flex items-center justify-center gap-1">
              <Flag className="w-3.5 h-3.5 text-amber-400" />
              <span>Quy tắc: Đổ 1 hoặc 6 để xuất quân ra đường đua! Đổ 6 được thêm lượt.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar: Controls & AI Announcer */}
      <div className="w-full lg:w-80 space-y-4">
        {/* Gemini AI Voice Announcer */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-amber-500/30 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
              <Sparkles className="w-4 h-4" />
              <span>Bình Luận Viên Đua Ngựa (TTS Voice)</span>
            </div>
            {isSpeaking && <span className="text-[10px] text-emerald-400 animate-pulse font-semibold">Đang đọc...</span>}
          </div>

          <p className="text-xs text-slate-200 leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800 mb-3 min-h-[50px]">
            "{commentary}"
          </p>

          <button
            onClick={() => speakCommentary(commentary)}
            disabled={isSpeaking}
            className="w-full py-2 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <Volume2 className="w-4 h-4" />
            <span>Phát Giọng Bình Luận</span>
          </button>
        </div>

        {/* Exit Game */}
        <button
          onClick={onLeave}
          className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition cursor-pointer"
        >
          Rời bàn Cá Ngựa
        </button>
      </div>
    </div>
  );
};
