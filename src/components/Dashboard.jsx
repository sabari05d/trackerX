import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Flame, Trophy, Star, Plus, CheckCircle2, Circle, X, Calendar as CalendarIcon, LayoutGrid } from 'lucide-react';
import confetti from 'canvas-confetti';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import Navbar from './Navbar';
import { Link } from 'react-router-dom';
import Footer from './Footer';


export default function Dashboard() {
    const [habits, setHabits] = useState([]);
    const [completions, setCompletions] = useState([]);
    const [view, setView] = useState('weekly'); // 'weekly' or 'monthly'
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newHabit, setNewHabit] = useState({ name: '', icon: '✨' });

    useEffect(() => {
        fetchData();
    }, []);


    const fetchData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        const { data: habitsData } = await supabase
            .from('habits')
            .select('*')
            .eq('is_archived', false)
            .order('created_at', { ascending: true });
        const { data: compData } = await supabase.from('completions').select('*');
        setHabits(habitsData || []);
        setCompletions(compData || []);
    };



    const addHabit = async (e) => {
        e.preventDefault();
        const { data: { user } } = await supabase.auth.getUser();
        const { error } = await supabase.from('habits').insert([
            { ...newHabit, user_id: user.id }
        ]);
        if (!error) {
            setIsModalOpen(false);
            setNewHabit({ name: '', icon: '✨' });
            fetchData();
        }
    };

    const toggleHabit = async (habitId, date) => {
        const { data: { user } } = await supabase.auth.getUser();
        const existing = completions.find(c => c.habit_id === habitId && c.completed_at === date);

        if (existing) {
            await supabase.from('completions').delete().eq('id', existing.id);
        } else {
            await supabase.from('completions').insert([
                { habit_id: habitId, completed_at: date, user_id: user.id }
            ]);
        }
        fetchData();
    };

    // Date Generator based on View
    const getDays = () => {
        const numDays = view === 'weekly' ? 7 : 30;
        return [...Array(numDays)].map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d.toISOString().split('T')[0];
        }).reverse();
    };

    const days = getDays();


    const getHabitStats = (habitId) => {
        // Filter completions for this specific habit that exist within our current 'days' array
        const habitCompletions = completions.filter(
            c => c.habit_id === habitId && days.includes(c.completed_at)
        );

        const percentage = Math.round((habitCompletions.length / days.length) * 100);
        return { percentage };
    };

    const getGlobalProgress = () => {
        if (habits.length === 0 || days.length === 0) return 0;

        // Total possible slots (habits * days shown)
        const totalSlots = habits.length * days.length;

        // Total completions that actually exist within the current date range
        const totalDone = completions.filter(c =>
            days.includes(c.completed_at)
        ).length;

        return Math.round((totalDone / totalSlots) * 100);
    };

    const globalPct = getGlobalProgress();


    // 1. Confetti Effect
    useEffect(() => {
        if (globalPct === 100 && habits.length > 0) {
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#3B82F6', '#EAB308', '#10B981']
            });
        }
    }, [globalPct]);

    // 2. Calculation for Stats Cards
    const getStats = () => {
        if (completions.length === 0) return { bestStreak: 0, topHabit: 'None' };

        // Calculate Top Habit (most completions ever)
        const counts = completions.reduce((acc, curr) => {
            acc[curr.habit_id] = (acc[curr.habit_id] || 0) + 1;
            return acc;
        }, {});
        const topHabitId = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b, null);
        const topHabitName = habits.find(h => h.id === topHabitId)?.name || 'None';

        // Simplified Best Streak (total completions / number of habits)
        const bestStreak = Math.floor(completions.length / (habits.length || 1));

        return { bestStreak, topHabitName };
    };

    const { bestStreak, topHabitName } = getStats();

    const getChartData = () => {
        // Generate an array of the last 30 days
        const numDays = view === 'weekly' ? 7 : 30;
        const last30Days = [...Array(numDays)].map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d.toISOString().split('T')[0];
        }).reverse();

        return last30Days.map(date => {
            const dayCompletions = completions.filter(c => c.completed_at === date).length;
            const totalHabits = habits.length || 1;
            const percentage = Math.round((dayCompletions / totalHabits) * 100);

            return {
                date: new Date(date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
                pct: percentage
            };
        });
    };

    const chartData = getChartData();

    const calculateLevel = (totalCompletions) => {
        const XP_PER_COMPLETION = 10;
        const totalXP = totalCompletions * XP_PER_COMPLETION;

        // Level formula: Level = floor(sqrt(totalXP / 50)) + 1
        // This makes it harder to level up as you get higher
        const level = Math.floor(Math.sqrt(totalXP / 50)) + 1;

        // Progress to next level
        const currentLevelXP = 50 * Math.pow(level - 1, 2);
        const nextLevelXP = 50 * Math.pow(level, 2);
        const xpInCurrentLevel = totalXP - currentLevelXP;
        const xpRequiredForNext = nextLevelXP - currentLevelXP;
        const progressToNext = Math.min(Math.round((xpInCurrentLevel / xpRequiredForNext) * 100), 100);

        // Rank names based on level
        const ranks = ["Novice", "Grinder", "Disciplined", "Warrior", "Elite", "Master", "Legend"];
        const rank = ranks[Math.min(Math.floor(level / 5), ranks.length - 1)];

        return { level, totalXP, progressToNext, rank };
    };

    const { level, totalXP, progressToNext, rank } = calculateLevel(completions.length);

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-[#0D1117] text-white p-4 md:p-8 pb-24 px-4">

                <div className="max-w-7xl mx-auto">

                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
                        <div>
                            <h2 className="text-zinc-500 uppercase tracking-widest text-xs font-bold">TrackerX Analytics</h2>
                            <h1 className="text-4xl font-black mt-1">Daily Progress</h1>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* View Switcher */}
                            <div className="bg-zinc-900 p-1 rounded-xl border border-zinc-800 flex">
                                <button
                                    onClick={() => setView('weekly')}
                                    className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition ${view === 'weekly' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-white'}`}
                                >
                                    <LayoutGrid size={16} /> Week
                                </button>
                                <button
                                    onClick={() => setView('monthly')}
                                    className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition ${view === 'monthly' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-white'}`}
                                >
                                    <CalendarIcon size={16} /> Month
                                </button>
                            </div>

                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="flex items-center gap-2 bg-blue-600 px-5 py-3 rounded-xl font-bold hover:bg-blue-500 transition shadow-lg shadow-blue-900/20"
                            >
                                <Plus size={20} /> <span className="hidden sm:inline">Add Habit</span>
                            </button>
                        </div>
                    </div>

                    {/* Main Table Container */}
                    <div className="bg-zinc-900/30 border border-zinc-800 rounded-3xl overflow-hidden backdrop-blur-sm mb-10 mt-4">
                        <div className="overflow-x-auto scrollbar-hide">
                            <table className="w-full text-left border-collapse min-w-[800px]">
                                <thead>
                                    <tr className="border-b border-zinc-800 bg-zinc-900/50">
                                        <th className="p-2 px-3 font-bold text-zinc-400 sticky left-0 bg-[#161b22] z-10 w-24 sm:w-32 md:w-64">Habit</th>
                                        {days.map(day => (
                                            <th key={day} className="p-4 text-center">
                                                <div className="text-[10px] font-black text-zinc-500 uppercase tracking-tighter">
                                                    {new Date(day).toLocaleDateString('en-US', { weekday: 'short' })}
                                                </div>
                                                <div className={`text-sm font-bold ${day === new Date().toISOString().split('T')[0] ? 'text-blue-500' : 'text-zinc-300'}`}>
                                                    {new Date(day).getDate()}
                                                </div>
                                            </th>
                                        ))}
                                        <th className="p-4 text-center font-bold text-zinc-500 uppercase text-xs">Progress</th>
                                        <th className="p-4 text-center font-bold text-zinc-500 uppercase text-xs">Chart</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {habits.map(habit => {
                                        const { percentage } = getHabitStats(habit.id);
                                        return (
                                            <tr key={habit.id} className="border-b border-zinc-800/50 hover:bg-white/[0.02] transition-colors group">
                                                <td className="p-2 px-3 sticky left-0 bg-[#0D1117] group-hover:bg-[#161b22] transition-colors z-10">
                                                    <Link to={`/habit/${habit.id}`} className="flex items-center gap-4 hover:opacity-80 transition">
                                                        <div className="flex items-center gap-4">
                                                            <span className="text-2xl">{habit.icon}</span>
                                                            <span className="font-bold text-zinc-200 tracking-tight">{habit.name}</span>
                                                        </div>
                                                    </Link>
                                                </td>
                                                {days.map(day => {
                                                    const isDone = completions.some(c => c.habit_id === habit.id && c.completed_at === day);
                                                    return (
                                                        <td key={day} className="p-2 text-center">
                                                            <button
                                                                onClick={() => toggleHabit(habit.id, day)}
                                                                className="group/btn relative transition-all active:scale-75"
                                                            >
                                                                {isDone ?
                                                                    <CheckCircle2 className="text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" size={28} /> :
                                                                    <Circle className="text-zinc-800 group-hover/btn:text-zinc-600" size={28} strokeWidth={1.5} />
                                                                }
                                                            </button>
                                                        </td>
                                                    );
                                                })}
                                                {/* Percentage Text Column */}
                                                <td className="p-4 text-center">
                                                    <span className="font-mono font-bold text-blue-400">
                                                        {percentage}%
                                                    </span>
                                                </td>

                                                {/* Circle Progress Chart Column */}
                                                <td className="p-4 text-center">
                                                    <div className="relative w-10 h-10 mx-auto">
                                                        {/* Background Circle */}
                                                        <svg className="w-full h-full transform -rotate-90">
                                                            <circle
                                                                cx="20"
                                                                cy="20"
                                                                r="16"
                                                                stroke="currentColor"
                                                                strokeWidth="4"
                                                                fill="transparent"
                                                                className="text-zinc-800"
                                                            />
                                                            {/* Progress Circle */}
                                                            <circle
                                                                cx="20"
                                                                cy="20"
                                                                r="16"
                                                                stroke="currentColor"
                                                                strokeWidth="4"
                                                                fill="transparent"
                                                                strokeDasharray={100}
                                                                strokeDashoffset={100 - percentage}
                                                                strokeLinecap="round"
                                                                className="text-blue-500 transition-all duration-500 ease-out"
                                                            />
                                                        </svg>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="max-w-7xl mx-auto mb-10 mt-4">
                        <div className="bg-zinc-900/40 border border-zinc-800 p-8 rounded-[2.5rem] backdrop-blur-xl flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
                            {/* Subtle background glow */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[100px] -z-10" />

                            {/* Avatar/Level Circle */}
                            <div className="relative">
                                <div className="w-24 h-24 rounded-full border-4 border-zinc-800 flex items-center justify-center bg-zinc-900 shadow-2xl">
                                    <span className="text-4xl font-black text-white">{level}</span>
                                </div>
                                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-blue-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-lg shadow-blue-900/40">
                                    LEVEL
                                </div>
                            </div>

                            {/* User Info & Progress Bar */}
                            <div className="flex-1 w-full">
                                <div className="flex justify-between items-end mb-4">
                                    <div>
                                        <h2 className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Current Rank</h2>
                                        <h1 className="text-3xl font-black text-white flex items-center gap-3">
                                            {rank} <span className="text-blue-500 text-sm font-bold bg-blue-500/10 px-3 py-1 rounded-lg">PRO</span>
                                        </h1>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Total XP</p>
                                        <p className="text-xl font-mono font-bold text-white">{totalXP.toLocaleString()}</p>
                                    </div>
                                </div>

                                {/* XP Progress Bar */}
                                <div className="h-4 bg-zinc-800/50 rounded-full overflow-hidden border border-white/5 p-1">
                                    <div
                                        className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                                        style={{ width: `${progressToNext}%` }}
                                    />
                                </div>
                                <div className="flex justify-between mt-2">
                                    <span className="text-[10px] font-black text-zinc-600 uppercase italic">Next Level Progress</span>
                                    <span className="text-[10px] font-black text-blue-500 uppercase italic">{progressToNext}%</span>
                                </div>
                            </div>

                            {/* Quick Stats side-panel */}
                            <div className="hidden lg:flex flex-col gap-2 pl-8 border-l border-zinc-800">
                                <div className="text-center">
                                    <p className="text-zinc-500 text-[9px] font-black uppercase tracking-widest">Global Win Rate</p>
                                    <p className="text-lg font-bold text-white">{globalPct}%</p>
                                </div>
                                <div className="w-24 h-[1px] bg-zinc-800" />
                                <div className="text-center">
                                    <p className="text-zinc-500 text-[9px] font-black uppercase tracking-widest">Active Goals</p>
                                    <p className="text-lg font-bold text-white">{habits.length}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="max-w-7xl mx-auto mt-4 mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Global Progress Card */}
                        <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl flex items-center justify-between backdrop-blur-md">
                            <div>
                                <h3 className="text-zinc-500 text-xs font-black uppercase tracking-widest">Total Performance</h3>
                                <p className="text-3xl font-black mt-1 text-white">{globalPct}%</p>
                                <p className="text-xs text-zinc-400 mt-2">
                                    {globalPct >= 80 ? '🔥 You are killing it!' : 'Keep pushing forward'}
                                </p>
                            </div>

                            {/* Large Progress Circle */}
                            <div className="relative w-20 h-20">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle
                                        cx="40" cy="40" r="34"
                                        stroke="currentColor" strokeWidth="8"
                                        fill="transparent" className="text-zinc-800"
                                    />
                                    <circle
                                        cx="40" cy="40" r="34"
                                        stroke="currentColor" strokeWidth="8"
                                        fill="transparent"
                                        strokeDasharray="213.6" /* 2 * PI * R */
                                        strokeDashoffset={213.6 - (213.6 * globalPct) / 100}
                                        strokeLinecap="round"
                                        className="text-yellow-500 transition-all duration-1000 ease-in-out drop-shadow-[0_0_10px_rgba(234,179,8,0.4)]"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-yellow-500">
                                    GOAL
                                </div>
                            </div>
                        </div>

                        {/* 2. Best Streak Card */}
                        <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl flex items-center justify-between backdrop-blur-md border-b-orange-500/50">
                            <div>
                                <h3 className="text-zinc-500 text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                    <Flame size={14} className="text-orange-500" /> Consistency
                                </h3>
                                <p className="text-3xl font-black mt-1 text-white">{bestStreak} Days</p>
                                <p className="text-xs text-zinc-400 mt-2">Best personal record</p>
                            </div>
                            <div className="bg-orange-500/10 p-4 rounded-2xl">
                                <Flame size={32} className="text-orange-500 animate-pulse" />
                            </div>
                        </div>

                        {/* 3. Top Habit Card */}
                        <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl flex items-center justify-between backdrop-blur-md border-b-blue-500/50">
                            <div>
                                <h3 className="text-zinc-500 text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                    <Trophy size={14} className="text-blue-500" /> MVP Habit
                                </h3>
                                <p className="text-xl font-black mt-1 text-white truncate max-w-[150px]">{topHabitName}</p>
                                <p className="text-xs text-zinc-400 mt-2">Your most consistent win</p>
                            </div>
                            <div className="bg-blue-500/10 p-4 rounded-2xl">
                                <Trophy size={32} className="text-blue-500" />
                            </div>
                        </div>
                    </div>


                    <div className="max-w-7xl mx-auto mb-10">
                        <div className="bg-zinc-900/30 border border-zinc-800 p-6 rounded-3xl backdrop-blur-md">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-zinc-500 text-xs font-black uppercase tracking-widest">Performance Wave</h3>
                                <div className="flex gap-2 items-center text-[10px] text-zinc-500 font-bold">
                                    <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]"></span>
                                    COMPLETION %
                                </div>
                            </div>

                            <div className="h-[250px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient id="colorPct" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                                        <XAxis
                                            dataKey="date"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#71717a', fontSize: 10, fontWeight: 'bold' }}
                                            minTickGap={30}
                                        />
                                        <YAxis
                                            hide={true}
                                            domain={[0, 100]}
                                        />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '12px', fontSize: '12px' }}
                                            itemStyle={{ color: '#3b82f6', fontWeight: 'bold' }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="pct"
                                            stroke="#3b82f6"
                                            strokeWidth={4}
                                            fillOpacity={1}
                                            fill="url(#colorPct)"
                                            animationDuration={2000}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Add Habit Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                        <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-3xl p-8 shadow-2xl">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-2xl font-black">New Habit</h3>
                                <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-white"><X /></button>
                            </div>
                            <form onSubmit={addHabit} className="space-y-6">
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-2 ml-1">Habit Name</label>
                                    <input
                                        autoFocus
                                        required
                                        className="w-full bg-black border border-zinc-800 rounded-xl p-4 text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                                        placeholder="e.g., Colder Shower"
                                        value={newHabit.name}
                                        onChange={e => setNewHabit({ ...newHabit, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-2 ml-1">Icon</label>
                                    <div className="grid grid-cols-5 gap-2">
                                        {['✨', '🔥', '💧', '📚', '🧘', '🏃', '🥗', '⚡', '💊', '🛌'].map(emoji => (
                                            <button
                                                key={emoji}
                                                type="button"
                                                onClick={() => setNewHabit({ ...newHabit, icon: emoji })}
                                                className={`text-2xl p-3 rounded-xl border ${newHabit.icon === emoji ? 'border-blue-500 bg-blue-500/10' : 'border-zinc-800 hover:bg-zinc-800'}`}
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-xl font-black text-lg shadow-xl shadow-blue-900/20 transition-all active:scale-95">
                                    Create Habit
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
            <Footer />
        </>
    );
}