import React, { useState, useEffect, useRef } from 'react';
import { X, Mic, MicOff, Volume2, Sparkles, MessageSquare, AlertCircle, Headphones } from 'lucide-react';
import { LiveVoiceClient } from '../services/liveVoice';
import { soundManager } from '../services/audio';
import { api } from '../services/api';

interface LiveVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LiveVoiceModal: React.FC<LiveVoiceModalProps> = ({ isOpen, onClose }) => {
  const [status, setStatus] = useState<string>('disconnected');
  const [statusMsg, setStatusMsg] = useState<string>('Bấm bắt đầu để trò chuyện với Bình Luận Viên AI');
  const [volume, setVolume] = useState<number>(0);
  const [transcripts, setTranscripts] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    {
      sender: 'ai',
      text: 'Xin chào hiệp khách! Tôi là Bình Luận Viên ảo của VietPlay. Hãy bật micro và trò chuyện cùng tôi về bất kỳ ván đấu nào nhé!',
    },
  ]);
  const [isTtsPlaying, setIsTtsPlaying] = useState<boolean>(false);
  const liveClientRef = useRef<LiveVoiceClient | null>(null);

  useEffect(() => {
    return () => {
      if (liveClientRef.current) {
        liveClientRef.current.disconnect();
      }
    };
  }, []);

  if (!isOpen) return null;

  const handleStartLive = async () => {
    soundManager.playClick();
    if (status === 'connected' || status === 'listening' || status === 'speaking') {
      liveClientRef.current?.disconnect();
      setStatus('disconnected');
      setStatusMsg('Đã ngắt kết nối.');
      return;
    }

    const client = new LiveVoiceClient({
      onStatusChange: (newStatus, msg) => {
        setStatus(newStatus);
        if (msg) setStatusMsg(msg);
      },
      onVolumeChange: (vol) => {
        setVolume(vol);
      },
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
    } catch {
      // Handled in callback
    }
  };

  // Quick fallback TTS demonstration using gemini-3.8-flash-tts
  const handleQuickVoicePrompt = async (phrase: string) => {
    soundManager.playClick();
    if (isTtsPlaying) return;
    setIsTtsPlaying(true);
    setStatusMsg('Đang tổng hợp giọng nói Gemini...');

    try {
      setTranscripts((prev) => [...prev, { sender: 'user', text: phrase }]);
      const res = await api.textToSpeech(phrase, 'Hào hứng, dí dỏm, phong cách bình luận viên eSports Việt Nam', 'Puck');
      if (res.audioBase64) {
        setTranscripts((prev) => [...prev, { sender: 'ai', text: phrase }]);
        setStatusMsg('Bình Luận Viên đang phát âm thanh...');
        await soundManager.playWavBase64(res.audioBase64);
      }
    } catch (err: any) {
      console.warn('TTS playback error:', err);
    } finally {
      setIsTtsPlaying(false);
      setStatusMsg('Sẵn sàng tiếp tục.');
    }
  };

  const isLiveActive = status === 'connected' || status === 'listening' || status === 'speaking';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-violet-500/30 rounded-3xl shadow-2xl overflow-hidden p-6">
        <button
          onClick={() => {
            soundManager.playClick();
            if (liveClientRef.current) liveClientRef.current.disconnect();
            onClose();
          }}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Gemini 3.8 Live API & TTS
          </div>
          <h2 className="text-xl font-black text-white tracking-tight">
            Trợ Lý Bình Luận Viên Giọng Nói Trực Tiếp
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Đàm thoại 2 chiều siêu tốc với AI Master tiếng Việt qua micro hoặc nghe giọng bình luận chuyên nghiệp!
          </p>
        </div>

        {/* Central Audio Visualizer Orb */}
        <div className="flex flex-col items-center justify-center py-6 bg-slate-950/70 rounded-2xl border border-slate-800 mb-5 relative overflow-hidden">
          {/* Animated glow circle */}
          <div
            className={`w-28 h-28 rounded-full flex items-center justify-center transition-all duration-300 ${
              isLiveActive
                ? 'bg-gradient-to-tr from-violet-600 to-fuchsia-500 shadow-2xl shadow-violet-500/50'
                : 'bg-slate-800 border-2 border-slate-700'
            }`}
            style={{
              transform: `scale(${1 + volume * 0.4})`,
            }}
          >
            {isLiveActive ? (
              <Mic className="w-12 h-12 text-white animate-pulse" />
            ) : (
              <Headphones className="w-12 h-12 text-slate-400" />
            )}
          </div>

          <div className="mt-4 text-center px-4">
            <div className="text-xs font-semibold text-slate-300 flex items-center justify-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  isLiveActive ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'
                }`}
              ></span>
              <span>{statusMsg}</span>
            </div>
          </div>
        </div>

        {/* Quick Suggestion Prompts */}
        <div className="mb-4">
          <div className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1">
            <MessageSquare className="w-3.5 h-3.5 text-violet-400" />
            <span>Thử nghe câu thoại bình luận mẫu (Gemini Flash TTS):</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[
              'Chào mừng các chiến binh đến với đấu trường VietPlay!',
              'Ván cờ Caro này căng thẳng quá, nước cờ chặn tam quá hiểm hóc!',
              'Bầu Cua mở bát rồi anh em ơi: 2 Bầu 1 Tôm đại thắng!',
              'Luật chặt heo Tiến Lên: Tứ quý chặt được đôi heo và 3 đôi thông!',
            ].map((phrase, idx) => (
              <button
                key={idx}
                onClick={() => handleQuickVoicePrompt(phrase)}
                disabled={isTtsPlaying}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] text-slate-200 transition text-left cursor-pointer hover:border-violet-500/50"
              >
                🔊 {phrase}
              </button>
            ))}
          </div>
        </div>

        {/* Live Conversation Transcript Box */}
        <div className="mb-5 max-h-36 overflow-y-auto p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-2 text-xs">
          {transcripts.map((t, idx) => (
            <div
              key={idx}
              className={`p-2 rounded-lg ${
                t.sender === 'ai'
                  ? 'bg-violet-950/40 border border-violet-800/40 text-violet-200'
                  : 'bg-slate-800 text-slate-200 ml-6 text-right'
              }`}
            >
              <span className="font-bold text-[10px] uppercase tracking-wider block opacity-70 mb-0.5">
                {t.sender === 'ai' ? '🤖 Bình Luận Viên AI' : '👤 Bạn'}
              </span>
              {t.text}
            </div>
          ))}
        </div>

        {/* Main Connect / Toggle Button */}
        <div className="flex gap-2">
          <button
            onClick={handleStartLive}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-lg ${
              isLiveActive
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                : 'bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white shadow-violet-600/30'
            }`}
          >
            {isLiveActive ? (
              <>
                <MicOff className="w-4 h-4" />
                <span>Tắt Đàm Thoại Micro</span>
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" />
                <span>Bật Đàm Thoại Giọng Nói Trực Tiếp (Live API)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
