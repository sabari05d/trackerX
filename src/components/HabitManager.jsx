import { useEffect, useState } from 'react';
import useHabitStore from '../store/useHabitStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Trash2, Archive, Edit3, ChevronLeft, Sparkles, Star } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useUI } from '../context/UIContext';

export default function HabitManager() {
    const { habits, fetchData, addHabit, archiveHabit } = useHabitStore();
    const [newHabit, setNewHabit] = useState({ name: '', icon: '✨' });
    const navigate = useNavigate();
    const { isHabitModalOpen, setIsHabitModalOpen } = useUI();


    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!newHabit.name.trim()) {
            showToast("Protocol name required", "warning");
            return;
        }

        const success = await addHabit(newHabit);
        if (success) {
            showToast("New Protocol Initiated", "success");
            setIsHabitModalOpen(false);
            setNewHabit({ name: '', icon: '✨' });
        } else {
            showToast("Failed to initiate protocol", "error");
        }
    };

    return (
        <div className="min-h-screen bg-[#09090b] text-white p-6 pb-32">
            {/* HEADER */}
            <header className="flex items-center justify-center mb-12">
                {/* <button onClick={() => navigate(-1)} className="p-3 bg-white/5 rounded-2xl">
                    <ChevronLeft size={20} />
                </button> */}
                <h1 className="text-xl font-black uppercase tracking-[0.2em]">Habit Lab</h1>
                <div className="w-10" /> {/* Spacer */}
            </header>

            {/* ADD BUTTON CARD */}
            <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsHabitModalOpen(true)}
                className="w-full p-6 rounded-[2.5rem] bg-blue-600 flex items-center justify-between mb-10 shadow-xl shadow-blue-900/20"
            >
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                        <Plus className="text-white" size={24} strokeWidth={3} />
                    </div>
                    <div className="text-left">
                        <p className="font-black text-lg">Architect a Habit</p>
                        <p className="text-blue-100 text-[10px] font-bold uppercase tracking-widest">Start a new ritual</p>
                    </div>
                </div>
                <Sparkles size={20} className="text-blue-200 opacity-50" />
            </motion.button>

            {/* ACTIVE HABITS LIST */}
            <div className="space-y-4">
                <h2 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] ml-4 mb-6">Active Protocols</h2>
                {habits.length === 0 ? (
                    <div className="py-12 border-2 border-dashed border-white/[0.05] rounded-[2.5rem] flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-white/[0.02] rounded-full flex items-center justify-center mb-4">
                            <Star className="text-zinc-700" size={24} />
                        </div>
                        <p className="text-zinc-500 font-black text-xs uppercase tracking-[0.2em]">No Active Rituals</p>
                        <p className="text-zinc-700 text-[10px] mt-1 uppercase font-bold">Start a habit to track progress</p>
                    </div>
                ) : (
                    habits.map((habit) => (
                        <div key={habit.id} className="bg-white/[0.02] border border-white/5 p-5 rounded-[2.5rem] flex items-center justify-between group hover:border-red-500/30 transition-all">
                            {/* Wrap the clickable area in a Link */}
                            <Link to={`/habit/${habit.id}`} className="flex items-center gap-4 flex-1">
                                <div className="w-14 h-14 bg-zinc-900 rounded-[1.5rem] flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                                    {habit.icon}
                                </div>
                                <div>
                                    <h3 className="font-black text-white group-hover:text-red-500 transition-colors">{habit.name}</h3>
                                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">View Protocol Analytics</p>
                                </div>
                            </Link>
                            <div className="flex gap-2">
                                <button
                                    onClick={(e) => {
                                        e.preventDefault(); // Prevents the Link from triggering
                                        archiveHabit(habit.id);
                                    }}
                                    className="p-3 text-zinc-600 hover:text-orange-500 transition-all"
                                >
                                    <Archive size={18} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* MODERN MODAL */}
            <AnimatePresence>
                {isHabitModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl overflow-scroll"
                    >
                        <motion.div
                            initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
                            className="bg-zinc-900 border border-white/10 w-full max-w-md rounded-[1.5rem] p-8 shadow-2xl"
                        >
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="text-2xl font-black tracking-tighter text-white">New Ritual</h3>
                                <button onClick={() => setIsHabitModalOpen(false)} className="p-2 text-zinc-500 hover:text-white transition"><X /></button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-8">
                                <div>
                                    <label className="block text-[10px] font-black text-zinc-500 uppercase mb-3 tracking-widest ml-1">Protocol Name</label>
                                    <input
                                        autoFocus required
                                        className="w-full bg-black border border-white/5 rounded-2xl p-5 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold"
                                        placeholder="Cold Plunge, Deep Work..."
                                        value={newHabit.name}
                                        onChange={e => setNewHabit({ ...newHabit, name: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-zinc-500 uppercase mb-3 tracking-widest ml-1">Visual Anchor (Icon)</label>
                                    <div className="grid grid-cols-5 gap-3">
                                        {['🔥', '🧠', '💻', '🏋️', '🥗', '💧', '📚', '🧘', '⚡', '🌙'].map(emoji => (
                                            <button
                                                key={emoji} type="button"
                                                onClick={() => setNewHabit({ ...newHabit, icon: emoji })}
                                                className={`text-2xl h-14 rounded-2xl border transition-all ${newHabit.icon === emoji ? 'border-blue-500 bg-blue-500/10 scale-110' : 'border-white/5 bg-white/[0.02] opacity-40'}`}
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button type="submit" className="w-full bg-white text-black py-5 rounded-2xl font-black text-lg transition-all active:scale-95">
                                    Initialize Habit
                                </button>
                                <button onClick={() => setIsHabitModalOpen(false)} className="w-full bg-transparent py-5 rounded-2xl font-black text-lg shadow-xl shadow-gray-900/40 transition-all active:scale-95">
                                    Close
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}