import React, { useState, useEffect } from 'react';
import { Sparkles, RotateCcw, Volume2, Trophy, Clock, Bot, User, Flame } from 'lucide-react';
import confetti from 'canvas-confetti';
import { GameRoom, CaroState, RoomPlayer } from '../../types';
import { soundManager } from '../../services/audio';
import { api } from '../../services/api';
import { gameSocket } from '../../services/socket';
import { useAuth } from '../../context/AuthContext';

interface CaroGameProps {
  room: GameRoom;
  currentPlayer: RoomPlayer;
  onLeave: () => void;
}

export const CaroGame: React.FC<CaroGameProps> = ({ room, currentPlayer, onLeave }) => {
  const { recordGameResult, updateUserCoins } = useAuth();
  const [board, setBoard] = useState<(string | null)[][]>(() =>
    Array(15).fill(null).map(() => Array(15).fill(null))
  );
  const [turn, setTurn] = useState<string>(room.players[0]?.id || currentPlayer.id);
  const [winner, setWinner] = useState<string | null>(null);
  const [lastMove, setLastMove] = useState<{ row: number; col: number; symbol: string } | null>(null);
  const [aiThinking, setAiThinking] = useState<boolean>(false);
  const [commentary, setCommentary] = useState<string>('Ván cờ Caro đang diễn ra! Hãy bình tĩnh tính toán từng nước đi.');
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  const isSoloOrAi = room.players.length === 1;
  const mySymbol: 'X' | 'O' = room.players[0]?.id === currentPlayer.id ? 'X' : 'O';
  const opponentPlayer = room.players.find((p) => p.id !== currentPlayer.id) || {
    id: 'ai_bot',
    username: 'Kỳ Thủ AI',
    avatar: '🤖',
    isHost: false,
    isReady: true,
  };

  // Sync with multiplayer room state if available
  useEffect(() => {
    if (room.gameState?.board) {
      setBoard(room.gameState.board);
      setTurn(room.gameState.turnPlayerId);
      if (room.gameState.winnerId) {
        setWinner(room.gameState.winnerId);
      }
      if (room.gameState.lastMove) {
        setLastMove(room.gameState.lastMove);
      }
    }
  }, [room.gameState]);

  // Check 5 in a row
  const checkWin = (grid: (string | null)[][], r: number, c: number, sym: string): boolean => {
    const dirs = [
      [0, 1], // horizontal
      [1, 0], // vertical
      [1, 1], // diag \
      [1, -1], // diag /
    ];
    for (const [dr, dc] of dirs) {
      let count = 1;
      for (let s = 1; s < 5; s++) {
        const nr = r + dr * s;
        const nc = c + dc * s;
        if (nr >= 0 && nr < 15 && nc >= 0 && nc < 15 && grid[nr][nc] === sym) count++;
        else break;
      }
      for (let s = 1; s < 5; s++) {
        const nr = r - dr * s;
        const nc = c - dc * s;
        if (nr >= 0 && nr < 15 && nc >= 0 && nc < 15 && grid[nr][nc] === sym) count++;
        else break;
      }
      if (count >= 5) return true;
    }
    return false;
  };

  // Smart heuristic for AI bot move
  const getBestAiMove = (grid: (string | null)[][]): { r: number; c: number } => {
    // 1. Check if AI can win immediately (4 in a row)
    for (let r = 0; r < 15; r++) {
      for (let c = 0; c < 15; c++) {
        if (!grid[r][c]) {
          grid[r][c] = 'O';
          if (checkWin(grid, r, c, 'O')) {
            grid[r][c] = null;
            return { r, c };
          }
          grid[r][c] = null;
        }
      }
    }
    // 2. Check if Human has 3 or 4 in a row to block
    for (let r = 0; r < 15; r++) {
      for (let c = 0; c < 15; c++) {
        if (!grid[r][c]) {
          grid[r][c] = 'X';
          if (checkWin(grid, r, c, 'X')) {
            grid[r][c] = null;
            return { r, c };
          }
          grid[r][c] = null;
        }
      }
    }
    // 3. Play near existing stones
    const candidates: Array<{ r: number; c: number; score: number }> = [];
    for (let r = 0; r < 15; r++) {
      for (let c = 0; c < 15; c++) {
        if (!grid[r][c]) {
          let score = 0;
          for (let dr = -2; dr <= 2; dr++) {
            for (let dc = -2; dc <= 2; dc++) {
              const nr = r + dr;
              const nc = c + dc;
              if (nr >= 0 && nr < 15 && nc >= 0 && nc < 15 && grid[nr][nc]) {
                score += 1;
              }
            }
          }
          if (score > 0) candidates.push({ r, c, score });
        }
      }
    }

    if (candidates.length > 0) {
      candidates.sort((a, b) => b.score - a.score);
      return candidates[0];
    }
    return { r: 7, c: 7 };
  };

  // Human player clicks cell
  const handleCellClick = (r: number, c: number) => {
    if (board[r][c] || winner || aiThinking) return;

    if (!isSoloOrAi && turn !== currentPlayer.id) {
      return; // not your turn in multiplayer
    }

    soundManager.playStone();

    const sym = mySymbol;
    const nextBoard = board.map((row) => [...row]);
    nextBoard[r][c] = sym;
    setBoard(nextBoard);
    setLastMove({ row: r, col: c, symbol: sym });

    const isWin = checkWin(nextBoard, r, c, sym);

    if (isSoloOrAi) {
      if (isWin) {
        setWinner(currentPlayer.id);
        soundManager.playVictory();
        recordGameResult(true);
        updateUserCoins(1000);
        confetti({ particleCount: 70, spread: 60 });
        speakCommentary('Chúc mừng bạn đã giành chiến thắng ngoạn mục với nước cờ 5 quân thẳng hàng!');
        return;
      }

      // Switch to AI turn
      setTurn('ai_bot');
      setAiThinking(true);

      setTimeout(() => {
        const aiMove = getBestAiMove(nextBoard);
        nextBoard[aiMove.r][aiMove.c] = 'O';
        setBoard(nextBoard);
        setLastMove({ row: aiMove.r, col: aiMove.c, symbol: 'O' });
        soundManager.playStone();
        setAiThinking(false);

        if (checkWin(nextBoard, aiMove.r, aiMove.c, 'O')) {
          setWinner('ai_bot');
          soundManager.playDefeat();
          recordGameResult(false);
          speakCommentary('Kỳ Thủ AI đã giành chiến thắng! Đừng nản lòng, hãy phục thù ván tiếp theo!');
        } else {
          setTurn(currentPlayer.id);
        }
      }, 600);
    } else {
      // Send move to multiplayer socket
      gameSocket.sendCaroMove({
        roomId: room.id,
        row: r,
        col: c,
        playerId: currentPlayer.id,
      });
    }
  };

  // Gemini TTS speech commentary
  const speakCommentary = async (text: string) => {
    try {
      setIsSpeaking(true);
      setCommentary(text);
      const res = await api.textToSpeech(text, 'Hào hứng, sôi nổi như bình luận viên cờ vua và eSports Việt Nam', 'Puck');
      if (res.audioBase64) {
        await soundManager.playWavBase64(res.audioBase64);
      }
    } catch {
      // TTS error fallback
    } finally {
      setIsSpeaking(false);
    }
  };

  // Ask AI Master for advice
  const requestAdvice = async () => {
    soundManager.playClick();
    setCommentary('Bình Luận Viên đang phân tích thế trận...');
    try {
      const advice = await api.getGameAdvice('Cờ Caro', {
        mySymbol,
        lastMove,
        turn,
      });
      speakCommentary(advice);
    } catch {
      speakCommentary('Hãy tập trung quan sát đường chéo của đối thủ và tạo thế cờ đôi!');
    }
  };

  const handleRestart = () => {
    soundManager.playClick();
    const freshBoard = Array(15).fill(null).map(() => Array(15).fill(null));
    setBoard(freshBoard);
    setWinner(null);
    setLastMove(null);
    setTurn(currentPlayer.id);
    if (!isSoloOrAi) {
      gameSocket.requestRematch({ roomId: room.id });
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 max-w-6xl mx-auto py-2">
      {/* Left Board Area */}
      <div className="flex-1 flex flex-col items-center">
        {/* Match Header Info */}
        <div className="w-full max-w-xl flex items-center justify-between mb-3 px-3 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          {/* Player 1 (Me) */}
          <div
            className={`flex items-center gap-2 p-1.5 px-3 rounded-xl transition ${
              turn === currentPlayer.id
                ? 'bg-amber-500/20 border border-amber-500 text-amber-300 font-bold shadow-sm'
                : 'text-slate-400'
            }`}
          >
            <span className="text-xl">{currentPlayer.avatar}</span>
            <div className="text-left">
              <div className="text-xs font-bold">{currentPlayer.username} (Bạn)</div>
              <div className="text-[10px] text-red-400 font-black">Quân X</div>
            </div>
          </div>

          <div className="text-center">
            <span className="text-xs font-black px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              VS
            </span>
          </div>

          {/* Player 2 (Opponent / AI) */}
          <div
            className={`flex items-center gap-2 p-1.5 px-3 rounded-xl transition ${
              turn !== currentPlayer.id
                ? 'bg-cyan-500/20 border border-cyan-500 text-cyan-300 font-bold shadow-sm'
                : 'text-slate-400'
            }`}
          >
            <div className="text-right">
              <div className="text-xs font-bold">{opponentPlayer.username}</div>
              <div className="text-[10px] text-cyan-400 font-black">Quân O</div>
            </div>
            <span className="text-xl">{opponentPlayer.avatar}</span>
          </div>
        </div>

        {/* 15x15 Caro Board Container (Mobile Responsive with smooth horizontal scrolling) */}
        <div className="w-full max-w-full overflow-x-auto pb-2 scrollbar-thin">
          <div className="inline-block min-w-max p-2.5 sm:p-4 rounded-3xl bg-amber-950/40 border-2 border-amber-700/50 shadow-2xl shadow-amber-950/80 backdrop-blur-md mx-auto">
            <div
              className="gap-0.5 sm:gap-1 bg-amber-900/60 p-1 sm:p-2 rounded-2xl border border-amber-700/60"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(15, minmax(22px, 32px))',
              }}
            >
              {board.map((row, rIdx) =>
                row.map((cell, cIdx) => {
                  const isLast = lastMove?.row === rIdx && lastMove?.col === cIdx;
                  return (
                    <button
                      key={`${rIdx}-${cIdx}`}
                      onClick={() => handleCellClick(rIdx, cIdx)}
                      disabled={!!cell || !!winner || aiThinking}
                      className={`w-[22px] h-[22px] sm:w-8 sm:h-8 flex items-center justify-center font-black text-[11px] sm:text-base rounded sm:rounded-md transition-all select-none ${
                        cell === 'X'
                          ? 'bg-rose-950/90 text-rose-400 border border-rose-500/70 font-extrabold shadow-sm'
                          : cell === 'O'
                          ? 'bg-cyan-950/90 text-cyan-300 border border-cyan-500/70 font-extrabold shadow-sm'
                          : 'bg-amber-900/30 hover:bg-amber-700/40 cursor-pointer border border-amber-800/30 active:scale-95'
                      } ${isLast ? 'ring-2 ring-amber-400 animate-pulse' : ''}`}
                    >
                      {cell}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Status / Win Announcement */}
        {winner && (
          <div className="mt-4 p-4 w-full max-w-xl rounded-2xl bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-red-500/20 border border-amber-500/40 text-center animate-bounce">
            <Trophy className="w-8 h-8 text-amber-400 mx-auto mb-1" />
            <h3 className="text-lg font-black text-amber-300">
              {winner === currentPlayer.id ? '🎉 BẠN ĐÃ CHIẾN THẮNG! (+1,000 XU)' : '⚡ KỲ THỦ ĐỐI THỦ THẮNG!'}
            </h3>
            <button
              onClick={handleRestart}
              className="mt-2.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition cursor-pointer"
            >
              Chơi Ván Mới
            </button>
          </div>
        )}
      </div>

      {/* Right Sidebar Controls & AI Commentary */}
      <div className="w-full lg:w-80 space-y-4">
        {/* Gemini AI Voice Commentary Card */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-violet-500/30 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-violet-400">
              <Sparkles className="w-4 h-4" />
              <span>Bình Luận Viên AI (Gemini 3.8 Flash TTS)</span>
            </div>
            {isSpeaking && <span className="text-[10px] text-emerald-400 animate-pulse font-semibold">Đang nói...</span>}
          </div>

          <p className="text-xs text-slate-200 leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800 mb-3 min-h-[60px]">
            "{commentary}"
          </p>

          <div className="flex gap-2">
            <button
              onClick={requestAdvice}
              className="flex-1 py-2 px-3 rounded-xl bg-violet-600/30 hover:bg-violet-600/50 border border-violet-500/40 text-violet-200 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Xin Lời Khuyên Nước Cờ</span>
            </button>
            <button
              onClick={() => speakCommentary(commentary)}
              disabled={isSpeaking}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
              title="Nghe lại bình luận giọng nói"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Room & Game Info */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs space-y-2">
          <div className="flex justify-between text-slate-400">
            <span>Mã phòng:</span>
            <span className="font-mono font-bold text-amber-400">{room.code}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Chế độ:</span>
            <span className="font-semibold text-slate-200">{isSoloOrAi ? 'Đấu với Kỳ Thủ AI' : 'Đấu Online 1v1'}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Luật chơi:</span>
            <span className="font-semibold text-slate-200">5 quân thẳng hàng bất kỳ</span>
          </div>

          <div className="pt-2 border-t border-slate-800 flex gap-2">
            <button
              onClick={handleRestart}
              className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition cursor-pointer flex items-center justify-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Chơi lại</span>
            </button>
            <button
              onClick={onLeave}
              className="px-3 py-2 rounded-xl bg-rose-950/40 border border-rose-800/40 hover:bg-rose-900/50 text-rose-300 font-semibold text-xs transition cursor-pointer"
            >
              Rời bàn
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
