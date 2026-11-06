import { GameRoom, GameType, RoomPlayer, ChatMessage, BauCuaSymbol, PlayingCard, HorseColor } from '../types';

export type SocketEventCallback = (data: any) => void;

class GameSocketClient {
  private ws: WebSocket | null = null;
  private listeners: Map<string, Set<SocketEventCallback>> = new Map();
  private reconnectTimer: any = null;
  public currentRoom: GameRoom | null = null;
  public isConnected: boolean = false;

  public connect(): void {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.emitLocal('connection', { connected: true });
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          const { type, data } = payload;
          if (type === 'room_updated') {
            this.currentRoom = data.room;
          }
          if (type === 'room_left') {
            this.currentRoom = null;
          }
          this.emitLocal(type, data);
        } catch (err) {
          console.warn('Socket message parse error:', err);
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.emitLocal('disconnection', {});
        // Auto reconnect every 3s
        this.reconnectTimer = setTimeout(() => this.connect(), 3000);
      };

      this.ws.onerror = (e) => {
        console.warn('Game socket error:', e);
      };
    } catch (e) {
      console.warn('Socket connect failed:', e);
    }
  }

  public on(event: string, callback: SocketEventCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => this.listeners.get(event)?.delete(callback);
  }

  private emitLocal(event: string, data: any) {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach((fn) => fn(data));
    }
  }

  public send(type: string, data: any = {}) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, data }));
    } else {
      // If server socket is not yet open, queue or handle locally
      this.handleLocalFallback(type, data);
    }
  }

  // Room actions
  public createRoom(params: { name: string; gameType: GameType; maxPlayers: number; isPrivate: boolean; player: RoomPlayer }) {
    this.send('create_room', params);
  }

  public joinRoom(params: { roomCode: string; player: RoomPlayer }) {
    this.send('join_room', params);
  }

  public leaveRoom(params: { roomId: string; playerId: string }) {
    this.send('leave_room', params);
  }

  public toggleReady(params: { roomId: string; playerId: string }) {
    this.send('toggle_ready', params);
  }

  public startGame(params: { roomId: string }) {
    this.send('start_game', params);
  }

  public sendChat(params: { roomId: string; message: ChatMessage }) {
    this.send('send_chat', params);
  }

  // Game specific actions
  public sendCaroMove(params: { roomId: string; row: number; col: number; playerId: string }) {
    this.send('caro_move', params);
  }

  public sendBauCuaBet(params: { roomId: string; playerId: string; symbol: BauCuaSymbol; amount: number }) {
    this.send('baucua_bet', params);
  }

  public sendBauCuaShake(params: { roomId: string }) {
    this.send('baucua_shake', params);
  }

  public sendTienLenPlay(params: { roomId: string; playerId: string; cards: PlayingCard[] }) {
    this.send('tienlen_play', params);
  }

  public sendTienLenPass(params: { roomId: string; playerId: string }) {
    this.send('tienlen_pass', params);
  }

  public sendCaNguaRoll(params: { roomId: string; playerId: string }) {
    this.send('cangua_roll', params);
  }

  public sendCaNguaMove(params: { roomId: string; playerId: string; horseIndex: number; color: HorseColor }) {
    this.send('cangua_move', params);
  }

  public requestRematch(params: { roomId: string }) {
    this.send('rematch', params);
  }

  // Client-side fallback if server socket is unavailable
  private handleLocalFallback(type: string, data: any) {
    if (type === 'create_room') {
      const room: GameRoom = {
        id: 'local_' + Math.random().toString(36).substring(2, 8),
        code: Math.floor(1000 + Math.random() * 9000).toString(),
        name: data.name || 'Phòng Của Tôi',
        gameType: data.gameType,
        maxPlayers: data.maxPlayers || 2,
        players: [{ ...data.player, isHost: true, isReady: true }],
        status: 'waiting',
        hostId: data.player.id,
        isPrivate: data.isPrivate || false,
        gameState: null,
        createdAt: Date.now(),
      };
      this.currentRoom = room;
      this.emitLocal('room_created', { room });
      this.emitLocal('room_updated', { room });
    }
  }
}

export const gameSocket = new GameSocketClient();
