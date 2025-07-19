// src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import AgentAuth from './components/AgentAuth';
import UserChat from './components/UserChat';
import AgentChat from './components/AgentChat';
import LandingPage from './components/LandingPage';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <div className="min-h-screen bg-black text-white">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/agent/auth" element={<AgentAuth />} />
              <Route path="/agent/chat" element={<AgentChat />} />
              <Route path="/user/chat" element={<UserChat />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <Toaster 
              position="top-right"
              toastOptions={{
                style: {
                  background: '#1a1a1a',
                  color: '#fff',
                  border: '1px solid #333',
                },
              }}
            />
          </div>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;