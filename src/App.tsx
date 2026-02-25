import { Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal, LayoutDashboard, CheckSquare, Settings, LogOut, Menu, X, Bell } from 'lucide-react';

// Pages
import Dashboard from './pages/Dashboard';
import Assistant from './pages/Assistant';
import Tasks from './pages/Tasks';
import Login from './pages/Login';
import SettingsPage from './pages/Settings';
import { useTranslation } from './i18n';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('jarvis_token'));
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('jarvis_theme') || 'cyan');
  const [notifications, setNotifications] = useState<{id: string, message: string}[]>([]);
  const location = useLocation();
  const { t } = useTranslation();

  useEffect(() => {
    const handleStorageChange = () => {
      setIsAuthenticated(!!localStorage.getItem('jarvis_token'));
    };
    
    const handleSettingsChange = () => {
      setTheme(localStorage.getItem('jarvis_theme') || 'cyan');
    };

    const handleNotification = (e: any) => {
      const id = Date.now().toString();
      setNotifications(prev => [...prev, { id, message: e.detail }]);
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, 5000);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('jarvis_settings_updated', handleSettingsChange);
    window.addEventListener('jarvis_notification', handleNotification);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('jarvis_settings_updated', handleSettingsChange);
      window.removeEventListener('jarvis_notification', handleNotification);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('jarvis_token');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  const hueMap: Record<string, number> = {
    cyan: 0,
    red: 160,
    green: -60,
    orange: 190,
    purple: 90,
  };

  const currentHue = hueMap[theme] || 0;

  const navItems = [
    { path: '/', icon: <Terminal className="w-5 h-5" />, label: t('jarvis') },
    { path: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" />, label: t('dashboard') },
    { path: '/tasks', icon: <CheckSquare className="w-5 h-5" />, label: t('tasks') },
    { path: '/settings', icon: <Settings className="w-5 h-5" />, label: t('settings') },
  ];

  return (
    <div 
      className="flex h-screen bg-[#020813] text-[#00f0ff] font-mono overflow-hidden crt select-none transition-all duration-1000"
      style={{ filter: `hue-rotate(${currentHue}deg)` }}
    >
      <style>{`
        img, video {
          filter: hue-rotate(${-currentHue}deg);
        }
      `}</style>
      <div className="scanlines"></div>

      {/* Notifications */}
      <div className="fixed top-4 right-4 z-[60] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {notifications.map(n => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              className="bg-[#020813]/90 border border-[#00f0ff]/50 p-3 flex items-center gap-3 backdrop-blur-md shadow-[0_0_15px_rgba(0,240,255,0.2)] pointer-events-auto"
            >
              <Bell className="w-4 h-4 text-[#00f0ff]" />
              <span className="text-xs tracking-widest text-[#00f0ff]">{n.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Mobile Sidebar Toggle */}
      <button 
        className="lg:hidden absolute top-4 left-4 z-50 p-2 bg-[#00f0ff]/10 rounded border border-[#00f0ff]/30"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar */}
      <AnimatePresence>
        {(sidebarOpen || window.innerWidth >= 1024) && (
          <motion.aside 
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
            className="fixed lg:static inset-y-0 left-0 z-40 w-64 bg-[#020813]/95 backdrop-blur-md border-r border-[#00f0ff]/30 flex flex-col pt-16 lg:pt-0"
          >
            <div className="p-6 border-b border-[#00f0ff]/30 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#00f0ff]/20 flex items-center justify-center border border-[#00f0ff]/50 shadow-[0_0_10px_#00f0ff]">
                <Terminal className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-bold tracking-widest">JARVIS PT</h1>
            </div>

            <nav className="flex-1 p-4 space-y-2">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link 
                    key={item.path}
                    to={item.path}
                    onClick={() => {
                      if (window.innerWidth < 1024) setSidebarOpen(false);
                    }}
                    className={`flex items-center gap-3 p-3 rounded transition-all duration-200 ${
                      isActive 
                        ? 'bg-[#00f0ff]/20 border border-[#00f0ff]/50 shadow-[0_0_10px_rgba(0,240,255,0.2)]' 
                        : 'hover:bg-[#00f0ff]/10 border border-transparent'
                    }`}
                  >
                    {item.icon}
                    <span className="tracking-widest">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-[#00f0ff]/30">
              <button 
                onClick={handleLogout}
                className="flex items-center gap-3 p-3 w-full rounded hover:bg-red-500/20 text-red-400 border border-transparent hover:border-red-500/50 transition-all duration-200"
              >
                <LogOut className="w-5 h-5" />
                <span className="tracking-widest">{t('logout')}</span>
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden flex flex-col w-full">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Assistant />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </main>
    </div>
  );
}
