import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Settings as SettingsIcon, Palette, Globe, MapPin, Save, Check, Volume2, BrainCircuit } from 'lucide-react';
import { useTranslation } from '../i18n';

export default function Settings() {
  const [theme, setTheme] = useState(localStorage.getItem('jarvis_theme') || 'cyan');
  const [language, setLanguage] = useState(localStorage.getItem('jarvis_lang') || 'Português');
  const [region, setRegion] = useState(localStorage.getItem('jarvis_region') || 'Portugal');
  const [voice, setVoice] = useState(localStorage.getItem('jarvis_voice') !== 'false');
  const [reasoning, setReasoning] = useState(localStorage.getItem('jarvis_reasoning') !== 'false');
  const [saved, setSaved] = useState(false);
  const { t } = useTranslation();

  const themes = [
    { id: 'cyan', name: 'Cyan (Padrão)', color: '#00f0ff' },
    { id: 'red', name: 'Vermelho Tático', color: '#ff3333' },
    { id: 'green', name: 'Verde Sistema', color: '#33ff77' },
    { id: 'orange', name: 'Laranja Alerta', color: '#ff9900' },
    { id: 'purple', name: 'Roxo Quântico', color: '#b84dff' },
  ];

  const languages = ['Português', 'English', 'Español', 'Français', 'Deutsch'];
  const regions = ['Portugal', 'Brasil', 'USA', 'UK', 'Espanha', 'França', 'Alemanha', 'Global'];

  const handleSave = () => {
    localStorage.setItem('jarvis_theme', theme);
    localStorage.setItem('jarvis_lang', language);
    localStorage.setItem('jarvis_region', region);
    localStorage.setItem('jarvis_voice', voice.toString());
    localStorage.setItem('jarvis_reasoning', reasoning.toString());
    
    // Dispatch event to update App.tsx state
    window.dispatchEvent(new Event('jarvis_settings_updated'));
    
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 md:p-8 h-full flex flex-col overflow-y-auto custom-scrollbar"
    >
      <header className="mb-8 border-b border-[#00f0ff]/30 pb-4 shrink-0">
        <h1 className="text-2xl md:text-3xl font-bold tracking-[0.2em] flex items-center gap-3">
          <SettingsIcon className="w-8 h-8" />
          {t('systemSettings')}
        </h1>
        <p className="opacity-50 tracking-widest text-sm mt-2">{t('globalConfig')}</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl">
        
        {/* Theme Settings */}
        <div className="border border-[#00f0ff]/30 bg-[#00f0ff]/[0.02] p-6 relative backdrop-blur-sm">
          <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#00f0ff]"></div>
          <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#00f0ff]"></div>
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#00f0ff]"></div>
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#00f0ff]"></div>

          <h3 className="text-sm font-bold tracking-widest border-b border-[#00f0ff]/30 pb-2 mb-6 flex items-center gap-2">
            <Palette className="w-4 h-4" /> {t('visualInterface')}
          </h3>

          <div className="space-y-4">
            <label className="block text-xs tracking-widest opacity-70">{t('colorScheme')}</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {themes.map(t_item => (
                <button
                  key={t_item.id}
                  onClick={() => setTheme(t_item.id)}
                  className={`flex items-center gap-3 p-3 border transition-all ${theme === t_item.id ? 'border-[#00f0ff] bg-[#00f0ff]/20 shadow-[0_0_10px_rgba(0,240,255,0.2)]' : 'border-[#00f0ff]/30 hover:bg-[#00f0ff]/10'}`}
                >
                  <div className="w-4 h-4 rounded-full shadow-[0_0_5px_currentColor]" style={{ backgroundColor: t_item.color, color: t_item.color }}></div>
                  <span className="text-xs tracking-widest">{t_item.name}</span>
                </button>
              ))}
            </div>
            <p className="text-[10px] opacity-50 tracking-widest mt-2">{t('colorNote')}</p>
          </div>
        </div>

        {/* Localization Settings */}
        <div className="border border-[#00f0ff]/30 bg-[#00f0ff]/[0.02] p-6 relative backdrop-blur-sm">
          <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#00f0ff]"></div>
          <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#00f0ff]"></div>
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#00f0ff]"></div>
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#00f0ff]"></div>

          <h3 className="text-sm font-bold tracking-widest border-b border-[#00f0ff]/30 pb-2 mb-6 flex items-center gap-2">
            <Globe className="w-4 h-4" /> {t('localization')}
          </h3>

          <div className="space-y-6">
            <div>
              <label className="block text-xs tracking-widest opacity-70 mb-2 flex items-center gap-2">
                <Globe className="w-3 h-3" /> {t('assistantLanguage')}
              </label>
              <select 
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full bg-[#020813] border border-[#00f0ff]/30 p-3 outline-none focus:border-[#00f0ff] tracking-widest text-sm text-[#00f0ff]"
              >
                {languages.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs tracking-widest opacity-70 mb-2 flex items-center gap-2">
                <MapPin className="w-3 h-3" /> {t('operationRegion')}
              </label>
              <select 
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full bg-[#020813] border border-[#00f0ff]/30 p-3 outline-none focus:border-[#00f0ff] tracking-widest text-sm text-[#00f0ff]"
              >
                {regions.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* System Behavior Settings */}
        <div className="border border-[#00f0ff]/30 bg-[#00f0ff]/[0.02] p-6 relative backdrop-blur-sm lg:col-span-2">
          <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#00f0ff]"></div>
          <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#00f0ff]"></div>
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#00f0ff]"></div>
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#00f0ff]"></div>

          <h3 className="text-sm font-bold tracking-widest border-b border-[#00f0ff]/30 pb-2 mb-6 flex items-center gap-2">
            <BrainCircuit className="w-4 h-4" /> {t('systemBehavior')}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className={`w-12 h-6 rounded-full border transition-all relative ${voice ? 'bg-[#00f0ff]/20 border-[#00f0ff]' : 'bg-transparent border-[#00f0ff]/30'}`}>
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-[#00f0ff] transition-all ${voice ? 'left-7 shadow-[0_0_10px_#00f0ff]' : 'left-1 opacity-50'}`}></div>
              </div>
              <input type="checkbox" className="hidden" checked={voice} onChange={e => setVoice(e.target.checked)} />
              <div className="flex flex-col">
                <span className="text-xs tracking-widest flex items-center gap-2"><Volume2 className="w-3 h-3" /> {t('voiceOutput')}</span>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer group">
              <div className={`w-12 h-6 rounded-full border transition-all relative ${reasoning ? 'bg-[#00f0ff]/20 border-[#00f0ff]' : 'bg-transparent border-[#00f0ff]/30'}`}>
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-[#00f0ff] transition-all ${reasoning ? 'left-7 shadow-[0_0_10px_#00f0ff]' : 'left-1 opacity-50'}`}></div>
              </div>
              <input type="checkbox" className="hidden" checked={reasoning} onChange={e => setReasoning(e.target.checked)} />
              <div className="flex flex-col">
                <span className="text-xs tracking-widest flex items-center gap-2"><BrainCircuit className="w-3 h-3" /> {t('reasoningLogs')}</span>
              </div>
            </label>
          </div>
        </div>

      </div>

      <div className="mt-8 max-w-4xl flex justify-end">
        <button 
          onClick={handleSave}
          className="bg-[#00f0ff]/20 hover:bg-[#00f0ff]/30 border border-[#00f0ff]/50 p-3 px-8 tracking-[0.2em] font-bold transition-all flex items-center gap-2 hover:shadow-[0_0_15px_rgba(0,240,255,0.4)]"
        >
          {saved ? <><Check className="w-5 h-5" /> {t('saved')}</> : <><Save className="w-5 h-5" /> {t('applyChanges')}</>}
        </button>
      </div>
    </motion.div>
  );
}
