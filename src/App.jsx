import React, { useEffect } from 'react'
import './App.css'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { StatusBar, Style } from '@capacitor/status-bar';
import { UIProvider } from './context/UIContext';

import Auth from './components/Auth'
import Register from './components/Register'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout' // New Component

// Views
import Dashboard from './components/Dashboard'
import Admin from './components/Admin'
import HabitView from './components/HabitView'
import Archives from './components/Archives'
import Profile from './components/Profile'
import HabitManager from './components/HabitManager';
import TaskManager from './components/TaskManager';
import { NotificationService } from './services/NotificationService';
import Landing from './components/Landing';


const App = () => {
  useEffect(() => {
    // Keeping your theme consistent for Android status bar
    StatusBar.setBackgroundColor({ color: '#09090b' });
    StatusBar.setOverlaysWebView({ overlay: true });
    StatusBar.setStyle({ style: Style.Dark });

    NotificationService.init();
  }, []);

  return (
    <UIProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Auth />} />
          <Route path="/register" element={<Register />} />

          {/* Wrap all protected routes inside the Layout */}
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/habits" element={<HabitManager />} />
            <Route path="/tasks" element={<TaskManager />} />
            <Route path="/habit/:id" element={<HabitView />} />
            <Route path="/archives" element={<Archives />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/admin" element={<Admin />} />
          </Route>

          <Route path='*' element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </UIProvider>
  )
}

export default App