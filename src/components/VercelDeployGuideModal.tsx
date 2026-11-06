import React, { useState } from 'react';
import { X, Github, Globe, Check, Copy, Terminal, ExternalLink, ShieldCheck } from 'lucide-react';
import { soundManager } from '../services/audio';

interface VercelDeployGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VercelDeployGuideModal: React.FC<VercelDeployGuideModalProps> = ({ isOpen, onClose }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, index: number) => {
    soundManager.playClick();
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const steps = [
    {
      title: 'Bước 1: Tải mã nguồn & Đẩy lên GitHub Repository',
      desc: 'Mở terminal tại thư mục dự án và thực hiện các lệnh sau để đẩy lên GitHub của bạn:',
      cmd: `git init\ngit add .\ngit commit -m "feat: VietPlay Arena - Cổng game nhiều người Việt Nam"\ngit branch -M main\ngit remote add origin https://github.com/USERNAME/vietplay-arena.git\ngit push -u origin main`,
    },
    {
      title: 'Bước 2: Kết nối GitHub với Vercel',
      desc: 'Truy cập https://vercel.com/new và chọn "Import" repository vừa tạo từ tài khoản GitHub của bạn.',
      cmd: `Framework Preset: Vite\nBuild Command: npm run build\nOutput Directory: dist`,
    },
    {
      title: 'Bước 3: Cấu hình Biến môi trường (Environment Variables)',
      desc: 'Trong mục Environment Variables trên Vercel, thêm API key của bạn:',
      cmd: `GEMINI_API_KEY = "Khóa_Gemini_Của_Bạn"`,
    },
    {
      title: 'Bước 4: Gán tên miền riêng của bạn (Custom Domain)',
      desc: 'Sau khi bấm Deploy thành công, vào mục Settings > Domains trên Vercel:',
      cmd: `Thêm tên miền của bạn (ví dụ: gameviet.vn hoặc play.yourdomain.com)\nTrỏ bản ghi CNAME về: cname.vercel-dns.com\nHoặc bản ghi A về: 76.76.21.21`,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden p-6 max-h-[90vh] flex flex-col">
        <button
          onClick={() => {
            soundManager.playClick();
            onClose();
          }}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            Sẵn sàng triển khai 100%
          </div>
          <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            <Github className="w-5 h-5" />
            <span>Hướng Dẫn Đưa Lên GitHub & Chạy Tên Miền Riêng Trên Vercel</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Dự án đã có sẵn file cấu hình <code className="text-amber-400 font-mono">vercel.json</code>, build Vite tối ưu mượt mà và bảo mật.
          </p>
        </div>

        {/* Steps List */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {steps.map((st, idx) => (
            <div key={idx} className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <div className="flex items-center justify-between mb-1.5">
                <h3 className="font-bold text-sm text-slate-100">{st.title}</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                  {idx + 1}/4
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-3">{st.desc}</p>
              <div className="relative group">
                <pre className="p-3 rounded-xl bg-slate-900 text-amber-300 font-mono text-xs overflow-x-auto border border-slate-800 leading-relaxed whitespace-pre-wrap">
                  {st.cmd}
                </pre>
                <button
                  onClick={() => copyToClipboard(st.cmd, idx)}
                  className="absolute top-2 right-2 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 flex items-center gap-1 border border-slate-700 transition"
                >
                  {copiedIndex === idx ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Đã chép</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Sao chép</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Note */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Globe className="w-4 h-4 text-emerald-400" />
            <span>Tự động cấp SSL HTTPS miễn phí trọn đời bởi Vercel</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition"
          >
            Đã hiểu & Bắt đầu
          </button>
        </div>
      </div>
    </div>
  );
};
