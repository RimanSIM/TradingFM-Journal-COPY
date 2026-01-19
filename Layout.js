import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from './utils';
import { base44 } from '@/api/base44Client';
import { 
  LayoutDashboard, 
  BookOpen, 
  PlusCircle, 
  CalendarDays, 
  BarChart3, 
  Target, 
  Calculator, 
  Award, 
  DollarSign,
  Globe,
  Sparkles,
  Menu,
  X,
  LogOut,
  User,
  Shield
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import ErrorBoundary from './components/ErrorBoundary';

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
        if (userData?.email === 'rimanmustafa2003@gmail.com') {
          setIsAdmin(true);
        }
      } catch (e) {
        console.error('User auth error:', e);
        setUser({ full_name: 'Guest', email: 'guest@tradingfm.com' });
      }
    };
    loadUser();
  }, []);

  const handleLogout = async () => {
    await base44.auth.logout();
  };

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, page: 'Dashboard' },
    { name: 'Journal', icon: BookOpen, page: 'Journal' },
    { name: 'Add Trade', icon: PlusCircle, page: 'AddTrade' },
    { name: 'Calendar', icon: CalendarDays, page: 'Calendar' },
    { name: 'Analytics', icon: BarChart3, page: 'Analytics' },
    { name: 'Goals', icon: Target, page: 'Goals' },
    { name: 'Calculator', icon: Calculator, page: 'Calculator' },
    { name: 'Certificates', icon: Award, page: 'Certificates' },
    { name: 'Payouts', icon: DollarSign, page: 'Payouts' },
    { name: 'Global Performance', icon: Globe, page: 'GlobalPerformance' },
    { name: 'AI Insights', icon: Sparkles, page: 'AIInsights' },
    ...(isAdmin ? [{ name: 'Admin', icon: Shield, page: 'Admin' }] : []),
    { name: 'Settings', icon: User, page: 'Settings' },
  ];

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-gray-100">
      <style>{`
        :root {
          --background: #0A0E1A;
          --surface: #111827;
          --surface-light: #1F2937;
          --accent: #06B6D4;
          --accent-dim: rgba(6, 182, 212, 0.1);
          --success: #10B981;
          --danger: #EF4444;
          --warning: #F59E0B;
          --text-primary: #F9FAFB;
          --text-secondary: #9CA3AF;
        }
        
        * {
          scrollbar-width: thin;
          scrollbar-color: #374151 #111827;
        }
        
        *::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        *::-webkit-scrollbar-track {
          background: #111827;
          border-radius: 4px;
        }
        
        *::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #06B6D4, #0891B2);
          border-radius: 4px;
        }
        
        *::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #0891B2, #0E7490);
        }
      `}</style>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-gray-900/98 to-gray-800/98 backdrop-blur-xl border-b border-gray-800/50 shadow-lg">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 via-cyan-600 to-blue-600 flex items-center justify-center shadow-md shadow-cyan-500/30">
              <span className="text-white font-bold text-sm">TF</span>
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-cyan-400 via-cyan-300 to-blue-400 bg-clip-text text-transparent">
              TradingFM
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-40 h-screen w-64 bg-[#111827]/95 backdrop-blur-xl border-r border-gray-800/50
        transform transition-transform duration-300 ease-in-out
        lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="hidden lg:flex items-center gap-3 px-6 py-5 border-b border-gray-800/50 bg-gradient-to-r from-gray-900/50 to-gray-800/30">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 via-cyan-600 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
            <span className="text-white font-bold text-lg">TF</span>
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 via-cyan-300 to-blue-400 bg-clip-text text-transparent">
            TradingFM
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 mt-16 lg:mt-0 space-y-1 overflow-y-auto max-h-[calc(100vh-180px)]">
          {navItems.map((item) => {
            const isActive = currentPageName === item.page;
            return (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                  ${isActive 
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/20 text-cyan-300 border border-cyan-500/40 shadow-lg shadow-cyan-500/10' 
                    : 'text-gray-400 hover:text-white hover:bg-gradient-to-r hover:from-gray-800/50 hover:to-gray-700/30 hover:border hover:border-gray-700/50'
                  }
                `}
              >
                <item.icon className={`w-5 h-5 transition-all ${isActive ? 'text-cyan-400' : 'group-hover:text-cyan-400'}`} />
                <span className={`font-medium text-sm ${isActive ? 'font-semibold' : ''}`}>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800/50 bg-gradient-to-t from-gray-900 to-gray-900/50 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 via-cyan-600 to-blue-600 flex items-center justify-center overflow-hidden shadow-lg shadow-cyan-500/20 ring-2 ring-cyan-500/20">
                {user?.profile_picture ? (
                  <img src={user.profile_picture} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white font-bold text-sm">{user?.full_name?.charAt(0) || 'U'}</span>
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-white truncate max-w-[120px]">
                  {user?.full_name || 'Trader'}
                </span>
                <span className="text-xs text-gray-400">{user?.email?.split('@')[0] || 'Welcome'}</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-30 bg-black/60 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen pt-16 lg:pt-0">
        <div className="p-4 lg:p-6">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
}