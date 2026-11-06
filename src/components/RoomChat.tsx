import React, { useState, useRef, useEffect } from 'react';
import { Send, Smile, MessageCircle } from 'lucide-react';
import { ChatMessage, RoomPlayer } from '../types';
import { soundManager } from '../services/audio';

interface RoomChatProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  currentPlayerId: string;
}

const QUICK_EMOTES = [
  'Gáy khét 🔥',
  'Cay thế nhờ 🥲',
  'Nước đi cao tay! 🧠',
  'Tất tay luôn!',
  'Cứ từ từ thôi ae 😉',
  'GG ván đấu hay!',
  'Ảo ma thực sự 🪄',
  'Xin ván nữa!',
];

export const RoomChat: React.FC<RoomChatProps> = ({ messages, onSendMessage, currentPlayerId }) => {
  const [inputText, setInputText] = useState('');
  const [showEmotes, setShowEmotes] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    soundManager.playClick();
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleQuickEmote = (emote: string) => {
    soundManager.playClick();
    onSendMessage(emote);
    setShowEmotes(false);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950/70 rounded-2xl border border-slate-800/80 overflow-hidden">
      {/* Header */}
      <div className="px-3.5 py-2.5 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
          <MessageCircle className="w-3.5 h-3.5 text-amber-400" />
          <span>Kênh Chat Bàn Đấu</span>
        </div>
        <button
          type="button"
          onClick={() => setShowEmotes(!showEmotes)}
          className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold cursor-pointer"
        >
          <Smile className="w-3.5 h-3.5" />
          <span>Biểu cảm</span>
        </button>
      </div>

      {/* Quick Emotes Panel */}
      {showEmotes && (
        <div className="p-2 bg-slate-900 border-b border-slate-800 grid grid-cols-2 gap-1.5 animate-fade-in text-[11px]">
          {QUICK_EMOTES.map((em, idx) => (
            <button
              key={idx}
              onClick={() => handleQuickEmote(em)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-left transition truncate"
            >
              {em}
            </button>
          ))}
        </div>
      )}

      {/* Message List */}
      <div className="flex-1 p-3 overflow-y-auto space-y-2 text-xs">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-500 text-[11px] italic">
            Chưa có tin nhắn nào. Hãy gửi lời chào đến mọi người!
          </div>
        ) : (
          messages.map((m) => {
            const isMe = m.senderId === currentPlayerId;
            return (
              <div
                key={m.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                {!isMe && (
                  <span className="text-[10px] text-slate-400 font-semibold mb-0.5 flex items-center gap-1">
                    <span>{m.senderAvatar}</span>
                    <span>{m.senderName}</span>
                  </span>
                )}
                <div
                  className={`px-3 py-1.5 rounded-xl max-w-[85%] break-words leading-relaxed ${
                    isMe
                      ? 'bg-amber-500 text-slate-950 font-medium rounded-tr-none'
                      : 'bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-2 bg-slate-900 border-t border-slate-800 flex items-center gap-1.5">
        <input
          type="text"
          placeholder="Nhập tin nhắn..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          maxLength={100}
          className="flex-1 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-amber-500"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="p-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold transition cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
