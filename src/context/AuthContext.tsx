import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  loginGuest: (username?: string, avatar?: string) => UserProfile;
  loginAccount: (username: string, pass: string) => Promise<UserProfile>;
  logout: () => void;
  updateUserCoins: (delta: number) => void;
  recordGameResult: (won: boolean) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  soundEnabled: boolean;
  toggleSound: () => void;
  voiceAnnouncerEnabled: boolean;
  toggleVoiceAnnouncer: () => void;
}

const DEFAULT_AVATARS = [
  '🐉', '⚡', '🔥', '⚔️', '👑', '🦅', '🐯', '🦊', '🚀', '🥋', '🎯', '💎'
];

const STORAGE_KEY = 'vietplay_user_session';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [voiceAnnouncerEnabled, setVoiceAnnouncerEnabled] = useState<boolean>(true);

  useEffect(() => {
    // Load persisted user session
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
      } else {
        // Auto-create initial quick guest so user can play instantly without annoying barriers!
        const initial = createDefaultGuest();
        setUser(initial);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      }
    } catch {
      const initial = createDefaultGuest();
      setUser(initial);
    }
  }, []);

  const createDefaultGuest = (customName?: string, customAvatar?: string): UserProfile => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const randomAvatar = DEFAULT_AVATARS[Math.floor(Math.random() * DEFAULT_AVATARS.length)];
    return {
      id: 'user_' + Math.random().toString(36).substring(2, 9),
      username: customName || `ChiếnBinh_${randomNum}`,
      avatar: customAvatar || randomAvatar,
      coins: 20000, // 20k VietCoins tặng tân thủ
      level: 1,
      wins: 0,
      losses: 0,
      title: 'Tân Thủ VietPlay',
      isGuest: true,
      createdAt: Date.now(),
    };
  };

  const loginGuest = (username?: string, avatar?: string): UserProfile => {
    const newUser = createDefaultGuest(username, avatar);
    setUser(newUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
    return newUser;
  };

  const loginAccount = async (username: string): Promise<UserProfile> => {
    const existing = user ? { ...user } : createDefaultGuest();
    const updated: UserProfile = {
      ...existing,
      username: username.trim() || existing.username,
      isGuest: false,
      title: 'Hiệp Khách VietPlay',
    };
    setUser(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  };

  const logout = () => {
    const freshGuest = createDefaultGuest();
    setUser(freshGuest);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(freshGuest));
  };

  const updateUserCoins = (delta: number) => {
    setUser((prev) => {
      if (!prev) return null;
      const newCoins = Math.max(0, prev.coins + delta);
      const updated = { ...prev, coins: newCoins };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const recordGameResult = (won: boolean) => {
    setUser((prev) => {
      if (!prev) return null;
      const wins = won ? prev.wins + 1 : prev.wins;
      const losses = won ? prev.losses : prev.losses + 1;
      const totalGames = wins + losses;
      const level = Math.floor(totalGames / 3) + 1;

      let title = 'Tân Thủ';
      if (level >= 10) title = 'Đại Tông Sư';
      else if (level >= 6) title = 'Cao Thủ Võ Lâm';
      else if (level >= 3) title = 'Hiệp Khách';

      const updated = { ...prev, wins, losses, level, title };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const updateProfile = (updates: Partial<UserProfile>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const toggleSound = () => setSoundEnabled((v) => !v);
  const toggleVoiceAnnouncer = () => setVoiceAnnouncerEnabled((v) => !v);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loginGuest,
        loginAccount,
        logout,
        updateUserCoins,
        recordGameResult,
        updateProfile,
        soundEnabled,
        toggleSound,
        voiceAnnouncerEnabled,
        toggleVoiceAnnouncer,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
