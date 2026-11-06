import React, { useState, useEffect } from 'react';
import { Volume2, Sparkles, Trophy, Clock, CheckCircle2, XCircle, Award } from 'lucide-react';
import confetti from 'canvas-confetti';
import { GameRoom, RoomPlayer } from '../../types';
import { soundManager } from '../../services/audio';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface TriviaGameProps {
  room: GameRoom;
  currentPlayer: RoomPlayer;
  onLeave: () => void;
}

const QUESTIONS = [
  {
    q: 'Điền vào câu ca dao: "Bầu ơi thương lấy bí cùng, tuy rằng khác giống nhưng chung một..."?',
    options: ['Giàn', 'Cây', 'Nhà', 'Vườn'],
    correct: 0,
    note: 'Bài ca dao bất hủ về tinh thần đoàn kết đùm bọc của nhân dân Việt Nam.',
  },
  {
    q: 'Trong bộ môn Cờ Caro chuẩn, bao nhiêu quân cờ thẳng hàng thì giành chiến thắng?',
    options: ['3 quân', '4 quân', '5 quân', '6 quân'],
    correct: 2,
    note: '5 quân liên tiếp không bị chặn 2 đầu là điều kiện thắng kinh điển của cờ Caro.',
  },
  {
    q: 'Linh vật nào KHÔNG có mặt trong trò chơi Bầu Cua Tôm Cá truyền thống?',
    options: ['Con Tôm', 'Con Ngựa', 'Con Nai', 'Con Cá'],
    correct: 1,
    note: 'Bầu Cua Tôm Cá chỉ có: Bầu, Cua, Tôm, Cá, Gà và Nai.',
  },
  {
    q: 'Trong bài Tiến Lên Miền Nam, "Tứ Quý" có thể chặt được tổ hợp nào sau đây?',
    options: ['Đôi Heo', '3 Con Heo', '4 Đôi Thông', 'Sảnh Rồng'],
    correct: 0,
    note: 'Tứ quý chặt được 1 con heo, đôi heo hoặc 3 đôi thông bé hơn.',
  },
  {
    q: 'Thủ đô của nước Cộng hòa Xã hội Chủ nghĩa Việt Nam là thành phố nào?',
    options: ['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng'],
    correct: 0,
    note: 'Hà Nội là thủ đô ngàn năm văn hiến của Việt Nam.',
  },
];

