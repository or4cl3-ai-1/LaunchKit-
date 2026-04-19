import { useState, useEffect } from 'react';
import { ArrowRight, Zap, Palette, FileText, CheckCircle2, Clock, FolderOpen } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { motion } from 'motion/react';
import { getSavedKits } from '../services/storage';
import { UserKit } from '../types';

export default function Landing() {
  const navigate = useNavigate();
  const [savedKits, setSavedKits] = useState<UserKit[]>([]);

  useEffect(() => {
    const loadKits = async () => {
      const kits = await getSavedKits();
      setSavedKits(kits);
    };
    loadKits();
  }, []);

  const handleLoadKit = (kit: UserKit) => {
    navigate('/dashboard', { state: { kit } });
  };

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-neutral-950 pt-24 pb-32">
        <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/abstract/1920/1080?blur=10')] opacity-10 bg-cover bg-center" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block py-1 px-3 rounded-full bg-indigo-900/50 text-indigo-300 text-sm font-semibold tracking-wide mb-6 border border-indigo-800">
              The Business-in-a-Box Engine
            </span>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-8 leading-tight">
              Go from "Shower Idea" to <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
                "Investor Ready"
              </span> in 10 minutes.
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-neutral-400 mb-10 leading-relaxed">
              LaunchKit is an AI-powered strategic partner that transforms raw ideas or messy notes into a cohesive, professionally designed suite of business assets.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                to="/wizard"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200 w-full sm:w-auto"
              >
                Start Your Engine
                <ArrowRight className="ml-2 -mr-1 w-5 h-5" />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium rounded-xl text-neutral-300 bg-neutral-900 border border-neutral-700 hover:bg-neutral-800 transition-colors w-full sm:w-auto"
              >
                See How It Works
              </a>
            </div>
          </motion.div>

          {/* Saved Kits Section */}
          {savedKits.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-20 max-w-4xl mx-auto text-left"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <FolderOpen className="w-6 h-6 text-indigo-400" />
                  <h2 className="text-2xl font-bold text-white">Your Saved Projects</h2>
                </div>
                <Link to="/projects" className="text-sm font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                  View All
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                {savedKits.slice(0, 3).map((kit, index) => (
                  <button
                    key={kit.id || `kit-${index}`}
                    onClick={() => handleLoadKit(kit)}
                    className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl hover:border-indigo-500/50 hover:bg-neutral-800 transition-all text-left group"
                  >
                    <h3 className="font-bold text-white mb-2 truncate group-hover:text-indigo-400 transition-colors">
                      {kit.name}
                    </h3>
                    <p className="text-xs text-neutral-500 flex items-center">
                      <Clock className="w-3 h-3 mr-1.5" />
                      {new Date(kit.updatedAt).toLocaleDateString()}
                    </p>
                    <div className="mt-4 flex items-center text-xs font-medium text-neutral-400">
                      <span className="capitalize">{kit.vibe}</span>
                      <span className="mx-2">•</span>
                      <span>{kit.deliverables.filter(d => d.status === 'completed').length} assets</span>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-neutral-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Everything you need to launch</h2>
            <p className="text-lg text-neutral-400 max-w-2xl mx-auto">
              We don't just give you text; we give you the identity and infrastructure to start a company.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                icon: <Zap className="w-8 h-8 text-amber-500" />,
                title: 'The "Magic Import" Intake',
                desc: 'Upload a README, a technical spec, or a rough brain-dump. Our AI extracts the core business logic and flags missing critical info.',
              },
              {
                icon: <FileText className="w-8 h-8 text-emerald-500" />,
                title: 'Integrated Logic Engine',
                desc: 'Cohesive data flow ensures your Market Research informs your Financial Projections, which informs your Pitch Deck.',
              },
              {
                icon: <Palette className="w-8 h-8 text-indigo-500" />,
                title: 'Professional Design Wrapper',
                desc: 'Based on your chosen "Vibe", every asset is dynamically styled with custom fonts, hex codes, and layouts for consultancy-grade outputs.',
              },
            ].map((feature, i) => (
              <motion.div
                key={`feature-${i}-${feature.title}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2, duration: 0.5 }}
                className="bg-neutral-950 p-8 rounded-2xl shadow-sm border border-neutral-800 hover:border-neutral-700 transition-colors"
              >
                <div className="w-14 h-14 rounded-xl bg-neutral-900 flex items-center justify-center mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-neutral-400 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Deliverables Table */}
      <section className="py-24 bg-neutral-950 border-t border-neutral-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">The "Full Package" Deliverables</h2>
            <p className="text-lg text-neutral-400">What you get when you run the engine.</p>
          </div>
          
          <div className="overflow-x-auto bg-neutral-900 shadow-sm ring-1 ring-neutral-800 rounded-2xl">
            <table className="min-w-full divide-y divide-neutral-800">
              <thead className="bg-neutral-950">
                <tr>
                  <th scope="col" className="py-4 pl-6 pr-3 text-left text-sm font-semibold text-white">Category</th>
                  <th scope="col" className="px-3 py-4 text-left text-sm font-semibold text-white">Key Assets Included</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800 bg-neutral-900">
                {[
                  { cat: '🎨 Brand Identity', desc: 'Logo concepts, color palette, typography pairing, social media banners, and email signatures.' },
                  { cat: '📊 Market Intel', desc: 'TAM/SAM/SOM analysis, target personas, and real-time demand signals from Reddit/Search trends.' },
                  { cat: '🔍 Competition', desc: '5-10 local/global competitors, pricing comparison matrix, and a SWOT-based positioning map.' },
                  { cat: '📝 Business Plan', desc: '15-page executive plan covering operations, revenue streams, and 12-month milestones.' },
                  { cat: '💰 Financials', desc: 'Startup costs, break-even analysis, 12-month P&L, and unit economics (CAC/LTV).' },
                  { cat: '📣 Marketing', desc: '30-day launch calendar, SEO keywords, ad copy, and high-conversion email templates.' },
                  { cat: '🎤 Pitch Deck', desc: '10-12 investor-ready slides with speaker notes and data-driven storytelling.' },
                  { cat: '📄 Legal & Social', desc: 'Custom Privacy Policy/ToS, 30 days of social captions, and hashtag strategy.' },
                ].map((item, i) => (
                  <tr key={`deliverable-${i}`} className="hover:bg-neutral-800/50 transition-colors">
                    <td className="whitespace-nowrap py-4 pl-6 pr-3 text-sm font-medium text-white">{item.cat}</td>
                    <td className="px-3 py-4 text-sm text-neutral-400">{item.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 bg-neutral-900 text-white border-t border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Simple, transparent pricing</h2>
            <p className="text-lg text-neutral-400">Choose the pack that fits your stage.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { name: 'Starter', price: '$49', desc: 'The "Side Hustle" pack.', features: ['Brand Kit', 'Business Plan', 'Marketing Strategy'] },
              { name: 'Pro', price: '$99', desc: 'The "Founder" pack.', features: ['Everything in Starter', 'Market Research', 'Competitive Analysis', 'Financial Projections'], popular: true },
              { name: 'Complete', price: '$199', desc: 'The "CEO" pack.', features: ['All 9 Deliverables', 'Pitch Deck', 'Legal Starter Docs'] },
            ].map((tier, i) => (
              <div key={`tier-${i}`} className={`rounded-3xl p-8 ${tier.popular ? 'bg-indigo-600 ring-4 ring-indigo-500/30' : 'bg-neutral-800 border border-neutral-700'}`}>
                {tier.popular && <span className="inline-block px-3 py-1 bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider rounded-full mb-4">Most Popular</span>}
                <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
                <p className="text-neutral-400 mb-6 h-12">{tier.desc}</p>
                <div className="mb-8">
                  <span className="text-5xl font-extrabold">{tier.price}</span>
                  <span className="text-neutral-400">/one-time</span>
                </div>
                <ul className="space-y-4 mb-8">
                  {tier.features.map((f, j) => (
                    <li key={`feature-${i}-${j}`} className="flex items-start">
                      <CheckCircle2 className={`w-5 h-5 mr-3 shrink-0 ${tier.popular ? 'text-indigo-200' : 'text-indigo-500'}`} />
                      <span className={tier.popular ? 'text-indigo-50' : 'text-neutral-300'}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/wizard"
                  className={`block w-full py-4 px-6 rounded-xl text-center font-bold transition-colors ${
                    tier.popular 
                      ? 'bg-white text-indigo-900 hover:bg-neutral-100' 
                      : 'bg-neutral-700 text-white hover:bg-neutral-600'
                  }`}
                >
                  Get Started
                </Link>
              </div>
            ))}
          </div>
          <div className="text-center mt-12 text-neutral-400">
            <p>Pivot your idea? Re-run the engine with updated data for a fraction of the cost with <strong>The Refresh ($29)</strong>.</p>
          </div>
        </div>
      </section>
    </Layout>
  );
}
