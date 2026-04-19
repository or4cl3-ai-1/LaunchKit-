import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Search, 
  Filter, 
  Grid, 
  List as ListIcon, 
  MoreVertical, 
  Trash2, 
  ExternalLink, 
  Clock, 
  Calendar,
  Rocket,
  Plus,
  ArrowRight,
  FolderOpen
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { getSavedKits, deleteKit } from '../services/storage';
import { UserKit } from '../types';
import { auth } from '../lib/firebase';

export default function Projects() {
  const navigate = useNavigate();
  const [kits, setKits] = useState<UserKit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterVibe, setFilterVibe] = useState<string>('all');

  useEffect(() => {
    const loadKits = async () => {
      setLoading(true);
      try {
        const savedKits = await getSavedKits();
        setKits(savedKits);
      } finally {
        setLoading(false);
      }
    };
    loadKits();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      await deleteKit(id);
      setKits(prev => prev.filter(k => k.id !== id));
    }
  };

  const handleOpen = (kit: UserKit) => {
    navigate('/dashboard', { state: { kit } });
  };

  const filteredKits = kits.filter(kit => {
    const name = kit.name?.toLowerCase() || '';
    const solution = kit.idea?.solution?.toLowerCase() || '';
    const problem = kit.idea?.problem?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();
    
    const matchesSearch = name.includes(query) || 
                         solution.includes(query) ||
                         problem.includes(query);
    const matchesVibe = filterVibe === 'all' || kit.vibe === filterVibe;
    return matchesSearch && matchesVibe;
  });

  const vibes = ['all', ...Array.from(new Set(kits.map(k => k.vibe).filter(v => v !== 'all')))];

  return (
    <Layout>
      <div className="flex-1 bg-neutral-950 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <div>
              <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">My Projects</h1>
              <p className="text-neutral-400">Manage and launch your business ideas.</p>
            </div>
            <button 
              onClick={() => navigate('/wizard')}
              className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20"
            >
              <Plus className="w-5 h-5" />
              New Project
            </button>
          </div>

          {/* Controls */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
              <input 
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl py-3 pl-12 pr-4 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <select 
                  value={filterVibe}
                  onChange={(e) => setFilterVibe(e.target.value)}
                  className="bg-neutral-900 border border-neutral-800 rounded-2xl py-3 pl-10 pr-8 text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer"
                >
                  {vibes.map((v, i) => (
                    <option key={`vibe-${v}-${i}`} value={v || ''} className="capitalize">{v || 'No Vibe'}</option>
                  ))}
                </select>
              </div>
              <div className="flex bg-neutral-900 border border-neutral-800 rounded-2xl p-1">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
                >
                  <ListIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-neutral-900 border border-neutral-800 rounded-3xl h-64 animate-pulse" />
              ))}
            </div>
          ) : filteredKits.length > 0 ? (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredKits.map((kit, index) => (
                  <motion.div
                    key={`${kit.id}-${index}`}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="group bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden hover:border-indigo-500/50 transition-all flex flex-col"
                  >
                    <div className="p-6 flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-indigo-500/10 rounded-2xl">
                          <Rocket className="w-6 h-6 text-indigo-400" />
                        </div>
                        <div className="flex gap-1">
                          <button 
                            onClick={() => handleDelete(kit.id)}
                            className="p-2 text-neutral-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-400 transition-colors">{kit.name}</h3>
                      <p className="text-neutral-400 text-sm line-clamp-2 mb-6">{kit.idea?.solution || 'No description available'}</p>
                      
                      <div className="flex flex-wrap gap-2 mb-6">
                        <span className="px-2 py-1 bg-neutral-800 text-neutral-400 text-[10px] font-bold uppercase tracking-wider rounded-md border border-neutral-700">
                          {kit.vibe}
                        </span>
                        <span className="px-2 py-1 bg-neutral-800 text-neutral-400 text-[10px] font-bold uppercase tracking-wider rounded-md border border-neutral-700">
                          {kit.deliverables.filter(d => d.status === 'completed').length} Assets
                        </span>
                      </div>
                    </div>
                    
                    <div className="p-6 pt-0 mt-auto">
                      <div className="flex items-center justify-between text-xs text-neutral-500 mb-6">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(kit.updatedAt).toLocaleDateString()}
                        </div>
                        {kit.ownerId === auth.currentUser?.uid ? (
                          <span className="text-indigo-400 font-medium">Owner</span>
                        ) : (
                          <span className="text-emerald-400 font-medium">Collaborator</span>
                        )}
                      </div>
                      <button 
                        onClick={() => handleOpen(kit)}
                        className="w-full flex items-center justify-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white py-3 rounded-xl font-bold transition-all group-hover:bg-indigo-600"
                      >
                        Open Project
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-800 bg-neutral-950/50">
                      <th className="p-4 text-xs font-bold text-neutral-500 uppercase tracking-wider">Project</th>
                      <th className="p-4 text-xs font-bold text-neutral-500 uppercase tracking-wider">Vibe</th>
                      <th className="p-4 text-xs font-bold text-neutral-500 uppercase tracking-wider">Progress</th>
                      <th className="p-4 text-xs font-bold text-neutral-500 uppercase tracking-wider">Last Updated</th>
                      <th className="p-4 text-xs font-bold text-neutral-500 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800">
                    {filteredKits.map((kit, index) => (
                      <tr key={`row-${kit.id}-${index}`} className="hover:bg-neutral-800/30 transition-colors group">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-500/10 rounded-lg">
                              <Rocket className="w-4 h-4 text-indigo-400" />
                            </div>
                            <div>
                              <div className="font-bold text-white group-hover:text-indigo-400 transition-colors">{kit.name}</div>
                              <div className="text-xs text-neutral-500 truncate max-w-[200px]">{kit.idea?.solution || 'No description available'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="capitalize text-sm text-neutral-400">{kit.vibe}</span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-neutral-800 rounded-full max-w-[100px] overflow-hidden">
                              <div 
                                className="h-full bg-indigo-500" 
                                style={{ width: `${(kit.deliverables.filter(d => d.status === 'completed').length / kit.deliverables.length) * 100}%` }}
                              />
                            </div>
                            <span className="text-xs text-neutral-500">
                              {kit.deliverables.filter(d => d.status === 'completed').length}/{kit.deliverables.length}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-sm text-neutral-500">
                          {new Date(kit.updatedAt).toLocaleDateString()}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => handleOpen(kit)}
                              className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-all"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDelete(kit.id)}
                              className="p-2 text-neutral-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            <div className="text-center py-24 bg-neutral-900 border border-neutral-800 rounded-3xl border-dashed">
              <div className="w-20 h-20 bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <FolderOpen className="w-10 h-10 text-neutral-600" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">No projects found</h2>
              <p className="text-neutral-400 mb-8 max-w-sm mx-auto">
                {searchQuery ? "No projects match your search criteria." : "You haven't created any business kits yet. Start your first project today!"}
              </p>
              <button 
                onClick={() => navigate('/wizard')}
                className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold transition-all"
              >
                <Plus className="w-5 h-5" />
                Create New Project
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
