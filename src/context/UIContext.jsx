import { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import Toast from '../components/Toast';

const UIContext = createContext();

export const UIProvider = ({ children }) => {
    const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

    // 1. Add Global Toast State
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    // 2. Function to show toast (memoized with useCallback)
    const showToast = useCallback((message, type = 'success') => {
        setToast({ show: true, message, type });
    }, []);

    // 3. Function to hide toast
    const hideToast = useCallback(() => {
        setToast(prev => ({ ...prev, show: false }));
    }, []);

    return (
        <UIContext.Provider value={{
            isHabitModalOpen, setIsHabitModalOpen,
            isTaskModalOpen, setIsTaskModalOpen,
            showToast // 4. Export showToast so components can use it
        }}>
            {children}

            {/* 5. Render Toast at the root level */}
            <AnimatePresence>
                {toast.show && (
                    <Toast
                        message={toast.message}
                        type={toast.type}
                        onClose={hideToast}
                    />
                )}
            </AnimatePresence>
        </UIContext.Provider>
    );
};

export const useUI = () => useContext(UIContext);