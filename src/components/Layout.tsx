import { ReactNode, useState, useEffect } from 'react';
import { Rocket, Menu, X, LogIn, LogOut, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { auth, googleProvider } from '../lib/firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

export default function Layout({ children, hideFooter = false }: { children: ReactNode, hideFooter?: boolean }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<FirebaseUser | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Sign in failed:", error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 font-sans flex flex-col">
      <header className="border-b border-neutral-800 bg-neutral-900 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-indigo-600 font-bold text-xl tracking-tight">
            <Rocket className="w-6 h-6" />
            <span>LaunchKit</span>
          </Link>
          
          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-neutral-400">
            <a href="/#features" className="hover:text-white transition-colors py-2">Features</a>
            <a href="/#pricing" className="hover:text-white transition-colors py-2">Pricing</a>
            <Link to="/projects" className="hover:text-white transition-colors py-2">My Projects</Link>
            
            {user ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-white bg-neutral-800 px-3 py-1.5 rounded-lg border border-neutral-700">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="" className="w-5 h-5 rounded-full" referrerPolicy="no-referrer" />
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                  <span className="max-w-[100px] truncate">{user.displayName || 'User'}</span>
                </div>
                <button 
                  onClick={handleSignOut}
                  className="text-neutral-500 hover:text-white transition-colors flex items-center gap-1"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Exit</span>
                </button>
              </div>
            ) : (
              <button 
                onClick={handleSignIn}
                className="flex items-center gap-2 text-white bg-neutral-800 hover:bg-neutral-700 px-4 py-2 rounded-lg border border-neutral-700 transition-colors"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </button>
            )}

            <Link to="/wizard" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm">
              Start Building
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2 text-neutral-400 hover:text-white"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Nav */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-neutral-800 bg-neutral-900 px-4 py-4 space-y-4 shadow-lg absolute w-full">
            <a href="/#features" onClick={() => setIsMenuOpen(false)} className="block text-base font-medium text-neutral-400 hover:text-white py-2">Features</a>
            <a href="/#pricing" onClick={() => setIsMenuOpen(false)} className="block text-base font-medium text-neutral-400 hover:text-white py-2">Pricing</a>
            <Link to="/projects" onClick={() => setIsMenuOpen(false)} className="block text-base font-medium text-neutral-400 hover:text-white py-2">My Projects</Link>
            
            {user ? (
              <button 
                onClick={() => { handleSignOut(); setIsMenuOpen(false); }}
                className="flex items-center gap-2 text-neutral-400 hover:text-white py-2 w-full"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out ({user.displayName || 'User'})</span>
              </button>
            ) : (
              <button 
                onClick={() => { handleSignIn(); setIsMenuOpen(false); }}
                className="flex items-center gap-2 text-neutral-400 hover:text-white py-2 w-full"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </button>
            )}

            <Link to="/wizard" onClick={() => setIsMenuOpen(false)} className="block text-center bg-indigo-600 text-white px-4 py-3 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm font-medium">
              Start Building
            </Link>
          </div>
        )}
      </header>
      <main className="flex-1 flex flex-col">
        {children}
      </main>
      {!hideFooter && (
        <footer className="bg-neutral-900 border-t border-neutral-800 py-8 text-center text-sm text-neutral-500">
          <div className="max-w-7xl mx-auto px-4">
            &copy; {new Date().getFullYear()} LaunchKit. All rights reserved.
          </div>
        </footer>
      )}
    </div>
  );
}
