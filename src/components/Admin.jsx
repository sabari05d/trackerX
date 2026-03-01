import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Check, X, ShieldAlert, LogOut, LucideArrowLeft, ArrowLeft } from 'lucide-react';
import Navbar from './Navbar';
import { Link, useNavigate } from 'react-router-dom';

export default function Admin() {
    const [users, setUsers] = useState([]);
    const navigate = useNavigate();
    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        const { data } = await supabase.from('profiles').select('*').order('updated_at', { ascending: false });
        setUsers(data || []);
    };

    const toggleVerify = async (userId, currentStatus) => {
        await supabase.from('profiles').update({ is_verified: !currentStatus }).eq('id', userId);
        fetchUsers();
    };

    return (
        <div className="p-8 bg-[#0D1117] min-h-screen text-white">
            <h1 className="text-3xl font-black mb-8 flex items-center gap-3">
                {/* Back Button First for better UX */}
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 -ml-2 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-all"
                    aria-label="Go back"
                >
                    <ArrowLeft size={24} />
                </button>
                <ShieldAlert className="text-red-500" /> Admin Control

            </h1>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-zinc-800/50 text-zinc-500 text-xs uppercase font-bold">
                        <tr>
                            <th className="p-4">User Email</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u.id} className="border-t border-zinc-800">
                                <td className="p-4 font-medium">{u.email}</td>
                                <td className="p-4">
                                    {u.is_verified ?
                                        <span className="text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full text-xs">Verified</span> :
                                        <span className="text-yellow-500 bg-yellow-500/10 px-3 py-1 rounded-full text-xs">Pending</span>
                                    }
                                </td>
                                <td className="p-4 text-right">
                                    <button
                                        onClick={() => toggleVerify(u.id, u.is_verified)}
                                        className={`px-4 py-2 rounded-lg font-bold transition ${u.is_verified ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500 text-white'}`}
                                    >
                                        {u.is_verified ? 'Deactivate' : 'Approve User'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}