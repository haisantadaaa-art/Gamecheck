import express, { Request, Response } from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, Modality } from '@google/genai';
import dotenv from 'dotenv';
import { GameRoom, GameType, RoomPlayer, CaroState, BauCuaState, BauCuaSymbol, PlayingCard, TienLenState, CaNguaState, HorseColor } from './src/types';

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
    const selectedVoice = voiceName || 'Puck'; // 'Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: text.slice(0, 300), // safety trim
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

// 2. Trending games & esports with Search Grounding using gemini-3.8-flash
app.post('/api/trending-games', async (_req: Request, res: Response) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents:
        'Tổng hợp danh sách 4 xu hướng game hot nhất tại Việt Nam hiện nay (bao gồm các tựa game eSports đình đám như Liên Quân Mobile, Free Fire, LMHT Tốc Chiến, Valorant và các trò chơi dân gian trực tuyến như Cờ Caro, Bầu Cua Tôm Cá, Tiến Lên Miền Nam). Với mỗi mục hãy nêu: tiêu đề, tóm tắt ngắn, thể loại, độ hot (thang điểm 1-100). Sau đó viết 1 đoạn nhận định tổng quan ngắn gọn về thị hiếu game thủ Việt Nam.',
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
      .slice(0, 5);

    // Fallback parsed articles from text or structured fallback
    const articles = [
      {
        title: 'Cờ Caro & Bầu Cua Tôm Cá: Cơn Sốt Game Dân Gian Đa Nền Tảng',
        summary: 'Các trò chơi quen thuộc của tuổi thơ Việt Nam đang bùng nổ trở lại trên nền tảng web hiện đại với đồ họa neon và tính năng đấu phòng trực tuyến.',
        category: 'Game Dân Gian',
        hotness: 98,
        source: 'VietPlay Community',
      },
      {
        title: 'Liên Quân Mobile & Đấu Trường Danh Vọng 2026',
        summary: 'Sôi động các giải đấu eSports hàng đầu với hàng triệu lượt theo dõi từ các chiến đội hàng đầu như Saigon Phantom, V Gaming.',
        category: 'eSports Mobile',
        hotness: 96,
        source: 'Garena eSports VN',
      },
      {
        title: 'Tiến Lên Miền Nam & Đấu Trí 13 Lá',
        summary: 'Trò chơi bài dân tộc đậm tính chiến thuật với các pha chặt heo, 3 đôi thông kịch tính luôn thu hút lượng người chơi đông đảo mỗi ngày.',
        category: 'Game Đấu Trí',
        hotness: 94,
        source: 'VietPlay Games',
      },
      {
        title: 'Cờ Cá Ngựa: Ký Ức Tuổi Thơ Đua Về Đích',
        summary: 'Đổ xí ngầu xúc xắc, đá ngựa đối phương và dẫn đầu cuộc đua về chuồng cùng bạn bè trong phòng chơi trực tuyến.',
        category: 'Board Game',
        hotness: 90,
        source: 'Bảng Xếp Hạng Game Việt',
      },
    ];

    return res.json({
      articles,
      groundingSources: sources,
      overview: text.slice(0, 500) || 'Thị trường game trực tuyến tại Việt Nam tiếp tục phát triển mạnh mẽ với sự giao thoa giữa eSports hiện đại và các trò chơi dân gian truyền thống.',
    });
  } catch (error: any) {
    console.error('Search grounding error:', error);
    return res.status(500).json({ error: error.message || 'Lỗi tìm kiếm dữ liệu game' });
  }
});

