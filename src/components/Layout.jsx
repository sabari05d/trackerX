import { useEffect, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutGrid, Archive, User, ShieldCheck, LogOut, CircleCheckBig, Menu, X, ListTodo, Plus, Bell, CheckCircle2 } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { useUI } from '../context/UIContext';
import { LocalNotifications } from '@capacitor/local-notifications';

export default function Layout() {
    const location = useLocation();
    const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState({ username: '', email: '', avatar_url: '', is_admin: false });

    const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
    const { setIsHabitModalOpen, setIsTaskModalOpen } = useUI();
    const navigate = useNavigate();

    const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
    const [scheduledNotifs, setScheduledNotifs] = useState([]);

    // Function to fetch what's actually scheduled in the phone
    const checkScheduled = async () => {
        const pending = await LocalNotifications.getPending();

        // Group or filter by unique title so duplicates don't stack up
        const uniqueNotifications = [];
        const seenTitles = new Set();

        if (pending?.notifications) {
            for (const notif of pending.notifications) {
                if (!seenTitles.has(notif.title)) {
                    seenTitles.add(notif.title);
                    uniqueNotifications.push(notif);
                }
            }
        }

        setScheduledNotifs(uniqueNotifications);
        setIsNotifModalOpen(true);
    };

    const handleSelectOption = (type) => {
        setIsPlusMenuOpen(false); // Close the choice menu
        if (type === 'habit') {
            navigate('/habits'); // Go to page
            setTimeout(() => setIsHabitModalOpen(true), 100); // Small delay to let page load
        }
        if (type === 'task') {
            navigate('/tasks'); // Go to page
            setTimeout(() => setIsTaskModalOpen(true), 100); // Small delay to let page load
        }
    };

    const handlePlusClick = () => {
        // Smart Logic: Open Task modal if on Tasks page, else Habit modal
        if (location.pathname === '/tasks') {
            setIsTaskModalOpen(true);
        } else {
            setIsHabitModalOpen(true);
        }
    };

    useEffect(() => {
        fetchProfileData();
    }, []);

    const fetchProfileData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            setProfile({ ...profileData, email: user.email });
        }
        setLoading(false);
    };

    const navItems = [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutGrid },
        { name: 'Habits', path: '/habits', icon: CircleCheckBig },
        { name: 'Tasks', path: '/tasks', icon: ListTodo },
        { name: 'Archives', path: '/archives', icon: Archive },
        { name: 'Profile', path: '/profile', icon: User },
        ...(profile.is_admin ? [{ name: 'Admin', path: '/admin', icon: ShieldCheck }] : []),
    ];

    const isActive = (path) => location.pathname === path;

    const handleLogout = () => {
        supabase.auth.signOut();
        navigate('/login');
    }


    return (
        <>
            <div className="flex h-screen bg-[#09090b] text-white overflow-hidden font-sans" style={{
                paddingTop: 'var(--sat)',
                paddingBottom: 'var(--sab)',
                height: '100dvh' // Use dynamic viewport height
            }}>

                {/* 1. DESKTOP SIDEBAR */}
                <aside className="hidden md:flex flex-col w-72 border-r border-white/5 bg-[#09090b] p-8">
                    <div className="mb-12">
                        <h1 className="text-2xl font-black tracking-tighter italic">TRACKER<span className="text-blue-500 text-3xl">X</span></h1>
                    </div>

                    <nav className="flex-1 space-y-3">
                        {navItems.map((item) => (
                            <Link
                                key={item.name}
                                to={item.path}
                                className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 ${isActive(item.path)
                                    ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20 scale-[1.02]'
                                    : 'text-zinc-500 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <item.icon size={22} strokeWidth={isActive(item.path) ? 2.5 : 2} />
                                <span className="font-bold tracking-tight">{item.name}</span>
                            </Link>
                        ))}
                    </nav>

                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-4 px-5 py-4 rounded-2xl text-zinc-500 hover:text-red-500 hover:bg-red-500/10 transition-all mt-auto"
                    >
                        <LogOut size={22} />
                        <span className="font-bold">Sign Out</span>
                    </button>
                </aside>

                {/* 2. MOBILE SIDEBAR (DRAWER) */}
                <AnimatePresence>
                    {isSideMenuOpen && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                onClick={() => setIsSideMenuOpen(false)}
                                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] md:hidden"
                            />
                            <motion.div
                                initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
                                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                style={{ paddingTop: 'calc(var(--sat) + 2rem)' }}
                                className="fixed top-0 left-0 bottom-0 w-[80%] bg-[#0d0d0f] z-[70] p-8 pt-[18] md:hidden border-r border-white/5"
                            >
                                <div className="flex justify-between items-center mb-12">
                                    <h1 className="text-xl font-black italic">TRACKER<span className="text-blue-500 text-2xl">X</span></h1>
                                    <button onClick={() => setIsSideMenuOpen(false)} className="p-2 bg-white/5 rounded-xl"><X size={20} /></button>
                                </div>
                                <nav className="space-y-4">
                                    {navItems.map((item) => (
                                        <Link
                                            key={item.name} to={item.path}
                                            onClick={() => setIsSideMenuOpen(false)}
                                            className={`flex items-center gap-4 p-4 rounded-2xl ${isActive(item.path) ? 'bg-blue-600 text-white' : 'text-zinc-400'}`}
                                        >
                                            <item.icon size={22} />
                                            <span className="font-bold">{item.name}</span>
                                        </Link>
                                    ))}
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center gap-4 p-4 rounded-2xl text-zinc-500 w-full"
                                    >
                                        <LogOut size={22} />
                                        <span className="font-bold">Sign Out</span>
                                    </button>
                                </nav>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

                {/* 3. MAIN CONTENT */}
                <main className="flex-1 overflow-y-auto relative bg-[#09090b]">
                    {/* Mobile Header */}
                    <div className="md:hidden flex justify-between items-center p-6 sticky top-0 bg-[#09090b]/80 backdrop-blur-md z-40">
                        <button onClick={() => setIsSideMenuOpen(true)} className="p-3 bg-zinc-900 rounded-2xl border border-white/5">
                            <Menu size={20} />
                        </button>
                        <span className="font-black italic tracking-tighter uppercase text-xs">
                            {navItems.find(i => isActive(i.path))?.name || "TrackerX"}
                        </span>
                        <button
                            onClick={checkScheduled}
                            className="p-3 bg-zinc-900 rounded-2xl border border-white/5 relative"
                        >
                            <Bell size={20} />
                            {scheduledNotifs.length > 0 && (
                                <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full" />
                            )}
                        </button>
                    </div>

                    <div className="max-w-5xl mx-auto px-6 pb-32 md:pb-12 md:pt-12">
                        <Outlet />
                    </div>
                </main>

                <AnimatePresence>
                    {isNotifModalOpen && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsNotifModalOpen(false)}
                                className="absolute inset-0 bg-black/90 backdrop-blur-md"
                            />
                            <motion.div
                                initial={{ scale: 0.9, y: 20 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.9, y: 20 }}
                                className="bg-[#161618] border border-white/10 p-8 rounded-[2.5rem] w-full max-w-sm relative z-10 flex flex-col max-h-[85vh]"
                            >
                                {/* Header Block */}
                                <div className="flex items-center gap-4 mb-6 shrink-0">
                                    <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500">
                                        <Bell size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-lg">Active Alerts</h3>
                                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">System Reminders</p>
                                    </div>
                                </div>

                                {/* --- SCROLLABLE CONTAINER AREA --- */}
                                <div className="space-y-3 mb-8 overflow-y-auto pr-1 max-h-[280px] custom-scrollbar">
                                    {scheduledNotifs.length > 0 ? (
                                        scheduledNotifs.map(n => {
                                            // Safely handle display times if format varies slightly
                                            const hour = String(n.schedule?.on?.hour || '00').padStart(2, '0');
                                            const minute = String(n.schedule?.on?.minute || '00').padStart(2, '0');

                                            return (
                                                <div key={n.id} className="p-4 bg-white/5 rounded-2xl border border-white/5 transition-all hover:bg-white/[0.07]">
                                                    <p className="font-bold text-sm text-zinc-200 tracking-tight uppercase">{n.title}</p>
                                                    <p className="text-[10px] font-black text-indigo-400 mt-1 uppercase tracking-wider">
                                                        Active Sync Target Time • {hour}:{minute}
                                                    </p>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <p className="text-center py-12 text-zinc-600 text-xs font-black uppercase tracking-wider">
                                            No active protocol reminders.
                                        </p>
                                    )}
                                </div>

                                {/* Action Controls */}
                                <button
                                    onClick={() => setIsNotifModalOpen(false)}
                                    className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 active:scale-98 transition-all rounded-2xl font-black text-xs uppercase tracking-widest text-zinc-200 shrink-0"
                                >
                                    Dismiss
                                </button>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* 4. CHOICE OVERLAY (Speed Dial) */}
                <AnimatePresence>
                    {isPlusMenuOpen && (
                        <>
                            {/* Dim Backdrop */}
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                onClick={() => setIsPlusMenuOpen(false)}
                                className="fixed inset-0 bg-black/80 backdrop-blur-md z-[55]"
                            />

                            {/* Options Menu */}
                            <motion.div
                                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 20, scale: 0.9 }}
                                className="fixed bottom-32 left-0 right-0 flex justify-center gap-6 z-[60] px-6"
                            >
                                <button
                                    onClick={() => handleSelectOption('habit')}
                                    className="flex flex-col items-center gap-3 group"
                                >
                                    <div className="w-16 h-16 bg-zinc-900 border border-white/10 rounded-3xl flex items-center justify-center text-blue-500 group-active:scale-90 transition-transform shadow-2xl">
                                        <CheckCircle2 size={28} />
                                    </div>
                                    <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Habit</span>
                                </button>

                                <button
                                    onClick={() => handleSelectOption('task')}
                                    className="flex flex-col items-center gap-3 group"
                                >
                                    <div className="w-16 h-16 bg-zinc-900 border border-white/10 rounded-3xl flex items-center justify-center text-emerald-500 group-active:scale-90 transition-transform shadow-2xl">
                                        <ListTodo size={28} />
                                    </div>
                                    <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Task</span>
                                </button>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

                {/* 5. MOBILE BOTTOM BAR */}
                <nav className="md:hidden fixed bottom-6 left-6 right-6 h-20 bg-[#161618]/90 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] flex justify-between items-center px-8 z-50 shadow-2xl"
                    style={{ bottom: 'calc(var(--sab) + 1.5rem)' }}>
                    <Link to="/dashboard" className={`p-2 transition-all ${isActive('/') ? 'text-blue-500 scale-110' : 'text-zinc-500'}`}>
                        <LayoutGrid size={26} strokeWidth={isActive('/') ? 2.5 : 2} />
                    </Link>

                    {/* Central Action Button */}
                    <button
                        onClick={() => {
                            if (location.pathname === '/tasks' || location.pathname === '/habits') {
                                handlePlusClick();
                            } else {
                                setIsPlusMenuOpen(!isPlusMenuOpen);
                            }
                        }}
                        className={`p-4 rounded-full -mt-14 border-[6px] border-[#09090b] shadow-xl transition-all duration-300 active:scale-90 ${isPlusMenuOpen ? 'bg-zinc-800 rotate-45 border-zinc-900' : 'bg-blue-600 shadow-blue-600/40'
                            }`}
                    >
                        <Plus size={28} color="white" strokeWidth={3} />
                    </button>

                    <Link to="/profile" className={`relative p-1 rounded-3xl transition-all ${isActive('/profile') ? 'ring-2 ring-blue-500 scale-110' : 'opacity-70'}`}>
                        {profile.avatar_url ? (
                            <div className="w-8 h-8 rounded-xl overflow-hidden border border-white/10">
                                <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                            </div>
                        ) : (
                            <User size={26} strokeWidth={isActive('/profile') ? 2.5 : 2} className="text-zinc-500" />
                        )}
                    </Link>
                </nav>
            </div>
        </>
    );
}