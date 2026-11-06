import express, { Request, Response } from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, Modality } from '@google/genai';
import dotenv from 'dotenv';
import {
  GameRoom,
  GameType,
  RoomPlayer,
  CaroState,
  BauCuaState,
  BauCuaSymbol,
  PlayingCard,
  TienLenState,
  CaNguaState,
  HorseColor,
  OAnQuanState,
  TriviaState,
  CommunityPost,
  CoinTransferRecord,
  FriendUser,
} from './src/types';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize GoogleGenAI server client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

/* ==========================================================================
   In-Memory Storage for Social & Community Features
   ========================================================================== */

let communityPosts: CommunityPost[] = [
  {
    id: 'post_1',
    authorId: 'user_huynhau',
    authorName: 'Huỳnh Âu (Developer)',
    authorAvatar: '👑',
    authorTitle: 'Nhà Phát Triển VietPlay',
    content:
      'Chào mừng tất cả anh em game thủ đến với VietPlay Arena! Game được lập trình bởi Huỳnh Âu với 6 tựa game hot nhất: Cờ Caro, Bầu Cua, Tiến Lên, Cờ Cá Ngựa, Ô Ăn Quan và Đấu Trường Tri Thức. Chúc anh em chơi vui và leo rank đỉnh cao!',
    likes: 42,
    isLiked: false,
    comments: [
      {
        id: 'cmt_1',
        authorName: 'Lạc Long Quân',
        authorAvatar: '🐉',
        text: 'Game mượt mà quá Huỳnh Âu ơi, âm thanh lắc Bầu Cua cực đã!',
        timestamp: Date.now() - 3600000,
      },
      {
        id: 'cmt_2',
        authorName: 'Bá Vương Hà Nội',
        authorAvatar: '⚡',
        text: 'Ai làm vài ván Cờ Caro không, phòng 1234 nhé anh em!',
        timestamp: Date.now() - 1800000,
      },
    ],
    timestamp: Date.now() - 7200000,
    gameTag: 'Thông Báo',
  },
  {
    id: 'post_2',
    authorId: 'user_99',
    authorName: 'Sơn Tinh Bất Bại',
    authorAvatar: '🔥',
    authorTitle: 'Cao Thủ Bầu Cua',
    content:
      'Vừa ăn trọn quả 3 Bầu nhân 3 tiền cược 50k Xu! Cảm ơn đại gia Huỳnh Âu đã tặng thưởng điểm danh cực uy tín.',
    likes: 19,
    isLiked: false,
    comments: [],
    timestamp: Date.now() - 1200000,
    gameTag: 'Bầu Cua Tôm Cá',
  },
];

let transferLogs: CoinTransferRecord[] = [];

/* ==========================================================================
   REST API Endpoints
   ========================================================================== */

// 1. Text-to-Speech using gemini-3.8-flash-tts
app.post('/api/tts', async (req: Request, res: Response) => {
  try {
    const { text, style, voiceName } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Thiếu nội dung văn bản' });
    }

    const speakerStyle = style || 'Hào hứng, dí dỏm như bình luận viên eSports Việt Nam chuyên nghiệp';
    const selectedVoice = voiceName || 'Puck';

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: text.slice(0, 350),
              speechMetadata: {
                style: speakerStyle,
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: selectedVoice },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      return res.status(500).json({ error: 'Không thể tạo âm thanh từ Gemini TTS' });
    }

    return res.json({ audioBase64: base64Audio, speaker: selectedVoice });
  } catch (error: any) {
    console.error('TTS error:', error);
    return res.status(500).json({ error: error.message || 'Lỗi xử lý giọng nói TTS' });
  }
});

