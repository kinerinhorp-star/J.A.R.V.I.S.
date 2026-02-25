import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckSquare, Plus, Trash2, Calendar, Clock } from 'lucide-react';
import { useTranslation } from '../i18n';

type Task = {
  id: number;
  title: string;
  description: string;
  status: 'pending' | 'completed';
  due_date: string;
};

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState({ title: '', description: '', due_date: '' });
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/tasks', {
        headers: { Authorization: `Bearer ${localStorage.getItem('jarvis_token')}` }
      });
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title) return;

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('jarvis_token')}`
        },
        body: JSON.stringify(newTask)
      });
      if (res.ok) {
        setNewTask({ title: '', description: '', due_date: '' });
        fetchTasks();
        window.dispatchEvent(new CustomEvent('jarvis_notification', { detail: 'TAREFA ADICIONADA COM SUCESSO.' }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleStatus = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === 'pending' ? 'completed' : 'pending';
    try {
      await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('jarvis_token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteTask = async (id: number) => {
    try {
      await fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('jarvis_token')}` }
      });
      fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 md:p-8 h-full flex flex-col overflow-hidden"
    >
      <header className="mb-6 border-b border-[#00f0ff]/30 pb-4 shrink-0">
        <h1 className="text-2xl md:text-3xl font-bold tracking-[0.2em] flex items-center gap-3">
          <CheckSquare className="w-8 h-8" />
          {t('taskManager')}
        </h1>
        <p className="opacity-50 tracking-widest text-sm mt-2">{t('productivitySystem')}</p>
      </header>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        {/* Add Task Form */}
        <div className="lg:w-1/3 shrink-0">
          <form onSubmit={addTask} className="border border-[#00f0ff]/30 bg-[#00f0ff]/[0.02] p-6 relative backdrop-blur-sm space-y-4">
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#00f0ff]"></div>
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#00f0ff]"></div>
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#00f0ff]"></div>
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#00f0ff]"></div>

            <h3 className="text-sm font-bold tracking-widest border-b border-[#00f0ff]/30 pb-2 mb-4">{t('newTask')}</h3>
            
            <input 
              type="text" 
              placeholder={t('title')} 
              value={newTask.title}
              onChange={e => setNewTask({...newTask, title: e.target.value})}
              className="w-full bg-transparent border border-[#00f0ff]/30 p-2 outline-none focus:border-[#00f0ff] tracking-widest text-sm"
              required
            />
            
            <textarea 
              placeholder={t('description')} 
              value={newTask.description}
              onChange={e => setNewTask({...newTask, description: e.target.value})}
              className="w-full bg-transparent border border-[#00f0ff]/30 p-2 outline-none focus:border-[#00f0ff] tracking-widest text-sm h-24 resize-none"
            />
            
            <div className="relative">
              <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
              <input 
                type="date" 
                value={newTask.due_date}
                onChange={e => setNewTask({...newTask, due_date: e.target.value})}
                className="w-full bg-transparent border border-[#00f0ff]/30 p-2 pl-8 outline-none focus:border-[#00f0ff] tracking-widest text-sm"
              />
            </div>

            <button 
              type="submit" 
              className="w-full bg-[#00f0ff]/20 hover:bg-[#00f0ff]/30 border border-[#00f0ff]/50 p-2 tracking-[0.2em] font-bold transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> {t('add')}
            </button>
          </form>
        </div>

        {/* Task List */}
        <div className="flex-1 border border-[#00f0ff]/30 bg-[#00f0ff]/[0.02] p-4 relative flex flex-col min-h-0">
          <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#00f0ff]"></div>
          <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#00f0ff]"></div>
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#00f0ff]"></div>
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#00f0ff]"></div>

          <h3 className="text-sm font-bold tracking-widest border-b border-[#00f0ff]/30 pb-2 mb-4 shrink-0">{t('taskList')}</h3>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
            {loading ? (
              <div className="text-center opacity-50 tracking-widest animate-pulse">{t('loadingData')}</div>
            ) : tasks.length === 0 ? (
              <div className="text-center opacity-50 tracking-widest">{t('noTasks')}</div>
            ) : (
              <AnimatePresence>
                {tasks.map(task => (
                  <motion.div 
                    key={task.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className={`p-4 border ${task.status === 'completed' ? 'border-green-500/30 bg-green-500/5' : 'border-[#00f0ff]/30 bg-[#00f0ff]/5'} relative group transition-all`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className={`font-bold tracking-widest text-sm ${task.status === 'completed' ? 'line-through opacity-50 text-green-400' : ''}`}>
                          {task.title}
                        </h4>
                        {task.description && (
                          <p className="text-xs opacity-70 mt-1 tracking-wider">{task.description}</p>
                        )}
                        {task.due_date && (
                          <div className="flex items-center gap-1 text-[10px] opacity-50 mt-2 tracking-widest">
                            <Clock className="w-3 h-3" /> {task.due_date}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 shrink-0">
                        <button 
                          onClick={() => toggleStatus(task.id, task.status)}
                          className={`p-2 border transition-colors ${task.status === 'completed' ? 'border-green-500 text-green-400 hover:bg-green-500/20' : 'border-[#00f0ff]/50 text-[#00f0ff] hover:bg-[#00f0ff]/20'}`}
                        >
                          <CheckSquare className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => deleteTask(task.id)}
                          className="p-2 border border-red-500/50 text-red-400 hover:bg-red-500/20 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
