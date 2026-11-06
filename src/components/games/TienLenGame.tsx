import React, { useState, useEffect } from 'react';
import { Volume2, Sparkles, Trophy, ArrowRight, ShieldAlert, Award } from 'lucide-react';
import confetti from 'canvas-confetti';
import { GameRoom, PlayingCard, RoomPlayer } from '../../types';
import { soundManager } from '../../services/audio';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface TienLenGameProps {
  room: GameRoom;
  currentPlayer: RoomPlayer;
  onLeave: () => void;
}

const SUIT_ICONS: { [k in PlayingCard['suit']]: { icon: string; color: string; label: string } } = {
  spades: { icon: '♠', color: 'text-slate-100', label: 'Bích' },
  clubs: { icon: '♣', color: 'text-slate-100', label: 'Chuồn' },
  diamonds: { icon: '♦', color: 'text-red-500', label: 'Rô' },
  hearts: { icon: '♥', color: 'text-red-500', label: 'Cơ' },
};

const VALUE_LABELS: { [v: number]: string } = {
  3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9', 10: '10',
  11: 'J', 12: 'Q', 13: 'K', 14: 'A', 15: '2',
};

export const TienLenGame: React.FC<TienLenGameProps> = ({ room, currentPlayer, onLeave }) => {
  const { updateUserCoins, recordGameResult } = useAuth();
  const [myHand, setMyHand] = useState<PlayingCard[]>([]);
  const [botHands, setBotHands] = useState<{ [id: string]: number }>({
    bot1: 13,
    bot2: 13,
    bot3: 13,
  });
  const [selectedCardIds, setSelectedCardIds] = useState<Set<string>>(new Set());
  const [tableCards, setTableCards] = useState<{
    playerId: string;
    playerName: string;
    cards: PlayingCard[];
    description: string;
  } | null>(null);
  const [turnPlayerId, setTurnPlayerId] = useState<string>(currentPlayer.id);
  const [passedPlayerIds, setPassedPlayerIds] = useState<string[]>([]);
  const [finishedOrder, setFinishedOrder] = useState<string[]>([]);
  const [commentary, setCommentary] = useState<string>('Ván bài Tiến Lên Miền Nam bắt đầu! Ai cầm 3 Bích đánh trước.');
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Initialize hand for human & bots
  useEffect(() => {
    initDeckAndDeal();
  }, []);

  const initDeckAndDeal = () => {
    const suits: PlayingCard['suit'][] = ['spades', 'clubs', 'diamonds', 'hearts'];
    const deck: PlayingCard[] = [];
    for (let v = 3; v <= 15; v++) {
      for (const s of suits) {
        deck.push({ suit: s, value: v, id: `${v}_${s}` });
      }
    }
    // Shuffle
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    // Deal 13 to player
    const sortedHand = deck.slice(0, 13).sort((a, b) => a.value - b.value);
    setMyHand(sortedHand);
    setBotHands({ bot1: 13, bot2: 13, bot3: 13 });
    setSelectedCardIds(new Set());
    setTableCards(null);
    setPassedPlayerIds([]);
    setFinishedOrder([]);
    setTurnPlayerId(currentPlayer.id);
  };

  const toggleSelectCard = (id: string) => {
    soundManager.playClick();
    setSelectedCardIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Human plays selected cards
  const handlePlayCards = () => {
    if (turnPlayerId !== currentPlayer.id) return;
    if (selectedCardIds.size === 0) return;

    const cardsToPlay = myHand.filter((c) => selectedCardIds.has(c.id));
    soundManager.playCard();

    // Check combo description
    let desc = 'Đánh bài';
    if (cardsToPlay.length === 1 && cardsToPlay[0].value === 15) desc = '🔥 Heo quyền lực!';
    if (cardsToPlay.length === 2 && cardsToPlay[0].value === cardsToPlay[1].value) desc = 'Đôi';
    if (cardsToPlay.length === 4 && cardsToPlay[0].value === cardsToPlay[3].value) desc = '⚡ Tứ Quý Chặt Heo!';

    setTableCards({
      playerId: currentPlayer.id,
      playerName: currentPlayer.username,
      cards: cardsToPlay,
      description: desc,
    });

    const remainingHand = myHand.filter((c) => !selectedCardIds.has(c.id));
    setMyHand(remainingHand);
    setSelectedCardIds(new Set());

    // Check if player finished
    if (remainingHand.length === 0) {
      setFinishedOrder((prev) => [...prev, currentPlayer.id]);
      soundManager.playVictory();
      recordGameResult(true);
      updateUserCoins(5000);
      confetti({ particleCount: 70, spread: 70 });
      speakAnnouncement('Tới nhất! Chúc mừng bạn đã về nhất ván đấu Tiến Lên xuất sắc!');
      return;
    }

    // Switch turn to bots
    runBotsTurn(cardsToPlay);
  };

  // Human passes turn
  const handlePass = () => {
    if (turnPlayerId !== currentPlayer.id) return;
    soundManager.playDefeat();
    setPassedPlayerIds((prev) => [...prev, currentPlayer.id]);
    runBotsTurn(tableCards?.cards || []);
  };

  // Simple simulated bots play
  const runBotsTurn = (lastCards: PlayingCard[]) => {
    setTurnPlayerId('bot1');
    setTimeout(() => {
      // Bot 1
      setBotHands((prev) => ({ ...prev, bot1: Math.max(0, prev.bot1 - 1) }));
      soundManager.playCard();

      setTimeout(() => {
        // Bot 2
        setTurnPlayerId('bot2');
        setBotHands((prev) => ({ ...prev, bot2: Math.max(0, prev.bot2 - 1) }));
        soundManager.playCard();

        setTimeout(() => {
          // Bot 3
          setTurnPlayerId('bot3');
          setBotHands((prev) => ({ ...prev, bot3: Math.max(0, prev.bot3 - 1) }));
          soundManager.playCard();

          // Return to human
          setTimeout(() => {
            setTurnPlayerId(currentPlayer.id);
            setPassedPlayerIds([]);
          }, 600);
        }, 600);
      }, 600);
    }, 600);
  };

  const speakAnnouncement = async (text: string) => {
    try {
      setIsSpeaking(true);
      setCommentary(text);
      const res = await api.textToSpeech(text, 'Hào hứng, sôi nổi như bình luận viên bài Tiến Lên Miền Nam', 'Puck');
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
      {/* Game Table Area */}
      <div className="flex-1 flex flex-col items-center">
        {/* Table Felt Green Arena */}
        <div className="w-full max-w-3xl bg-emerald-950/70 border-4 border-amber-900/80 rounded-3xl p-4 sm:p-6 shadow-2xl relative min-h-[460px] flex flex-col justify-between overflow-hidden">
          {/* Top Bot (Bot 2) */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700 text-xs">
              <span>🤖 Cao Thủ Nam Định</span>
              <span className="font-bold text-amber-400">({botHands.bot2} lá)</span>
              {turnPlayerId === 'bot2' && <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>}
            </div>
          </div>

          {/* Middle Row: Bot 1 (Left), Played Cards (Center), Bot 3 (Right) */}
          <div className="flex items-center justify-between gap-2 my-auto">
            {/* Left Bot 1 */}
            <div className="flex flex-col items-center">
              <div className="px-2.5 py-1 rounded-xl bg-slate-900/80 border border-slate-700 text-xs text-center">
                <span>🤖 Thần Bài Sài Gòn</span>
                <div className="font-bold text-amber-400 text-[11px]">{botHands.bot1} lá</div>
              </div>
            </div>

            {/* Center Table Played Cards */}
            <div className="flex flex-col items-center justify-center p-4 min-h-[140px] bg-emerald-900/40 rounded-2xl border border-emerald-700/40 w-64 shadow-inner">
              {tableCards ? (
                <>
                  <div className="flex items-center -space-x-4 mb-2">
                    {tableCards.cards.map((c) => {
                      const suit = SUIT_ICONS[c.suit];
                      return (
                        <div
                          key={c.id}
                          className="w-12 h-18 sm:w-14 sm:h-20 bg-white rounded-xl shadow-lg border border-slate-300 flex flex-col justify-between p-1.5 transform hover:-translate-y-1 transition select-none"
                        >
                          <div className={`font-black text-xs ${suit.color}`}>
                            {VALUE_LABELS[c.value]}
                          </div>
                          <div className={`text-xl sm:text-2xl text-center ${suit.color}`}>
                            {suit.icon}
                          </div>
                          <div className={`font-black text-xs self-end ${suit.color}`}>
                            {VALUE_LABELS[c.value]}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <span className="text-[11px] font-bold text-amber-300">
                    {tableCards.playerName}: {tableCards.description}
                  </span>
                </>
              ) : (
                <span className="text-xs text-emerald-300/60 italic">Bàn đang trống lượt mới</span>
              )}
            </div>

            {/* Right Bot 3 */}
            <div className="flex flex-col items-center">
              <div className="px-2.5 py-1 rounded-xl bg-slate-900/80 border border-slate-700 text-xs text-center">
                <span>🤖 Bá Vương Hà Nội</span>
                <div className="font-bold text-amber-400 text-[11px]">{botHands.bot3} lá</div>
              </div>
            </div>
          </div>

          {/* Bottom Area: Human Player Hand */}
          <div className="flex flex-col items-center mt-2">
            {/* Turn notification */}
            <div className="mb-2">
              {turnPlayerId === currentPlayer.id ? (
                <span className="px-3 py-1 rounded-full bg-amber-500 text-slate-950 font-black text-xs shadow-md animate-pulse">
                  👉 Lượt Của Bạn! Chọn bài để ra
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs">
                  Đang đợi đối thủ ra bài...
                </span>
              )}
            </div>

            {/* 13 Hand Cards with overlap & mobile touch scroll */}
            <div className="w-full max-w-full overflow-x-auto pb-4 scrollbar-none">
              <div className="min-w-max flex items-center justify-center -space-x-4 sm:-space-x-6 px-4 py-2 mx-auto">
                {myHand.map((c) => {
                  const suit = SUIT_ICONS[c.suit];
                  const isSelected = selectedCardIds.has(c.id);
                  return (
                    <button
                      key={c.id}
                      onClick={() => toggleSelectCard(c.id)}
                      className={`w-11 h-16 sm:w-16 sm:h-24 bg-white rounded-xl shadow-xl border-2 transition-transform cursor-pointer select-none flex flex-col justify-between p-1 sm:p-1.5 ${
                        isSelected
                          ? '-translate-y-4 sm:-translate-y-5 border-amber-500 ring-2 ring-amber-400 z-10'
                          : 'border-slate-300 hover:-translate-y-2'
                      }`}
                    >
                      <div className={`font-black text-[11px] sm:text-sm ${suit.color}`}>
                        {VALUE_LABELS[c.value]}
                      </div>
                      <div className={`text-base sm:text-3xl text-center ${suit.color}`}>
                        {suit.icon}
                      </div>
                      <div className={`font-black text-[10px] sm:text-sm self-end ${suit.color}`}>
                        {VALUE_LABELS[c.value]}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 mt-3">
              <button
                onClick={handlePlayCards}
                disabled={turnPlayerId !== currentPlayer.id || selectedCardIds.size === 0}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 disabled:opacity-40 text-slate-950 font-black text-xs transition cursor-pointer shadow-md"
              >
                Đánh Bài ({selectedCardIds.size})
              </button>
              <button
                onClick={handlePass}
                disabled={turnPlayerId !== currentPlayer.id}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 font-bold text-xs transition cursor-pointer"
              >
                Bỏ Lượt
              </button>
              <button
                onClick={initDeckAndDeal}
                className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs transition"
              >
                Chia Lại
              </button>
            </div>
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
              <span>Bình Luận Viên Tiến Lên</span>
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
            <span>Phát Bình Luận Giọng Nói</span>
          </button>
        </div>

        {/* Quick Rules */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs space-y-2">
          <h4 className="font-bold text-slate-200 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-400" />
            <span>Luật Chặt Heo Tiến Lên Miền Nam</span>
          </h4>
          <ul className="space-y-1 text-slate-400 leading-relaxed text-[11px] list-disc list-inside">
            <li>Tứ quý chặt được: 1 con heo, đôi heo, hoặc 3 đôi thông bé hơn.</li>
            <li>3 đôi thông chặt được: 1 con heo hoặc 3 đôi thông bé hơn (không cần vòng).</li>
            <li>4 đôi thông chặt được: đôi heo, tứ quý, 3 đôi thông (bất chấp vòng).</li>
            <li>Heo cơ là quân bài quyền lực lớn nhất bộ bài!</li>
          </ul>
        </div>

        {/* Leave Game */}
        <button
          onClick={onLeave}
          className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition cursor-pointer"
        >
          Rời bàn Tiến Lên
        </button>
      </div>
    </div>
  );
};
