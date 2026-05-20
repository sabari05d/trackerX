import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Link } from 'react-router-dom';
import { Archive, ArrowLeft, RotateCcw, Trash2, AlertTriangle, CheckCircle2, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Archives() {
    const [activeTab, setActiveTab] = useState('habits'); // 'habits' or 'tasks'
    const [archivedHabits, setArchivedHabits] = useState([]);
    const [archivedTasks, setArchivedTasks] = useState([]);
    const [deleteConfig, setDeleteConfig] = useState({ id: null, type: null });

    useEffect(() => {
        fetchArchives();
    }, []);

    const fetchArchives = async () => {
        const { data: habits } = await supabase.from('habits').select('*').eq('is_archived', true);
        const { data: tasks } = await supabase.from('tasks').select('*').eq('is_archived', true);
        setArchivedHabits(habits || []);
        setArchivedTasks(tasks || []);
    };

    const restoreItem = async (id, type) => {
        const table = type === 'habits' ? 'habits' : 'tasks';
        await supabase.from(table).update({ is_archived: false }).eq('id', id);
        fetchArchives();
    };

    const deletePermanently = async () => {
        const { id, type } = deleteConfig;
        if (type === 'habits') {
            await supabase.from('completions').delete().eq('habit_id', id);
            await supabase.from('habits').delete().eq('id', id);
        } else {
            await supabase.from('tasks').delete().eq('id', id);
        }
        setDeleteConfig({ id: null, type: null });
        fetchArchives();
    };

    return (
        <div className="min-h-screen bg-[#09090b] text-white p-6 md:p-12 pb-32">
            <div className="max-w-2xl mx-auto">

                <div className="flex flex-col mb-12">
                    <h1 className="text-4xl font-black tracking-tighter mb-2">Vault</h1>
                    <p className="text-zinc-500 font-bold uppercase tracking-[0.2em] text-[10px]">Archived Operations & Rituals</p>
                </div>

                {/* TAB SWITCHER */}
                <div className="flex bg-white/5 p-1 rounded-2xl mb-8">
                    {['habits', 'tasks'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === tab ? 'bg-white text-black shadow-lg' : 'text-zinc-500'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* CONTENT LIST */}
                <div className="space-y-4">
                    <AnimatePresence mode="wait">
                        {(activeTab === 'habits' ? archivedHabits : archivedTasks).length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="p-20 border border-white/5 rounded-[3rem] text-center"
                            >
                                <Archive className="mx-auto text-zinc-800 mb-4" size={48} />
                                <p className="text-zinc-600 font-bold text-sm uppercase tracking-widest">Vault is Empty</p>
                            </motion.div>
                        ) : (
                            (activeTab === 'habits' ? archivedHabits : archivedTasks).map((item) => (
                                <motion.div
                                    layout
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                    key={item.id}
                                    className="bg-white/[0.02] border border-white/5 p-6 rounded-[2.5rem] flex justify-between items-center group"
                                >
                                    <div className="flex items-center gap-5">
                                        <div className="w-14 h-14 bg-zinc-900 rounded-2xl flex items-center justify-center text-2xl">
                                            {activeTab === 'habits' ? item.icon : <CheckCircle2 className="text-indigo-500" />}
                                        </div>
                                        <div>
                                            <h3 className="font-black text-zinc-200">{item.name || item.title}</h3>
                                            <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest mt-1">
                                                {activeTab === 'habits' ? 'Ritual Mastered' : 'Operation Complete'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => restoreItem(item.id, activeTab)}
                                            className="p-3 bg-white/5 rounded-xl text-zinc-400 hover:text-emerald-400 transition"
                                            title="Restore"
                                        >
                                            <RotateCcw size={18} />
                                        </button>
                                        <button
                                            onClick={() => setDeleteConfig({ id: item.id, type: activeTab })}
                                            className="p-3 bg-white/5 rounded-xl text-zinc-400 hover:text-red-500 transition"
                                            title="Delete Permanently"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* DELETE CONFIRMATION MODAL */}
            <AnimatePresence>
                {deleteConfig.id && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                            className="bg-zinc-900 border border-white/10 p-10 rounded-[3rem] max-w-sm w-full shadow-2xl text-center"
                        >
                            <div className="bg-red-500/10 w-16 h-16 rounded-3xl flex items-center justify-center mb-8 mx-auto">
                                <AlertTriangle className="text-red-500" size={32} />
                            </div>
                            <h2 className="text-2xl font-black text-white mb-3">Permanent Erasure</h2>
                            <p className="text-zinc-500 text-sm leading-relaxed mb-10">
                                This action will scrub all data related to this {deleteConfig.type === 'habits' ? 'habit' : 'task'} from the core database.
                            </p>
                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={() => deletePermanently()}
                                    className="w-full py-4 rounded-2xl bg-red-600 text-white font-black text-sm transition active:scale-95 shadow-lg shadow-red-900/20"
                                >
                                    Confirm Deletion
                                </button>
                                <button
                                    onClick={() => setDeleteConfig({ id: null, type: null })}
                                    className="w-full py-4 rounded-2xl bg-white/5 text-zinc-400 font-bold text-xs uppercase tracking-widest"
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}