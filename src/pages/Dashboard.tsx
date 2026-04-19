import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Loader2, FileText, Download, Play, AlertCircle, Sparkles, Menu, X, Terminal, Rocket, Star, Users, MessageSquare, Share2, Copy, Check } from 'lucide-react';
import Markdown from 'react-markdown';
import Layout from '../components/Layout';
import { generateDeliverableContent, runMarketingAgentsStream } from '../services/ai';
import { saveKit } from '../services/storage';
import { UserKit, Deliverable, Comment } from '../types';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, onSnapshot, collection, query, orderBy, addDoc, deleteDoc, updateDoc, arrayUnion, arrayRemove, where } from 'firebase/firestore';
import CollaborationModal from '../components/CollaborationModal';
import Comments from '../components/Comments';

export default function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const [kit, setKit] = useState<UserKit | null>(null);
  const [activeDeliverable, setActiveDeliverable] = useState<Deliverable | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showMarketingAgents, setShowMarketingAgents] = useState(false);
  const [marketingStream, setMarketingStream] = useState('');
  const [isMarketingRunning, setIsMarketingRunning] = useState(false);
  const [quotaError, setQuotaError] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isFeedbackSaved, setIsFeedbackSaved] = useState(false);
  const [showShareTooltip, setShowShareTooltip] = useState(false);

  const [showCollabModal, setShowCollabModal] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [permissionError, setPermissionError] = useState(false);

  const currentUserRole = kit?.ownerId === auth.currentUser?.uid 
    ? 'owner' 
    : (kit?.collaborators?.find(c => c.email === auth.currentUser?.email)?.role || 'viewer');

  const canEdit = currentUserRole === 'owner' || currentUserRole === 'editor';

  // Real-time kit sync
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const kitId = searchParams.get('kitId') || location.state?.kit?.id;
    const assetId = searchParams.get('assetId');

    if (!kitId) {
      navigate('/wizard');
      return;
    }

    // If not logged in, we can't easily fetch from Firestore by ID if it's protected
    // But we can check local storage if available
    if (!auth.currentUser) {
      const savedLocal = localStorage.getItem('launchkit_saved_projects');
      if (savedLocal) {
        const kits = JSON.parse(savedLocal) as UserKit[];
        const found = kits.find(k => k.id === kitId);
        if (found) {
          setKit(found);
          if (assetId) {
            const asset = found.deliverables.find(d => d.id === assetId);
            if (asset) setActiveDeliverable(asset);
          } else if (!activeDeliverable && !showMarketingAgents) {
            setActiveDeliverable(found.deliverables[0]);
          }
          return;
        }
      }
      
      const initialKit = location.state?.kit;
      if (initialKit && initialKit.id === kitId) {
        setKit(initialKit);
        if (assetId) {
          const asset = initialKit.deliverables.find(d => d.id === assetId);
          if (asset) setActiveDeliverable(asset);
        } else if (!activeDeliverable && !showMarketingAgents) {
          setActiveDeliverable(initialKit.deliverables[0]);
        }
      }
      return;
    }

    const unsubscribe = onSnapshot(doc(db, 'kits', kitId), (doc) => {
      setPermissionError(false);
      if (doc.exists()) {
        const data = doc.data() as UserKit;
        setKit(data);
        // Sync active deliverable
        if (assetId && !activeDeliverable) {
          const target = data.deliverables.find(d => d.id === assetId);
          if (target) setActiveDeliverable(target);
        } else if (activeDeliverable) {
          const updated = data.deliverables.find(d => d.id === activeDeliverable.id);
          if (updated) setActiveDeliverable(updated);
        } else if (!showMarketingAgents) {
          setActiveDeliverable(data.deliverables[0]);
        }
      }
    }, (error) => {
      // Only report if we're actually supposed to have access
      if (auth.currentUser) {
        if (error.message.includes('permission')) {
          setPermissionError(true);
        } else {
          handleFirestoreError(error, OperationType.GET, `kits/${kitId}`);
        }
      }
    });

    return () => unsubscribe();
  }, [location.state?.kit?.id, navigate, auth.currentUser]);

  // Real-time comments sync
  useEffect(() => {
    if (!kit || !activeDeliverable || !auth.currentUser) return;

    const q = query(
      collection(db, 'kits', kit.id, 'comments'),
      where('deliverableId', '==', activeDeliverable.id),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newComments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment));
      setComments(newComments);
    }, (error) => {
      if (auth.currentUser) {
        console.error("Comments sync failed:", error);
      }
    });

    return () => unsubscribe();
  }, [kit?.id, activeDeliverable?.id, auth.currentUser]);

  useEffect(() => {
    if (activeDeliverable) {
      setRating(activeDeliverable.feedback?.rating || 0);
      setComment(activeDeliverable.feedback?.comment || '');
      setIsFeedbackSaved(!!activeDeliverable.feedback);
    }
  }, [activeDeliverable?.id]);

  const handleGenerateAsset = async (deliverableId: string, feedbackOverride?: { rating: number; comment: string }) => {
    if (!kit) return;

    const targetDeliverable = kit.deliverables.find(d => d.id === deliverableId);
    if (!targetDeliverable) return;

    // Update status to generating in Firestore
    try {
      const updatedDeliverables = kit.deliverables.map(d => 
        d.id === deliverableId ? { ...d, status: 'generating' as const } : d
      );
      await updateDoc(doc(db, 'kits', kit.id), { deliverables: updatedDeliverables });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `kits/${kit.id}`);
    }

    const feedbackToUse = feedbackOverride || targetDeliverable.feedback;

    try {
      const content = await generateDeliverableContent(
        kit.idea,
        kit.vibe,
        targetDeliverable.category,
        targetDeliverable.title,
        feedbackToUse
      );

      const finalDeliverables = kit.deliverables.map(d => 
        d.id === deliverableId ? { ...d, status: 'completed' as const, content } : d
      );
      await updateDoc(doc(db, 'kits', kit.id), { deliverables: finalDeliverables, updatedAt: Date.now() });

    } catch (error: any) {
      if (error.message === 'QUOTA_EXCEEDED') {
        setQuotaError(true);
        setTimeout(() => setQuotaError(false), 10000);
      }
      
      const failedDeliverables = kit.deliverables.map(d => 
        d.id === deliverableId ? { ...d, status: 'failed' as const } : d
      );
      await updateDoc(doc(db, 'kits', kit.id), { deliverables: failedDeliverables });
    }
  };

  const handleInvite = async (email: string, role: 'editor' | 'viewer') => {
    if (!kit) return;
    try {
      await updateDoc(doc(db, 'kits', kit.id), {
        collaborators: arrayUnion({ email, role })
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `kits/${kit.id}`);
    }
  };

  const handleRemoveCollaborator = async (email: string) => {
    if (!kit) return;
    const collab = kit.collaborators?.find(c => c.email === email);
    if (!collab) return;
    try {
      await updateDoc(doc(db, 'kits', kit.id), {
        collaborators: arrayRemove(collab)
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `kits/${kit.id}`);
    }
  };

  const handleTogglePublic = async (isPublic: boolean) => {
    if (!kit) return;
    try {
      await updateDoc(doc(db, 'kits', kit.id), { isPublic });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `kits/${kit.id}`);
    }
  };

  const handleSendComment = async (text: string) => {
    if (!kit || !activeDeliverable || !auth.currentUser) return;
    try {
      await addDoc(collection(db, 'kits', kit.id, 'comments'), {
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || 'Anonymous',
        userPhoto: auth.currentUser.photoURL,
        text,
        createdAt: Date.now(),
        deliverableId: activeDeliverable.id,
        kitId: kit.id
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `kits/${kit.id}/comments`);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!kit) return;
    try {
      await deleteDoc(doc(db, 'kits', kit.id, 'comments', commentId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `kits/${kit.id}/comments/${commentId}`);
    }
  };

  const handleSaveFeedback = async () => {
    if (!kit || !activeDeliverable || rating === 0) return;
    if (!canEdit) return; // Only editors/owners can trigger regeneration via feedback
    
    const newFeedback = { rating, comment };
    const updatedDeliverables = kit.deliverables.map(d => 
      d.id === activeDeliverable.id ? { ...d, feedback: newFeedback } : d
    );
    await updateDoc(doc(db, 'kits', kit.id), { deliverables: updatedDeliverables });
    setIsFeedbackSaved(true);
    await handleGenerateAsset(activeDeliverable.id, newFeedback);
  };

  const handleCopyShareLink = (deliverableId?: string) => {
    const url = new URL(window.location.origin + window.location.pathname);
    url.searchParams.set('kitId', kit?.id || '');
    if (deliverableId) url.searchParams.set('assetId', deliverableId);
    
    navigator.clipboard.writeText(url.toString());
    setShowShareTooltip(true);
    setTimeout(() => setShowShareTooltip(false), 2000);
  };

  const handleRunMarketingAgents = async () => {
    if (!kit || isMarketingRunning) return;
    
    setIsMarketingRunning(true);
    setMarketingStream('');
    
    try {
      await runMarketingAgentsStream(kit.idea, kit.vibe, (chunk) => {
        setMarketingStream(prev => prev + chunk);
      });
    } catch (error) {
      console.error("Marketing agents failed:", error);
      setMarketingStream(prev => prev + '\n\n[SYSTEM ERROR]: Agent connection lost. Please retry.');
    } finally {
      setIsMarketingRunning(false);
    }
  };

  if (!kit) return null;

  return (
    <Layout hideFooter>
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-neutral-950 relative">
        
        {/* Permission Error Overlay */}
        <AnimatePresence>
          {permissionError && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
            >
              <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-3xl p-8 text-center shadow-2xl">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-4">Access Denied</h2>
                <p className="text-neutral-400 mb-8">
                  You don't have permission to view this project. This usually happens if you're not signed in with the correct account.
                </p>
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={() => window.location.reload()}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold transition-all"
                  >
                    Try Again
                  </button>
                  <button 
                    onClick={() => navigate('/')}
                    className="w-full bg-neutral-800 hover:bg-neutral-700 text-white py-3 rounded-xl font-bold transition-all"
                  >
                    Back to Home
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-neutral-950/80 z-40 md:hidden backdrop-blur-sm"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={`
          fixed md:static inset-y-0 left-0 z-50 w-80 bg-neutral-900 border-r border-neutral-800 flex flex-col h-[calc(100vh-4rem)]
          transform transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          <div className="p-6 border-b border-neutral-800">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-lg font-bold text-white mb-1 truncate max-w-[180px]">{kit.name}</h2>
                <p className="text-xs text-neutral-400">Vibe: <span className="capitalize font-medium text-neutral-200">{kit.vibe}</span></p>
              </div>
              <div className="flex gap-1">
                <button 
                  onClick={() => setShowCollabModal(true)}
                  className="p-2 text-neutral-400 hover:bg-neutral-800 rounded-lg transition-colors"
                  title="Collaborators"
                >
                  <Users className="w-4 h-4" />
                </button>
                <button className="md:hidden p-2 text-neutral-400 hover:bg-neutral-800 rounded-lg" onClick={() => setIsSidebarOpen(false)}>
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
          
          <div className="p-4 space-y-2 flex-1 overflow-y-auto">
            <button
              onClick={() => { setShowMarketingAgents(true); setActiveDeliverable(null); setIsSidebarOpen(false); }}
              className={`w-full text-left p-4 rounded-xl transition-all flex items-start gap-3 mb-4 ${
                showMarketingAgents 
                  ? 'bg-indigo-900/20 border border-indigo-500/30 shadow-sm' 
                  : 'hover:bg-neutral-800 border border-transparent'
              }`}
            >
              <div className="mt-0.5">
                <Terminal className={`w-5 h-5 ${showMarketingAgents ? 'text-indigo-400' : 'text-neutral-500'}`} />
              </div>
              <div>
                <div className={`font-semibold text-sm ${showMarketingAgents ? 'text-indigo-300' : 'text-neutral-300'}`}>
                  Autonomous Marketing
                </div>
                <div className="text-xs text-neutral-500 mt-1">AI Agent Swarm</div>
              </div>
            </button>

            <div className="text-xs font-bold text-neutral-600 uppercase tracking-wider mb-2 px-2">Deliverables</div>
            {kit.deliverables.map((item, index) => (
              <button
                key={`${item.id}-${index}`}
                onClick={() => { setActiveDeliverable(item); setShowMarketingAgents(false); setIsSidebarOpen(false); }}
                className={`w-full text-left p-4 rounded-xl transition-all flex items-start gap-3 ${
                  activeDeliverable?.id === item.id && !showMarketingAgents
                    ? 'bg-neutral-800 border border-neutral-700 shadow-sm' 
                    : 'hover:bg-neutral-800/50 border border-transparent'
                }`}
              >
                <div className="mt-0.5">
                  {item.status === 'completed' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : item.status === 'generating' ? (
                    <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                  ) : item.status === 'failed' ? (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-neutral-700" />
                  )}
                </div>
                <div>
                  <div className={`font-semibold text-sm ${activeDeliverable?.id === item.id && !showMarketingAgents ? 'text-white' : 'text-neutral-300'}`}>
                    {item.title}
                  </div>
                  <div className="text-xs text-neutral-500 mt-1">{item.category}</div>
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <main className="flex-1 h-[calc(100vh-4rem)] overflow-y-auto bg-neutral-950 p-4 md:p-8">
            <div className="md:hidden mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsSidebarOpen(true)}
                  className="p-2.5 bg-neutral-900 border border-neutral-800 rounded-xl shadow-sm text-neutral-300 hover:bg-neutral-800"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <h1 className="font-bold text-white text-lg truncate max-w-[150px]">{kit.name}</h1>
              </div>
              <button 
                onClick={() => setShowComments(!showComments)}
                className={`p-2.5 rounded-xl border transition-all ${showComments ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-neutral-900 border-neutral-800 text-neutral-400'}`}
              >
                <MessageSquare className="w-5 h-5" />
              </button>
            </div>

            <AnimatePresence mode="wait">
              {showMarketingAgents && (
                <motion.div
                  key="marketing-agents"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="max-w-4xl mx-auto h-full flex flex-col"
                >
                  <div className="bg-neutral-900 rounded-2xl shadow-sm border border-neutral-800 overflow-hidden flex-1 flex flex-col min-h-[600px]">
                    {/* Header */}
                    <div className="border-b border-neutral-800 p-4 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between bg-neutral-900 sticky top-0 z-10 gap-4">
                      <div>
                        <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                          <Terminal className="w-6 h-6 text-indigo-400" />
                          Autonomous Marketing Swarm
                        </h1>
                        <p className="text-sm text-neutral-400 mt-1">Acquire your first 100 customers at $0 cost.</p>
                      </div>
                      <div className="flex flex-wrap gap-2 sm:gap-3">
                        <button 
                          onClick={handleRunMarketingAgents}
                          disabled={isMarketingRunning}
                          className="flex-1 sm:flex-none justify-center flex items-center px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                        >
                          {isMarketingRunning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Rocket className="w-4 h-4 mr-2" />}
                          {isMarketingRunning ? 'Agents Active...' : 'Launch Swarm'}
                        </button>
                      </div>
                    </div>

                    {/* Terminal Body */}
                    <div className="p-4 md:p-8 flex-1 bg-neutral-950 font-mono text-sm overflow-y-auto" ref={terminalRef}>
                      {!marketingStream && !isMarketingRunning ? (
                        <div className="h-full flex flex-col items-center justify-center text-center text-neutral-500 py-20">
                          <Terminal className="w-16 h-16 text-neutral-700 mb-4" />
                          <h3 className="text-lg font-medium text-neutral-300 mb-2">System Ready</h3>
                          <p className="max-w-md mx-auto mb-6">Click "Launch Swarm" to initialize the Growth Hacker, Copywriter, and Community Manager agents.</p>
                        </div>
                      ) : (
                        <div className="text-neutral-300 whitespace-pre-wrap">
                          {marketingStream}
                          {isMarketingRunning && (
                            <span className="inline-block w-2 h-4 bg-indigo-500 ml-1 animate-pulse" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeDeliverable && !showMarketingAgents && (
                <motion.div
                  key={activeDeliverable.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="max-w-4xl mx-auto"
                >
                  <div className="bg-neutral-900 rounded-2xl shadow-sm border border-neutral-800 overflow-hidden min-h-[600px] flex flex-col">
                    {/* Header */}
                    <div className="border-b border-neutral-800 p-4 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between bg-neutral-900 sticky top-0 z-10 gap-4">
                      <div>
                        <h1 className="text-xl md:text-2xl font-bold text-white">{activeDeliverable.title}</h1>
                        <p className="text-sm text-neutral-400 mt-1">{activeDeliverable.category}</p>
                      </div>
                      <div className="flex flex-wrap gap-2 sm:gap-3">
                        <div className="relative">
                          <button 
                            onClick={() => handleCopyShareLink(activeDeliverable.id)}
                            className="flex items-center px-4 py-2.5 text-sm font-medium bg-neutral-800 border border-neutral-700 text-neutral-300 rounded-xl hover:bg-neutral-700 transition-all"
                            title="Share Asset"
                          >
                            <Share2 className="w-4 h-4 mr-2" />
                            Share
                          </button>
                          <AnimatePresence>
                            {showShareTooltip && (
                              <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-emerald-600 text-white text-[10px] py-1 px-2 rounded-lg whitespace-nowrap flex items-center gap-1 shadow-lg"
                              >
                                <Check className="w-3 h-3" />
                                Link Copied!
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                        <button 
                          onClick={() => setShowComments(!showComments)}
                          className={`hidden md:flex items-center px-4 py-2.5 text-sm font-medium rounded-xl border transition-all ${showComments ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:bg-neutral-700'}`}
                        >
                          <MessageSquare className="w-4 h-4 mr-2" />
                          {showComments ? 'Hide Comments' : 'Show Comments'}
                        </button>
                        {activeDeliverable.status === 'completed' && (
                          <button className="flex-1 sm:flex-none justify-center flex items-center px-4 py-2.5 text-sm font-medium text-neutral-300 bg-neutral-800 border border-neutral-700 rounded-xl hover:bg-neutral-700 transition-colors">
                            <Download className="w-4 h-4 mr-2" />
                            Export PDF
                          </button>
                        )}
                        {(activeDeliverable.status === 'pending' || activeDeliverable.status === 'failed') && canEdit && (
                          <button 
                            onClick={() => handleGenerateAsset(activeDeliverable.id)}
                            className="flex-1 sm:flex-none justify-center flex items-center px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
                          >
                            <Play className="w-4 h-4 mr-2" />
                            Generate Asset
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Content Body */}
                    <div className="p-4 md:p-8 flex-1 bg-neutral-950">
                      {activeDeliverable.status === 'pending' && (
                        <div className="h-full flex flex-col items-center justify-center text-center text-neutral-500 py-20">
                          <FileText className="w-16 h-16 text-neutral-700 mb-4" />
                          <h3 className="text-lg font-medium text-white mb-2">Asset Not Generated Yet</h3>
                          <p className="max-w-md mx-auto mb-6">Click the button above to run the Logic Engine and generate your {activeDeliverable.title}.</p>
                          <button 
                            onClick={() => handleGenerateAsset(activeDeliverable.id)}
                            className="flex items-center px-6 py-3 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
                          >
                            <Sparkles className="w-4 h-4 mr-2" />
                            Generate Now
                          </button>
                        </div>
                      )}

                      {activeDeliverable.status === 'generating' && (
                        <div className="h-full flex flex-col items-center justify-center text-center text-neutral-500 py-20">
                          <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-6" />
                          <h3 className="text-lg font-medium text-white mb-2">Generating {activeDeliverable.title}...</h3>
                          <p className="max-w-md mx-auto">Our AI is analyzing your business logic and applying the {kit.vibe} design wrapper.</p>
                        </div>
                      )}

                      {activeDeliverable.status === 'failed' && (
                        <div className="h-full flex flex-col items-center justify-center text-center text-red-500 py-20">
                          <AlertCircle className="w-12 h-12 mb-4" />
                          <h3 className="text-lg font-medium text-white mb-2">Generation Failed</h3>
                          <p className="max-w-md mx-auto text-neutral-400 mb-6">Something went wrong while generating this asset. Please try again.</p>
                          <button 
                            onClick={() => handleGenerateAsset(activeDeliverable.id)}
                            className="flex items-center px-6 py-3 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
                          >
                            <Play className="w-4 h-4 mr-2" />
                            Retry Generation
                          </button>
                        </div>
                      )}

                      {(activeDeliverable.status === 'completed' || (activeDeliverable.status === 'generating' && activeDeliverable.content)) && (
                        <div className="space-y-8">
                          {activeDeliverable.category.includes('Logo') && activeDeliverable.content.trim().startsWith('<svg') ? (
                            <div className="flex flex-col items-center justify-center p-12 bg-neutral-900 rounded-xl border border-neutral-800 shadow-inner">
                              <div 
                                className="w-full max-w-[400px] aspect-square flex items-center justify-center"
                                dangerouslySetInnerHTML={{ __html: activeDeliverable.content }}
                              />
                              <div className="mt-8 flex gap-4">
                                <button 
                                  onClick={() => {
                                    const blob = new Blob([activeDeliverable.content], { type: 'image/svg+xml' });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `${kit.name.replace(/\s+/g, '-').toLowerCase()}-logo.svg`;
                                    a.click();
                                    URL.revokeObjectURL(url);
                                  }}
                                  className="flex items-center px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-sm font-medium transition-colors border border-neutral-700"
                                >
                                  <Download className="w-4 h-4 mr-2" />
                                  Download SVG
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className={`prose prose-invert max-w-none p-4 md:p-8 rounded-xl shadow-sm border border-neutral-800 bg-neutral-900
                              ${kit.vibe === 'minimal' ? 'prose-neutral prose-headings:font-normal prose-headings:tracking-tight' : ''}
                              ${kit.vibe === 'bold' ? 'prose-slate prose-headings:font-black prose-headings:uppercase prose-a:text-indigo-400' : ''}
                              ${kit.vibe === 'luxury' ? 'prose-stone prose-headings:font-serif prose-headings:font-normal prose-p:leading-relaxed' : ''}
                              ${kit.vibe === 'tech' ? 'prose-zinc prose-headings:font-mono prose-headings:tracking-tight prose-a:text-emerald-400' : ''}
                            `}>
                              <Markdown>{activeDeliverable.content}</Markdown>
                            </div>
                          )}

                          {/* Feedback Section */}
                          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
                            <h3 className="text-lg font-medium text-white mb-4">Rate this deliverable</h3>
                            
                            <div className="flex items-center gap-2 mb-4">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => setRating(star)}
                                  onMouseEnter={() => setHoverRating(star)}
                                  onMouseLeave={() => setHoverRating(0)}
                                  className="p-1 focus:outline-none transition-colors"
                                >
                                  <Star 
                                    className={`w-8 h-8 ${
                                      (hoverRating || rating) >= star 
                                        ? 'fill-amber-400 text-amber-400' 
                                        : 'text-neutral-600 hover:text-neutral-500'
                                    }`} 
                                  />
                                </button>
                              ))}
                            </div>

                            <div className="space-y-3">
                              <label className="block text-sm font-medium text-neutral-400">
                                Additional comments (optional)
                              </label>
                              <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="What did you like? What could be improved?"
                                className="w-full p-3 bg-neutral-950 border border-neutral-800 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm text-neutral-200 resize-none"
                                rows={3}
                              />
                              
                              <div className="flex items-center justify-between pt-2">
                                {isFeedbackSaved ? (
                                  <span className="text-emerald-400 text-sm flex items-center">
                                    <CheckCircle2 className="w-4 h-4 mr-1.5" />
                                    Feedback saved!
                                  </span>
                                ) : (
                                  <span /> // Spacer
                                )}
                                
                                <button
                                  onClick={handleSaveFeedback}
                                  disabled={rating === 0 || activeDeliverable.status === 'generating'}
                                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                                >
                                  {activeDeliverable.status === 'generating' ? (
                                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Regenerating...</>
                                  ) : (
                                    <><Sparkles className="w-4 h-4 mr-2" /> Submit & Regenerate</>
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>

        {/* Comments Sidebar */}
        <AnimatePresence>
          {showComments && activeDeliverable && (
            <motion.div
              initial={{ x: 320 }}
              animate={{ x: 0 }}
              exit={{ x: 320 }}
              className="fixed md:static inset-y-0 right-0 z-50"
            >
              <Comments 
                comments={comments} 
                onSend={handleSendComment} 
                onDelete={handleDeleteComment}
                currentUserId={auth.currentUser?.uid}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collaboration Modal */}
        {showCollabModal && kit && (
          <CollaborationModal 
            kit={kit} 
            onClose={() => setShowCollabModal(false)}
            onInvite={handleInvite}
            onRemove={handleRemoveCollaborator}
            onTogglePublic={handleTogglePublic}
          />
        )}
      </div>
    </Layout>
  );
}
