import React, { useState, useEffect } from 'react';
import { Volume2, Sparkles, Trophy, RotateCcw, Flame, History } from 'lucide-react';
import confetti from 'canvas-confetti';
import { GameRoom, BauCuaSymbol, RoomPlayer } from '../../types';
import { soundManager } from '../../services/audio';
import { api } from '../../services/api';
import { gameSocket } from '../../services/socket';
import { useAuth } from '../../context/AuthContext';

interface BauCuaGameProps {
  room: GameRoom;
  currentPlayer: RoomPlayer;
  onLeave: () => void;
}

const SYMBOLS: Array<{ key: BauCuaSymbol; label: string; icon: string; color: string }> = [
  { key: 'bau', label: 'Bầu', icon: '🍐', color: 'from-amber-600/30 to-yellow-600/20 border-amber-500/40' },
  { key: 'cua', label: 'Cua', icon: '🦀', color: 'from-rose-600/30 to-red-600/20 border-rose-500/40' },
  { key: 'tom', label: 'Tôm', icon: '🦐', color: 'from-orange-600/30 to-amber-600/20 border-orange-500/40' },
  { key: 'ca', label: 'Cá', icon: '🐟', color: 'from-cyan-600/30 to-blue-600/20 border-cyan-500/40' },
  { key: 'ga', label: 'Gà', icon: '🐓', color: 'from-red-600/30 to-orange-600/20 border-red-500/40' },
  { key: 'nai', label: 'Nai', icon: '🦌', color: 'from-emerald-600/30 to-teal-600/20 border-emerald-500/40' },
];

const CHIP_VALUES = [100, 500, 1000, 5000, 10000];

