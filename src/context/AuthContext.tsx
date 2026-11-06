import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, FriendUser } from '../types';
import { soundManager } from '../services/audio';
import confetti from 'canvas-confetti';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isRegistered: boolean;
  registerUser: (username: string, avatar: string, bio?: string) => Promise<UserProfile>;
  logout: () => void;
  updateUserCoins: (delta: number) => void;
  recordGameResult: (won: boolean) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  // Sound controls
  soundEnabled: boolean;
  toggleSound: () => void;
  // Friends System
  friends: FriendUser[];
  addFriend: (username: string) => boolean;
  transferCoins: (recipientName: string, amount: number, message?: string) => Promise<boolean>;
  // Online Time Rewards
  onlineSeconds: number;
  claimedMilestones: number[]; // e.g. [180, 600, 1800]
  claimOnlineReward: (secondsMilestone: number, rewardAmount: number) => void;
}

const STORAGE_KEY = 'vietplay_huynhau_user';
const FRIENDS_KEY = 'vietplay_huynhau_friends';
const CLAIMED_REWARDS_KEY = 'vietplay_claimed_milestones';

const DEFAULT_FRIENDS: FriendUser[] = [
  { id: 'f_1', username: 'Huỳnh Âu (Admin)', avatar: '👑', isOnline: true, level: 99, statusText: 'Đang phát triển tính năng mới' },
  { id: 'f_2', username: 'Lạc Long Quân', avatar: '🐉', isOnline: true, level: 28, statusText: 'Đang tìm phòng Cờ Caro' },
  { id: 'f_3', username: 'Thần Bài Sài Gòn', avatar: '⚡', isOnline: true, level: 19, statusText: 'Vừa thắng 50k Bầu Cua' },
  { id: 'f_4', username: 'Bá Vương Hà Nội', avatar: '🔥', isOnline: false, level: 15, statusText: 'Ngoại tuyến' },
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [onlineSeconds, setOnlineSeconds] = useState<number>(0);
  const [claimedMilestones, setClaimedMilestones] = useState<number[]>([]);

  // 1. Load user session & friends on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
      }
      const storedFriends = localStorage.getItem(FRIENDS_KEY);
      if (storedFriends) {
        setFriends(JSON.parse(storedFriends));
      } else {
        setFriends(DEFAULT_FRIENDS);
        localStorage.setItem(FRIENDS_KEY, JSON.stringify(DEFAULT_FRIENDS));
      }
      const storedClaimed = localStorage.getItem(CLAIMED_REWARDS_KEY);
      if (storedClaimed) {
        setClaimedMilestones(JSON.parse(storedClaimed));
      }
    } catch {
      setFriends(DEFAULT_FRIENDS);
    }
  }, []);

  // 2. Real-time online duration tracking timer (1 tick per second)
  useEffect(() => {
    const timer = setInterval(() => {
      setOnlineSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Register New Account
  const registerUser = async (username: string, avatar: string, bio?: string): Promise<UserProfile> => {
    const newUser: UserProfile = {
      id: 'user_' + Math.random().toString(36).substring(2, 9),
      username: username.trim(),
      avatar: avatar || '🐉',
      coins: 50000, // Tặng 50.000 Xu chào mừng tân thủ
      level: 1,
      wins: 0,
      losses: 0,
      title: 'Chiến Binh Huỳnh Âu Arena',
      isGuest: false,
      isRegistered: true,
      bio: bio || 'Đam mê game dân gian & eSports',
      createdAt: Date.now(),
    };

    setUser(newUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
    soundManager.playVictory();
    try {
      confetti({ particleCount: 90, spread: 75, origin: { y: 0.6 } });
    } catch {}
    return newUser;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
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

      let title = 'Tân Thủ Huỳnh Âu';
      if (level >= 15) title = 'Đại Tông Sư Võ Lâm';
      else if (level >= 8) title = 'Cao Thủ Bất Bại';
      else if (level >= 4) title = 'Hiệp Khách Lừng Danh';

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

  // Add friend
  const addFriend = (username: string): boolean => {
    const trimmed = username.trim();
    if (!trimmed) return false;
    if (friends.some((f) => f.username.toLowerCase() === trimmed.toLowerCase())) {
      return false;
    }
    const avatars = ['🐉', '⚡', '🔥', '👑', '🦅', '🐯', '🦊'];
    const newFriend: FriendUser = {
      id: 'f_' + Math.random().toString(36).substring(2, 7),
      username: trimmed,
      avatar: avatars[Math.floor(Math.random() * avatars.length)],
      isOnline: true,
      level: Math.floor(1 + Math.random() * 10),
      statusText: 'Vừa kết bạn',
    };
    const updated = [newFriend, ...friends];
    setFriends(updated);
    localStorage.setItem(FRIENDS_KEY, JSON.stringify(updated));
    soundManager.playVictory();
    return true;
  };

  // Transfer coins to friend
  const transferCoins = async (recipientName: string, amount: number, message?: string): Promise<boolean> => {
    if (!user || user.coins < amount || amount <= 0) {
      alert('Số dư VietCoins của bạn không đủ để tặng!');
      return false;
    }

    updateUserCoins(-amount);
    soundManager.playChip();
    try {
      confetti({ particleCount: 50, spread: 50 });
    } catch {}
    return true;
  };

  // Claim online time milestone reward
  const claimOnlineReward = (secondsMilestone: number, rewardAmount: number) => {
    if (claimedMilestones.includes(secondsMilestone)) return;
    updateUserCoins(rewardAmount);
    const updated = [...claimedMilestones, secondsMilestone];
    setClaimedMilestones(updated);
    localStorage.setItem(CLAIMED_REWARDS_KEY, JSON.stringify(updated));
    soundManager.playVictory();
    try {
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    } catch {}
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isRegistered: !!user?.isRegistered,
        registerUser,
        logout,
        updateUserCoins,
        recordGameResult,
        updateProfile,
        soundEnabled,
        toggleSound,
        friends,
        addFriend,
        transferCoins,
        onlineSeconds,
        claimedMilestones,
        claimOnlineReward,
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