// 2. Live AI Master Voice & Chat Assistant (Dual Engine)
app.post('/api/live-master/chat', async (req: Request, res: Response) => {
  try {
    const { message, gameContext } = req.body;
    const userPrompt = message || 'Hãy chào mừng người chơi và bình luận về phòng đấu hiện tại.';

    // Generate intelligent response from Gemini 3.8 Flash
    const textRes = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Bạn là "AI Game Master & Bình Luận Viên Trực Tiếp" của cổng game VietPlay Arena, được lập trình bởi lập trình viên Huỳnh Âu.
Tính cách của bạn: dí dỏm, hào hứng, am hiểu các game Việt Nam (Cờ Caro, Bầu Cua Tôm Cá, Tiến Lên Miền Nam, Cờ Cá Ngựa, Ô Ăn Quan, Đố Vui Dân Gian).
Hãy xưng hô thân mật ("tôi" và "bạn", hoặc "anh em hiệp khách"), nhắc khéo lời chào từ lập trình viên Huỳnh Âu khi phù hợp.
Ngữ cảnh người chơi: ${JSON.stringify(gameContext || {})}.
Yêu cầu của người chơi: "${userPrompt}".
Hãy trả lời ngắn gọn (2-3 câu), hào sảng và đầy năng lượng bằng tiếng Việt!`,
    });

    const replyText = textRes.text?.trim() || 'Chào mừng bạn đến với VietPlay Arena được lập trình bởi Huỳnh Âu! Chúc bạn bách chiến bách thắng!';

    // Generate voice audio with Gemini 3.8 Flash TTS
    let base64Audio = '';
    try {
      const ttsRes = await ai.models.generateContent({
        model: 'gemini-3.8-flash-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: replyText.slice(0, 300),
                speechMetadata: {
                  style: 'Sôi nổi, hào hứng, truyền cảm như bình luận viên thể thao điện tử Việt Nam',
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Puck' },
            },
          },
        },
      });
      base64Audio = ttsRes.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || '';
    } catch (ttsErr) {
      console.warn('TTS within live master warning:', ttsErr);
    }

    return res.json({
      replyText,
      audioBase64: base64Audio,
    });
  } catch (error: any) {
    console.error('Live master chat error:', error);
    return res.json({
      replyText: 'Chào mừng bạn đến với đấu trường game của Huỳnh Âu! Hãy sẵn sàng cho những ván đấu đỉnh cao nhé!',
      audioBase64: '',
    });
  }
});

// 3. Trending games with Search Grounding using gemini-3.8-flash
app.post('/api/trending-games', async (_req: Request, res: Response) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents:
        'Cập nhật tin tức và bảng xếp hạng xu hướng game online hot nhất tại Việt Nam hiện nay theo thời gian thực (ví dụ giải đấu Liên Quân ĐTDV, Tốc Chiến, VCS LMHT, Free Fire, cùng các trò chơi dân gian trực tuyến như Cờ Caro, Bầu Cua Tôm Cá, Tiến Lên Miền Nam, Ô Ăn Quan). Nêu 4 xu hướng hot nhất kèm nguồn tin tức thực tế.',
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || '';
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = groundingChunks
      .filter((chunk: any) => chunk.web?.uri && chunk.web?.title)
      .map((chunk: any) => ({
        uri: chunk.web.uri,
        title: chunk.web.title,
      }))
      .slice(0, 6);

    const articles = [
      {
        title: 'Cờ Caro & Bầu Cua Tôm Cá Huỳnh Âu: Bùng Nổ Lượng Người Chơi',
        summary:
          'Cổng game VietPlay Arena của lập trình viên Huỳnh Âu tạo nên cơn sốt với tính năng đa nền tảng, AI Game Master và bàn chơi 1v1 đến 8 người cực mượt.',
        category: 'Game Dân Gian',
        hotness: 99,
        source: 'VietPlay News',
        publishedTime: 'Vừa xong',
      },
      {
        title: 'Đấu Trường Danh Vọng & eSports Mobile Việt Nam 2026',
        summary:
          'Các trận so tài đỉnh cao của các chiến đội hàng đầu mang đến những pha xử lý nghẹt thở thu hút hàng triệu lượt xem trực tiếp.',
        category: 'eSports Mobile',
        hotness: 97,
        source: 'Garena eSports',
        publishedTime: '15 phút trước',
      },
      {
        title: 'Tiến Lên Miền Nam & Ô Ăn Quan: Đấu Trí Dân Gian Việt',
        summary:
          'Trí tuệ dân gian với các pha chặt heo kịch tính và rải sỏi ăn quan đang là điểm đến giải trí yêu thích của giới trẻ và văn phòng.',
        category: 'Chiến Thuật',
        hotness: 95,
        source: 'Thế Giới Game',
        publishedTime: '30 phút trước',
      },
      {
        title: 'Vua Tiếng Việt & Đố Vui Dân Gian: Sân Chơi Tri Thức Hot',
        summary:
          'Thử thách tốc độ phản xạ và vốn ca dao tục ngữ phong phú trong đấu trường nhiều người chơi thời gian thực.',
        category: 'Đố Vui',
        hotness: 92,
        source: 'VTV & Tri Thức Trẻ',
        publishedTime: '1 giờ trước',
      },
    ];

    return res.json({
      articles,
      groundingSources: sources,
      overview:
        text.slice(0, 500) ||
        'Thị trường game trực tuyến tại Việt Nam đang phát triển mạnh mẽ với xu hướng giao thoa giữa eSports hiện đại và nét đẹp trò chơi dân gian truyền thống.',
    });
  } catch (error: any) {
    console.error('Search grounding error:', error);
    return res.status(500).json({ error: error.message || 'Lỗi tìm kiếm dữ liệu game' });
  }
});

// 4. Community Posts API (Đăng bài, thích, bình luận)
app.get('/api/community/posts', (_req: Request, res: Response) => {
  res.json({ posts: communityPosts });
});

app.post('/api/community/posts', (req: Request, res: Response) => {
  const { authorId, authorName, authorAvatar, authorTitle, content, gameTag } = req.body;
  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Nội dung bài viết không được để trống' });
  }

  const newPost: CommunityPost = {
    id: 'post_' + Date.now(),
    authorId: authorId || 'user_guest',
    authorName: authorName || 'Game Thủ',
    authorAvatar: authorAvatar || '🐉',
    authorTitle: authorTitle || 'Hiệp Khách',
    content: content.trim(),
    likes: 0,
    isLiked: false,
    comments: [],
    timestamp: Date.now(),
    gameTag: gameTag || 'Chung',
  };

  communityPosts.unshift(newPost);
  res.json({ post: newPost });
});

app.post('/api/community/posts/:id/like', (req: Request, res: Response) => {
  const { id } = req.params;
  const post = communityPosts.find((p) => p.id === id);
  if (post) {
    post.isLiked = !post.isLiked;
    post.likes += post.isLiked ? 1 : -1;
    return res.json({ post });
  }
  res.status(404).json({ error: 'Không tìm thấy bài viết' });
});

app.post('/api/community/posts/:id/comment', (req: Request, res: Response) => {
  const { id } = req.params;
  const { authorName, authorAvatar, text } = req.body;
  const post = communityPosts.find((p) => p.id === id);
  if (post && text) {
    const cmt = {
      id: 'cmt_' + Date.now(),
      authorName: authorName || 'Bạn bè',
      authorAvatar: authorAvatar || '🐉',
      text: text.trim(),
      timestamp: Date.now(),
    };
    post.comments.push(cmt);
    return res.json({ comment: cmt, post });
  }
  res.status(404).json({ error: 'Không thể thêm bình luận' });
});

// 5. Coin Transfer API (Chuyển tiền / Tặng Xu bạn bè)
app.post('/api/coins/transfer', (req: Request, res: Response) => {
  const { senderName, recipientName, amount, message } = req.body;
  if (!recipientName || !amount || amount <= 0) {
    return res.status(400).json({ error: 'Thông tin chuyển tiền không hợp lệ' });
  }

  const record: CoinTransferRecord = {
    id: 'tx_' + Date.now(),
    senderName: senderName || 'Bạn',
    recipientName: recipientName.trim(),
    amount: Number(amount),
    message: message || 'Tặng bạn hiền ít vốn quẩy game!',
    timestamp: Date.now(),
  };

  transferLogs.unshift(record);
  res.json({ success: true, record });
});

// 6. Quick Auth / Registration
app.post('/api/auth/register', (req: Request, res: Response) => {
  const { username, avatar, bio } = req.body;
  const safeName = (username || 'ChiếnBinh_' + Math.floor(1000 + Math.random() * 9000)).slice(0, 20);
  const safeAvatar = avatar || '🐉';

  res.json({
    id: 'user_' + Math.random().toString(36).substring(2, 9),
    username: safeName,
    avatar: safeAvatar,
    coins: 50000, // 50,000 Xu tân thủ
    level: 1,
    wins: 0,
    losses: 0,
    title: 'Chiến Binh Huỳnh Âu Arena',
    isGuest: false,
    isRegistered: true,
    bio: bio || 'Đam mê game dân gian và eSports đỉnh cao!',
    createdAt: Date.now(),
  });
});

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    app: 'VietPlay Arena - Game được lập trình bởi Huỳnh Âu',
    time: Date.now(),
  });
});

/* ==========================================================================
   Multiplayer Game Room Engine & WebSockets (/ws & /live)
   ========================================================================== */

const rooms = new Map<string, GameRoom>();
const playerSockets = new Map<string, WebSocket>();

// Pre-seeded active multiplayer rooms for instant discovery!
const SEED_ROOMS: GameRoom[] = [
  {
    id: 'room_seed_1',
    code: '8888',
    name: '👑 Sảnh Vip Bầu Cua Huỳnh Âu',
    gameType: 'baucua',
    maxPlayers: 8,
    players: [
      { id: 'bot_host', username: 'Huỳnh Âu VIP', avatar: '👑', isHost: true, isReady: true },
      { id: 'bot_2', username: 'Kỳ Thủ Sài Gòn', avatar: '⚡', isHost: false, isReady: true },
      { id: 'bot_3', username: 'Thần Bài Hà Nội', avatar: '🐉', isHost: false, isReady: true },
    ],
    status: 'playing',
    hostId: 'bot_host',
    isPrivate: false,
    stakes: 1000,
    gameState: null,
    createdAt: Date.now() - 600000,
  },
  {
    id: 'room_seed_2',
    code: '6666',
    name: '⭕ Cờ Caro Giao Lưu 1v1',
    gameType: 'caro',
    maxPlayers: 2,
    players: [
      { id: 'bot_caro', username: 'Kỳ Thánh Miền Tây', avatar: '🦁', isHost: true, isReady: true },
    ],
    status: 'waiting',
    hostId: 'bot_caro',
    isPrivate: false,
    stakes: 2000,
    gameState: null,
    createdAt: Date.now() - 300000,
  },
  {
    id: 'room_seed_3',
    code: '9999',
    name: '🃏 Tiến Lên Miền Nam Chặt Heo',
    gameType: 'tienlen',
    maxPlayers: 4,
    players: [
      { id: 'bot_tl1', username: 'Bá Vương Nam Bộ', avatar: '🔥', isHost: true, isReady: true },
      { id: 'bot_tl2', username: 'Cô Ba Sài Gòn', avatar: '💎', isHost: false, isReady: true },
    ],
    status: 'waiting',
    hostId: 'bot_tl1',
    isPrivate: false,
    stakes: 5000,
    gameState: null,
    createdAt: Date.now() - 150000,
  },
];

SEED_ROOMS.forEach((r) => rooms.set(r.id, r));

function broadcastToRoom(roomId: string, message: any) {
  const room = rooms.get(roomId);
  if (!room) return;
  const payload = JSON.stringify(message);
  for (const player of room.players) {
    const ws = playerSockets.get(player.id);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  }
}

function broadcastRoomList() {
  const roomList = Array.from(rooms.values()).map((r) => ({
    id: r.id,
    code: r.code,
    name: r.name,
    gameType: r.gameType,
    playersCount: r.players.length,
    maxPlayers: r.maxPlayers,
    status: r.status,
    stakes: r.stakes || 500,
  }));
  const payload = JSON.stringify({ type: 'room_list', data: { rooms: roomList } });
  for (const ws of playerSockets.values()) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  }
}

// Caro Win Detection
function checkCaroWinner(board: (string | null)[][], row: number, col: number, symbol: string): boolean {
  const directions = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ];

  for (const [dr, dc] of directions) {
    let count = 1;
    for (let step = 1; step < 5; step++) {
      const r = row + dr * step;
      const c = col + dc * step;
      if (r >= 0 && r < 15 && c >= 0 && c < 15 && board[r][c] === symbol) count++;
      else break;
    }
    for (let step = 1; step < 5; step++) {
      const r = row - dr * step;
      const c = col - dc * step;
      if (r >= 0 && r < 15 && c >= 0 && c < 15 && board[r][c] === symbol) count++;
      else break;
    }
    if (count >= 5) return true;
  }
  return false;
}

// Trivia Questions Bank
const TRIVIA_QUESTIONS = [
  {
    id: 'q1',
    question: 'Điền từ còn thiếu vào câu thành ngữ: "Có công mài sắt, có ngày nên..."?',
    options: ['Kim', 'Bạc', 'Đao', 'Kiếm'],
    correctIndex: 0,
    explanation: 'Thành ngữ ca dao truyền thống khuyên nhủ con người phải luôn kiên trì bền bỉ.',
    category: 'Ca Dao Tục Ngữ',
  },
  {
    id: 'q2',
    question: 'Trong trò chơi Tiến Lên Miền Nam, lá bài nào có quyền lực cao nhất bộ bài?',
    options: ['Át Bích', '2 Cơ (Heo Cơ)', 'K Cơ', '2 Bích'],
    correctIndex: 1,
    explanation: '2 Cơ là lá heo đỏ lớn nhất trong bộ bài 52 lá của Tiến Lên Miền Nam.',
    category: 'Luật Bài Dân Gian',
  },
  {
    id: 'q3',
    question: 'Trò chơi Bầu Cua Tôm Cá truyền thống có tổng cộng bao nhiêu linh vật trên bàn cược?',
    options: ['4', '5', '6', '8'],
    correctIndex: 2,
    explanation: 'Gồm 6 linh vật: Bầu, Cua, Tôm, Cá, Gà và Nai.',
    category: 'Văn Hóa Lễ Hội',
  },
  {
    id: 'q4',
    question: 'Trong trò Cờ Cá Ngựa, người chơi phải đổ xúc xắc được số mấy để ra quân (xuất chuồng)?',
    options: ['1 hoặc 6', 'Chỉ số 6', 'Số chẵn', 'Số 5'],
    correctIndex: 0,
    explanation: 'Luật Cờ Cá Ngựa Việt Nam cho phép ra quân khi đổ được số 1 hoặc số 6.',
    category: 'Board Game Việt',
  },
  {
    id: 'q5',
    question: 'Trò chơi dân gian Ô Ăn Quan có tổng cộng bao nhiêu ô quân dân và bao nhiêu ô quan?',
    options: ['10 ô dân, 2 ô quan', '8 ô dân, 2 ô quan', '12 ô dân, 4 ô quan', '10 ô dân, 1 ô quan'],
    correctIndex: 0,
    explanation: 'Bàn Ô Ăn Quan gồm 10 ô vuông nhỏ (dân) và 2 ô bán nguyệt ở hai đầu (quan).',
    category: 'Trò Chơi Dân Gian',
  },
];

function initGameState(gameType: GameType, players: RoomPlayer[]): any {
  if (gameType === 'caro') {
    const board = Array(15)
      .fill(null)
      .map(() => Array(15).fill(null));
    const playerSymbols: { [playerId: string]: 'X' | 'O' } = {};
    if (players[0]) playerSymbols[players[0].id] = 'X';
    if (players[1]) playerSymbols[players[1].id] = 'O';

    const caroState: CaroState = {
      board,
      turnPlayerId: players[0]?.id || '',
      playerSymbols,
      timer: 30,
    };
    return caroState;
  }

  if (gameType === 'baucua') {
    const symbols: BauCuaSymbol[] = ['bau', 'cua', 'tom', 'ca', 'ga', 'nai'];
    const diceResults: [BauCuaSymbol, BauCuaSymbol, BauCuaSymbol] = [
      symbols[Math.floor(Math.random() * 6)],
      symbols[Math.floor(Math.random() * 6)],
      symbols[Math.floor(Math.random() * 6)],
    ];
    const bauCuaState: BauCuaState = {
      phase: 'betting',
      diceResults,
      bets: {},
      roundTimer: 20,
      history: [
        ['bau', 'cua', 'tom'],
        ['ca', 'ga', 'nai'],
      ],
      dealerId: players[0]?.id,
    };
    return bauCuaState;
  }

  if (gameType === 'tienlen') {
    const suits: PlayingCard['suit'][] = ['spades', 'clubs', 'diamonds', 'hearts'];
    const deck: PlayingCard[] = [];
    for (let value = 3; value <= 15; value++) {
      for (const suit of suits) {
        deck.push({ suit, value, id: `${value}_${suit}` });
      }
    }
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    const hands: { [playerId: string]: PlayingCard[] } = {};
    players.forEach((p, idx) => {
      hands[p.id] = deck.slice(idx * 13, (idx + 1) * 13).sort((a, b) => a.value - b.value);
    });

    const tienLenState: TienLenState = {
      turnPlayerId: players[0]?.id || '',
      lastPlayedCards: null,
      passedPlayerIds: [],
      hands,
      finishedPlayers: [],
      roundNumber: 1,
    };
    return tienLenState;
  }

  if (gameType === 'cangua') {
    const colors: HorseColor[] = ['red', 'blue', 'yellow', 'green'];
    const playerColors: { [id: string]: HorseColor } = {};
    const horses: { [color in HorseColor]: any[] } = {
      red: [0, 1, 2, 3].map((i) => ({ id: `red_${i}`, color: 'red', index: i, position: -1 })),
      blue: [0, 1, 2, 3].map((i) => ({ id: `blue_${i}`, color: 'blue', index: i, position: -1 })),
      yellow: [0, 1, 2, 3].map((i) => ({ id: `yellow_${i}`, color: 'yellow', index: i, position: -1 })),
      green: [0, 1, 2, 3].map((i) => ({ id: `green_${i}`, color: 'green', index: i, position: -1 })),
    };

    players.forEach((p, idx) => {
      playerColors[p.id] = colors[idx % colors.length];
    });

    const caNguaState: CaNguaState = {
      currentTurnColor: 'red',
      turnPlayerId: players[0]?.id || '',
      diceValue: null,
      hasRolled: false,
      playerColors,
      horses,
      finishedHorses: { red: 0, blue: 0, yellow: 0, green: 0 },
    };
    return caNguaState;
  }

  if (gameType === 'oanquan') {
    // 0..4: 5 ô dân dưới (5 quân mỗi ô)
    // 5: ô quan phải (10 quân hoặc 1 quan lớn)
    // 6..10: 5 ô dân trên (5 quân mỗi ô)
    // 11: ô quan trái (10 quân)
    const board = [5, 5, 5, 5, 5, 10, 5, 5, 5, 5, 5, 10];
    const scores: { [id: string]: number } = {};
    players.forEach((p) => (scores[p.id] = 0));

    const oanquanState: OAnQuanState = {
      board,
      scores,
      turnPlayerId: players[0]?.id || '',
      isFinished: false,
    };
    return oanquanState;
  }

  if (gameType === 'trivia') {
    const scores: { [id: string]: number } = {};
    players.forEach((p) => (scores[p.id] = 0));

    const triviaState: TriviaState = {
      currentQuestionIndex: 0,
      scores,
      answeredPlayerIds: {},
      timer: 15,
      isRoundOver: false,
    };
    return triviaState;
  }

  return {};
}

// Attach WebSocketServer
const wss = new WebSocketServer({ server });

wss.on('connection', (ws: WebSocket, req) => {
  const url = req.url || '';

  // 1. Live Voice API Bridge (/live)
  if (url.startsWith('/live')) {
    handleLiveVoiceBridge(ws);
    return;
  }

  // 2. Multiplayer Gaming Socket (/ws or default)
  let currentPlayerId: string | null = null;
  let currentRoomId: string | null = null;

  // Send current room list upon connection
  broadcastRoomList();

  ws.on('message', (messageRaw: any) => {
    try {
      const parsed = JSON.parse(messageRaw.toString());
      const { type, data } = parsed;

      // Request Room List
      if (type === 'get_rooms') {
        broadcastRoomList();
      }

      // Create Room
      if (type === 'create_room') {
        const { name, gameType, maxPlayers, isPrivate, stakes, player } = data;
        currentPlayerId = player.id;
        playerSockets.set(player.id, ws);

        const roomCode = Math.floor(1000 + Math.random() * 9000).toString();
        const roomId = 'room_' + Date.now();
        const newPlayer: RoomPlayer = {
          ...player,
          isHost: true,
          isReady: true,
        };

        const room: GameRoom = {
          id: roomId,
          code: roomCode,
          name: name || `Phòng ${roomCode} - Huỳnh Âu Arena`,
          gameType: gameType || 'caro',
          maxPlayers: maxPlayers || 4,
          players: [newPlayer],
          status: 'waiting',
          hostId: player.id,
          isPrivate: !!isPrivate,
          stakes: stakes || 1000,
          gameState: null,
          createdAt: Date.now(),
        };

        rooms.set(roomId, room);
        currentRoomId = roomId;

        ws.send(JSON.stringify({ type: 'room_created', data: { room } }));
        broadcastToRoom(roomId, { type: 'room_updated', data: { room } });
        broadcastRoomList();
      }

      // Add Smart Bot to fill room
      if (type === 'add_bot') {
        const { roomId } = data;
        const room = rooms.get(roomId);
        if (room && room.players.length < room.maxPlayers) {
          const botNames = ['Bot Huỳnh Âu', 'Kỳ Thủ Sài Gòn', 'Chiến Binh Hà Nội', 'Thần Bài Đà Nẵng', 'Bá Vương Cần Thơ'];
          const botAvatars = ['🤖', '⚡', '🐉', '👑', '🔥'];
          const randIdx = Math.floor(Math.random() * botNames.length);

          const botPlayer: RoomPlayer = {
            id: 'bot_' + Math.random().toString(36).substring(2, 7),
            username: botNames[randIdx] + ' (AI)',
            avatar: botAvatars[randIdx],
            isHost: false,
            isReady: true,
            isBot: true,
          };

          room.players.push(botPlayer);
          broadcastToRoom(roomId, { type: 'room_updated', data: { room } });
          broadcastRoomList();
        }
      }

      // Join Room by Code
      if (type === 'join_room') {
        const { roomCode, player } = data;
        currentPlayerId = player.id;
        playerSockets.set(player.id, ws);

        const room = Array.from(rooms.values()).find((r) => r.code === roomCode);
        if (!room) {
          return ws.send(JSON.stringify({ type: 'error', data: { message: 'Không tìm thấy phòng chơi' } }));
        }

        if (room.players.length >= room.maxPlayers) {
          return ws.send(JSON.stringify({ type: 'error', data: { message: 'Phòng đã đủ số lượng người chơi' } }));
        }

        const existingPlayer = room.players.find((p) => p.id === player.id);
        if (!existingPlayer) {
          room.players.push({
            ...player,
            isHost: false,
            isReady: false,
          });
        }

        currentRoomId = room.id;
        ws.send(JSON.stringify({ type: 'room_joined', data: { room } }));
        broadcastToRoom(room.id, { type: 'room_updated', data: { room } });
        broadcastRoomList();
      }

      // Toggle Ready
      if (type === 'toggle_ready') {
        const { roomId, playerId } = data;
        const room = rooms.get(roomId);
        if (room) {
          const p = room.players.find((pl) => pl.id === playerId);
          if (p) p.isReady = !p.isReady;
          broadcastToRoom(roomId, { type: 'room_updated', data: { room } });
        }
      }

      // Start Game
      if (type === 'start_game') {
        const { roomId } = data;
        const room = rooms.get(roomId);
        if (room) {
          // If players < min, auto fill with 1 bot
          if (room.players.length === 1 && (room.gameType === 'caro' || room.gameType === 'oanquan')) {
            room.players.push({
              id: 'bot_ai',
              username: 'Kỳ Thủ Huỳnh Âu (AI)',
              avatar: '🤖',
              isHost: false,
              isReady: true,
              isBot: true,
            });
          }
          room.status = 'playing';
          room.gameState = initGameState(room.gameType, room.players);
          broadcastToRoom(roomId, { type: 'game_started', data: { room } });
          broadcastToRoom(roomId, { type: 'room_updated', data: { room } });
          broadcastRoomList();
        }
      }

      // Caro Move
      if (type === 'caro_move') {
        const { roomId, row, col, playerId } = data;
        const room = rooms.get(roomId);
        if (room && room.status === 'playing' && room.gameType === 'caro') {
          const state: CaroState = room.gameState;
          if (state.turnPlayerId === playerId && state.board[row][col] === null && !state.winnerId) {
            const symbol = state.playerSymbols[playerId] || 'X';
            state.board[row][col] = symbol;
            state.lastMove = { row, col, playerId, symbol, timestamp: Date.now() };

            const isWin = checkCaroWinner(state.board, row, col, symbol);
            if (isWin) {
              state.winnerId = playerId;
              room.status = 'ended';
            } else {
              const nextPlayer = room.players.find((p) => p.id !== playerId);
              state.turnPlayerId = nextPlayer?.id || playerId;
            }
            broadcastToRoom(roomId, { type: 'room_updated', data: { room } });
          }
        }
      }

      // Bầu Cua Bet & Shake
      if (type === 'baucua_bet') {
        const { roomId, playerId, symbol, amount } = data;
        const room = rooms.get(roomId);
        if (room && room.gameType === 'baucua' && room.status === 'playing') {
          const state: BauCuaState = room.gameState;
          if (state.phase === 'betting') {
            if (!state.bets[playerId]) state.bets[playerId] = {};
            state.bets[playerId][symbol as BauCuaSymbol] = (state.bets[playerId][symbol as BauCuaSymbol] || 0) + amount;
            broadcastToRoom(roomId, { type: 'room_updated', data: { room } });
          }
        }
      }

      if (type === 'baucua_shake') {
        const { roomId } = data;
        const room = rooms.get(roomId);
        if (room && room.gameType === 'baucua' && room.status === 'playing') {
          const state: BauCuaState = room.gameState;
          state.phase = 'shaking';
          broadcastToRoom(roomId, { type: 'room_updated', data: { room } });

          setTimeout(() => {
            const symbols: BauCuaSymbol[] = ['bau', 'cua', 'tom', 'ca', 'ga', 'nai'];
            const dice1 = symbols[Math.floor(Math.random() * 6)];
            const dice2 = symbols[Math.floor(Math.random() * 6)];
            const dice3 = symbols[Math.floor(Math.random() * 6)];
            state.diceResults = [dice1, dice2, dice3];
            state.phase = 'revealed';
            state.history.unshift([dice1, dice2, dice3]);
            if (state.history.length > 8) state.history.pop();
            broadcastToRoom(roomId, { type: 'room_updated', data: { room } });

            setTimeout(() => {
              state.bets = {};
              state.phase = 'betting';
              broadcastToRoom(roomId, { type: 'room_updated', data: { room } });
            }, 6000);
          }, 2000);
        }
      }

      // Chat
      if (type === 'send_chat') {
        const { roomId, message } = data;
        broadcastToRoom(roomId, { type: 'chat_message', data: { message } });
      }

      // Leave Room
      if (type === 'leave_room') {
        const { roomId, playerId } = data;
        const room = rooms.get(roomId);
        if (room) {
          room.players = room.players.filter((p) => p.id !== playerId);
          if (room.players.length === 0) {
            rooms.delete(roomId);
          } else {
            if (room.hostId === playerId) {
              room.hostId = room.players[0].id;
              room.players[0].isHost = true;
            }
            broadcastToRoom(roomId, { type: 'room_updated', data: { room } });
          }
          broadcastRoomList();
        }
        ws.send(JSON.stringify({ type: 'room_left', data: {} }));
      }
    } catch (err) {
      console.warn('Socket handle error:', err);
    }
  });

  ws.on('close', () => {
    if (currentPlayerId) {
      playerSockets.delete(currentPlayerId);
      if (currentRoomId) {
        const room = rooms.get(currentRoomId);
        if (room) {
          room.players = room.players.filter((p) => p.id !== currentPlayerId);
          if (room.players.length === 0) {
            rooms.delete(currentRoomId);
          } else {
            broadcastToRoom(currentRoomId, { type: 'room_updated', data: { room } });
          }
          broadcastRoomList();
        }
      }
    }
  });
});

// Gemini Live API Bridge Handler
async function handleLiveVoiceBridge(clientWs: WebSocket) {
  try {
    clientWs.send(JSON.stringify({ status: 'connected', message: 'Sẵn sàng đàm thoại cùng AI Master Huỳnh Âu!' }));

    const session = await ai.live.connect({
      model: 'gemini-3.8-live',
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } },
        },
        systemInstruction:
          'Bạn là Bình Luận Viên ảo & Game Master được lập trình bởi Huỳnh Âu trong cổng game VietPlay Arena. Hãy nói tiếng Việt hào hứng, năng nổ, khích lệ các hiệp khách, giải thích luật chơi và chúc mừng những pha xử lý đỉnh cao!',
      },
      callbacks: {
        onmessage: (message: any) => {
          for (const part of message.serverContent?.modelTurn?.parts ?? []) {
            if (part.inlineData?.data) {
              clientWs.send(JSON.stringify({ audio: part.inlineData.data }));
            }
            if (part.text) {
              clientWs.send(JSON.stringify({ transcript: part.text }));
            }
          }
          if (message.serverContent?.interrupted) {
            clientWs.send(JSON.stringify({ interrupted: true }));
          }
        },
      },
    });

    clientWs.on('message', (data: any) => {
      try {
        const parsed = JSON.parse(data.toString());
        if (parsed.audio) {
          session.sendRealtimeInput({
            audio: { data: parsed.audio, mimeType: 'audio/pcm;rate=16000' },
          });
        }
      } catch (err) {
        console.warn('Live API forward error:', err);
      }
    });

    clientWs.on('close', () => {
      try {
        session.close();
      } catch {}
    });
  } catch (error) {
    console.warn('Live API bridge fallback:', error);
    clientWs.send(
      JSON.stringify({
        status: 'fallback',
        message: 'Đã chuyển sang chế độ Trợ Lý Giọng Nói Trực Tuyến qua TTS.',
      })
    );
  }
}

/* ==========================================================================
   Vite Middleware / Production Static Serve
   ========================================================================== */

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, () => {
    console.log(`VietPlay Arena (Game được lập trình bởi Huỳnh Âu) running at http://localhost:${PORT}`);
  });
}

startServer();
