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
  isRegistered: boolean;
  bio?: string;
  createdAt: number;
}

export type GameType = 'caro' | 'baucua' | 'tienlen' | 'cangua' | 'oanquan' | 'trivia';

export interface RoomPlayer {
  id: string;
  username: string;
  avatar: string;
  isHost: boolean;
  isReady: boolean;
  isBot?: boolean;
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
  stakes?: number;
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
  suit: 'spades' | 'clubs' | 'diamonds' | 'hearts';
  value: number; // 3 to 15
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
  finishedPlayers: string[];
  roundNumber: number;
}

// Ca Ngua Game State
export type HorseColor = 'red' | 'blue' | 'yellow' | 'green';

export interface HorsePiece {
  id: string;
  color: HorseColor;
  index: number;
  position: number;
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

// Ô Ăn Quan Game State
export interface OAnQuanState {
  board: number[]; // 0..4: dân dưới, 5: quan phải, 6..10: dân trên, 11: quan trái
  scores: { [playerId: string]: number };
  turnPlayerId: string;
  winnerId?: string;
  isFinished: boolean;
}

// Trivia / Vua Tiếng Việt
export interface TriviaQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  category: string;
}

export interface TriviaState {
  currentQuestionIndex: number;
  scores: { [playerId: string]: number };
  answeredPlayerIds: { [playerId: string]: number }; // playerId -> chosen option
  timer: number;
  isRoundOver: boolean;
  winnerId?: string;
}

// Friends & Social
export interface FriendUser {
  id: string;
  username: string;
  avatar: string;
  isOnline: boolean;
  level: number;
  statusText?: string;
}

export interface CoinTransferRecord {
  id: string;
  senderName: string;
  recipientName: string;
  amount: number;
  message: string;
  timestamp: number;
}

export interface CommunityPost {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorTitle: string;
  content: string;
  likes: number;
  isLiked?: boolean;
  comments: Array<{
    id: string;
    authorName: string;
    authorAvatar: string;
    text: string;
    timestamp: number;
  }>;
  timestamp: number;
  gameTag?: string;
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
