import React, { useState, useEffect } from 'react';
import { X, Globe2, Flame, ExternalLink, RefreshCw, Sparkles, Trophy } from 'lucide-react';
import { api, TrendingResponse } from '../services/api';
import { soundManager } from '../services/audio';

interface TrendingNewsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TrendingNewsModal: React.FC<TrendingNewsModalProps> = ({ isOpen, onClose }) => {
  const [data, setData] = useState<TrendingResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTrending = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getTrendingGames();
      setData(res);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải tin tức game');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && !data) {
      fetchTrending();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-blue-500/30 rounded-3xl shadow-2xl overflow-hidden p-6 max-h-[90vh] flex flex-col">
        <button
          onClick={() => {
            soundManager.playClick();
            onClose();
          }}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Globe2 className="w-3.5 h-3.5" />
            Google Search Grounding (Gemini 3.8 Flash)
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                <span>Điểm Tin & Bảng Xếp Hạng Game Hot Việt Nam</span>
                <Flame className="w-5 h-5 text-orange-500" />
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Cập nhật thông tin thực tế từ Google Search về eSports, game dân gian & tựa game hot
              </p>
            </div>
            <button
              onClick={() => {
                soundManager.playClick();
                fetchTrending();
              }}
              disabled={loading}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="Làm mới tin tức"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {loading ? (
            <div className="py-16 text-center text-slate-400">
              <RefreshCw className="w-8 h-8 mx-auto animate-spin text-blue-400 mb-3" />
              <p className="text-sm font-semibold">Đang truy vấn Google Search bằng Gemini 3.8 Flash...</p>
              <p className="text-xs text-slate-500 mt-1">Tìm kiếm giải đấu eSports và xu hướng game Việt</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300 text-sm">
              {error}
            </div>
          ) : data ? (
            <>
              {/* Overview block */}
              {data.overview && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-slate-900 border border-blue-800/40 text-xs leading-relaxed text-slate-200">
                  <div className="flex items-center gap-1.5 font-bold text-blue-400 uppercase text-[10px] tracking-wider mb-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    Tổng quan thị trường game
                  </div>
                  {data.overview}
                </div>
              )}

              {/* Game Trend Articles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {data.articles.map((art, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-blue-500/40 transition group"
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {art.category}
                      </span>
                      <div className="flex items-center gap-1 text-xs font-black text-orange-400">
                        <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-500" />
                        <span>{art.hotness}/100</span>
                      </div>
                    </div>

                    <h4 className="font-bold text-slate-100 text-sm group-hover:text-blue-400 transition mb-1.5">
                      {art.title}
                    </h4>

                    <p className="text-xs text-slate-400 leading-relaxed mb-3">{art.summary}</p>

                    <div className="text-[10px] text-slate-500 flex items-center justify-between pt-2 border-t border-slate-900">
                      <span>Nguồn: {art.source || 'Google Search Data'}</span>
                      {art.url && (
                        <a
                          href={art.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-400 hover:underline flex items-center gap-0.5"
                        >
                          <span>Xem chi tiết</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Grounded Web Sources */}
              {data.groundingSources && data.groundingSources.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-800">
                  <div className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
                    <Globe2 className="w-3.5 h-3.5 text-blue-400" />
                    <span>Nguồn tìm kiếm thực tế (Google Search Grounding):</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {data.groundingSources.map((src, idx) => (
                      <a
                        key={idx}
                        href={src.uri}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] text-blue-300 hover:text-white transition flex items-center gap-1"
                      >
                        <span className="max-w-[200px] truncate">{src.title}</span>
                        <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};
