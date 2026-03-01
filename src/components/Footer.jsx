import { Smartphone, Download, Github, Globe } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="max-w-7xl mx-auto px-6 pb-12 mt-20">
            <div className="bg-zinc-900/30 border border-zinc-800 p-8 rounded-[2.5rem] backdrop-blur-md flex flex-col md:flex-row justify-between items-center gap-6">

                {/* App Info */}
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center">
                        <Smartphone className="text-blue-500" size={24} />
                    </div>
                    <div>
                        <h3 className="text-white font-black text-sm uppercase tracking-widest">TrackerX for Android</h3>
                        <p className="text-zinc-500 text-xs font-bold">Version 1.0.0 • Build 2026</p>
                    </div>
                </div>

                {/* Download Link */}
                <div className="flex flex-wrap justify-center gap-4">
                    <a
                        href="/TrackerX.apk"
                        download
                        className="flex items-center gap-3 bg-white text-black px-6 py-3 rounded-xl font-black text-xs hover:bg-blue-500 hover:text-white transition-all active:scale-95 shadow-lg"
                    >
                        <Download size={16} /> DOWNLOAD APK
                    </a>

                    <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-zinc-800/50 border border-zinc-700/50 text-zinc-400 text-[10px] font-black uppercase tracking-tighter">
                        <Globe size={14} /> WEB STABLE
                    </div>
                </div>
            </div>

            <div className="mt-8 text-center">
                <p className="text-zinc-700 text-[10px] font-black uppercase tracking-[0.5em]">
                    Designed for the Grind • 2026
                </p>
            </div>
        </footer>
    );
}