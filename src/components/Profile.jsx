import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { User, Save, Camera, ShieldCheck, Zap, Award, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Toast from './Toast';
import { useUI } from '../context/UIContext';

export default function Profile() {
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [profile, setProfile] = useState({ username: '', email: '', avatar_url: '' });
    const [completions, setCompletions] = useState([]);
    const navigate = useNavigate();

    const [isResetModalOpen, setIsResetModalOpen] = useState(false);
    const [passwords, setPasswords] = useState({ newPassword: '', confirmPassword: '' });
    const [resetting, setResetting] = useState(false);

    // Helper to trigger toast
    const { showToast } = useUI();

    useEffect(() => {
        fetchProfileData();
    }, []);

    const fetchProfileData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        const { data: compData } = await supabase.from('completions').select('*');

        setCompletions(compData || []);
        setProfile({ ...profileData, email: user.email });
        setLoading(false);
    };

    const uploadAvatar = async (event) => {
        try {
            setUpdating(true);
            const file = event.target.files[0];

            // Basic validation for file selection
            if (!file) return;

            const fileExt = file.name.split('.').pop();
            const fileName = `${profile.id}-${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            // Upload to Supabase Storage
            let { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // Get Public URL
            const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
            const publicUrl = data.publicUrl;

            // Update Profile Table
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ avatar_url: publicUrl })
                .eq('id', profile.id);

            if (updateError) throw updateError;

            setProfile({ ...profile, avatar_url: publicUrl });
            showToast("Identity Image Updated", "success");

        } catch (error) {
            showToast("Upload Failed: Check connection", "error");
        } finally {
            setUpdating(false);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();

        if (!profile.username.trim()) {
            showToast("Username cannot be empty", "warning");
            return;
        }

        setUpdating(true);
        const { error } = await supabase
            .from('profiles')
            .update({ username: profile.username })
            .eq('id', profile.id);

        if (!error) {
            showToast("Profile Synced to Cloud", "success");
        } else {
            showToast("Sync Error: Profile not updated", "error");
        }
        setUpdating(false);
    };

    const calculateLevel = (totalCompletions) => {
        const XP_PER_COMPLETION = 10;
        const totalXP = totalCompletions * XP_PER_COMPLETION;
        const level = Math.floor(Math.sqrt(totalXP / 50)) + 1;
        const ranks = ["Novice", "Grinder", "Disciplined", "Warrior", "Elite", "Master", "Legend"];
        const rank = ranks[Math.min(Math.floor(level / 5), ranks.length - 1)];

        // Progress bar calculation
        const currentLevelXP = 50 * Math.pow(level - 1, 2);
        const nextLevelXP = 50 * Math.pow(level, 2);
        const progress = Math.min(Math.round(((totalXP - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100), 100);

        return { level, totalXP, rank, progress };
    };

    const { level, totalXP, rank, progress } = calculateLevel(completions.length);

    const handlePasswordReset = async (e) => {
        e.preventDefault();
        if (passwords.newPassword !== passwords.confirmPassword) {
            showToast("Passwords do not match!", "warning");
            return;
        }

        setResetting(true);
        const { error } = await supabase.auth.updateUser({
            password: passwords.newPassword
        });

        if (error) {
            showToast(error.message, "error");
        } else {
            showToast("Password updated successfully!", "success");
            setIsResetModalOpen(false);
            setPasswords({ newPassword: '', confirmPassword: '' });
        }
        setResetting(false);
    };

    if (loading) return (
        <div className="h-screen bg-[#09090b] flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#09090b] text-white p-6 md:p-12 pb-32">
            <div className="max-w-4xl mx-auto">

                {/* <Link to="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-white mb-10 transition font-bold text-xs uppercase tracking-widest">
                    <ChevronLeft size={16} /> Exit to Hub
                </Link> */}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* LEFT COLUMN: IDENTITY CARD */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-white/[0.02] border border-white/5 p-8 rounded-[3rem] text-center relative overflow-hidden">
                            {/* Avatar Section */}
                            <div className="relative w-32 h-32 mx-auto mb-6 group">
                                <div className="w-full h-full bg-zinc-900 rounded-[100%] overflow-hidden border-2 border-indigo-500/20 flex items-center justify-center">
                                    {profile.avatar_url ? (
                                        <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-4xl font-black text-zinc-700">{profile.username?.charAt(0)}</span>
                                    )}
                                </div>
                                <label className="absolute bottom-0 right-0 p-2 bg-indigo-600 rounded-xl cursor-pointer hover:bg-indigo-500 transition-all shadow-xl group-hover:scale-110">
                                    <Camera size={16} />
                                    <input type="file" accept="image/*" onChange={uploadAvatar} className="hidden" disabled={updating} />
                                </label>
                            </div>

                            <h2 className="text-2xl font-black tracking-tighter">{profile.username || 'Agent'}</h2>
                            <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em] mt-1">{rank}</p>

                            <div className="mt-8 pt-8 border-t border-white/5 space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-zinc-500 uppercase">System Rank</span>
                                    <span className="text-sm font-black">LVL {level}</span>
                                </div>
                                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                                    <div className="bg-indigo-500 h-full transition-all duration-1000" style={{ width: `${progress}%` }} />
                                </div>
                                <p className="text-[9px] text-zinc-600 font-bold uppercase text-right">{progress}% to Next Level</p>
                            </div>
                        </div>

                        {/* STATS MINI-GRID */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/[0.02] border border-white/5 p-5 rounded-[2rem]">
                                <Zap size={16} className="text-yellow-500 mb-2" />
                                <div className="text-xl font-black">{totalXP}</div>
                                <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Total XP</div>
                            </div>
                            <div className="bg-white/[0.02] border border-white/5 p-5 rounded-[2rem]">
                                <Award size={16} className="text-indigo-500 mb-2" />
                                <div className="text-xl font-black">{completions.length}</div>
                                <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Rituals</div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: CORE SETTINGS */}
                    <div className="lg:col-span-8 space-y-6">
                        <form onSubmit={handleUpdate} className="bg-white/[0.02] border border-white/5 p-10 rounded-[3rem] space-y-8">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-500">
                                    <User size={20} />
                                </div>
                                <div>
                                    <h3 className="font-black text-lg">System Identity</h3>
                                    <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Update your display parameters</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Access Email</label>
                                    <input disabled value={profile.email} className="w-full bg-black border border-white/5 rounded-2xl p-4 text-zinc-600 cursor-not-allowed text-sm font-bold" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Callsign</label>
                                    <input
                                        required
                                        value={profile.username || ''}
                                        onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                                        className="w-full bg-black border border-white/5 rounded-2xl p-4 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition font-bold"
                                        placeholder="Username"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex flex-col sm:flex-row gap-4">
                                <button
                                    type="submit"
                                    disabled={updating}
                                    className="flex-1 bg-white text-black py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50"
                                >
                                    <Save size={18} /> SYNC IDENTITY
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setIsResetModalOpen(true)}
                                    className="flex-1 bg-white/5 border border-white/10 text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition active:scale-95"
                                >
                                    <ShieldCheck size={18} /> RESET PASSWORD
                                </button>

                                <button
                                    type="button"
                                    onClick={() => supabase.auth.signOut()}
                                    className="px-8 py-4 rounded-2xl bg-red-500/10 text-red-500 border border-red-500/20 font-black text-sm flex items-center justify-center gap-2 hover:bg-red-500 hover:text-white transition"
                                >
                                    <LogOut size={18} /> LOGOUT
                                </button>
                            </div>
                        </form>

                        {/* STATUS CARD */}
                        <div className="bg-indigo-600 p-8 rounded-[3rem] flex items-center justify-between shadow-xl shadow-indigo-900/20">
                            <div className="flex items-center gap-5">
                                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                                    <ShieldCheck className="text-white" />
                                </div>
                                <div>
                                    <h4 className="font-black text-white">System Verified</h4>
                                    <p className="text-indigo-200 text-[10px] font-bold uppercase tracking-widest">End-to-End Encryption Active</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* RESET PASSWORD MODAL */}
            <AnimatePresence>
                {isResetModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setIsResetModalOpen(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-[#161618] border border-white/10 p-8 rounded-[2.5rem] w-full max-w-md relative z-10"
                        >
                            <h3 className="text-xl font-black mb-2">Secure Update</h3>
                            <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mb-8">Change your access credentials</p>

                            <form onSubmit={handlePasswordReset} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">New Password</label>
                                    <input
                                        type="password"
                                        required
                                        value={passwords.newPassword}
                                        onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                                        className="w-full bg-black border border-white/5 rounded-2xl p-4 text-white outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Confirm Password</label>
                                    <input
                                        type="password"
                                        required
                                        value={passwords.confirmPassword}
                                        onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                                        className="w-full bg-black border border-white/5 rounded-2xl p-4 text-white outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                                    />
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsResetModalOpen(false)}
                                        className="flex-1 px-6 py-4 rounded-2xl bg-white/5 font-black text-xs uppercase"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={resetting}
                                        className="flex-1 px-6 py-4 rounded-2xl bg-indigo-600 font-black text-xs uppercase disabled:opacity-50"
                                    >
                                        {resetting ? 'Updating...' : 'Update'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

