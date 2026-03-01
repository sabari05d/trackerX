import React, { useEffect } from 'react'
import './App.css'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { StatusBar, Style } from '@capacitor/status-bar';
import Auth from './components/Auth'
import Dashboard from './components/Dashboard'
import Register from './components/Register'
import ProtectedRoute from './components/ProtectedRoute'
import Admin from './components/Admin'
import HabitView from './components/HabitView'
import Archives from './components/Archives'
import Profile from './components/Profile'

const App = () => {
  useEffect(() => {
    StatusBar.setBackgroundColor({ color: '#0D1117' });
    StatusBar.setStyle({ style: Style.Dark });
  }, []);
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Auth />} />
          <Route path="/register" element={<Register />} />

          {/* User Dashboard - Requires Verification */}
          <Route path="/" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />

          {/* Admin Only Route */}
          <Route path="/admin" element={
            <ProtectedRoute adminOnly={true}>
              <Admin />
            </ProtectedRoute>
          } />

          <Route path="/habit/:id" element={<ProtectedRoute><HabitView /></ProtectedRoute>} />
          <Route path="/archives" element={<ProtectedRoute><Archives /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          {/* Default redirect to dashboard or login */}
          <Route path='*' element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
