import { useEffect, useState } from 'react';
import useHabitStore from '../store/useHabitStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Zap, CheckCircle2, Circle, Trophy, Target, ListTodo, Flame, Star } from 'lucide-react';
import useTaskStore from '../store/useTaskStore';
import { useUI } from '../context/UIContext';

export default function Dashboard() {
    const { habits, completions, fetchData, toggleHabit, getStats, loading } = useHabitStore();
    const [activeTab, setActiveTab] = useState('habits');
    const { tasks, fetchTasks, addTask, updateTaskStatus, archiveTask } = useTaskStore();

    const { showToast } = useUI();

    // Create these handler functions to manage the UI feedback
    const handleCompleteTask = async (id, title) => {
        const result = await updateTaskStatus(id, 'done');
        if (result) {
            showToast(`Objective Secured: ${title}`, "success");
        } else {
            showToast("System Sync Failed", "error");
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const { level, totalXP, progressToNext, rank } = getStats();
    const today = new Date().toISOString().split('T')[0];
    const hour = new Date().getHours();

    const getGreeting = () => {
        if (hour < 12) return { msg: "Chase the sunrise", sub: "Master your morning rituals." };
        if (hour < 18) return { msg: "Stay in the flow", sub: "Discipline is the bridge to goals." };
        return { msg: "Finish strong", sub: "End the day with a win." };
    };

    const getDailyFocus = () => {
        if (habits.length === 0) return "0%";
        const doneToday = habits.filter(h => completions.some(c => c.habit_id === h.id && c.completed_at === today)).length;
        return Math.round((doneToday / habits.length) * 100) + "%";
    };

    const todayStr = new Date().toISOString().split('T')[0];

    // Filter tasks: show if due today OR if overdue (pending) and not archived
    const activeTasks = tasks.filter(task => {
        const isArchived = task.is_archived === true;
        const isCompleted = task.status === 'done';
        const isDueTodayOrPast = task.due_date <= todayStr;

        return !isArchived && !isCompleted && isDueTodayOrPast;
    });

    if (loading) return (
        <div className="flex h-screen items-center justify-center bg-[#09090b]">
            <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5 }} className="text-zinc-600 font-black tracking-widest uppercase text-xs">
                Syncing Routine...
            </motion.div>
        </div>
    );

    return (
        <div className="px-6 py-4 space-y-10 max-w-4xl mx-auto pb-32">

            {/* DYNAMIC HEADER */}
            <header className="py-6">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2 mb-2">
                    <div className="h-px w-8 bg-blue-500/50" />
                    <span className="text-blue-500 text-[10px] font-black uppercase tracking-[0.3em]">
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </span>
                </motion.div>
                <h1 className="text-4xl font-black tracking-tight text-white mb-2">
                    {getGreeting().msg}, <span className="text-zinc-500 italic">Sabari.</span>
                </h1>
                <p className="text-zinc-500 font-medium text-sm">{getGreeting().sub}</p>
            </header>

            {/* REAL-TIME STATS BENTO */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Level', val: level.toString().padStart(2, '0'), icon: Zap, color: 'text-yellow-500', sub: `${progressToNext}% to next` },
                    { label: 'Rank', val: rank, icon: Trophy, color: 'text-blue-500', sub: 'Global Tier' },
                    { label: 'XP', val: totalXP, icon: Sparkles, color: 'text-emerald-500', sub: 'Lifetime' },
                    { label: 'Focus', val: getDailyFocus(), icon: Target, color: 'text-red-500', sub: 'Today' },
                ].map((stat, i) => (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                        key={stat.label}
                        className="bg-white/[0.02] border border-white/[0.05] backdrop-blur-3xl p-5 rounded-[1rem] flex flex-col justify-between h-32"
                    >
                        <div className="flex items-center justify-between">
                            <stat.icon className={stat.color} size={16} strokeWidth={3} />
                            <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">{stat.label}</span>
                        </div>
                        <div>
                            <span className="text-2xl font-black text-white">{stat.val}</span>
                            <p className="text-[8px] font-bold text-zinc-700 uppercase mt-1 tracking-tighter">{stat.sub}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* SEGMENTED CONTROL (TABS) */}
            <div className="flex gap-8 border-b border-white/5 pb-2">
                {['habits', 'tasks'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`text-[10px] font-black uppercase tracking-[0.2em] transition-all relative pb-2 ${activeTab === tab ? 'text-white' : 'text-zinc-600'}`}
                    >
                        {tab === 'habits' ? 'Daily Rituals' : 'Deep Work'}
                        {activeTab === tab && <motion.div layoutId="tabLine" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />}
                    </button>
                ))}
            </div>

            {/* EXECUTION AREA */}
            <div className="space-y-4">
                <AnimatePresence mode="wait">
                    {activeTab === 'habits' ? (
                        <motion.div key="habits" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                            {habits.length > 0 ? (
                                habits.map((habit) => {
                                    const isDone = completions.some(c => c.habit_id === habit.id && c.completed_at === today);
                                    return (
                                        <div
                                            key={habit.id}
                                            className={`group flex items-center justify-between p-5 rounded-[1rem] border transition-all duration-700 ${isDone ? 'bg-emerald-500/5 border-emerald-500/20 shadow-[0_0_40px_rgba(16,185,129,0.03)]' : 'bg-white/[0.01] border-white/5'
                                                }`}
                                        >
                                            <div className="flex items-center gap-5">
                                                <div className={`w-16 h-16 rounded-[1.8rem] flex items-center justify-center text-3xl transition-all duration-500 ${isDone ? 'bg-emerald-500/20 scale-95 rotate-6' : 'bg-zinc-900 border border-white/5'}`}>
                                                    {habit.icon}
                                                </div>
                                                <div>
                                                    <h3 className={`font-black text-lg ${isDone ? 'text-emerald-400' : 'text-zinc-200'}`}>{habit.name}</h3>
                                                    <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">+5 XP ON COMPLETION</span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => toggleHabit(habit.id, today)}
                                                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-75 ${isDone ? 'text-emerald-500' : 'text-zinc-800 hover:text-blue-500'}`}
                                            >
                                                {isDone ? <CheckCircle2 size={40} strokeWidth={2.5} /> : <Circle size={40} strokeWidth={1.2} />}
                                            </button>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="py-12 border-2 border-dashed border-white/[0.05] rounded-[2.5rem] flex flex-col items-center justify-center text-center">
                                    <div className="w-16 h-16 bg-white/[0.02] rounded-full flex items-center justify-center mb-4">
                                        <Star className="text-zinc-700" size={24} />
                                    </div>
                                    <p className="text-zinc-500 font-black text-xs uppercase tracking-[0.2em]">No Active Rituals</p>
                                    <p className="text-zinc-700 text-[10px] mt-1 uppercase font-bold">Start a habit to track progress</p>
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div key="tasks" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                            {activeTasks.length > 0 ? (
                                activeTasks.map((task) => (
                                    <div
                                        key={task.id}
                                        className="bg-white/[0.02] border border-white/5 p-5 rounded-[1.5rem] flex items-center justify-between group hover:border-blue-500/30 transition-all"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-2 h-2 rounded-full ${task.priority === 'high' ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' :
                                                task.priority === 'medium' ? 'bg-orange-500' : 'bg-blue-500'
                                                }`} />
                                            <div>
                                                <h3 className="font-black text-white text-sm uppercase tracking-tight">{task.title}</h3>
                                                <p className="text-[10px] text-zinc-600 font-bold uppercase mt-0.5">
                                                    {task.due_date === todayStr ? "Due Today" : "Overdue"}
                                                </p>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleCompleteTask(task.id, 'done')}
                                            className="p-3 bg-blue-600/10 text-blue-500 rounded-xl hover:bg-blue-600 hover:text-white transition-all"
                                        >
                                            <CheckCircle2 size={18} />
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div className="py-24 flex flex-col items-center opacity-40">
                                    <ListTodo size={48} className="text-zinc-700 mb-4" />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Protocol Clear: No Pending Tasks</p>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}