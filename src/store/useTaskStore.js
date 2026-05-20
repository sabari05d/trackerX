import { create } from 'zustand';
import { supabase } from '../supabaseClient';

const useTaskStore = create((set, get) => ({
    tasks: [],
    loading: false,

    fetchTasks: async () => {
        set({ loading: true });
        const { data } = await supabase
            .from('tasks')
            .select('*')
            .eq('is_archived', false)
            .order('created_at', { ascending: false });
        set({ tasks: data || [], loading: false });
    },

    addTask: async (task) => {
        const { data: { user } } = await supabase.auth.getUser();
        const { data, error } = await supabase
            .from('tasks')
            .insert([{ ...task, user_id: user.id }])
            .select()
            .single();

        if (!error) {
            set((state) => ({ tasks: [data, ...state.tasks] }));
            return { success: true };
        }
        return { success: false, error: error.message };
    },

    updateTaskStatus: async (id, status) => {
        const cleanStatus = status.toLowerCase();
        const { error } = await supabase
            .from('tasks')
            .update({ status: cleanStatus })
            .eq('id', id);

        if (error) return { success: false, error: error.message };

        set((state) => ({
            tasks: state.tasks.map(t => t.id === id ? { ...t, status: cleanStatus } : t)
        }));
        return { success: true };
    },

    archiveTask: async (id) => {
        const { error } = await supabase.from('tasks').update({ is_archived: true }).eq('id', id);
        if (!error) {
            set((state) => ({ tasks: state.tasks.filter(t => t.id !== id) }));
            return { success: true };
        }
        return { success: false, error: error.message };
    }
}));

export default useTaskStore;