import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { ChevronLeft, Flame, Target, Calendar, Archive } from 'lucide-react';
import { AreaChart, Area, XAxis, ResponsiveContainer, Tooltip } from 'recharts';

export default function HabitView() {
    const { id } = useParams();
    const [habit, setHabit] = useState(null);
    const [completions, setCompletions] = useState([]);
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const fetchHabitData = async () => {
            const { data: habitData } = await supabase.from('habits').select('*').eq('id', id).single();
            const { data: compData } = await supabase.from('completions').select('*').eq('habit_id', id);

            const { data: compDataLimit } = await supabase
                .from('completions')
                .select('*')
                .eq('habit_id', id)
                .order('completed_at', { ascending: false })
                .limit(10); // Get the last 10 completions

            setHabit(habitData);
            setCompletions(compData || []);
        };
        fetchHabitData();
    }, [id]);

    if (!habit) return <div className="p-10 text-white">Loading Habit Details...</div>;

    // Calculate specific stats for this habit
    const totalCompletions = completions.length;
    const currentStreak = calculateStreak(completions); // Helper function needed

    // Inside HabitView.jsx - before the return statement

    const getHabitChartData = () => {
        const last30Days = [...Array(30)].map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d.toISOString().split('T')[0];
        }).reverse();

        return last30Days.map(date => {
            // Check if THIS specific habit was completed on this date
            const isDone = completions.some(c => c.completed_at === date);

            return {
                date: new Date(date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
                // 100 for completed, 0 for not (creates the high/low wave)
                val: isDone ? 100 : 0
            };
        });
    };

    const habitChartData = getHabitChartData();



    const handleArchive = async () => {
        const { error } = await supabase
            .from('habits')
            .update({ is_archived: true })
            .eq('id', id);
        if (!error) navigate('/');
    };


    return (
        <div className="min-h-screen bg-[#0D1117] text-white p-6 md:p-12">
            <div style={{ paddingTop: 'var(--sat)' }} />
            <Link to="/" className="flex items-center gap-2 text-zinc-500 hover:text-white mb-8 transition">
                <ChevronLeft size={20} /> Back to Dashboard
            </Link>

            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-6 mb-12">
                    <span className="text-6xl p-4 bg-zinc-900 rounded-3xl border border-zinc-800 shadow-xl">{habit.icon}</span>
                    <div>
                        <h1 className="text-3xl font-black tracking-tighter">{habit.name}</h1>
                        <p className="text-zinc-500 font-bold uppercase tracking-widest mt-1">Individual Performance</p>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl">
                        <Flame className="text-orange-500 mb-2" />
                        <h3 className="text-zinc-500 text-xs font-bold uppercase">Current Streak</h3>
                        <p className="text-3xl font-black">{currentStreak} Days</p>
                    </div>
                    <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl">
                        <Target className="text-blue-500 mb-2" />
                        <h3 className="text-zinc-500 text-xs font-bold uppercase">Total Wins</h3>
                        <p className="text-3xl font-black">{totalCompletions}</p>
                    </div>
                    <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl">
                        <Calendar className="text-emerald-500 mb-2" />
                        <h3 className="text-zinc-500 text-xs font-bold uppercase">Start Date</h3>
                        <p className="text-3xl font-black">{new Date(habit.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                    </div>
                </div>

                <div className="bg-zinc-900/30 border border-zinc-800 p-8 rounded-[2.5rem] backdrop-blur-md shadow-2xl">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="text-sm font-black text-zinc-400 uppercase tracking-widest">Activity History</h3>
                            <p className="text-xs text-zinc-600 font-bold">Past 30 Days</p>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500">
                                <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]"></span>
                                COMPLETED
                            </div>
                        </div>
                    </div>

                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={habitChartData}>
                                <defs>
                                    <linearGradient id="habitGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#52525b', fontSize: 10, fontWeight: 'bold' }}
                                    minTickGap={40}
                                />
                                <Tooltip
                                    cursor={{ stroke: '#3f3f46', strokeWidth: 1 }}
                                    contentStyle={{
                                        backgroundColor: '#09090b',
                                        border: '1px solid #27272a',
                                        borderRadius: '16px',
                                        fontSize: '12px',
                                        fontWeight: 'bold'
                                    }}
                                    itemStyle={{ color: '#3b82f6' }}
                                    labelStyle={{ color: '#71717a', marginBottom: '4px' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="val"
                                    stroke="#3b82f6"
                                    strokeWidth={4}
                                    fillOpacity={1}
                                    fill="url(#habitGradient)"
                                    animationDuration={1500}
                                    // This makes the dots appear on the "peaks"
                                    dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#0D1117' }}
                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="mt-10 bg-zinc-900/30 border border-zinc-800 rounded-[2.5rem] overflow-hidden backdrop-blur-md">
                <div className="p-8 border-b border-zinc-800 flex justify-between items-center">
                    <h3 className="text-sm font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                        <Calendar size={16} className="text-blue-500" /> Recent Wins
                    </h3>
                    <span className="text-[10px] font-bold text-zinc-600 bg-zinc-800/50 px-3 py-1 rounded-full">
                        LAST 10 ENTRIES
                    </span>
                </div>

                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="text-[10px] font-black text-zinc-500 uppercase tracking-tighter bg-zinc-800/20">
                            <th className="p-6">Date</th>
                            <th className="p-6">Status</th>
                            <th className="p-6 text-right">XP Gained</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                        {completions.length > 0 ? (
                            completions.map((comp) => (
                                <tr key={comp.id} className="group hover:bg-zinc-800/30 transition-colors">
                                    <td className="p-6 text-sm font-bold text-zinc-300">
                                        {new Date(comp.completed_at).toLocaleDateString('en-US', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </td>
                                    <td className="p-6">
                                        <span className="flex items-center gap-2 text-emerald-500 text-xs font-black italic">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            COMPLETED
                                        </span>
                                    </td>
                                    <td className="p-6 text-right font-mono text-blue-400 font-bold text-sm">
                                        +10 XP
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="3" className="p-10 text-center text-zinc-600 font-bold italic text-sm">
                                    No completions recorded yet. Time to start the grind!
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="mt-20 pt-8 border-t border-zinc-800 flex justify-between items-center">
                <div className="text-zinc-600 text-sm">
                    Recorded since {new Date(habit.created_at).toLocaleDateString()}
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="px-6 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-orange-500 hover:border-orange-500/50 transition-all font-bold text-sm flex items-center gap-2"
                >
                    Archive Habit
                </button>
            </div>


            {/* Custom Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[2rem] max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="bg-orange-500/10 w-12 h-12 rounded-2xl flex items-center justify-center mb-6">
                            <Archive className="text-orange-500" size={24} />
                        </div>
                        <h2 className="text-xl font-black text-white mb-2">Archive Habit?</h2>
                        <p className="text-zinc-400 text-sm leading-relaxed mb-8">
                            This will hide the habit from your daily grid. Your progress history will be safely stored in the Vault.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="flex-1 px-4 py-3 rounded-xl bg-zinc-800 text-white font-bold text-sm hover:bg-zinc-700 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleArchive}
                                className="flex-1 px-4 py-3 rounded-xl bg-orange-500 text-white font-bold text-sm hover:bg-orange-600 transition"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Simple streak helper
function calculateStreak(completions) {
    if (!completions.length) return 0;
    const dates = completions.map(c => c.completed_at).sort().reverse();
    let streak = 0;
    let checkDate = new Date().toISOString().split('T')[0];

    for (let date of dates) {
        if (date === checkDate) {
            streak++;
            let d = new Date(checkDate);
            d.setDate(d.getDate() - 1);
            checkDate = d.toISOString().split('T')[0];
        } else break;
    }
    return streak;
}