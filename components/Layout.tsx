import React from 'react';
import { LayoutDashboard, ShieldAlert, Fingerprint, Activity, Server, Sun, Moon } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activePage: string;
  onNavigate: (page: string) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activePage, onNavigate, isDarkMode, toggleTheme }) => {
  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'access', label: 'Access Control', icon: Fingerprint },
    { id: 'attacks', label: 'Threat Sim', icon: ShieldAlert },
    { id: 'logs', label: 'Audit Logs', icon: Activity },
  ];

  return (
    <div className="flex h-screen font-sans selection:bg-emerald-500/30">
      {/* Sidebar */}
      <aside className="w-20 lg:w-64 border-r dark:border-zinc-800 border-gray-200 flex flex-col bg-white/80 dark:bg-zinc-900/40 backdrop-blur-xl transition-colors duration-300">
        <div className="h-16 flex items-center justify-center lg:justify-start lg:px-6 border-b dark:border-zinc-800 border-gray-200">
          <div className="w-8 h-8 bg-emerald-600 rounded flex items-center justify-center shadow-lg shadow-emerald-900/20">
             <ShieldAlert className="text-white w-5 h-5" />
          </div>
          <div className="ml-3 hidden lg:block">
            <h1 className="text-sm font-bold tracking-wider dark:text-zinc-100 text-gray-900">BIOSEC</h1>
            <p className="text-[10px] text-zinc-500 font-mono tracking-widest">ENTERPRISE</p>
          </div>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center justify-center lg:justify-start lg:px-4 py-3 rounded-md transition-all duration-200 group ${
                  isActive 
                    ? 'dark:bg-zinc-800/80 bg-gray-100 text-emerald-600 dark:text-white border dark:border-zinc-700/50 border-gray-200 shadow-sm' 
                    : 'text-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-900 dark:hover:text-zinc-300'
                }`}
              >
                <Icon size={20} className={`transition-colors ${isActive ? 'text-emerald-500' : 'group-hover:text-gray-700 dark:group-hover:text-zinc-300'}`} />
                <span className="ml-3 text-sm font-medium hidden lg:block">{item.label}</span>
                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500 hidden lg:block shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t dark:border-zinc-800 border-gray-200 hidden lg:block space-y-4">
           {/* Theme Toggle */}
          <button 
             onClick={toggleTheme}
             className="w-full flex items-center justify-between px-3 py-2 rounded-md bg-gray-100 dark:bg-zinc-800 text-xs font-medium text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-200 transition-colors"
          >
             <div className="flex items-center">
                {isDarkMode ? <Moon size={14} className="mr-2" /> : <Sun size={14} className="mr-2" />}
                <span>{isDarkMode ? 'Dark Mode' : 'Light Mode'}</span>
             </div>
             <div className={`w-8 h-4 rounded-full p-0.5 flex ${isDarkMode ? 'bg-emerald-600 justify-end' : 'bg-gray-400 justify-start'}`}>
                 <div className="w-3 h-3 bg-white rounded-full shadow-sm"></div>
             </div>
          </button>

          <div className="flex items-center space-x-3 px-2">
            <div className="relative">
              <Server size={16} className="text-zinc-600" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full animate-pulse border-2 border-white dark:border-zinc-900"></div>
            </div>
            <div className="flex-1">
              <p className="text-[10px] uppercase font-bold text-zinc-500">System Status</p>
              <p className="text-xs text-emerald-500 font-mono">OPERATIONAL</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden bg-gray-50 dark:bg-zinc-950 relative transition-colors duration-300">
        {/* Header */}
        <header className="h-16 border-b dark:border-zinc-800 border-gray-200 flex items-center justify-between px-8 bg-white/50 dark:bg-zinc-900/20 backdrop-blur-sm z-10 transition-colors duration-300">
          <div className="flex items-center text-xs text-zinc-500 space-x-2">
            <span>SECURE CONSOLE</span>
            <span>/</span>
            <span className="dark:text-zinc-300 text-gray-700 uppercase font-semibold">{activePage}</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-xs font-mono text-zinc-500">{new Date().toLocaleDateString()}</span>
            <div className="h-4 w-px dark:bg-zinc-800 bg-gray-300"></div>
            <div className="flex items-center space-x-2">
               <div className="w-2 h-2 rounded-full dark:bg-zinc-700 bg-gray-400"></div>
               <span className="text-xs dark:text-zinc-400 text-gray-500">Admin Session</span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6 lg:p-10 relative">
            {/* Subtle Grid Background */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:invert-0 invert" 
                style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
            </div>
            <div className="relative z-10 max-w-7xl mx-auto h-full">
                {children}
            </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;