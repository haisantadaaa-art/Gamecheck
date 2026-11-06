# 🎮 VietPlay Arena - Cổng Game Nhiều Người Việt Nam

> Nền tảng game trực tuyến nhiều người chơi thời gian thực với các tựa game dân gian và eSports hot nhất Việt Nam: **Cờ Caro (15x15)**, **Bầu Cua Tôm Cá**, **Tiến Lên Miền Nam (13 lá)**, **Cờ Cá Ngựa**. Tích hợp AI Game Master giọng nói trực tiếp (Gemini Live API & Gemini Flash TTS) và điểm tin Google Search Grounding.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

---

## ✨ Tính Năng Nổi Bật

- ⭕ **Cờ Caro (Gomoku)**: Bàn cờ 15x15 chuẩn thi đấu, hỗ trợ 1v1 online phòng chờ thời gian thực và chế độ luyện tập với Kỳ Thủ AI.
- 🎲 **Bầu Cua Tôm Cá**: Bàn cược 6 linh vật dân gian (Bầu, Cua, Tôm, Cá, Gà, Nai), bát úp lắc xúc xắc 3D, chọn mức cược VietCoins đa dạng và tính thưởng tự động.
- 🃏 **Tiến Lên Miền Nam**: Đấu bài 13 lá luật chuẩn (chặt heo, 3 đôi thông, 4 đôi thông, tứ quý), hỗ trợ 2-4 người chơi.
- 🐴 **Cờ Cá Ngựa**: Đua ngựa 4 màu rực rỡ, đổ xúc xắc 1 hoặc 6 để ra quân, cơ chế đá ngựa đối thủ về chuồng.
- ⚡ **Hệ Thống Đăng Nhập Nhanh (Fast Login 1-Chạm)**: Tạo nhanh tài khoản Khách, chọn Avatar linh vật Việt Nam, tặng 20.000 Xu tân thủ và rương quà điểm danh mỗi ngày.
- 🎙️ **Bình Luận Viên Giọng Nói (Gemini 3.8 Flash TTS)**: Phát giọng đọc bình luận dí dỏm, chuyên nghiệp trong trận đấu và khi mở bát.
- 🗣️ **Live AI Master (Gemini 3.8 Live API)**: Đàm thoại giọng nói 2 chiều siêu tốc qua micro.
- 🌐 **Tin Game Hot (Gemini 3.8 Flash + Google Search Grounding)**: Điểm tin giải đấu eSports và xu hướng game Việt theo thời gian thực.

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Môi Trường Cục Bộ

```bash
# 1. Cài đặt các gói phụ thuộc
npm install

# 2. Khởi chạy máy chủ phát triển
npm run dev
```
Mở trình duyệt tại: `http://localhost:3000`

---

## 🌐 Triển Khai Lên Vercel Với Tên Miền Riêng

Dự án đã có sẵn file cấu hình `vercel.json`.

1. **Đẩy mã nguồn lên GitHub của bạn**:
   ```bash
   git branch -M main
   git remote add origin https://github.com/USERNAME/vietplay-arena.git
   git push -u origin main
   ```
2. **Import vào Vercel**:
   - Truy cập [vercel.com/new](https://vercel.com/new), kết nối với GitHub và chọn repository `vietplay-arena`.
   - Thiết lập biến môi trường trong mục **Environment Variables**:
     `GEMINI_API_KEY` = `Khóa API Gemini của bạn`
   - Bấm **Deploy**.
3. **Gán Tên Miền Riêng (Custom Domain)**:
   - Trong dashboard dự án trên Vercel, vào **Settings > Domains**.
   - Thêm tên miền riêng của bạn (ví dụ `gameviet.vn` hoặc `play.yourdomain.com`).
   - Cập nhật bản ghi DNS (CNAME hoặc A record) theo hướng dẫn trên Vercel để được cấp chứng chỉ SSL HTTPS miễn phí.
