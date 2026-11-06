export interface UserProfile {
  id: string;
  username: string;
  avatar: string;
  coins: number;
  level: number;
  wins: number;
  losses: number;
  title: string;
  isGuest: boolean;
  createdAt: number;
}

export type GameType = 'caro' | 'baucua' | 'tienlen' | 'cangua';

export interface RoomPlayer {
  id: string;
  username: string;
  avatar: string;
  isHost: boolean;
  isReady: boolean;
  score?: number;
  betAmount?: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
}

export interface GameRoom {
  id: string;
  code: string;
  name: string;
  gameType: GameType;
  maxPlayers: number;
  players: RoomPlayer[];
  status: 'waiting' | 'playing' | 'ended';
  currentTurnPlayerId?: string;
  hostId: string;
  isPrivate: boolean;
  gameState: any;
  createdAt: number;
}

// Caro Game State
export interface CaroMove {
  row: number;
  col: number;
  playerId: string;
  symbol: 'X' | 'O';
  timestamp: number;
}

export interface CaroState {
  board: (string | null)[][]; // 15x15
  lastMove?: CaroMove;
  turnPlayerId: string;
  winnerId?: string | 'draw';
  winningLine?: [number, number][];
  playerSymbols: { [playerId: string]: 'X' | 'O' };
  timer: number;
}

// Bau Cua Game State
export type BauCuaSymbol = 'bau' | 'cua' | 'tom' | 'ca' | 'ga' | 'nai';

export interface BauCuaState {
  phase: 'betting' | 'shaking' | 'revealed';
  diceResults: [BauCuaSymbol, BauCuaSymbol, BauCuaSymbol];
  bets: {
    [playerId: string]: {
      [key in BauCuaSymbol]?: number;
    };
  };
  roundTimer: number;
  history: [BauCuaSymbol, BauCuaSymbol, BauCuaSymbol][];
  dealerId?: string;
  lastPayouts?: { [playerId: string]: number };
}

// Tien Len Game State
export interface PlayingCard {
  suit: 'spades' | 'clubs' | 'diamonds' | 'hearts'; // Bích, Chuồn/Tép, Rô, Cơ
  value: number; // 3 to 15 (3=3, ..., 10=10, 11=J, 12=Q, 13=K, 14=A, 15=2/Heo)
  id: string;
}

export interface TienLenState {
  turnPlayerId: string;
  lastPlayedCards: {
    playerId: string;
    cards: PlayingCard[];
    comboType: string;
  } | null;
  passedPlayerIds: string[];
  hands: { [playerId: string]: PlayingCard[] };
  finishedPlayers: string[]; // Order of finishes (Nhất, Nhì, Ba, Bét)
  roundNumber: number;
}

// Ca Ngua Game State
export type HorseColor = 'red' | 'blue' | 'yellow' | 'green';

export interface HorsePiece {
  id: string;
  color: HorseColor;
  index: number; // 0..3
  position: number; // -1 = chuồng xuất phát, 0..55 = đường đua, 101..106 = chuồng đích
}

export interface CaNguaState {
  currentTurnColor: HorseColor;
  turnPlayerId: string;
  diceValue: number | null;
  hasRolled: boolean;
  playerColors: { [playerId: string]: HorseColor };
  horses: { [color in HorseColor]: HorsePiece[] };
  finishedHorses: { [color in HorseColor]: number };
}

export interface TrendingGameArticle {
  title: string;
  summary: string;
  category: string;
  hotness: number;
  url?: string;
  source?: string;
  publishedTime?: string;
}
