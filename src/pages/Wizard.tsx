import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { UploadCloud, Sparkles, ArrowRight, Loader2, CheckCircle2, AlertCircle, File, X, Layout as LayoutIcon } from 'lucide-react';
import Layout from '../components/Layout';
import Onboarding from '../components/Onboarding';
import { parseIdea } from '../services/ai';
import { BusinessIdea, UserKit, UploadedFile } from '../types';
import { QUICK_START_TEMPLATES, Template } from '../constants/templates';

import { saveKit } from '../services/storage';
import { auth } from '../lib/firebase';

const VIBES = [
  { id: 'minimal', name: 'Minimal & Clean', desc: 'Lots of whitespace, sans-serif fonts, monochrome with one accent color.' },
  { id: 'bold', name: 'Bold & Energetic', desc: 'High contrast, large typography, vibrant colors, dynamic layouts.' },
  { id: 'luxury', name: 'Luxury & Premium', desc: 'Serif fonts, muted earth tones or dark mode, elegant spacing.' },
  { id: 'tech', name: 'Tech & Modern', desc: 'Monospace accents, dark themes, neon highlights, grid patterns.' },
];

export default function Wizard() {
  const navigate = useNavigate();
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('launchkit_onboarding_seen');
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
    }
  }, []);

  const [step, setStep] = useState(1);
  const [rawIdea, setRawIdea] = useState('');
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsedIdea, setParsedIdea] = useState<Partial<BusinessIdea>>({});
  const [selectedVibe, setSelectedVibe] = useState('minimal');

  const handleApplyTemplate = (template: Template) => {
    setParsedIdea(template.idea);
    setSelectedVibe(template.vibe);
    setStep(2);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    selectedFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setFiles(prev => [...prev, {
            data: event.target!.result as string,
            mimeType: file.type,
            name: file.name
          }]);
        }
      };
      reader.readAsDataURL(file);
    });
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleMagicImport = async () => {
    if (!rawIdea.trim() && files.length === 0) return;
    setIsParsing(true);
    const result = await parseIdea(rawIdea, files);
    setParsedIdea(result);
    setIsParsing(false);
    setStep(2);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(3);
  };

  const handleGenerate = async () => {
    const kitName = parsedIdea.solution 
      ? (parsedIdea.solution.length > 30 ? parsedIdea.solution.substring(0, 30) + '...' : parsedIdea.solution)
      : 'Untitled Project';

    const kit: UserKit = {
      id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `kit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: kitName,
      ownerId: auth.currentUser?.uid,
      updatedAt: Date.now(),
      idea: parsedIdea as BusinessIdea,
      vibe: selectedVibe,
      deliverables: [
        { id: 'logo', title: 'Logo Design', category: '🎨 Logo', content: '', status: 'pending' },
        { id: 'brand', title: 'Brand Identity', category: '🎨 Brand Identity', content: '', status: 'pending' },
        { id: 'market', title: 'Market Intel', category: '📊 Market Intel', content: '', status: 'pending' },
        { id: 'comp', title: 'Competitive Analysis', category: '🔍 Competition', content: '', status: 'pending' },
        { id: 'plan', title: 'Business Plan', category: '📝 Business Plan', content: '', status: 'pending' },
        { id: 'fin', title: 'Financial Projections', category: '💰 Financials', content: '', status: 'pending' },
        { id: 'mktg', title: 'Marketing Strategy', category: '📣 Marketing', content: '', status: 'pending' },
        { id: 'pitch', title: 'Pitch Deck', category: '🎤 Pitch Deck', content: '', status: 'pending' },
        { id: 'legal', title: 'Legal & Social', category: '📄 Legal & Social', content: '', status: 'pending' },
      ],
      collaborators: []
    };
    
    await saveKit(kit);
    
    // Simulate a brief loading state before redirecting
    setStep(4);
    setTimeout(() => {
      navigate('/dashboard', { state: { kit } });
    }, 2000);
  };

  return (
    <Layout>
      <AnimatePresence>
        {showOnboarding && (
          <Onboarding onComplete={() => {
            setShowOnboarding(false);
            localStorage.setItem('launchkit_onboarding_seen', 'true');
          }} />
        )}
      </AnimatePresence>

      <div className="max-w-3xl mx-auto px-4 py-12 w-full">
        {/* Progress Bar */}
        <div className="mb-8 md:mb-12">
          <div className="flex justify-between mb-2">
            {['Magic Import', 'Refine Details', 'Choose Vibe', 'Generate'].map((label, i) => (
              <span key={`step-${i}`} className={`text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-center ${step > i ? 'text-indigo-600' : 'text-neutral-400'}`}>
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">Step {i + 1}</span>
              </span>
            ))}
          </div>
          <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-indigo-500"
              initial={{ width: '0%' }}
              animate={{ width: `${((step - 1) / 3) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-neutral-900 p-8 rounded-2xl shadow-sm border border-neutral-800"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-indigo-900/30 rounded-xl text-indigo-400">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">The "Magic Import" Intake</h2>
                  <p className="text-neutral-400">Dump your brain here or start with a template.</p>
                </div>
                {!rawIdea && files.length === 0 && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="ml-auto bg-indigo-500 text-white text-[10px] font-bold px-2 py-1 rounded-md animate-bounce"
                  >
                    Start Here!
                  </motion.div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
                {QUICK_START_TEMPLATES.map((template) => (
                  <button
                    key={`template-${template.id}`}
                    onClick={() => handleApplyTemplate(template)}
                    className="flex flex-col items-center p-4 bg-neutral-950 border border-neutral-800 rounded-xl hover:border-indigo-500 hover:bg-neutral-900 transition-all group"
                  >
                    <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">{template.icon}</span>
                    <span className="text-xs font-bold text-white mb-1">{template.name}</span>
                    <span className="text-[10px] text-neutral-500 text-center leading-tight">{template.description}</span>
                  </button>
                ))}
              </div>

              <div className="relative mb-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-neutral-800"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-neutral-900 px-2 text-neutral-500 font-bold">Or Start from Scratch</span>
                </div>
              </div>

              <textarea
                value={rawIdea}
                onChange={(e) => setRawIdea(e.target.value)}
                placeholder="e.g., I want to build a SaaS for dog walkers that helps them schedule walks and bill clients automatically. It should cost $15/mo. I'll find customers in local Facebook groups..."
                className="w-full h-48 p-4 bg-neutral-950 border border-neutral-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none text-neutral-200 mb-4 placeholder:text-neutral-600"
              />

              <div className="mb-6">
                <input 
                  type="file" 
                  multiple 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden" 
                  accept=".pdf,.txt,.doc,.docx,.csv"
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center text-sm text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
                >
                  <UploadCloud className="w-4 h-4 mr-2" />
                  Upload PDFs or Documents
                </button>
                
                {files.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {files.map((file, i) => (
                      <div key={`file-${i}`} className="flex items-center justify-between p-3 bg-neutral-950 border border-neutral-800 rounded-lg">
                        <div className="flex items-center text-sm text-neutral-300 truncate">
                          <File className="w-4 h-4 mr-2 text-neutral-500 shrink-0" />
                          <span className="truncate">{file.name}</span>
                        </div>
                        <button onClick={() => removeFile(i)} className="text-neutral-500 hover:text-red-400 p-1">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={handleMagicImport}
                disabled={isParsing || (!rawIdea.trim() && files.length === 0)}
                className="w-full flex items-center justify-center py-4 px-6 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isParsing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Extracting Business Logic...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Analyze Idea
                  </>
                )}
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-neutral-900 p-8 rounded-2xl shadow-sm border border-neutral-800"
            >
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">Smart Form Autofill</h2>
                <p className="text-neutral-400">We extracted what we could. Fill in the gaps to complete your profile.</p>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-6">
                {[
                  { id: 'problem', label: 'The Problem', desc: 'What pain point are you solving?' },
                  { id: 'solution', label: 'The Solution', desc: 'What is your product or service?' },
                  { id: 'targetAudience', label: 'Target Audience', desc: 'Who exactly is buying this?' },
                  { id: 'pricingStrategy', label: 'Pricing Strategy', desc: 'How will you make money?' },
                  { id: 'marketingChannels', label: 'Marketing Channels', desc: 'How will you find your first 100 customers?' },
                ].map((field) => {
                  const value = parsedIdea[field.id as keyof BusinessIdea] || '';
                  const isMissing = !value;

                  return (
                    <div key={`field-${field.id}`} className={`p-4 rounded-xl border ${isMissing ? 'border-amber-900/50 bg-amber-900/10' : 'border-neutral-800 bg-neutral-950'}`}>
                      <label className="block text-sm font-bold text-white mb-1">
                        {field.label}
                        {isMissing && (
                          <span className="ml-2 inline-flex items-center text-xs font-semibold text-amber-400 bg-amber-900/30 px-2 py-0.5 rounded-full">
                            <AlertCircle className="w-3 h-3 mr-1" /> Needs Info
                          </span>
                        )}
                      </label>
                      <p className="text-xs text-neutral-400 mb-2">{field.desc}</p>
                      <textarea
                        required
                        value={value}
                        onChange={(e) => setParsedIdea({ ...parsedIdea, [field.id]: e.target.value })}
                        className="w-full p-3 bg-neutral-900 border border-neutral-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm text-neutral-200"
                        rows={3}
                      />
                    </div>
                  );
                })}

                <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-full sm:w-auto px-6 py-3.5 border border-neutral-700 text-neutral-300 rounded-xl font-medium hover:bg-neutral-800 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="w-full sm:flex-1 flex items-center justify-center py-3.5 px-6 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
                  >
                    Continue to Branding
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-neutral-900 p-8 rounded-2xl shadow-sm border border-neutral-800"
            >
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">Choose Your Vibe</h2>
                <p className="text-neutral-400">This will dictate the typography, colors, and layout of your generated assets.</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 mb-8">
                {VIBES.map((vibe) => (
                  <button
                    key={`vibe-${vibe.id}`}
                    onClick={() => setSelectedVibe(vibe.id)}
                    className={`text-left p-6 rounded-xl border-2 transition-all ${
                      selectedVibe === vibe.id
                        ? 'border-indigo-500 bg-indigo-900/20 ring-4 ring-indigo-500/10'
                        : 'border-neutral-800 hover:border-neutral-600 hover:bg-neutral-800'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-bold text-white">{vibe.name}</h3>
                      {selectedVibe === vibe.id && <CheckCircle2 className="w-5 h-5 text-indigo-400" />}
                    </div>
                    <p className="text-sm text-neutral-400">{vibe.desc}</p>
                  </button>
                ))}
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4">
                <button
                  onClick={() => setStep(2)}
                  className="w-full sm:w-auto px-6 py-3.5 border border-neutral-700 text-neutral-300 rounded-xl font-medium hover:bg-neutral-800 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleGenerate}
                  className="w-full sm:flex-1 flex items-center justify-center py-3.5 px-6 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Generate LaunchKit
                </button>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-neutral-900 p-12 rounded-2xl shadow-sm border border-neutral-800 text-center"
            >
              <div className="w-20 h-20 bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Initializing Logic Engine...</h2>
              <p className="text-neutral-400">Preparing your personalized dashboard.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
