import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Rocket, Sparkles, Users, Layout, ArrowRight, X } from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
}

const steps = [
  {
    title: "Welcome to LaunchKit",
    description: "The ultimate strategic partner for your next big idea. We help you turn concepts into professional business assets in seconds.",
    icon: <Rocket className="w-12 h-12 text-indigo-500" />,
    color: "bg-indigo-500/10"
  },
  {
    title: "The Magic Import",
    description: "Got messy notes, a rough PDF, or just a voice-to-text dump? Paste it or upload it. Our AI extracts the core business logic—problem, solution, audience—automatically.",
    icon: <Sparkles className="w-12 h-12 text-purple-500" />,
    color: "bg-purple-500/10"
  },
  {
    title: "Choose Your Vibe",
    description: "Branding isn't just a logo. Select a 'Vibe'—Minimal, Bold, Luxury, or Tech—and your entire kit, from pitch decks to svg logos, will follow that design language.",
    icon: <Layout className="w-12 h-12 text-emerald-500" />,
    color: "bg-emerald-500/10"
  },
  {
    title: "Collaborate & Grow",
    description: "Launch is a team sport. Invite collaborators, share assets via links, and iterate using real-time comments and feedback systems.",
    icon: <Users className="w-12 h-12 text-blue-500" />,
    color: "bg-blue-500/10"
  }
];

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl"
      >
        <div className="p-8">
          <div className="flex justify-between items-start mb-8">
            <div className={`p-4 rounded-2xl ${steps[currentStep].color}`}>
              {steps[currentStep].icon}
            </div>
            <button 
              onClick={onComplete}
              className="p-2 text-neutral-500 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <h2 className="text-3xl font-bold text-white tracking-tight">
                {steps[currentStep].title}
              </h2>
              <p className="text-lg text-neutral-400 leading-relaxed">
                {steps[currentStep].description}
              </p>
            </motion.div>
          </AnimatePresence>

          <div className="mt-12 flex items-center justify-between">
            <div className="flex gap-2">
              {steps.map((_, i) => (
                <div 
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === currentStep ? 'w-8 bg-indigo-500' : 'w-2 bg-neutral-800'
                  }`}
                />
              ))}
            </div>
            
            <button
              onClick={handleNext}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-indigo-500/20"
            >
              {currentStep === steps.length - 1 ? "Get Started" : "Next"}
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
