import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { User, Shield, Zap, Award, Save, CheckCircle, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Profile() {
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [profile, setProfile] = useState({ username: '', email: '' });
    const [stats, setStats] = useState({ completions: 0 });
    const [completions, setCompletions] = useState([]);

    useEffect(() => {
        fetchProfileData();
    }, []);

    const fetchProfileData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        const { count } = await supabase.from('completions').select('*', { count: 'exact', head: true });

        const { data: compData } = await supabase.from('completions').select('*');
        setCompletions(compData || []);

        setProfile({ ...profileData, email: user.email });
        setStats({ completions: count || 0 });
        setLoading(false);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setUpdating(true);
        const { error } = await supabase.from('profiles').update({ username: profile.username }).eq('id', profile.id);
        if (!error) alert("Profile Synced to Cloud!");
        setUpdating(false);
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

    if (loading) return <div className="p-20 text-center">Loading Profile...</div>;

    return (
        <div className="min-h-screen bg-[#0D1117] text-white p-6 md:p-12">
            <div style={{ paddingTop: 'var(--sat)' }} />
            <Link to="/" className="flex items-center gap-2 text-zinc-500 hover:text-white mb-8 transition">
                <ChevronLeft size={20} /> Back to Dashboard
            </Link>
            <div className="max-w-3xl mx-auto">
                <h1 className="text-4xl font-black mb-10 flex items-center gap-4">
                    <User className="text-blue-500" size={36} /> Profile
                </h1>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                    {/* RPG Card */}
                    <div className="md:col-span-1 bg-zinc-900 border border-zinc-800 p-8 rounded-[2.5rem] text-center shadow-2xl">
                        <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl shadow-[0_0_30px_rgba(37,99,235,0.3)]">
                            {profile.username?.charAt(0) || 'U'}
                        </div>
                        <h2 className="text-2xl font-black mb-1">{profile.username || 'Anonymous'}</h2>
                        <p className="text-blue-500 text-xs font-black uppercase tracking-widest mb-6">{rank}</p>

                        <div className="space-y-4 text-left">
                            <div className="flex justify-between text-xs">
                                <span className="text-zinc-500 font-bold uppercase">Level</span>
                                <span className="font-black">{level}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-zinc-500 font-bold uppercase">Total XP</span>
                                <span className="font-black">{totalXP}</span>
                            </div>
                        </div>
                    </div>

                    {/* Update Form */}
                    <form onSubmit={handleUpdate} className="md:col-span-2 bg-zinc-900/40 border border-zinc-800 p-8 rounded-[2.5rem] space-y-6">
                        <div>
                            <label className="block text-[10px] font-black text-zinc-500 uppercase mb-2 tracking-widest ml-1 text-white">System Email</label>
                            <input disabled value={profile.email} className="w-full bg-black/50 border border-zinc-800 rounded-xl p-4 text-zinc-500 cursor-not-allowed text-sm" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-zinc-500 uppercase mb-2 tracking-widest ml-1 text-white">Display Name</label>
                            <input
                                required
                                value={profile.username || ''}
                                onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                                placeholder="Enter Username"
                                className="w-full bg-black border border-zinc-800 rounded-xl p-4 text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                            />
                        </div>
                        <button
                            disabled={updating}
                            className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition active:scale-95 shadow-lg shadow-blue-900/20"
                        >
                            {updating ? "Updating..." : <><Save size={18} /> Sync Changes</>}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

// Ensure calculateLevel is exported or shared globally