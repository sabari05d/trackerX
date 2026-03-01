import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) alert(error.message);
        else {
            alert('Check your email for the confirmation link!');
            navigate('/login');
        }
        setLoading(false);
    };

    return (
        <div className="flex h-screen items-center justify-center p-6 bg-[#0D1117]">
            <div className="w-full max-w-md space-y-8 bg-zinc-900/50 p-10 rounded-3xl border border-white/10 backdrop-blur-xl">
                <div className="text-center">
                    <h1 className="text-4xl font-black tracking-tighter text-white">Join TrackerX</h1>
                    <p className="text-zinc-400 mt-2">Start your gamified journey today.</p>
                </div>
                <form onSubmit={handleRegister} className="space-y-4">
                    <input type="email" placeholder="Email" className="w-full p-4 bg-black/40 border border-zinc-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500" onChange={(e) => setEmail(e.target.value)} required />
                    <input type="password" placeholder="Password" className="w-full p-4 bg-black/40 border border-zinc-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500" onChange={(e) => setPassword(e.target.value)} required />
                    <button disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-500 py-4 rounded-xl font-bold text-lg transition-all active:scale-95">
                        {loading ? 'Creating Account...' : 'Create Account'}
                    </button>
                </form>
                <p className="text-center text-zinc-500 text-sm">
                    Already have an account? <Link to="/login" className="text-blue-400 hover:underline">Sign In</Link>
                </p>
            </div>
        </div>
    );
}