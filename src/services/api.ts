import { TrendingGameArticle, UserProfile } from '../types';

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

  // Call server Gemini 3.8 Flash for AI game advice / commentary
  async getGameAdvice(gameType: string, gameContext: any): Promise<string> {
    const res = await fetch('/api/ai-advisor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameType, gameContext }),
    });

    if (!res.ok) {
      throw new Error('AI advisor error');
    }

    const data = await res.json();
    return data.advice || '';
  },

  // Fast login or guest session
  async fastLogin(username: string, avatar: string): Promise<UserProfile> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, avatar }),
    });

    if (!res.ok) {
      throw new Error('Đăng nhập thất bại');
    }

    return res.json();
  },
};
