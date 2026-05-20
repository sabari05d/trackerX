import { ShieldCheck, X, Zap } from "lucide-react";
import { useEffect } from "react";
import { AnimatePresence, motion } from 'framer-motion';

const Toast = ({ message, type, onClose }) => {
    const config = {
        success: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-500', icon: <ShieldCheck size={18} /> },
        warning: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-500', icon: <Zap size={18} /> },
        error: { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-500', icon: <X size={18} /> }
    };

    const style = config[type] || config.success;

    useEffect(() => {
        const timer = setTimeout(onClose, 2000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`fixed top-10 right-5 -translate-x-1/2 z-[200] flex items-center gap-3 px-6 py-4 rounded-2xl border ${style.bg} ${style.border} ${style.text} backdrop-blur-xl shadow-2xl min-w-[280px]`}
        >
            {style.icon}
            <span className="text-xs font-black uppercase tracking-widest">{message}</span>
        </motion.div>
    );
};
export default Toast;