export const BauCuaGame: React.FC<BauCuaGameProps> = ({ room, currentPlayer, onLeave }) => {
  const { user, updateUserCoins, recordGameResult } = useAuth();
  const [selectedChip, setSelectedChip] = useState<number>(1000);
  const [bets, setBets] = useState<{ [key in BauCuaSymbol]?: number }>({});
  const [phase, setPhase] = useState<'betting' | 'shaking' | 'revealed'>('betting');
  const [diceResults, setDiceResults] = useState<[BauCuaSymbol, BauCuaSymbol, BauCuaSymbol]>(['bau', 'cua', 'tom']);
  const [history, setHistory] = useState<Array<[BauCuaSymbol, BauCuaSymbol, BauCuaSymbol]>>([
    ['bau', 'ca', 'ga'],
    ['cua', 'tom', 'nai'],
  ]);
  const [roundTimer, setRoundTimer] = useState<number>(15);
  const [commentary, setCommentary] = useState<string>('Mời quý khách đặt cược vào Bầu, Cua, Tôm, Cá, Gà, Nai!');
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [roundNetWin, setRoundNetWin] = useState<number | null>(null);

  // Sync state if room provided from server
  useEffect(() => {
    if (room.gameState?.phase) {
      setPhase(room.gameState.phase);
      if (room.gameState.diceResults) setDiceResults(room.gameState.diceResults);
      if (room.gameState.history) setHistory(room.gameState.history);
      if (room.gameState.roundTimer) setRoundTimer(room.gameState.roundTimer);
    }
  }, [room.gameState]);

  // Round countdown timer in solo/local mode
  useEffect(() => {
    let timer: any;
    if (phase === 'betting') {
      timer = setInterval(() => {
        setRoundTimer((prev) => {
          if (prev <= 1) {
            handleShakeBowl();
            return 15;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [phase, bets]);

  // Place bet on a symbol
  const handlePlaceBet = (sym: BauCuaSymbol) => {
    if (phase !== 'betting') return;
    if (!user || user.coins < selectedChip) {
      alert('Bạn không đủ VietCoins để cược!');
      return;
    }

    soundManager.playChip();
    updateUserCoins(-selectedChip);
    setBets((prev) => ({
      ...prev,
      [sym]: (prev[sym] || 0) + selectedChip,
    }));

    if (room.players.length > 1) {
      gameSocket.sendBauCuaBet({
        roomId: room.id,
        playerId: currentPlayer.id,
        symbol: sym,
        amount: selectedChip,
      });
    }
  };

  // Shake the bowl
  const handleShakeBowl = () => {
    if (phase !== 'betting') return;
    setPhase('shaking');
    soundManager.playDice();

    setTimeout(() => {
      const allSyms: BauCuaSymbol[] = ['bau', 'cua', 'tom', 'ca', 'ga', 'nai'];
      const d1 = allSyms[Math.floor(Math.random() * 6)];
      const d2 = allSyms[Math.floor(Math.random() * 6)];
      const d3 = allSyms[Math.floor(Math.random() * 6)];
      const newDices: [BauCuaSymbol, BauCuaSymbol, BauCuaSymbol] = [d1, d2, d3];

      setDiceResults(newDices);
      setPhase('revealed');
      setHistory((prev) => [newDices, ...prev.slice(0, 7)]);

      // Calculate payouts
      const diceCount: { [k in BauCuaSymbol]?: number } = {};
      newDices.forEach((s) => {
        diceCount[s] = (diceCount[s] || 0) + 1;
      });

      let netWin = 0;
      let totalBet = 0;
      for (const [s, amt] of Object.entries(bets) as [BauCuaSymbol, number][]) {
        totalBet += amt;
        const matches = diceCount[s] || 0;
        if (matches > 0) {
          // Refund initial bet + win multiple
          const winAmt = amt + amt * matches;
          netWin += winAmt;
        }
      }

      if (netWin > 0) {
        updateUserCoins(netWin);
        recordGameResult(true);
        soundManager.playVictory();
        confetti({ particleCount: 60, spread: 60 });
        setRoundNetWin(netWin - totalBet);
      } else if (totalBet > 0) {
        recordGameResult(false);
        soundManager.playDefeat();
        setRoundNetWin(-totalBet);
      }

      // Voice announcer with Gemini TTS
      const dLabels = newDices.map((d) => SYMBOLS.find((s) => s.key === d)?.label).join(', ');
      const announcement = `Bầu Cua mở bát: ${dLabels}! ${
        netWin > totalBet ? 'Chúc mừng các đại gia đã thắng lớn!' : 'Cơ hội cho ván tiếp theo!'
      }`;
      speakAnnouncement(announcement);

      // Auto start next round after 5 seconds
      setTimeout(() => {
        setBets({});
        setPhase('betting');
        setRoundNetWin(null);
        setRoundTimer(15);
      }, 5500);
    }, 2200);
  };

  const speakAnnouncement = async (text: string) => {
    try {
      setIsSpeaking(true);
      setCommentary(text);
      const res = await api.textToSpeech(text, 'Hào hứng, sôi nổi như nhà cái Bầu Cua dân gian Việt Nam chuyên nghiệp', 'Puck');
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
      {/* Main Table Area */}
      <div className="flex-1 flex flex-col items-center">
        {/* Header Bowl & Dice Plate */}
        <div className="w-full max-w-2xl bg-gradient-to-b from-amber-950/60 to-slate-950 rounded-3xl border-2 border-amber-600/40 p-4 shadow-2xl relative overflow-hidden mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
              <span>🎲 Bát Úp Bầu Cua</span>
              {phase === 'betting' && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-[11px]">
                  Cược còn: {roundTimer}s
                </span>
              )}
            </span>
            <button
              onClick={handleShakeBowl}
              disabled={phase !== 'betting'}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 disabled:opacity-40 text-slate-950 font-black text-xs transition cursor-pointer shadow-md"
            >
              {phase === 'betting' ? 'Lắc Bát Ngay' : phase === 'shaking' ? 'Đang Lắc Bát...' : 'Đang Mở Bát'}
            </button>
          </div>

          {/* Central Bowl / Dice Display */}
          <div className="h-32 flex items-center justify-center relative">
            {phase === 'shaking' ? (
              <div className="flex flex-col items-center animate-bounce">
                <div className="text-6xl animate-spin">🥣</div>
                <span className="text-xs font-bold text-amber-300 mt-2">Lắc lắc xóc xóc...</span>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                {diceResults.map((dice, idx) => {
                  const symInfo = SYMBOLS.find((s) => s.key === dice);
                  return (
                    <div
                      key={idx}
                      className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-900 to-yellow-600 border-2 border-amber-400 shadow-xl flex flex-col items-center justify-center p-1 transform transition hover:scale-105"
                    >
                      <span className="text-3xl">{symInfo?.icon}</span>
                      <span className="text-xs font-black text-amber-200 mt-1">{symInfo?.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Round net payout notification */}
          {roundNetWin !== null && (
            <div
              className={`p-2 rounded-xl text-center text-xs font-bold mt-1 ${
                roundNetWin >= 0
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
              }`}
            >
              {roundNetWin >= 0
                ? `🎉 Thắng +${roundNetWin.toLocaleString()} Xu!`
                : `Hụt -${Math.abs(roundNetWin).toLocaleString()} Xu. Chúc may mắn ván sau!`}
            </div>
          )}
        </div>

        {/* 6 Betting Boxes Grid (Mobile Friendly 3 columns) */}
        <div className="w-full max-w-2xl grid grid-cols-3 gap-2 sm:gap-3 mb-4">
          {SYMBOLS.map((sym) => {
            const myBet = bets[sym.key] || 0;
            return (
              <button
                key={sym.key}
                onClick={() => handlePlaceBet(sym.key)}
                disabled={phase !== 'betting'}
                className={`p-2.5 sm:p-4 rounded-2xl bg-gradient-to-b ${sym.color} border-2 hover:border-amber-400 transition-all flex flex-col items-center justify-center relative cursor-pointer group active:scale-95 shadow-md`}
              >
                {/* Placed Chip Badge */}
                {myBet > 0 && (
                  <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 px-1.5 sm:px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[9px] sm:text-[10px] shadow-sm animate-pulse">
                    {myBet >= 1000 ? `${myBet / 1000}k` : myBet}
                  </div>
                )}
                <span className="text-3xl sm:text-4xl group-hover:scale-110 transition-transform mb-1">{sym.icon}</span>
                <span className="text-xs sm:text-sm font-black text-slate-100">{sym.label}</span>
                <span className="text-[9px] sm:text-[10px] text-slate-400 mt-0.5">Ăn x1, x2, x3</span>
              </button>
            );
          })}
        </div>

        {/* Chip Selection Bar */}
        <div className="w-full max-w-2xl p-2.5 sm:p-3 bg-slate-900 rounded-2xl border border-slate-800 flex items-center justify-between gap-2 overflow-x-auto">
          <span className="text-xs font-semibold text-slate-400 hidden sm:inline shrink-0">Mức Cược:</span>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {CHIP_VALUES.map((val) => (
              <button
                key={val}
                onClick={() => {
                  soundManager.playClick();
                  setSelectedChip(val);
                }}
                className={`px-2.5 sm:px-3 py-1.5 rounded-xl font-black text-[11px] sm:text-xs transition cursor-pointer ${
                  selectedChip === val
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 scale-105'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                🪙 {val >= 1000 ? `${val / 1000}k` : val}
              </button>
            ))}
          </div>
          <div className="text-[11px] sm:text-xs font-bold text-amber-400 flex items-center gap-1 shrink-0">
            <span>Ví:</span>
            <span>{user?.coins.toLocaleString()} Xu</span>
          </div>
        </div>
      </div>

      {/* Right Sidebar: History & Gemini Announcer */}
      <div className="w-full lg:w-80 space-y-4">
        {/* Gemini AI Voice Announcer */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-amber-500/30 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
              <Sparkles className="w-4 h-4" />
              <span>Bình Luận Viên Bầu Cua (TTS Voice)</span>
            </div>
            {isSpeaking && <span className="text-[10px] text-emerald-400 animate-pulse font-semibold">Đang đọc...</span>}
          </div>

          <p className="text-xs text-slate-200 leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800 mb-3 min-h-[50px]">
            "{commentary}"
          </p>

          <button
            onClick={() => speakAnnouncement(commentary)}
            disabled={isSpeaking}
            className="w-full py-2 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <Volume2 className="w-4 h-4" />
            <span>Nghe Lại Lời Mở Bát</span>
          </button>
        </div>

        {/* History of Past Rounds */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-slate-300 mb-3">
            <History className="w-4 h-4 text-amber-400" />
            <span>Lịch Sử Kết Quả Các Ván Trước</span>
          </div>

          <div className="space-y-2">
            {history.map((h, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-slate-800/80">
                <span className="text-[10px] text-slate-500">Ván -{idx + 1}</span>
                <div className="flex items-center gap-2">
                  {h.map((sym, sIdx) => {
                    const info = SYMBOLS.find((s) => s.key === sym);
                    return (
                      <span key={sIdx} className="text-lg" title={info?.label}>
                        {info?.icon}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Exit Table */}
        <button
          onClick={onLeave}
          className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition cursor-pointer"
        >
          Rời bàn Bầu Cua
        </button>
      </div>
    </div>
  );
};