export const TriviaGame: React.FC<TriviaGameProps> = ({ room, currentPlayer, onLeave }) => {
  const { updateUserCoins, recordGameResult } = useAuth();
  const [qIndex, setQIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [myScore, setMyScore] = useState(0);
  const [botScore, setBotScore] = useState(0);
  const [timer, setTimer] = useState(15);
  const [isAnswered, setIsAnswered] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [commentary, setCommentary] = useState('Đấu Trường Tri Thức bắt đầu! Hãy chọn đáp án nhanh nhất.');
  const [isSpeaking, setIsSpeaking] = useState(false);

  const currentQ = QUESTIONS[qIndex];

  // 15s timer per question
  useEffect(() => {
    if (gameOver || isAnswered) return;
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          handleTimeOut();
          return 15;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [qIndex, isAnswered, gameOver]);

  const handleTimeOut = () => {
    setIsAnswered(true);
    soundManager.playDefeat();
    setTimeout(() => nextQuestion(), 2000);
  };

  const handleChoose = (idx: number) => {
    if (isAnswered || gameOver) return;
    setSelectedOption(idx);
    setIsAnswered(true);

    const isCorrect = idx === currentQ.correct;
    if (isCorrect) {
      soundManager.playVictory();
      setMyScore((prev) => prev + timer * 10);
      speakCommentary(`Chính xác! ${currentQ.note}`);
    } else {
      soundManager.playDefeat();
      speakCommentary(`Tiếc quá, đáp án đúng phải là: ${currentQ.options[currentQ.correct]}!`);
    }

    // Bot random answer (70% accuracy)
    const botCorrect = Math.random() < 0.75;
    if (botCorrect) {
      setBotScore((prev) => prev + Math.floor(Math.random() * 5 + 8) * 10);
    }

    setTimeout(() => nextQuestion(), 2500);
  };

  const nextQuestion = () => {
    if (qIndex + 1 < QUESTIONS.length) {
      setQIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setTimer(15);
    } else {
      // Game Over
      setGameOver(true);
      const isWin = myScore >= botScore;
      if (isWin) {
        soundManager.playVictory();
        recordGameResult(true);
        updateUserCoins(5000);
        confetti({ particleCount: 80, spread: 70 });
        speakCommentary(`Xuất sắc! Bạn là Vua Tri Thức ván này với ${myScore} điểm! Nhận ngay 5.000 Xu.`);
      } else {
        soundManager.playDefeat();
        recordGameResult(false);
      }
    }
  };

  const speakCommentary = async (text: string) => {
    try {
      setIsSpeaking(true);
      setCommentary(text);
      const res = await api.textToSpeech(text, 'Hào hứng, cổ vũ sôi nổi như MC chương trình Vua Tiếng Việt', 'Puck');
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
    setQIndex(0);
    setSelectedOption(null);
    setMyScore(0);
    setBotScore(0);
    setTimer(15);
    setIsAnswered(false);
    setGameOver(false);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 max-w-6xl mx-auto py-2">
      {/* Question Arena */}
      <div className="flex-1 flex flex-col items-center">
        {/* Score Header */}
        <div className="w-full max-w-xl flex items-center justify-between p-3.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md mb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{currentPlayer.avatar}</span>
            <div>
              <div className="text-xs font-bold text-white">{currentPlayer.username}</div>
              <div className="text-xs font-black text-amber-400">Điểm: {myScore}</div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-xs font-black text-amber-400">
            <Clock className="w-3.5 h-3.5 text-orange-400 animate-spin" />
            <span>{timer}s</span>
          </div>

          <div className="flex items-center gap-2 text-right">
            <div>
              <div className="text-xs font-bold text-white">Bot Huỳnh Âu</div>
              <div className="text-xs font-black text-cyan-400">Điểm: {botScore}</div>
            </div>
            <span className="text-2xl">🤖</span>
          </div>
        </div>

        {/* Question Card */}
        {!gameOver ? (
          <div className="w-full max-w-xl p-6 rounded-3xl bg-slate-900 border-2 border-slate-800 shadow-2xl relative">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-3 font-semibold">
              <span>Câu hỏi {qIndex + 1}/{QUESTIONS.length}</span>
              <span className="text-amber-400 font-bold">Vua Tiếng Việt & Đố Vui</span>
            </div>

            <h3 className="text-base sm:text-lg font-black text-white leading-relaxed mb-6 min-h-[50px]">
              {currentQ.q}
            </h3>

            {/* 4 Answer Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              {currentQ.options.map((opt, idx) => {
                const isSelected = selectedOption === idx;
                const isCorrect = idx === currentQ.correct;
                let btnStyle = 'bg-slate-950 border-slate-800 hover:border-amber-400 text-slate-100';

                if (isAnswered) {
                  if (isCorrect) {
                    btnStyle = 'bg-emerald-950/80 border-emerald-500 text-emerald-300 ring-2 ring-emerald-400';
                  } else if (isSelected) {
                    btnStyle = 'bg-rose-950/80 border-rose-500 text-rose-300';
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleChoose(idx)}
                    disabled={isAnswered}
                    className={`p-4 rounded-2xl border-2 font-bold text-sm text-left transition-all cursor-pointer flex items-center justify-between ${btnStyle}`}
                  >
                    <span>{String.fromCharCode(65 + idx)}. {opt}</span>
                    {isAnswered && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                    {isAnswered && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-rose-400" />}
                  </button>
                );
              })}
            </div>

            {isAnswered && (
              <p className="p-3 rounded-xl bg-slate-950 text-xs text-slate-300 border border-slate-800 animate-fade-in">
                💡 <span className="font-semibold text-amber-400">Giải thích:</span> {currentQ.note}
              </p>
            )}
          </div>
        ) : (
          <div className="w-full max-w-xl p-8 rounded-3xl bg-slate-900 border-2 border-amber-500/40 text-center shadow-2xl animate-bounce">
            <Trophy className="w-12 h-12 text-amber-400 mx-auto mb-2" />
            <h3 className="text-xl font-black text-white mb-1">
              {myScore >= botScore ? '🎉 BẠN LÀ VUA TIẾNG VIỆT! (+5.000 Xu)' : '⚡ BOT ĐẠT ĐIỂM CAO HƠN!'}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Điểm số của bạn: <b className="text-amber-400">{myScore}</b> | Điểm Bot: <b className="text-cyan-400">{botScore}</b>
            </p>
            <button
              onClick={handleRestart}
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition cursor-pointer"
            >
              Chơi Lại Trận Mới
            </button>
          </div>
        )}
      </div>

      {/* Right Sidebar: AI Announcer */}
      <div className="w-full lg:w-80 space-y-4">
        {/* Gemini Voice Announcer */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-amber-500/30 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
              <Sparkles className="w-4 h-4" />
              <span>Bình Luận Viên Tri Thức (TTS)</span>
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

        <button
          onClick={onLeave}
          className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition cursor-pointer"
        >
          Rời Đấu Trường Tri Thức
        </button>
      </div>
    </div>
  );
};
