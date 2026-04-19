import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Send, User, Trash2, Loader2 } from 'lucide-react';
import { Comment } from '../types';
import { formatDistanceToNow } from 'date-fns';

interface CommentsProps {
  comments: Comment[];
  onSend: (text: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  currentUserId?: string;
}

export default function Comments({ comments, onSend, onDelete, currentUserId }: CommentsProps) {
  const [newComment, setNewComment] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [comments]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSending) return;
    setIsSending(true);
    try {
      await onSend(newComment);
      setNewComment('');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-neutral-900 border-l border-neutral-800 w-80">
      <div className="p-4 border-b border-neutral-800 flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-indigo-400" />
        <h3 className="font-bold text-white text-sm">Activity & Comments</h3>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {comments.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <MessageSquare className="w-8 h-8 text-neutral-700 mb-2" />
            <p className="text-xs text-neutral-500">No activity yet. Start the conversation!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="group space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {comment.userPhoto ? (
                    <img src={comment.userPhoto} alt={comment.userName} className="w-5 h-5 rounded-full" />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-neutral-800 flex items-center justify-center">
                      <User className="w-3 h-3 text-neutral-500" />
                    </div>
                  )}
                  <span className="text-xs font-bold text-white">{comment.userName}</span>
                </div>
                <span className="text-[10px] text-neutral-600">
                  {formatDistanceToNow(comment.createdAt, { addSuffix: true })}
                </span>
              </div>
              <div className="relative bg-neutral-800/50 p-3 rounded-xl rounded-tl-none border border-neutral-700/50">
                <p className="text-sm text-neutral-300 leading-relaxed">{comment.text}</p>
                {currentUserId === comment.userId && (
                  <button 
                    onClick={() => onDelete(comment.id)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 text-neutral-500 hover:text-red-400 transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSend} className="p-4 border-t border-neutral-800 bg-neutral-900/50">
        <div className="relative">
          <textarea 
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2 px-3 pr-10 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none min-h-[80px]"
          />
          <button 
            disabled={!newComment.trim() || isSending}
            className="absolute bottom-2 right-2 p-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg transition-all"
          >
            {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </form>
    </div>
  );
}
