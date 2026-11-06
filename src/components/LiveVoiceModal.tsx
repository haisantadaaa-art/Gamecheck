import React, { useState, useEffect, useRef } from 'react';
import { X, Mic, MicOff, Volume2, Sparkles, MessageSquare, Send, Bot, RefreshCw, Radio } from 'lucide-react';
import { LiveVoiceClient } from '../services/liveVoice';
import { soundManager } from '../services/audio';
import { api } from '../services/api';

interface LiveVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameContext?: any;
}

export const LiveVoiceModal: React.FC<LiveVoiceModalProps> = ({ isOpen, onClose, gameContext }) => {
  const [activeEngine, setActiveEngine] = useState<'interactive' | 'live_ws'>('interactive');
  const [statusMsg, setStatusMsg] = useState<string>('Sẵn sàng đàm thoại cùng AI Master Huỳnh Âu!');
  const [volume, setVolume] = useState<number>(0);
  const [inputText, setInputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);

  const [transcripts, setTranscripts] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    {
      sender: 'ai',
      text: 'Xin chào hiệp khách! Tôi là AI Game Master & Bình Luận Viên ảo được lập trình bởi Huỳnh Âu. Hãy hỏi tôi bất kỳ điều gì về Cờ Caro, Bầu Cua, Tiến Lên, Ô Ăn Quan nhé!',
    },
  ]);

  const liveClientRef = useRef<LiveVoiceClient | null>(null);

  useEffect(() => {
    return () => {
      liveClientRef.current?.disconnect();
    };
  }, []);

  if (!isOpen) return null;

  // Send query to AI Master (Generates text + spoken audio with Gemini Flash & TTS)
  const handleAskMaster = async (queryText: string) => {
    if (!queryText.trim() || isLoading) return;
    soundManager.playClick();
    setIsLoading(true);
    setStatusMsg('AI Master đang suy nghĩ câu trả lời...');

    const userMsg = queryText.trim();
    setTranscripts((prev) => [...prev, { sender: 'user', text: userMsg }]);
    setInputText('');

    try {
      const res = await api.askLiveMaster(userMsg, gameContext);
      setTranscripts((prev) => [...prev, { sender: 'ai', text: res.replyText }]);

      if (res.audioBase64) {
        setIsPlayingAudio(true);
        setStatusMsg('Bình Luận Viên đang nói...');
        await soundManager.playWavBase64(res.audioBase64);
        setIsPlayingAudio(false);
      }
      setStatusMsg('Sẵn sàng tiếp tục.');
    } catch {
      setStatusMsg('Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setIsLoading(false);
      setIsPlayingAudio(false);
    }
  };

  // Toggle Live WebSocket Microphone Bridge (gemini-3.8-live)
  const handleToggleLiveMic = async () => {
    soundManager.playClick();
    if (activeEngine === 'live_ws') {
      liveClientRef.current?.disconnect();
      setActiveEngine('interactive');
      setStatusMsg('Đã chuyển sang chế độ Voice Master trực tuyến.');
      return;
    }

    setStatusMsg('Đang mở micro kết nối tới Gemini 3.8 Live API...');
    const client = new LiveVoiceClient({
      onStatusChange: (status, msg) => {
        if (msg) setStatusMsg(msg);
      },
      onVolumeChange: (vol) => setVolume(vol),
      onAiTranscript: (text) => {
        setTranscripts((prev) => [...prev, { sender: 'ai', text }]);
      },
      onUserTranscript: (text) => {
        setTranscripts((prev) => [...prev, { sender: 'user', text }]);
      },
    });

    liveClientRef.current = client;
    try {
      await client.connect();
      setActiveEngine('live_ws');
    } catch {
      setStatusMsg('Không thể mở micro trực tiếp. Đã tự động kích hoạt Voice Master trực tuyến 100% ổn định!');
      setActiveEngine('interactive');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-violet-500/40 rounded-3xl shadow-2xl overflow-hidden p-6 max-h-[92vh] flex flex-col">
        <button
          onClick={() => {
            soundManager.playClick();
            liveClientRef.current?.disconnect();
            onClose();
          }}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            <span>AI Master được lập trình bởi Huỳnh Âu</span>
          </div>
          <h2 className="text-xl font-black text-white tracking-tight">
            Trợ Lý Bình Luận Viên Giọng Nói Trực Tiếp
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Hỏi luật chơi, xin mẹo cờ hoặc nghe bình luận dí dỏm bằng giọng nói tiếng Việt tự nhiên!
          </p>
        </div>

        {/* Visualizer Orb */}
        <div className="flex flex-col items-center justify-center py-5 bg-slate-950/70 rounded-2xl border border-slate-800 mb-4 relative overflow-hidden">
          <div
            className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${
              isPlayingAudio || activeEngine === 'live_ws'
                ? 'bg-gradient-to-tr from-violet-600 via-fuchsia-600 to-amber-500 shadow-2xl shadow-violet-500/50 scale-110'
                : 'bg-slate-800 border-2 border-slate-700'
            }`}
            style={{
              transform: `scale(${1 + (isPlayingAudio ? 0.15 : volume * 0.4)})`,
            }}
          >
            {isPlayingAudio ? (
              <Volume2 className="w-10 h-10 text-white animate-pulse" />
            ) : activeEngine === 'live_ws' ? (
              <Mic className="w-10 h-10 text-white animate-bounce" />
            ) : (
              <Bot className="w-10 h-10 text-violet-400" />
            )}
          </div>

          <div className="mt-3 text-center px-4">
            <div className="text-xs font-semibold text-slate-300 flex items-center justify-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  isPlayingAudio || activeEngine === 'live_ws' ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'
                }`}
              ></span>
              <span>{statusMsg}</span>
            </div>
          </div>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="mb-3">
          <span className="text-[11px] font-semibold text-slate-400 mb-1.5 block">
            Gợi ý câu hỏi nhanh (Chạm để nghe AI Master trả lời):
          </span>
          <div className="flex flex-wrap gap-1.5">
            {[
              'Chào hỏi và giới thiệu cổng game Huỳnh Âu',
              'Tư vấn nước cờ Caro hiểm hóc nhất',
              'Bí quyết đặt cược Bầu Cua dễ trúng',
              'Giải thích luật chặt heo Tiến Lên',
            ].map((phrase, idx) => (
              <button
                key={idx}
                onClick={() => handleAskMaster(phrase)}
                disabled={isLoading || isPlayingAudio}
                className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] text-slate-200 transition cursor-pointer hover:border-violet-500/50 flex items-center gap-1"
              >
                <span>🔊</span>
                <span>{phrase}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Transcripts Log */}
        <div className="flex-1 overflow-y-auto p-3 bg-slate-950 rounded-2xl border border-slate-800/80 space-y-2 text-xs mb-3 min-h-[100px] max-h-40">
          {transcripts.map((t, idx) => (
            <div
              key={idx}
              className={`p-2 rounded-xl leading-relaxed ${
                t.sender === 'ai'
                  ? 'bg-violet-950/40 border border-violet-800/40 text-violet-200'
                  : 'bg-slate-800 text-slate-100 ml-6 text-right'
              }`}
            >
              <span className="font-bold text-[10px] uppercase tracking-wider block opacity-70 mb-0.5">
                {t.sender === 'ai' ? '🤖 AI Master Huỳnh Âu' : '👤 Bạn'}
              </span>
              {t.text}
            </div>
          ))}
        </div>

        {/* Input & Action Bar */}
        <div className="space-y-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAskMaster(inputText);
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              placeholder="Nhập câu hỏi để AI Master trả lời bằng giọng nói..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-violet-500"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white font-bold text-xs flex items-center gap-1 cursor-pointer shadow-md"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Hỏi</span>
            </button>
          </form>

          {/* Toggle Live Microphone */}
          <button
            onClick={handleToggleLiveMic}
            className={`w-full py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              activeEngine === 'live_ws'
                ? 'bg-rose-600 hover:bg-rose-500 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
            }`}
          >
            {activeEngine === 'live_ws' ? (
              <>
                <MicOff className="w-3.5 h-3.5" />
                <span>Tắt Micro Live Trực Tiếp</span>
              </>
            ) : (
              <>
                <Radio className="w-3.5 h-3.5 text-violet-400" />
                <span>Bật Chế Độ Micro Nói Chuyện Trực Tiếp (Live API)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
