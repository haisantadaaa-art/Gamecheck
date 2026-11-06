import { TrendingGameArticle, UserProfile, CommunityPost, CoinTransferRecord } from '../types';

export interface TTSResponse {
  audioBase64: string;
  durationEstimate?: number;
  speaker?: string;
}

export interface TrendingResponse {
  articles: TrendingGameArticle[];
  groundingSources?: Array<{ uri: string; title: string }>;
  overview: string;
}

export interface LiveMasterResponse {
  replyText: string;
  audioBase64?: string;
}

export const api = {
  // Call server TTS endpoint with gemini-3.8-flash-tts
  async textToSpeech(text: string, style?: string, voiceName?: string): Promise<TTSResponse> {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, style, voiceName }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Lỗi phát âm thanh' }));
      throw new Error(err.error || 'TTS error');
    }

    return res.json();
  },

  // Live AI Master chat and voice response (Gemini 3.8 Flash + TTS)
  async askLiveMaster(message: string, gameContext?: any): Promise<LiveMasterResponse> {
    const res = await fetch('/api/live-master/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, gameContext }),
    });

    if (!res.ok) {
      return {
        replyText: 'Chào mừng bạn đến với VietPlay Arena của Huỳnh Âu! Chúc bạn chơi vui vẻ!',
      };
    }

    return res.json();
  },

  // Game Advice helper
  async getGameAdvice(gameType: string, gameContext: any): Promise<string> {
    const res = await this.askLiveMaster(`Tôi đang chơi ${gameType}. Hãy cho tôi 1 lời khuyên chiến thuật ngắn gọn.`, gameContext);
    return res.replyText || 'Hãy quan sát kỹ thế cờ của đối thủ!';
  },

  // Call server Google Search Grounding for trending games in Vietnam
  async getTrendingGames(): Promise<TrendingResponse> {
    const res = await fetch('/api/trending-games', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Không thể tải tin tức' }));
      throw new Error(err.error || 'Search grounding error');
    }

    return res.json();
  },

  // Register account
  async register(username: string, avatar: string, bio?: string): Promise<UserProfile> {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, avatar, bio }),
    });

    if (!res.ok) {
      throw new Error('Đăng ký tài khoản thất bại');
    }

    return res.json();
  },

  // Community Posts
  async getCommunityPosts(): Promise<CommunityPost[]> {
    const res = await fetch('/api/community/posts');
    if (!res.ok) return [];
    const data = await res.json();
    return data.posts || [];
  },

  async createCommunityPost(postData: Partial<CommunityPost>): Promise<CommunityPost> {
    const res = await fetch('/api/community/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(postData),
    });
    if (!res.ok) throw new Error('Không thể đăng bài');
    const data = await res.json();
    return data.post;
  },

  async likeCommunityPost(postId: string): Promise<void> {
    await fetch(`/api/community/posts/${postId}/like`, { method: 'POST' });
  },

  async commentCommunityPost(postId: string, text: string, authorName: string, authorAvatar: string): Promise<any> {
    const res = await fetch(`/api/community/posts/${postId}/comment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, authorName, authorAvatar }),
    });
    return res.json();
  },

  // Coin Transfers
  async transferCoins(senderName: string, recipientName: string, amount: number, message?: string): Promise<any> {
    const res = await fetch('/api/coins/transfer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senderName, recipientName, amount, message }),
    });
    if (!res.ok) throw new Error('Chuyển tiền thất bại');
    return res.json();
  },
};
