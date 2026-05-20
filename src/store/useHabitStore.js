import { create } from 'zustand';
import { supabase } from '../supabaseClient';

const useHabitStore = create((set, get) => ({
    habits: [],
    completions: [],
    loading: false,

    fetchData: async () => {
        set({ loading: true });
        const { data: { user } } = await supabase.auth.getUser();

        const { data: habitsData } = await supabase
            .from('habits')
            .select('*')
            .eq('is_archived', false)
            .order('created_at', { ascending: true });

        const { data: compData } = await supabase.from('completions').select('*');

        set({ habits: habitsData || [], completions: compData || [], loading: false });
    },

    toggleHabit: async (habitId, date) => {
        const { completions, fetchData } = get();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return;

        const existing = completions.find(c => c.habit_id === habitId && c.completed_at === date);

        if (existing) {
            // Optimistic Update: Remove from UI immediately
            set({ completions: completions.filter(c => c.id !== existing.id) });

            const { error } = await supabase.from('completions').delete().eq('id', existing.id);
            if (error) {
                console.error("Delete error:", error);
                fetchData(); // Rollback on error
            }
        } else {
            // Prepare the new completion object
            const newCompletion = {
                habit_id: habitId,
                completed_at: date,
                user_id: user.id
            };

            const { data, error } = await supabase.from('completions')
                .insert([newCompletion])
                .select()
                .single();

            if (error) {
                console.error("Insert error:", error);
            } else {
                // Update UI with the real data from DB
                set({ completions: [...completions, data] });
            }
        }
    },

    // GLOBAL HARD PROGRESSION LOGIC
    getStats: () => {
        const { completions } = get();
        const XP_PER_COMPLETION = 5; // Reduced from 10
        const totalXP = completions.length * XP_PER_COMPLETION;

        // Formula: Level = floor(sqrt(totalXP / 100)) + 1
        // Level 2 needs 100XP (20 completions)
        // Level 3 needs 400XP (80 completions)
        const level = Math.floor(Math.sqrt(totalXP / 100)) + 1;

        const currentLevelXP = 100 * Math.pow(level - 1, 2);
        const nextLevelXP = 100 * Math.pow(level, 2);
        const xpInCurrentLevel = totalXP - currentLevelXP;
        const xpRequiredForNext = nextLevelXP - currentLevelXP;
        const progressToNext = Math.min(Math.round((xpInCurrentLevel / xpRequiredForNext) * 100), 100);

        const ranks = ["Novice", "Grinder", "Disciplined", "Warrior", "Elite", "Master", "Legend"];
        const rank = ranks[Math.min(Math.floor(level / 4), ranks.length - 1)];

        return { level, totalXP, progressToNext, rank };
    },

    // Add
    addHabit: async (habit) => {
        const { data: { user } } = await supabase.auth.getUser();
        const { data, error } = await supabase.from('habits')
            .insert([{ ...habit, user_id: user.id }])
            .select()
            .single();
        if (!error) {
            set((state) => ({ habits: [...state.habits, data] }));
            return true;
        }
        return false;
    },

    // Archive
    archiveHabit: async (id) => {
        const { error } = await supabase.from('habits').update({ is_archived: true }).eq('id', id);
        if (!error) {
            set((state) => ({ habits: state.habits.filter(h => h.id !== id) }));
        }
    },

}));

export default useHabitStore;