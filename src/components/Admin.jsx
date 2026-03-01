import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
        <div className="p-4 md:p-8 bg-[#0D1117] min-h-screen text-white pb-24">
            {/* Safe Area Inset for Mobile Devices */}
            <div style={{ paddingTop: 'calc(var(--sat, 0px) + 1rem)' }} />

            <header className="flex items-center gap-3 mb-8">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 -ml-2 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-all"
                    aria-label="Go back"
                >
                    <ArrowLeft size={24} />
                </button>
                <div className="flex items-center gap-3">
                    <ShieldAlert className="text-red-500" size={28} />
                    <h1 className="text-2xl md:text-3xl font-black">Admin Control</h1>
                </div>
            </header>

            {/* Main Content Area */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">

                {/* Desktop View: Table (Hidden on small screens) */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-zinc-800/50 text-zinc-500 text-xs uppercase font-bold">
                            <tr>
                                <th className="p-4">User Email</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {users.map(u => (
                                <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="p-4 font-medium">{u.email}</td>
                                    <td className="p-4">
                                        <StatusBadge isVerified={u.is_verified} />
                                    </td>
                                    <td className="p-4 text-right">
                                        <ActionButton
                                            isVerified={u.is_verified}
                                            onClick={() => toggleVerify(u.id, u.is_verified)}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile View: List Cards (Hidden on desktop) */}
                <div className="md:hidden divide-y divide-zinc-800">
                    {users.map(u => (
                        <div key={u.id} className="p-4 space-y-4">
                            <div className="flex justify-between items-start">
                                <div className="flex flex-col gap-1 max-w-[60%]">
                                    <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Email</span>
                                    <span className="font-medium text-zinc-200 break-all">{u.email}</span>
                                </div>
                                <StatusBadge isVerified={u.is_verified} />
                            </div>
                            <ActionButton
                                isVerified={u.is_verified}
                                onClick={() => toggleVerify(u.id, u.is_verified)}
                                fullWidth
                            />
                        </div>
                    ))}
                </div>

                {users.length === 0 && (
                    <div className="p-12 text-center text-zinc-500 font-medium">
                        No users found in the system.
                    </div>
                )}
            </div>
        </div>
    );
}

/* Reusable Sub-components for cleaner code */

const StatusBadge = ({ isVerified }) => (
    isVerified ?
        <span className="inline-flex items-center text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full text-xs font-bold ring-1 ring-inset ring-emerald-500/20">Verified</span> :
        <span className="inline-flex items-center text-yellow-500 bg-yellow-500/10 px-3 py-1 rounded-full text-xs font-bold ring-1 ring-inset ring-yellow-500/20">Pending</span>
);

const ActionButton = ({ isVerified, onClick, fullWidth }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 ${fullWidth ? 'w-full' : ''} ${isVerified
                ? 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20'
                : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-900/20'
            }`}
    >
        {isVerified ? 'Deactivate' : 'Approve User'}
    </button>
);