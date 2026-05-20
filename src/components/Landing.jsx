import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Smartphone, Zap, Shield, Target, Download, ArrowRight, Activity } from 'lucide-react';
import { supabase } from '../supabaseClient';

const Landing = () => {
    const navigate = useNavigate();

    const [checkingAuth, setCheckingAuth] = useState(true);

    useEffect(() => {
        const checkActiveSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();

            if (session?.user) {
                // User has an active session, redirect to the app core
                navigate('/dashboard', { replace: true });
            } else {
                // No session found, stay on landing page
                setCheckingAuth(false);
            }
        };

        checkActiveSession();
    }, [navigate]);

    // Keep the screen blank or show your themed loading status while validating 
    if (checkingAuth) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#09090b]">
                <motion.div
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="text-zinc-600 font-black tracking-widest uppercase text-xs"
                >
                    Resuming Protocol...
                </motion.div>
            </div>
        );
    }

    return (
        <>
            <div style={{ paddingTop: 'var(--sat)' }} />
            <div className="min-h-screen bg-[#09090b] text-white selection:bg-red-500/30 overflow-x-hidden">
                {/* Background Glows - Shifted to Red/Zinc for TrackerX */}
                <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-600/10 blur-[120px] rounded-full" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-zinc-600/10 blur-[120px] rounded-full" />
                </div>

                {/* Navigation */}
                <nav className="flex justify-between items-center p-6 max-w-7xl mx-auto">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-white text-black rounded-lg flex items-center justify-center font-black text-2xl italic shadow-lg shadow-white/10">X</div>
                        <span className="font-black tracking-[0.2em] text-xl uppercase italic">Tracker<span className="text-red-600">X</span></span>
                    </div>
                    <button
                        onClick={() => navigate('/login')}
                        className="text-xs font-black uppercase tracking-widest bg-white/5 hover:bg-white/10 px-6 py-3 rounded-full transition-all border border-white/10"
                    >
                        System Login
                    </button>
                </nav>

                {/* Hero Section */}
                <section className="max-w-7xl mx-auto px-6 pt-24 pb-32 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <span className="inline-block px-4 py-1.5 mb-6 text-[10px] font-black tracking-[0.3em] uppercase bg-red-600/10 text-red-500 rounded-md border border-red-500/20">
                            Operational Excellence v1.0
                        </span>
                        <h1 className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter leading-[0.85] mb-8 italic">
                            TRACK <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-700">EVERYTHING.</span>
                        </h1>
                        <p className="max-w-xl mx-auto text-zinc-500 text-lg md:text-xl mb-12 font-medium">
                            The elite protocol manager for developers. Habits, Tasks, and Life-Metrics optimized through a high-performance interface.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <button
                                onClick={() => navigate('/register')}
                                className="w-full sm:w-auto px-10 py-5 bg-white text-black hover:bg-zinc-200 rounded-full font-black text-lg flex items-center justify-center gap-2 transition-all active:scale-95"
                            >
                                Start Protocol <ArrowRight size={20} />
                            </button>

                            <a
                                href="/TrackerX.apk"
                                download
                                className="w-full sm:w-auto px-10 py-5 bg-transparent hover:bg-white/5 text-white rounded-full font-black text-lg flex items-center justify-center gap-2 transition-all border-2 border-white/10 active:scale-95"
                            >
                                <Download size={20} /> Get Android APK
                            </a>
                        </div>
                    </motion.div>
                </section>

                {/* Features Grid */}
                <section className="max-w-7xl mx-auto px-6 py-20 border-t border-white/5">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        <FeatureCard
                            icon={<Activity className="text-red-500" />}
                            title="X-Metrics"
                            desc="Visualize your growth with data-driven habit tracking and completion velocity."
                        />
                        <FeatureCard
                            icon={<Target className="text-white" />}
                            title="Direct Action"
                            desc="Eliminate friction with a task management system designed for pure execution."
                        />
                        <FeatureCard
                            icon={<Smartphone className="text-zinc-400" />}
                            title="Native Power"
                            desc="Optimized for Android with local notifications and offline-first reliability."
                        />
                    </div>
                </section>

                {/* Footer */}
                <footer className="p-12 text-center text-zinc-700 border-t border-white/5">
                    <p className="text-[10px] font-black uppercase tracking-[0.5em]">TrackerX // All Rights Reserved 2026</p>
                </footer>
            </div>
            <div style={{ paddingBottom: 'var(--sab)' }} />
        </>
    );
};

const FeatureCard = ({ icon, title, desc }) => (
    <div className="group">
        <div className="w-14 h-14 rounded-xl bg-white/5 flex items-center justify-center mb-6 group-hover:bg-red-600/20 group-hover:scale-110 transition-all duration-500">
            {icon}
        </div>
        <h3 className="text-xl font-black mb-3 italic uppercase tracking-tight">{title}</h3>
        <p className="text-zinc-500 leading-relaxed font-medium">{desc}</p>
    </div>
);

export default Landing;