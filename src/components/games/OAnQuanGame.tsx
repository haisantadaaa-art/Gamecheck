import React, { useState } from 'react';
import { Volume2, Sparkles, Trophy, RotateCcw, ArrowRight, ArrowLeft } from 'lucide-react';
import confetti from 'canvas-confetti';
import { GameRoom, RoomPlayer } from '../../types';
import { soundManager } from '../../services/audio';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface OAnQuanGameProps {
  room: GameRoom;
  currentPlayer: RoomPlayer;
  onLeave: () => void;
}

export const OAnQuanGame: React.FC<OAnQuanGameProps> = ({ room, currentPlayer, onLeave }) => {
  const { updateUserCoins, recordGameResult } = useAuth();

  // Board layout:
  // 0..4: 5 ô dân phía dưới (Của Bạn)
  // 5: Ô Quan Phải
  // 6..10: 5 ô dân phía trên (Của Đối thủ/Bot)
  // 11: Ô Quan Trái
  const [board, setBoard] = useState<number[]>([5, 5, 5, 5, 5, 10, 5, 5, 5, 5, 5, 10]);
  const [myScore, setMyScore] = useState<number>(0);
  const [opponentScore, setOpponentScore] = useState<number>(0);
  const [turn, setTurn] = useState<'player' | 'bot'>('player');
  const [selectedPit, setSelectedPit] = useState<number | null>(null);
  const [isDistributing, setIsDistributing] = useState<boolean>(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [commentary, setCommentary] = useState<string>('Ván Ô Ăn Quan bắt đầu! Hãy chọn ô dân của bạn và chọn hướng rải sỏi.');
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Human selects pit
  const handleSelectPit = (idx: number) => {
    if (turn !== 'player' || isDistributing || winner) return;
    if (idx < 0 || idx > 4) return; // only your bottom pits
    if (board[idx] === 0) {
      alert('Ô này đã hết sỏi! Hãy chọn ô khác.');
      return;
    }
    soundManager.playClick();
    setSelectedPit(idx);
  };

  // Human distributes stones in a direction
  const handleDistribute = (direction: 'cw' | 'ccw') => {
    if (selectedPit === null || isDistributing) return;
    setIsDistributing(true);
    soundManager.playStone();

    const newBoard = [...board];
    let stones = newBoard[selectedPit];
    newBoard[selectedPit] = 0;

    let currIdx = selectedPit;
    const step = direction === 'cw' ? 1 : -1;

    // Distribute stones one by one
    const interval = setInterval(() => {
      if (stones > 0) {
        currIdx = (currIdx + step + 12) % 12;
        newBoard[currIdx] += 1;
        stones -= 1;
        setBoard([...newBoard]);
        soundManager.playStone();
      } else {
        clearInterval(interval);
        // Check next pit
        const nextPit = (currIdx + step + 12) % 12;
        if (newBoard[nextPit] === 0) {
          // Capture!
          const targetCapture = (nextPit + step + 12) % 12;
          const capturedStones = newBoard[targetCapture];
          if (capturedStones > 0) {
            newBoard[targetCapture] = 0;
            setBoard([...newBoard]);
            setMyScore((prev) => prev + capturedStones);
            soundManager.playVictory();
            speakCommentary(`Ăn trọn ${capturedStones} quân sỏi! Nước đi tính toán quá chuẩn xác.`);
          }
        }

        // Check if both Quan are empty
        if (newBoard[5] === 0 && newBoard[11] === 0) {
          endGame(newBoard);
          return;
        }

        setSelectedPit(null);
        setIsDistributing(false);
        setTurn('bot');
        setTimeout(() => runBotTurn(newBoard), 1200);
      }
    }, 250);
  };

  // Bot Turn Simulation
  const runBotTurn = (currentBoard: number[]) => {
    // Bot picks top pit (6..10) with highest stones
    let bestPit = -1;
    let maxVal = 0;
    for (let p = 6; p <= 10; p++) {
      if (currentBoard[p] > maxVal) {
        maxVal = currentBoard[p];
        bestPit = p;
      }
    }

    if (bestPit === -1 || maxVal === 0) {
      // Opponent has no stones in pits
      endGame(currentBoard);
      return;
    }

    const newBoard = [...currentBoard];
    let stones = newBoard[bestPit];
    newBoard[bestPit] = 0;
    let curr = bestPit;
    const step = 1;

    const botInterval = setInterval(() => {
      if (stones > 0) {
        curr = (curr + step + 12) % 12;
        newBoard[curr] += 1;
        stones -= 1;
        setBoard([...newBoard]);
        soundManager.playStone();
      } else {
        clearInterval(botInterval);
        const nextPit = (curr + step + 12) % 12;
        if (newBoard[nextPit] === 0) {
          const targetCap = (nextPit + step + 12) % 12;
          const cap = newBoard[targetCap];
          if (cap > 0) {
            newBoard[targetCap] = 0;
            setBoard([...newBoard]);
            setOpponentScore((prev) => prev + cap);
            soundManager.playDefeat();
          }
        }

        if (newBoard[5] === 0 && newBoard[11] === 0) {
          endGame(newBoard);
          return;
        }

        setTurn('player');
      }
    }, 220);
  };

  const endGame = (finalBoard: number[]) => {
    const finalMyScore = myScore;
    const finalOppScore = opponentScore;

    if (finalMyScore >= finalOppScore) {
      setWinner('player');
      soundManager.playVictory();
      recordGameResult(true);
      updateUserCoins(3000);
      confetti({ particleCount: 70, spread: 70 });
      speakCommentary(`Chúc mừng bạn đã giành chiến thắng ván Ô Ăn Quan với ${finalMyScore} điểm!`);
    } else {
      setWinner('bot');
      soundManager.playDefeat();
      recordGameResult(false);
      speakCommentary(`Đối thủ đã thắng ván này với ${finalOppScore} điểm. Hãy thử sức lại ván mới!`);
    }
  };

  const speakCommentary = async (text: string) => {
    try {
      setIsSpeaking(true);
      setCommentary(text);
      const res = await api.textToSpeech(text, 'Hào hứng, dí dỏm như bình luận viên trò chơi dân gian Ô Ăn Quan', 'Puck');
      if (res.audioBase64) {
        await soundManager.playWavBase64(res.audioBase64);
      }
    } catch {
      // ignore
    } finally {
      setIsSpeaking(false);
    }
  };

  const handleRestart = () => {
    soundManager.playClick();
    setBoard([5, 5, 5, 5, 5, 10, 5, 5, 5, 5, 5, 10]);
    setMyScore(0);
    setOpponentScore(0);
    setTurn('player');
    setSelectedPit(null);
    setWinner(null);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 max-w-6xl mx-auto py-2">
      {/* Board Area */}
      <div className="flex-1 flex flex-col items-center">
        {/* Score Header */}
        <div className="w-full max-w-2xl flex items-center justify-between p-3.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md mb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{currentPlayer.avatar}</span>
            <div>
              <div className="text-xs font-bold text-white">{currentPlayer.username} (Bạn)</div>
              <div className="text-xs font-black text-amber-400">Điểm: {myScore} sỏi</div>
            </div>
          </div>

          <div className="text-center">
            <span className="text-xs font-black px-3 py-1 rounded-full bg-slate-800 text-amber-400 border border-slate-700">
              {turn === 'player' ? '👉 Lượt của bạn' : '🤖 Lượt đối thủ...'}
            </span>
          </div>

          <div className="flex items-center gap-2 text-right">
            <div>
              <div className="text-xs font-bold text-white">Kỳ Thủ AI</div>
              <div className="text-xs font-black text-cyan-400">Điểm: {opponentScore} sỏi</div>
            </div>
            <span className="text-2xl">🤖</span>
          </div>
        </div>

        {/* Traditional Wooden Mancala Board (Mobile Responsive) */}
        <div className="w-full max-w-2xl overflow-x-auto pb-2 scrollbar-none">
          <div className="min-w-[340px] bg-gradient-to-b from-amber-950/80 to-amber-900/60 p-2.5 sm:p-6 rounded-3xl border-4 border-amber-700/60 shadow-2xl relative">
            <div className="flex items-center justify-between gap-1.5 sm:gap-3">
              {/* Left Quan (Ô Quan Trái - 11) */}
              <div className="w-14 sm:w-24 h-40 sm:h-48 rounded-2xl sm:rounded-full bg-amber-900/90 border-2 border-amber-500/50 flex flex-col items-center justify-center shadow-inner p-1 sm:p-2 text-center shrink-0">
                <span className="text-[9px] sm:text-[11px] font-black text-amber-300 uppercase">Quan Bà</span>
                <span className="text-xl sm:text-3xl font-black text-white mt-1">🪨 {board[11]}</span>
              </div>

              {/* 10 Small Pits Grid (5 top, 5 bottom) */}
              <div className="flex-1 space-y-2 sm:space-y-3">
                {/* Top Row: Opponent Pits 10..6 */}
                <div className="grid grid-cols-5 gap-1 sm:gap-2">
                  {[10, 9, 8, 7, 6].map((idx) => (
                    <div
                      key={idx}
                      className="h-16 sm:h-20 rounded-xl sm:rounded-2xl bg-amber-900/40 border border-amber-700/50 flex flex-col items-center justify-center p-0.5 sm:p-1 text-center shadow-inner"
                    >
                      <span className="text-[9px] sm:text-[10px] text-slate-400">Ô {idx}</span>
                      <span className="text-base sm:text-xl font-black text-cyan-300">🪨 {board[idx]}</span>
                    </div>
                  ))}
                </div>

                {/* Bottom Row: Human Pits 0..4 */}
                <div className="grid grid-cols-5 gap-1 sm:gap-2">
                  {[0, 1, 2, 3, 4].map((idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectPit(idx)}
                      disabled={turn !== 'player' || isDistributing || !!winner}
                      className={`h-16 sm:h-20 rounded-xl sm:rounded-2xl border-2 flex flex-col items-center justify-center p-0.5 sm:p-1 text-center transition-all cursor-pointer shadow-md ${
                        selectedPit === idx
                          ? 'bg-amber-500/30 border-amber-400 scale-105 ring-2 ring-amber-400'
                          : 'bg-amber-900/60 border-amber-600/50 hover:border-amber-400 active:scale-95'
                      }`}
                    >
                      <span className="text-[8px] sm:text-[10px] font-bold text-amber-300">Ô bạn</span>
                      <span className="text-base sm:text-xl font-black text-white">🪨 {board[idx]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Right Quan (Ô Quan Phải - 5) */}
              <div className="w-14 sm:w-24 h-40 sm:h-48 rounded-2xl sm:rounded-full bg-amber-900/90 border-2 border-amber-500/50 flex flex-col items-center justify-center shadow-inner p-1 sm:p-2 text-center shrink-0">
                <span className="text-[9px] sm:text-[11px] font-black text-amber-300 uppercase">Quan Ông</span>
                <span className="text-xl sm:text-3xl font-black text-white mt-1">🪨 {board[5]}</span>
              </div>
            </div>

          {/* Direction Selector when a pit is selected */}
          {selectedPit !== null && (
            <div className="mt-4 p-3 rounded-2xl bg-slate-950/90 border border-amber-500/50 flex items-center justify-between gap-3 animate-fade-in">
              <span className="text-xs font-bold text-slate-200">
                Đã chọn Ô {selectedPit} ({board[selectedPit]} sỏi). Chọn hướng rải:
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDistribute('ccw')}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Rải Sang Trái</span>
                </button>
                <button
                  onClick={() => handleDistribute('cw')}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition"
                >
                  <span>Rải Sang Phải</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Winner Banner */}
          {winner && (
            <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 text-center animate-bounce">
              <Trophy className="w-8 h-8 text-amber-400 mx-auto mb-1" />
              <h3 className="text-lg font-black text-amber-300">
                {winner === 'player' ? '🎉 BẠN ĐÃ THẮNG VÁN Ô ĂN QUAN! (+3,000 Xu)' : '⚡ KỲ THỦ ĐỐI THỦ THẮNG!'}
              </h3>
              <button
                onClick={handleRestart}
                className="mt-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition cursor-pointer"
              >
                Chơi Ván Mới
              </button>
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Right Sidebar: Rules & AI Announcer */}
      <div className="w-full lg:w-80 space-y-4">
        {/* Gemini Voice Announcer */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-amber-500/30 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
              <Sparkles className="w-4 h-4" />
              <span>Bình Luận Viên Ô Ăn Quan (TTS)</span>
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

        {/* Quick Rules */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs space-y-2">
          <h4 className="font-bold text-slate-200">Luật Chơi Ô Ăn Quan Việt Nam:</h4>
          <ul className="space-y-1 text-slate-400 leading-relaxed text-[11px] list-disc list-inside">
            <li>Người chơi chọn 1 trong 5 ô dân của mình có sỏi.</li>
            <li>Rải sỏi lần lượt vào từng ô theo chiều đã chọn.</li>
            <li>Nếu ô kế tiếp trống và ô sau đó có sỏi: Ăn sỏi ô đó!</li>
            <li>Ăn được Ô Quan mang lại số điểm sỏi rất lớn (10+ điểm).</li>
          </ul>
        </div>

        <button
          onClick={onLeave}
          className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition cursor-pointer"
        >
          Rời bàn Ô Ăn Quan
        </button>
      </div>
    </div>
  );
};