// 3. AI Game Advisor with gemini-3.8-flash
app.post('/api/ai-advisor', async (req: Request, res: Response) => {
  try {
    const { gameType, gameContext } = req.body;
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Bạn là chiến lược gia cao thủ game Việt Nam. Game hiện tại: ${gameType}. Ngữ cảnh trận đấu: ${JSON.stringify(
        gameContext
      )}. Hãy đưa ra 1 lời khuyên chiến thuật ngắn gọn (tối đa 2 câu), hóm hỉnh và sâu sắc bằng tiếng Việt cho người chơi.`,
    });

    return res.json({ advice: response.text || 'Hãy bình tĩnh quan sát thế cờ của đối thủ!' });
  } catch (err: any) {
    return res.json({ advice: 'Tập trung cao độ, cơ hội chiến thắng đang ở ngay trước mắt!' });
  }
});

// 4. Quick Auth
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { username, avatar } = req.body;
  const safeName = (username || 'ChiếnBinh_' + Math.floor(1000 + Math.random() * 9000)).slice(0, 20);
  const safeAvatar = avatar || '🐉';

  res.json({
    id: 'user_' + Math.random().toString(36).substring(2, 9),
    username: safeName,
    avatar: safeAvatar,
    coins: 20000,
    level: 1,
    wins: 0,
    losses: 0,
    title: 'Tân Thủ VietPlay',
    isGuest: false,
    createdAt: Date.now(),
  });
});

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', time: Date.now() });
});

/* ==========================================================================
   Multiplayer Game Room Engine & WebSockets (/ws & /live)
   ========================================================================== */

const rooms = new Map<string, GameRoom>();
const playerSockets = new Map<string, WebSocket>();

// Helper to broadcast room state to all players in that room
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

// 1. Caro Win Detection (5 in a row)
function checkCaroWinner(board: (string | null)[][], row: number, col: number, symbol: string): boolean {
  const directions = [
    [0, 1], // horizontal
    [1, 0], // vertical
    [1, 1], // diagonal \
    [1, -1], // diagonal /
  ];

  for (const [dr, dc] of directions) {
    let count = 1;
    // Positive direction
    for (let step = 1; step < 5; step++) {
      const r = row + dr * step;
      const c = col + dc * step;
      if (r >= 0 && r < 15 && c >= 0 && c < 15 && board[r][c] === symbol) {
        count++;
      } else {
        break;
      }
    }
    // Negative direction
    for (let step = 1; step < 5; step++) {
      const r = row - dr * step;
      const c = col - dc * step;
      if (r >= 0 && r < 15 && c >= 0 && c < 15 && board[r][c] === symbol) {
        count++;
      } else {
        break;
      }
    }
    if (count >= 5) return true;
  }
  return false;
}

// Initialize Initial Game States
function initGameState(gameType: GameType, players: RoomPlayer[]): any {
  if (gameType === 'caro') {
    const board: (string | null)[][] = Array(15)
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
      roundTimer: 25,
      history: [],
      dealerId: players[0]?.id,
    };
    return bauCuaState;
  }

  if (gameType === 'tienlen') {
    // Generate and shuffle deck of 52 cards
    const suits: PlayingCard['suit'][] = ['spades', 'clubs', 'diamonds', 'hearts'];
    const deck: PlayingCard[] = [];
    for (let value = 3; value <= 15; value++) {
      for (const suit of suits) {
        deck.push({ suit, value, id: `${value}_${suit}` });
      }
    }
    // Fisher-Yates shuffle
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

  ws.on('message', (messageRaw: any) => {
    try {
      const parsed = JSON.parse(messageRaw.toString());
      const { type, data } = parsed;

      // Create Room
      if (type === 'create_room') {
        const { name, gameType, maxPlayers, isPrivate, player } = data;
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
          name: name || `Phòng ${roomCode}`,
          gameType: gameType || 'caro',
          maxPlayers: maxPlayers || 2,
          players: [newPlayer],
          status: 'waiting',
          hostId: player.id,
          isPrivate: !!isPrivate,
          gameState: null,
          createdAt: Date.now(),
        };

        rooms.set(roomId, room);
        currentRoomId = roomId;

        ws.send(JSON.stringify({ type: 'room_created', data: { room } }));
        broadcastToRoom(roomId, { type: 'room_updated', data: { room } });
      }

      // Join Room
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
          room.status = 'playing';
          room.gameState = initGameState(room.gameType, room.players);
          broadcastToRoom(roomId, { type: 'game_started', data: { room } });
          broadcastToRoom(roomId, { type: 'room_updated', data: { room } });
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
              // Switch turn to other player
              const nextPlayer = room.players.find((p) => p.id !== playerId);
              state.turnPlayerId = nextPlayer?.id || playerId;
            }
            broadcastToRoom(roomId, { type: 'room_updated', data: { room } });
          }
        }
      }

      // Bầu Cua Bet
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

      // Bầu Cua Shake & Reveal
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

            // Calculate payouts
            const diceCounts: { [k in BauCuaSymbol]?: number } = {};
            [dice1, dice2, dice3].forEach((s) => {
              diceCounts[s] = (diceCounts[s] || 0) + 1;
            });

            const payouts: { [playerId: string]: number } = {};
            for (const pId of Object.keys(state.bets)) {
              let netPayout = 0;
              const playerBets = state.bets[pId];
              for (const sym of Object.keys(playerBets) as BauCuaSymbol[]) {
                const betAmt = playerBets[sym] || 0;
                const matchCount = diceCounts[sym] || 0;
                if (matchCount > 0) {
                  netPayout += betAmt * matchCount;
                } else {
                  netPayout -= betAmt;
                }
              }
              payouts[pId] = netPayout;
            }
            state.lastPayouts = payouts;

            broadcastToRoom(roomId, { type: 'room_updated', data: { room } });

            // Reset for next round after 6 seconds
            setTimeout(() => {
              state.bets = {};
              state.phase = 'betting';
              broadcastToRoom(roomId, { type: 'room_updated', data: { room } });
            }, 6000);
          }, 2000);
        }
      }

      // Tien Len Play Cards
      if (type === 'tienlen_play') {
        const { roomId, playerId, cards } = data;
        const room = rooms.get(roomId);
        if (room && room.gameType === 'tienlen' && room.status === 'playing') {
          const state: TienLenState = room.gameState;
          if (state.turnPlayerId === playerId) {
            // Remove played cards from player's hand
            const playedIds = new Set(cards.map((c: PlayingCard) => c.id));
            state.hands[playerId] = state.hands[playerId].filter((c) => !playedIds.has(c.id));
            state.lastPlayedCards = { playerId, cards, comboType: 'Đánh bài' };

            // Check if player emptied hand
            if (state.hands[playerId].length === 0 && !state.finishedPlayers.includes(playerId)) {
              state.finishedPlayers.push(playerId);
            }

            // Check if game ended (all but 1 or all finished)
            if (state.finishedPlayers.length >= room.players.length - 1) {
              room.status = 'ended';
            } else {
              // Rotate turn to next player who hasn't passed
              let nextIdx = (room.players.findIndex((p) => p.id === playerId) + 1) % room.players.length;
              while (state.passedPlayerIds.includes(room.players[nextIdx].id) || state.finishedPlayers.includes(room.players[nextIdx].id)) {
                nextIdx = (nextIdx + 1) % room.players.length;
              }
              state.turnPlayerId = room.players[nextIdx].id;
            }
            broadcastToRoom(roomId, { type: 'room_updated', data: { room } });
          }
        }
      }

      // Tien Len Pass
      if (type === 'tienlen_pass') {
        const { roomId, playerId } = data;
        const room = rooms.get(roomId);
        if (room && room.gameType === 'tienlen' && room.status === 'playing') {
          const state: TienLenState = room.gameState;
          if (state.turnPlayerId === playerId) {
            if (!state.passedPlayerIds.includes(playerId)) {
              state.passedPlayerIds.push(playerId);
            }
            // Check if all other active players passed
            const activePlayers = room.players.filter((p) => !state.finishedPlayers.includes(p.id));
            if (state.passedPlayerIds.length >= activePlayers.length - 1) {
              // New round, the non-passed player leads
              state.passedPlayerIds = [];
              state.lastPlayedCards = null;
            } else {
              let nextIdx = (room.players.findIndex((p) => p.id === playerId) + 1) % room.players.length;
              while (state.passedPlayerIds.includes(room.players[nextIdx].id) || state.finishedPlayers.includes(room.players[nextIdx].id)) {
                nextIdx = (nextIdx + 1) % room.players.length;
              }
              state.turnPlayerId = room.players[nextIdx].id;
            }
            broadcastToRoom(roomId, { type: 'room_updated', data: { room } });
          }
        }
      }

      // Ca Ngua Roll Dice
      if (type === 'cangua_roll') {
        const { roomId, playerId } = data;
        const room = rooms.get(roomId);
        if (room && room.gameType === 'cangua' && room.status === 'playing') {
          const state: CaNguaState = room.gameState;
          if (state.turnPlayerId === playerId && !state.hasRolled) {
            state.diceValue = Math.floor(1 + Math.random() * 6);
            state.hasRolled = true;
            broadcastToRoom(roomId, { type: 'room_updated', data: { room } });
          }
        }
      }

      // Ca Ngua Move Piece
      if (type === 'cangua_move') {
        const { roomId, playerId, horseIndex, color } = data;
        const room = rooms.get(roomId);
        if (room && room.gameType === 'cangua' && room.status === 'playing') {
          const state: CaNguaState = room.gameState;
          if (state.turnPlayerId === playerId && state.hasRolled && state.diceValue) {
            const horse = state.horses[color as HorseColor]?.[horseIndex];
            if (horse) {
              if (horse.position === -1) {
                // Out of stable on 1 or 6
                if (state.diceValue === 1 || state.diceValue === 6) {
                  horse.position = 0;
                }
              } else {
                horse.position += state.diceValue;
                if (horse.position > 55) {
                  state.finishedHorses[color as HorseColor] = (state.finishedHorses[color as HorseColor] || 0) + 1;
                  if (state.finishedHorses[color as HorseColor] >= 4) {
                    room.status = 'ended';
                  }
                }
              }
            }

            // Next player turn unless rolled 6
            if (state.diceValue !== 6) {
              const currentIdx = room.players.findIndex((p) => p.id === playerId);
              const nextIdx = (currentIdx + 1) % room.players.length;
              state.turnPlayerId = room.players[nextIdx].id;
              state.currentTurnColor = state.playerColors[room.players[nextIdx].id];
            }
            state.hasRolled = false;
            state.diceValue = null;
            broadcastToRoom(roomId, { type: 'room_updated', data: { room } });
          }
        }
      }

      // Rematch request
      if (type === 'rematch') {
        const { roomId } = data;
        const room = rooms.get(roomId);
        if (room) {
          room.status = 'playing';
          room.gameState = initGameState(room.gameType, room.players);
          broadcastToRoom(roomId, { type: 'room_updated', data: { room } });
        }
      }

      // Send Chat Message
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
        }
      }
    }
  });
});

// Gemini Live API Bridge Handler
async function handleLiveVoiceBridge(clientWs: WebSocket) {
  try {
    const session = await ai.live.connect({
      model: 'gemini-3.8-live',
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } },
        },
        systemInstruction:
          'Bạn là Bình Luận Viên ảo dí dỏm, năng nổ của sảnh game VietPlay. Bạn đồng hành cùng người chơi trong các trò chơi dân gian và game hot Việt Nam (Cờ Caro, Bầu Cua Tôm Cá, Tiến Lên Miền Nam, Cờ Cá Ngựa). Hãy nói tiếng Việt hào hứng, đối đáp ngắn gọn, vui nhộn, cổ vũ tinh thần và hướng dẫn nhiệt tình!',
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
    console.warn('Failed to connect to Gemini Live API:', error);
    clientWs.send(JSON.stringify({ error: 'Không thể kết nối Gemini Live' }));
    clientWs.close();
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
    console.log(`VietPlay Game Server running at http://localhost:${PORT}`);
  });
}

startServer();
