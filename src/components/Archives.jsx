import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Link } from 'react-router-dom';
import { Archive, ArrowLeft, RotateCcw, Trash2, AlertTriangle } from 'lucide-react';

export default function Archives() {
    const [archivedHabits, setArchivedHabits] = useState([]);
    const [deleteId, setDeleteId] = useState(null);
    useEffect(() => {
        fetchArchives();
    }, []);

    const fetchArchives = async () => {
        const { data } = await supabase.from('habits').select('*').eq('is_archived', true);
        setArchivedHabits(data || []);
    };

    const restoreHabit = async (id) => {
        await supabase.from('habits').update({ is_archived: false }).eq('id', id);
        fetchArchives();
    };

    const deletePermanently = async (id) => {
        // 1. Delete all completions first (foreign key constraint)
        await supabase.from('completions').delete().eq('habit_id', id);
        // 2. Delete the habit
        await supabase.from('habits').delete().eq('id', id);

        setDeleteId(null);
        fetchArchives();
    };

    return (
        <div className="min-h-screen bg-[#0D1117] text-white p-8">
            <div className="max-w-4xl mx-auto">
                <Link to="/" className="flex items-center gap-2 text-zinc-500 hover:text-white mb-8 transition">
                    <ArrowLeft size={18} /> Back to Dashboard
                </Link>

                <h1 className="text-4xl font-black mb-2 flex items-center gap-4">
                    <Archive className="text-zinc-500" /> Archive Vault
                </h1>
                <p className="text-zinc-500 mb-10 font-bold uppercase tracking-widest text-xs">
                    Total Habits Mastered: {archivedHabits.length}
                </p>

                <div className="grid gap-4">
                    {archivedHabits.length === 0 && (
                        <div className="p-12 border-2 border-dashed border-zinc-800 rounded-3xl text-center text-zinc-600">
                            No archived habits yet.
                        </div>
                    )}
                    {archivedHabits.map(habit => (
                        <div key={habit.id} className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl flex justify-between items-center group">
                            <div className="flex items-center gap-4">
                                <span className="text-3xl grayscale group-hover:grayscale-0 transition">{habit.icon}</span>
                                <h3 className="text-xl font-bold text-zinc-300">{habit.name}</h3>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => restoreHabit(habit.id)}
                                    className="flex items-center gap-2 text-[10px] font-black text-blue-500 bg-blue-500/10 px-3 py-2 rounded-lg hover:bg-blue-500 hover:text-white transition"
                                >
                                    <RotateCcw size={14} /> RESTORE
                                </button>
                                <button
                                    onClick={() => setDeleteId(habit.id)}
                                    className="flex items-center gap-2 text-[10px] font-black text-red-500 bg-red-500/10 px-3 py-2 rounded-lg hover:bg-red-500 hover:text-white transition"
                                >
                                    <Trash2 size={14} /> DELETE
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>


            {deleteId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                    <div className="bg-zinc-900 border border-red-900/50 p-8 rounded-[2rem] max-w-sm w-full shadow-2xl">
                        <div className="bg-red-500/10 w-12 h-12 rounded-2xl flex items-center justify-center mb-6">
                            <AlertTriangle className="text-red-500" size={24} />
                        </div>
                        <h2 className="text-xl font-black text-white mb-2">Final Warning</h2>
                        <p className="text-zinc-400 text-sm leading-relaxed mb-8">
                            Deleting this habit will <span className="text-red-400 font-bold underline">permanently erase all completion data</span>. This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteId(null)} className="flex-1 px-4 py-3 rounded-xl bg-zinc-800 text-white font-bold text-sm">Cancel</button>
                            <button onClick={() => deletePermanently(deleteId)} className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white font-bold text-sm">Delete Forever</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}