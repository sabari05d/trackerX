import { useState, useEffect } from 'react';
import useTaskStore from '../store/useTaskStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Calendar, Bell, Trash2, CheckCircle2, Circle, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns';
import { useUI } from '../context/UIContext';
import { NotificationService } from '../services/NotificationService';

export default function TaskManager() {
    const { tasks, fetchTasks, addTask, updateTaskStatus, archiveTask } = useTaskStore();
    const { isTaskModalOpen, setIsTaskModalOpen, showToast } = useUI();
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const getTomorrowDate = () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
    };

    const defaultTask = {
        title: '',
        description: '',
        priority: 'medium',
        due_date: getTomorrowDate(),
        reminder_at: ''
    };

    const [newTask, setNewTask] = useState(defaultTask);

    useEffect(() => { fetchTasks(); }, []);

    // Logic: Only show tasks that are NOT archived and NOT done in the active list
    const activeTasks = tasks.filter(t => !t.is_archived && t.status !== 'done');
    const completedTasks = tasks.filter(t => !t.is_archived && t.status === 'done');

    const daysInMonth = eachDayOfInterval({
        start: startOfMonth(currentMonth),
        end: endOfMonth(currentMonth)
    });


    const handleSubmit = async (e) => {
        e.preventDefault();

        // Title is usually required, good to check before submitting
        if (!newTask.title.trim()) {
            showToast("Task title is required", "warning");
            return;
        }

        const taskToSubmit = {
            ...newTask,
            due_date: newTask.due_date || null,
            reminder_at: newTask.reminder_at || null,
            description: newTask.description || null,
            status: 'todo'
        };

        const success = await addTask(taskToSubmit);

        if (success) {
            if (newTask.reminder_at) {
                await NotificationService.scheduleReminder(
                    Date.now(),
                    "Task Protocol 🔔",
                    `Operational Alert: ${newTask.title}`,
                    newTask.reminder_at,
                );
            }

            // --- TRIGGER SUCCESS TOAST ---
            showToast("Task Logged Successfully", "success");

            setIsTaskModalOpen(false);
            setNewTask(defaultTask);
        } else {
            // --- TRIGGER ERROR TOAST ---
            showToast("Failed to sync task", "error");
        }
    };

    // Create these handler functions to manage the UI feedback
    const handleCompleteTask = async (id, title) => {
        const result = await updateTaskStatus(id, 'done');
        if (result) {
            showToast(`Objective Secured: ${title}`, "success");
        } else {
            showToast("System Sync Failed", "error");
        }
    };

    const handleArchiveTask = async (id) => {
        const result = await archiveTask(id);
        if (result) {
            showToast("Task Moved to Archives", "success");
        } else {
            showToast("Failed to Archive Task", "error");
        }
    };

    return (
        <div className="min-h-screen bg-[#09090b] text-white p-6 pb-32 font-sans">
            <header className="flex items-center justify-center mb-10">
                <h1 className="text-xl font-black uppercase tracking-[0.2em]">Deep Work</h1>
            </header>

            <motion.button
                onClick={() => setIsTaskModalOpen(true)}
                whileTap={{ scale: 0.98 }}
                className="w-full p-6 rounded-[2.5rem] bg-indigo-600 flex items-center gap-4 mb-12 shadow-xl shadow-indigo-900/20"
            >
                <Plus size={24} strokeWidth={3} />
                <span className="font-black text-lg">Deploy New Task</span>
            </motion.button>

            {/* ACTIVE OPERATIONS */}
            <div className="space-y-4 mb-12">
                <h2 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] ml-2 mb-4">Active Operations</h2>
                {activeTasks.length === 0 ? (
                    <div className="py-10 border border-white/5 rounded-[2.5rem] bg-white/[0.01] flex flex-col items-center justify-center">
                        <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest">All Systems Synchronized</p>
                    </div>
                ) : (
                    activeTasks.map((task) => (
                        <div key={task.id} className="bg-white/[0.02] border border-white/5 p-5 rounded-[1.8rem] flex items-center justify-between group hover:border-indigo-500/30 transition-all">
                            <div className="flex items-center gap-4">
                                <div className={`w-1.5 h-8 rounded-full ${task.priority === 'high' ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]' : 'bg-indigo-600'}`} />
                                <div>
                                    <h3 className="font-black text-sm uppercase tracking-tight text-zinc-200">{task.title}</h3>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest flex items-center gap-1">
                                            <Calendar size={10} /> {task.due_date}
                                        </span>
                                        {task.reminder_at && (
                                            <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-1">
                                                <Bell size={10} className="animate-pulse" /> Alert Active
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {/* --- UPDATED ARCHIVE BUTTON --- */}
                                <button
                                    onClick={() => handleArchiveTask(task.id)}
                                    className="p-2 text-zinc-700 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 size={16} />
                                </button>

                                {/* --- UPDATED COMPLETE BUTTON --- */}
                                <button
                                    onClick={() => handleCompleteTask(task.id, task.title)}
                                    className="w-12 h-12 rounded-full flex items-center justify-center text-zinc-800 hover:text-indigo-500 transition-all active:scale-75"
                                >
                                    <Circle size={32} strokeWidth={1.5} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* COMPLETED OPERATIONS */}
            {completedTasks.length > 0 && (
                <div className="space-y-4 mb-12">
                    <h2 className="text-[10px] font-black text-indigo-500/50 uppercase tracking-[0.3em] ml-2 mb-4">Completed Operations</h2>
                    <div className="space-y-3">
                        {completedTasks.map((task) => (
                            <div key={task.id} className="bg-indigo-500/[0.02] border border-indigo-500/10 p-4 rounded-[1.5rem] flex items-center justify-between opacity-60">
                                <div className="flex items-center gap-4">
                                    <div className="w-1.5 h-6 rounded-full bg-zinc-800" />
                                    <div>
                                        <h3 className="font-bold text-sm uppercase tracking-tight text-zinc-500 line-through decoration-indigo-500/50">{task.title}</h3>
                                        <span className="text-[8px] font-bold text-zinc-700 uppercase tracking-widest">System Offline</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button onClick={() => handleArchiveTask(task.id)} className="p-2 text-zinc-800 hover:text-red-500 transition-colors">
                                        <Trash2 size={16} />
                                    </button>
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-indigo-500">
                                        <CheckCircle2 size={24} strokeWidth={2.5} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* HEATMAP CALENDAR */}
            <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8">
                <div className="flex items-center justify-between mb-10">
                    <h3 className="font-black italic uppercase tracking-tighter text-xl">{format(currentMonth, 'MMMM yyyy')}</h3>
                    <div className="flex gap-2">
                        <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 bg-white/5 rounded-xl hover:bg-white/10 transition"><ChevronLeft size={18} /></button>
                        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 bg-white/5 rounded-xl hover:bg-white/10 transition"><ChevronRight size={18} /></button>
                    </div>
                </div>

                <div className="grid grid-cols-7 gap-3">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
                        <div key={d} className="text-center text-[10px] font-black text-zinc-700 pb-4">{d}</div>
                    ))}

                    {[...Array(startOfMonth(currentMonth).getDay())].map((_, i) => <div key={i} />)}

                    {daysInMonth.map(day => {
                        const dateStr = format(day, 'yyyy-MM-dd');
                        const dayTasks = tasks.filter(t => t.due_date === dateStr);
                        const hasTask = dayTasks.length > 0;
                        const isAllDone = hasTask && dayTasks.every(t => t.status === 'done');
                        const isToday = isSameDay(day, new Date());

                        return (
                            <div key={dateStr} className="aspect-square flex flex-col items-center justify-center relative">
                                <span className={`text-[9px] font-black mb-1.5 ${isToday ? 'text-indigo-500' : 'text-zinc-700'}`}>
                                    {format(day, 'd')}
                                </span>
                                <div className={`w-9 h-9 rounded-[1rem] flex items-center justify-center transition-all duration-500 ${isAllDone ? 'bg-indigo-600 shadow-[0_5px_15px_rgba(79,70,229,0.4)]' :
                                    hasTask ? 'bg-indigo-600/20 border border-indigo-500/40' : 'bg-white/[0.03]'
                                    }`}>
                                    {isAllDone ? (
                                        <CheckCircle2 size={16} className="text-white" />
                                    ) : hasTask ? (
                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                                    ) : null}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* NEW TASK MODAL */}
            <AnimatePresence>
                {isTaskModalOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-zinc-900 border border-white/10 w-full max-w-md rounded-[2.5rem] p-8">
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="text-2xl font-black tracking-tighter text-white uppercase">Initialize Protocol</h3>
                                <button onClick={() => setIsTaskModalOpen(false)} className="p-2 text-zinc-500 hover:text-white transition"><X /></button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Task Designation</label>
                                    <input
                                        className="w-full bg-black border border-white/5 rounded-2xl p-4 text-white font-bold outline-none focus:ring-1 focus:ring-indigo-500 mt-2"
                                        placeholder="Operation Name..."
                                        value={newTask.title}
                                        onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Priority Matrix</label>
                                    <div className="grid grid-cols-3 gap-2 mt-2">
                                        {['low', 'medium', 'high'].map((p) => (
                                            <button
                                                key={p}
                                                type="button"
                                                onClick={() => setNewTask({ ...newTask, priority: p })}
                                                className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${newTask.priority === p ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400' : 'border-white/5 bg-black text-zinc-600'
                                                    }`}
                                            >
                                                {p}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Deadline</label>
                                        <input
                                            type="date"
                                            className="w-full bg-black border border-white/5 rounded-xl p-3 text-sm text-white outline-none focus:border-indigo-500"
                                            style={{ colorScheme: 'dark' }}
                                            value={newTask.due_date}
                                            onChange={e => setNewTask({ ...newTask, due_date: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Reminder</label>
                                        <input
                                            type="datetime-local"
                                            className="w-full bg-black border border-white/5 rounded-xl p-3 text-sm text-white outline-none focus:border-indigo-500"
                                            style={{ colorScheme: 'dark' }}
                                            value={newTask.reminder_at}
                                            onChange={e => setNewTask({ ...newTask, reminder_at: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 py-5 rounded-2xl font-black text-lg shadow-xl shadow-indigo-900/40 transition-all active:scale-95">
                                    Commit Task
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}