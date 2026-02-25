import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Activity, Users, CheckCircle, Server, Cpu, Database } from 'lucide-react';
import { useTranslation } from '../i18n';

export default function Dashboard() {
  const [stats, setStats] = useState({ tasks: 0, interactions: 0, users: 0, systemHealth: '100%', uptime: 0 });
  const { t } = useTranslation();

  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error(err));
  }, []);

  const formatUptime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  const cards = [
    { title: t('activeTasks'), value: stats.tasks, icon: <CheckCircle className="w-6 h-6 text-green-400" /> },
    { title: t('interactions'), value: stats.interactions, icon: <Activity className="w-6 h-6 text-blue-400" /> },
    { title: t('users'), value: stats.users, icon: <Users className="w-6 h-6 text-purple-400" /> },
    { title: t('systemHealth'), value: stats.systemHealth, icon: <Server className="w-6 h-6 text-[#00f0ff]" /> },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 md:p-8 h-full overflow-y-auto custom-scrollbar"
    >
      <header className="mb-8 border-b border-[#00f0ff]/30 pb-4">
        <h1 className="text-2xl md:text-3xl font-bold tracking-[0.2em] flex items-center gap-3">
          <Activity className="w-8 h-8" />
          {t('controlPanel')}
        </h1>
        <p className="opacity-50 tracking-widest text-sm mt-2">{t('systemStats')}</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        {cards.map((card, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="border border-[#00f0ff]/30 bg-[#00f0ff]/[0.02] p-6 relative backdrop-blur-sm"
          >
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#00f0ff]"></div>
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#00f0ff]"></div>
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#00f0ff]"></div>
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#00f0ff]"></div>

            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xs tracking-widest opacity-70">{card.title}</h3>
              {card.icon}
            </div>
            <div className="text-3xl font-bold tracking-wider">{card.value}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border border-[#00f0ff]/30 bg-[#00f0ff]/[0.02] p-6 relative">
          <h3 className="text-sm font-bold tracking-widest mb-4 flex items-center gap-2 border-b border-[#00f0ff]/30 pb-2">
            <Cpu className="w-4 h-4" /> {t('serverResources')}
          </h3>
          <div className="space-y-4 text-xs tracking-widest">
            <div className="flex justify-between">
              <span className="opacity-60">{t('uptime')}</span>
              <span>{formatUptime(stats.uptime)}</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-60">{t('memory')}</span>
              <span>{t('stable')}</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-60">{t('latency')}</span>
              <span className="text-green-400">12ms</span>
            </div>
          </div>
        </div>

        <div className="border border-[#00f0ff]/30 bg-[#00f0ff]/[0.02] p-6 relative">
          <h3 className="text-sm font-bold tracking-widest mb-4 flex items-center gap-2 border-b border-[#00f0ff]/30 pb-2">
            <Database className="w-4 h-4" /> {t('dataIntegrity')}
          </h3>
          <div className="space-y-4 text-xs tracking-widest">
            <div className="flex justify-between">
              <span className="opacity-60">{t('database')}</span>
              <span className="text-green-400">{t('online')}</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-60">{t('sync')}</span>
              <span>{t('active')}</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-60">{t('backup')}</span>
              <span>{t('hoursAgo')}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
