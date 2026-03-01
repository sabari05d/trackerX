// src/components/ProtectedRoute.jsx
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function ProtectedRoute({ children, adminOnly = false }) {
    const [loading, setLoading] = useState(true);
    const [userStatus, setUserStatus] = useState(null);

    useEffect(() => {
        const checkUser = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();

                if (!user) {
                    setUserStatus('guest');
                } else {
                    const { data, error } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', user.id)
                        .single();

                    if (error) throw error;
                    setUserStatus(data);
                }
            } catch (error) {
                console.error("Error fetching profile:", error.message);
                setUserStatus('error');
            } finally {
                setLoading(false);
            }
        };
        checkUser();
    }, []);

    if (loading) return <div className="h-screen bg-black flex items-center justify-center text-white">Verifying...</div>;

    // Safe checks to prevent reading properties of null
    if (userStatus === 'guest' || userStatus === 'error' || !userStatus) {
        return <Navigate to="/login" />;
    }

    if (!userStatus.is_verified && !userStatus.is_admin) {
        return (
            <div className="h-screen bg-[#0D1117] flex items-center justify-center p-6 text-center">
                <div className="max-w-md space-y-4 text-white">
                    <h1 className="text-3xl font-bold">Account Pending ⏳</h1>
                    <p className="text-zinc-400">Wait for admin verification.</p>
                    <button onClick={() => supabase.auth.signOut()} className="text-blue-500 underline">Logout</button>
                </div>
            </div>
        );
    }

    if (adminOnly && !userStatus.is_admin) return <Navigate to="/" />;

    return children;
}