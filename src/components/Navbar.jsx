import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, LogOut, User, Archive } from 'lucide-react';

export default function Navbar() {
    const [profile, setProfile] = useState(null);
    const [pendingCount, setPendingCount] = useState(0);
    const [archiveCount, setArchiveCount] = useState(0);
    const navigate = useNavigate();
    const [completions, setCompletions] = useState([]);

    useEffect(() => {
        getProfile();
    }, []);

    const getProfile = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            setProfile(data);

            const { archiveCountD } = await supabase
                .from('habits')
                .select('*', { count: 'exact', head: true })
                .eq('is_archived', true);
            setArchiveCount(archiveCountD || 0);

            const { data: compData } = await supabase.from('completions').select('*');
            setCompletions(compData || []);


            // If admin, check for pending users
            if (data?.is_admin) {
                const { count } = await supabase
                    .from('profiles')
                    .select('*', { count: 'exact', head: true })
                    .eq('is_verified', false);
                setPendingCount(count || 0);
            }
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };


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
        <nav className="border-b border-zinc-800 bg-[#0D1117] p-4">
            <div style={{ paddingTop: 'var(--sat)' }} />
            <div className="max-w-7xl mx-auto flex justify-between items-center">
                <Link to="/" className="text-xl font-black tracking-tighter text-white">TRACKER<span className="text-blue-500">X</span></Link>

                <div className="flex items-center gap-4 md:gap-8">
                    <div className="hidden sm:flex items-center gap-3 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-2xl">
                        <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-black">{level}</div>
                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{rank}</span>
                    </div>

                    <Link to="/profile" className="text-zinc-400 hover:text-white transition">
                        <User size={20} />
                    </Link>
                    {profile?.is_admin && (
                        <Link to="/admin" className="relative flex items-center gap-2 text-zinc-400 hover:text-white transition">
                            <ShieldCheck size={18} />
                            <span className="text-sm font-bold">Admin</span>
                            {pendingCount > 0 && (
                                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                                    {pendingCount}
                                </span>
                            )}
                        </Link>
                    )}
                    <Link to="/archives" className="text-zinc-400 hover:text-white transition flex items-center gap-2">
                        <Archive size={18} />
                        {archiveCount > 0 && <span className="text-xs font-black bg-zinc-800 px-2 py-0.5 rounded-md">{archiveCount}</span>}
                    </Link>
                    <button onClick={handleLogout} className="text-zinc-400 hover:text-red-500 transition">
                        <LogOut size={18} />
                    </button>
                </div>
            </div>
        </nav>
    );
}