import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import {
    ChevronLeft, Flame, Target, Calendar, Archive,
    ChevronRight, Trophy, Zap, Clock, ShieldCheck, Bell, BellOff, Save
} from 'lucide-react';
import {
    format, addMonths, subMonths, startOfMonth,
    endOfMonth, eachDayOfInterval, isSameDay,
    parseISO, differenceInDays
} from 'date-fns';

import { LocalNotifications } from '@capacitor/local-notifications';
import { useUI } from '../context/UIContext';

export default function HabitView() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { showToast } = useUI();

    const [habit, setHabit] = useState(null);
    const [completions, setCompletions] = useState([]);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
    const [reminderData, setReminderData] = useState({
        time: '09:00',
        days: [],
        enabled: false
    });

    useEffect(() => {
        fetchHabitData();
    }, [id]);

    const fetchHabitData = async () => {
        const { data: habitData } = await supabase.from('habits').select('*').eq('id', id).single();
        const { data: compData } = await supabase.from('completions').select('*').eq('habit_id', id);

        setHabit(habitData);
        setCompletions(compData || []);
    };

    // Remainder Logic
    useEffect(() => {
        if (habit) {
            setReminderData({
                time: habit.reminder_time || '09:00',
                days: habit.reminder_days || [],
                enabled: habit.is_reminder_on || false
            });
        }
    }, [habit]);

    if (!habit) return <div className="min-h-screen bg-[#09090b] flex items-center justify-center text-zinc-500 font-black uppercase tracking-widest">Initialising Analytics...</div>;

    // --- ANALYTICS LOGIC ---
    const completionDates = completions.map(c => c.completed_at);
    const totalWins = completions.length;
    const daysSinceCreated = differenceInDays(new Date(), new Date(habit.created_at)) + 1;
    const consistencyScore = Math.round((totalWins / daysSinceCreated) * 100) || 0;

    // Streak Logic
    const calculateStreaks = (dates) => {
        if (!dates.length) return { current: 0, highest: 0 };
        const sorted = [...new Set(dates)].sort().reverse();
        let current = 0;
        let highest = 0;
        let temp = 0;

        let checkDate = new Date();
        // Adjust checkDate to today at midnight for comparison
        checkDate.setHours(0, 0, 0, 0);

        // Current Streak
        for (let i = 0; i < sorted.length; i++) {
            const d = parseISO(sorted[i]);
            if (isSameDay(d, checkDate) || isSameDay(d, new Date(checkDate.setDate(checkDate.getDate() - 1)))) {
                current++;
                checkDate = d;
            } else { break; }
        }

        // Highest Streak
        const sortedAsc = [...new Set(dates)].sort();
        for (let i = 0; i < sortedAsc.length; i++) {
            if (i > 0) {
                const prev = parseISO(sortedAsc[i - 1]);
                const curr = parseISO(sortedAsc[i]);
                if (differenceInDays(curr, prev) === 1) {
                    temp++;
                } else { temp = 0; }
            } else { temp = 1; }
            highest = Math.max(highest, temp);
        }
        return { current, highest };
    };

    const { current: currentStreak, highest: highestStreak } = calculateStreaks(completionDates);

    // --- CALENDAR LOGIC ---
    const daysInMonth = eachDayOfInterval({
        start: startOfMonth(currentMonth),
        end: endOfMonth(currentMonth)
    });


    const toggleDay = (dayIndex) => {
        setReminderData(prev => ({
            ...prev,
            days: prev.days.includes(dayIndex)
                ? prev.days.filter(d => d !== dayIndex)
                : [...prev.days, dayIndex]
        }));
    };

    const handleArchive = async () => {
        const { error } = await supabase.from('habits').update({ is_archived: true }).eq('id', id);
        if (!error) {
            showToast("Protocol Archived", "success");
            navigate('/habits');
        } else {
            showToast("Archive operation failed", "error");
        }
    };

    const saveReminderProtocol = async () => {
        // 1. Update Supabase
        const { error } = await supabase.from('habits').update({
            reminder_time: reminderData.time,
            reminder_days: reminderData.days,
            is_reminder_on: reminderData.enabled
        }).eq('id', id);

        if (error) {
            showToast("Sync Failed: Database unreachable", "error");
            return;
        }

        // 2. Clear existing notifications
        await LocalNotifications.cancel({ notifications: [{ id: parseInt(habit.id.slice(0, 8), 16) }] });

        // 3. Schedule new ones if enabled
        if (reminderData.enabled && reminderData.days.length > 0) {
            const [hours, minutes] = reminderData.time.split(':');

            const notifications = reminderData.days.map(day => ({
                title: `Protocol Active: ${habit.name}`,
                body: `It's time to execute your daily win.`,
                id: parseInt(habit.id.slice(0, 4), 16) + day,
                schedule: {
                    on: {
                        weekday: day + 1,
                        hour: parseInt(hours),
                        minute: parseInt(minutes)
                    },
                    repeats: true,
                    allowWhileIdle: true
                },
                extra: { habitId: id }
            }));
            await LocalNotifications.schedule({ notifications });
            showToast("Alert Protocol Scheduled", "success");
        } else if (!reminderData.enabled) {
            showToast("Alert Protocols Deactivated", "warning");
        }

        setIsReminderModalOpen(false);
        fetchHabitData();
    };


    return (
        <div className="min-h-screen bg-[#09090b] text-white p-6 pb-20 selection:bg-red-500/30">
            {/* Header */}
            <div className="max-w-2xl mx-auto">
                <Link to="/habits" className="inline-flex items-center gap-2 text-zinc-600 hover:text-white mb-8 transition-all font-bold text-xs uppercase tracking-widest">
                    <ChevronLeft size={16} /> Back to Protocol
                </Link>

                <div className="flex items-center gap-6 mb-10">
                    <div className="w-20 h-20 bg-white/[0.03] border border-white/5 rounded-[2rem] flex items-center justify-center text-4xl shadow-2xl">
                        {habit.icon}
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tighter italic uppercase">{habit.name}</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
                            <p className="text-zinc-500 text-[10px] font-black tracking-widest uppercase">Live Tracking Enabled</p>
                        </div>
                    </div>
                </div>

                {/* Primary Stats Grid */}
                <div className="grid grid-cols-2 gap-4 mb-10">
                    <div className="bg-white/[0.02] border border-white/5 p-5 rounded-[2rem]">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="p-2 bg-orange-500/10 rounded-lg"><Flame size={16} className="text-orange-500" /></div>
                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Streak</span>
                        </div>
                        <p className="text-3xl font-black italic">{currentStreak}<span className="text-sm ml-1 text-zinc-600 uppercase">Days</span></p>
                    </div>
                    <div className="bg-white/[0.02] border border-white/5 p-5 rounded-[2rem]">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="p-2 bg-red-500/10 rounded-lg"><Target size={16} className="text-red-500" /></div>
                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Consistency</span>
                        </div>
                        <p className="text-3xl font-black italic">{consistencyScore}<span className="text-sm ml-1 text-zinc-600 uppercase">%</span></p>
                    </div>
                </div>

                {/* Reminder Status Card */}
                <div
                    onClick={() => setIsReminderModalOpen(true)}
                    className="bg-white/[0.02] border border-white/5 p-5 rounded-[2rem] mb-10 flex items-center justify-between cursor-pointer hover:bg-white/[0.04] transition-all"
                >
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl ${reminderData.enabled ? 'bg-indigo-500/20 text-indigo-400' : 'bg-zinc-800 text-zinc-500'}`}>
                            {reminderData.enabled ? <Bell size={20} className="animate-pulse" /> : <BellOff size={20} />}
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Notification Protocol</p>
                            <p className="text-sm font-bold uppercase tracking-tight">
                                {reminderData.enabled ? `Active @ ${reminderData.time}` : 'System Offline'}
                            </p>
                        </div>
                    </div>
                    <ChevronRight size={18} className="text-zinc-700" />
                </div>

                {/* Monthly Calendar View */}
                <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-6 mb-10">
                    <div className="flex items-center justify-between mb-8 px-2">
                        <h3 className="font-black italic uppercase tracking-tighter text-lg">{format(currentMonth, 'MMMM yyyy')}</h3>
                        <div className="flex gap-2">
                            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 bg-white/5 rounded-xl hover:bg-white/10 transition"><ChevronLeft size={18} /></button>
                            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 bg-white/5 rounded-xl hover:bg-white/10 transition"><ChevronRight size={18} /></button>
                        </div>
                    </div>

                    <div className="grid grid-cols-7 gap-2">
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
                            <div key={d} className="text-center text-[10px] font-black text-zinc-700 pb-2">{d}</div>
                        ))}
                        {/* Empty slots for start of month */}
                        {[...Array(startOfMonth(currentMonth).getDay())].map((_, i) => (
                            <div key={i} />
                        ))}
                        {daysInMonth.map(day => {
                            const dateStr = format(day, 'yyyy-MM-dd');
                            const isDone = completionDates.includes(dateStr);
                            const isToday = isSameDay(day, new Date());

                            const isCreatedDate = isSameDay(day, new Date(habit.created_at));

                            return (
                                <div key={dateStr} className="aspect-square flex flex-col items-center justify-center relative">
                                    <span className={`text-[10px] font-bold mb-1 ${isToday ? 'text-red-500' :
                                        isCreatedDate ? 'text-blue-400' : 'text-zinc-600'
                                        }`}>
                                        {format(day, 'd')}
                                    </span>

                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${isDone
                                        ? 'bg-green-600 shadow-lg shadow-green-900/40'
                                        : isCreatedDate
                                            ? 'bg-blue-600/20 border border-blue-500/40' // Style for the creation day if not completed
                                            : 'bg-white/[0.03] opacity-20'
                                        }`}>
                                        {isDone ? (
                                            <Zap size={14} className="fill-white text-white" />
                                        ) : isCreatedDate ? (
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" /> // Small pulse for creation point
                                        ) : null}
                                    </div>

                                    {/* Optional: Tiny label for creation date */}
                                    {isCreatedDate && (
                                        <span className="absolute -bottom-2 text-[6px] font-black text-blue-500 uppercase tracking-tighter">
                                            Born
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Deep Metrics Section */}
                <div className="space-y-4 mb-10">
                    <h2 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] ml-4">Advanced Metrics</h2>
                    <MetricRow icon={<Trophy size={16} />} label="All-Time Peak Streak" value={`${highestStreak} Days`} />
                    <MetricRow icon={<Clock size={16} />} label="Protocol Age" value={`${daysSinceCreated} Days`} />
                    <MetricRow icon={<ShieldCheck size={16} />} label="Total Successful Hits" value={`${totalWins} Wins`} />
                </div>

                {/* Footer Actions */}
                <div className="flex flex-col gap-3 mt-10">
                    <button
                        onClick={() => navigate('/habits')}
                        className="w-full bg-white/[0.05] border border-white/10 py-5 rounded-2xl text-zinc-200 font-black text-xs uppercase tracking-[0.2em] hover:bg-white/10 transition-all active:scale-[0.98]"
                    >
                        Return to Protocol List
                    </button>

                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="w-full bg-red-600/10 border border-red-600/20 py-5 rounded-2xl text-red-500 font-black text-xs uppercase tracking-[0.2em] hover:bg-red-600 hover:text-white transition-all active:scale-[0.98] shadow-lg shadow-red-900/10"
                    >
                        Archive Protocol
                    </button>
                </div>
            </div>

            {/* Archive Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-md">
                    <div className="bg-zinc-900 border border-white/5 p-8 rounded-[2.5rem] max-w-sm w-full text-center">
                        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Archive className="text-red-500" size={28} />
                        </div>
                        <h2 className="text-xl font-black italic uppercase mb-2">Archive Habit?</h2>
                        <p className="text-zinc-500 text-sm font-medium mb-8">This will move the protocol to the vault. Progress data will be preserved but hidden from active view.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-white/5 rounded-2xl font-bold text-sm transition active:scale-95">Cancel</button>
                            <button onClick={handleArchive} className="flex-1 py-4 bg-red-600 rounded-2xl font-bold text-sm transition active:scale-95 shadow-lg shadow-red-900/40">Confirm</button>
                        </div>
                    </div>
                </div>
            )}

            {/* REMINDER MODAL */}
            {isReminderModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl">
                    <div className="bg-zinc-900 border border-white/10 p-8 rounded-[2.5rem] w-full max-w-sm">
                        <h2 className="text-xl font-black uppercase italic tracking-tighter mb-6">Reminder Config</h2>

                        {/* ON/OFF TOGGLE */}
                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl mb-6">
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Status</span>
                            <button
                                onClick={() => setReminderData(d => ({ ...d, enabled: !d.enabled }))}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${reminderData.enabled ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-500'}`}
                            >
                                {reminderData.enabled ? 'Enabled' : 'Disabled'}
                            </button>
                        </div>

                        {/* TIME PICKER */}
                        <div className="mb-6">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Sync Time</label>
                            <input
                                type="time"
                                value={reminderData.time}
                                onChange={(e) => setReminderData(d => ({ ...d, time: e.target.value }))}
                                className="w-full bg-black border border-white/5 p-4 rounded-2xl mt-2 text-white font-black outline-none focus:border-indigo-500 transition-colors"
                            />
                        </div>

                        {/* DAY PICKER */}
                        <div className="mb-8">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Repeat Days</label>
                            <div className="flex justify-between mt-3">
                                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                                    <button
                                        key={i}
                                        onClick={() => toggleDay(i)}
                                        className={`w-9 h-9 rounded-xl text-[10px] font-black transition-all border ${reminderData.days.includes(i)
                                            ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-900/40'
                                            : 'bg-black border-white/5 text-zinc-600'
                                            }`}
                                    >
                                        {day}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => setIsReminderModalOpen(false)} className="flex-1 py-4 bg-white/5 rounded-2xl font-bold text-xs uppercase">Cancel</button>
                            <button onClick={saveReminderProtocol} className="flex-1 py-4 bg-indigo-600 rounded-2xl font-bold text-xs uppercase shadow-xl shadow-indigo-900/40">Save</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const MetricRow = ({ icon, label, value }) => (
    <div className="flex items-center justify-between p-5 bg-white/[0.01] border border-white/5 rounded-3xl">
        <div className="flex items-center gap-4">
            <div className="text-zinc-500">{icon}</div>
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{label}</span>
        </div>
        <span className="font-black italic text-sm text-zinc-200">{value}</span>
    </div>
);