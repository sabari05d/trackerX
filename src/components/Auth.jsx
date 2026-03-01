import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Link, useNavigate } from 'react-router-dom';

export default function Auth() {
    const [loading, setLoading] = useState(false);
    const [email, setStepEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            alert(error.message);
        } else {
            navigate('/'); // Redirect to dashboard on success
        }
        setLoading(false);
    };

    return (
        <div className="flex h-screen items-center justify-center p-6">
            <div className="w-full max-w-md space-y-8 bg-zinc-900/50 p-10 rounded-3xl border border-white/10 backdrop-blur-xl">
                <div className="text-center">
                    <h1 className="text-4xl font-black tracking-tighter text-white">TrackerX</h1>
                    <p className="text-zinc-400 mt-2">Level up your daily habits.</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    <input
                        type="email"
                        placeholder="Email"
                        className="w-full p-4 bg-black/40 border border-zinc-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                        onChange={(e) => setStepEmail(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        className="w-full p-4 bg-black/40 border border-zinc-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <button
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-xl font-bold text-lg transition-all active:scale-95 disabled:opacity-50"
                    >
                        {loading ? 'Authenticating...' : 'Sign In'}
                    </button>
                </form>

                <p className="text-center text-zinc-500 text-sm">
                    Don't have an account? <Link to="/register" className="text-blue-400 hover:underline">Sign Up</Link>
                </p>
            </div>
        </div>
    );
}