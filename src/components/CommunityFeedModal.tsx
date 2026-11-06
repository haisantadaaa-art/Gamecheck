import React, { useState, useEffect } from 'react';
import { X, MessageSquare, Heart, Send, Sparkles, MessageCircle, Share2, Tag } from 'lucide-react';
import { CommunityPost } from '../types';
import { useAuth } from '../context/AuthContext';
import { soundManager } from '../services/audio';
import { api } from '../services/api';

interface CommunityFeedModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GAME_TAGS = ['Chung', 'Khoe Thắng Lớn 🏆', 'Cờ Caro', 'Bầu Cua Tôm Cá', 'Tiến Lên Miền Nam', 'Cờ Cá Ngựa', 'Ô Ăn Quan', 'Đố Vui Tri Thức'];

export const CommunityFeedModal: React.FC<CommunityFeedModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [selectedTag, setSelectedTag] = useState('Chung');
  const [commentInputs, setCommentInputs] = useState<{ [postId: string]: string }>({});

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const data = await api.getCommunityPosts();
      setPosts(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPosts();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;
    soundManager.playClick();

    try {
      const newPost = await api.createCommunityPost({
        authorId: user?.id || 'guest',
        authorName: user?.username || 'Hiệp Khách',
        authorAvatar: user?.avatar || '🐉',
        authorTitle: user?.title || 'Game Thủ',
        content: newContent.trim(),
        gameTag: selectedTag,
      });
      setPosts([newPost, ...posts]);
      setNewContent('');
      soundManager.playVictory();
    } catch (e) {
      alert('Không thể đăng bài');
    }
  };

  const handleLike = async (postId: string) => {
    soundManager.playClick();
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const nextLiked = !p.isLiked;
          return {
            ...p,
            isLiked: nextLiked,
            likes: p.likes + (nextLiked ? 1 : -1),
          };
        }
        return p;
      })
    );
    api.likeCommunityPost(postId).catch(() => {});
  };

  const handleAddComment = async (postId: string) => {
    const text = commentInputs[postId]?.trim();
    if (!text) return;
    soundManager.playClick();

    try {
      const res = await api.commentCommunityPost(
        postId,
        text,
        user?.username || 'Hiệp Khách',
        user?.avatar || '🐉'
      );
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id === postId) {
            return {
              ...p,
              comments: [...p.comments, res.comment],
            };
          }
          return p;
        })
      );
      setCommentInputs({ ...commentInputs, [postId]: '' });
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 max-h-[90vh] flex flex-col">
        <button
          onClick={() => {
            soundManager.playClick();
            onClose();
          }}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Cộng Đồng Game Thủ Huỳnh Âu</span>
          </div>
          <h2 className="text-xl font-black text-white">Bảng Tin Trò Chuyện & Chia Sẻ</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Đăng bài chia sẻ chiến tích thắng lớn, tìm đồng đội giao lưu các ván cược Bầu Cua, Caro và Tiến Lên!
          </p>
        </div>

        {/* Create Post Form */}
        <form onSubmit={handleCreatePost} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 mb-4">
          <div className="flex gap-2.5 items-start">
            <span className="text-2xl">{user?.avatar || '🐉'}</span>
            <div className="flex-1 space-y-2">
              <textarea
                placeholder="Bạn đang nghĩ gì? Chia sẻ chiến tích hoặc rủ bạn bè vào phòng..."
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                rows={2}
                maxLength={250}
                className="w-full bg-transparent text-slate-100 placeholder-slate-500 text-xs focus:outline-none resize-none"
              />

              {/* Tag selector */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800 flex-wrap gap-2">
                <div className="flex items-center gap-1 overflow-x-auto max-w-[340px]">
                  {GAME_TAGS.slice(0, 5).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setSelectedTag(t)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition cursor-pointer ${
                        selectedTag === t
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={!newContent.trim()}
                  className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-40 text-slate-950 font-black text-xs transition cursor-pointer shadow-md flex items-center gap-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Đăng Bài</span>
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* Feed Posts List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {posts.map((post) => (
            <div key={post.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800/90 space-y-2.5">
              {/* Author Info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{post.authorAvatar}</span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white">{post.authorName}</span>
                      <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        {post.authorTitle}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500">
                      {new Date(post.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {post.gameTag && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900 text-amber-400 border border-slate-800">
                    #{post.gameTag}
                  </span>
                )}
              </div>

              {/* Content */}
              <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">{post.content}</p>

              {/* Likes & Comments Count */}
              <div className="flex items-center gap-4 pt-2 border-t border-slate-900 text-xs">
                <button
                  onClick={() => handleLike(post.id)}
                  className={`flex items-center gap-1 transition cursor-pointer ${
                    post.isLiked ? 'text-rose-400 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${post.isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                  <span>{post.likes} Thích</span>
                </button>

                <div className="flex items-center gap-1 text-slate-400">
                  <MessageCircle className="w-4 h-4" />
                  <span>{post.comments.length} Bình luận</span>
                </div>
              </div>

              {/* Comments Section */}
              {post.comments.length > 0 && (
                <div className="space-y-1.5 pt-2 pl-2 border-l-2 border-slate-800">
                  {post.comments.map((c) => (
                    <div key={c.id} className="text-[11px] bg-slate-900/60 p-2 rounded-xl">
                      <span className="font-bold text-amber-400 mr-1.5">
                        {c.authorAvatar} {c.authorName}:
                      </span>
                      <span className="text-slate-200">{c.text}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Comment Input */}
              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Viết bình luận..."
                  value={commentInputs[post.id] || ''}
                  onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                  maxLength={100}
                  className="flex-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={() => handleAddComment(post.id)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold transition cursor-pointer"
                >
                  Gửi
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
