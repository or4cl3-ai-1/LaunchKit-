import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, UserPlus, Mail, Shield, Trash2, Loader2 } from 'lucide-react';
import { UserKit } from '../types';

interface CollaborationModalProps {
  kit: UserKit;
  onClose: () => void;
  onInvite: (email: string, role: 'editor' | 'viewer') => Promise<void>;
  onRemove: (email: string) => Promise<void>;
  onTogglePublic: (isPublic: boolean) => Promise<void>;
}

export default function CollaborationModal({ kit, onClose, onInvite, onRemove, onTogglePublic }: CollaborationModalProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'editor' | 'viewer'>('viewer');
  const [isInviting, setIsInviting] = useState(false);
  const [isUpdatingPublic, setIsUpdatingPublic] = useState(false);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsInviting(true);
    try {
      await onInvite(email, role);
      setEmail('');
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl"
      >
        <div className="p-6 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-lg">
              <UserPlus className="w-5 h-5 text-indigo-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Collaborators</h2>
          </div>
          <button onClick={onClose} className="p-2 text-neutral-500 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/10 rounded-lg">
                <Mail className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">Public Sharing</div>
                <div className="text-xs text-neutral-500">Anyone with the link can view</div>
              </div>
            </div>
            <button
              onClick={() => onTogglePublic(!kit.isPublic)}
              disabled={isUpdatingPublic}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${kit.isPublic ? 'bg-indigo-600' : 'bg-neutral-800'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${kit.isPublic ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          <form onSubmit={handleInvite} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Invite via Email</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <input 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="colleague@example.com"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <select 
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'editor' | 'viewer')}
                  className="bg-neutral-950 border border-neutral-800 rounded-xl px-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                </select>
              </div>
            </div>
            <button 
              disabled={isInviting || !email}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-2.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
            >
              {isInviting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Invite"}
            </button>
          </form>

          <div className="space-y-3">
            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Current Team</label>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
              {/* Owner */}
              <div className="flex items-center justify-between p-3 bg-neutral-800/50 rounded-xl border border-neutral-700/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-xs">
                    O
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">Owner</div>
                    <div className="text-xs text-neutral-500">Full Access</div>
                  </div>
                </div>
                <Shield className="w-4 h-4 text-indigo-400" />
              </div>

              {/* Collaborators */}
              {kit.collaborators?.map((collab) => (
                <div key={collab.email} className="flex items-center justify-between p-3 bg-neutral-800/30 rounded-xl border border-transparent hover:border-neutral-700 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center text-white font-bold text-xs">
                      {collab.email[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white truncate max-w-[150px]">{collab.email}</div>
                      <div className="text-xs text-neutral-500 capitalize">{collab.role}</div>
                    </div>
                  </div>
                  <button 
                    onClick={() => onRemove(collab.email)}
                    className="p-2 text-neutral-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
