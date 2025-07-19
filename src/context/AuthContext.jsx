import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [agent, setAgent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedAgent = localStorage.getItem('agent');
    const savedToken = localStorage.getItem('token');
    
    if (savedAgent && savedToken) {
      setAgent({
        ...JSON.parse(savedAgent),
        token: savedToken
      });
    }
    
    setLoading(false);
  }, []);

  const login = (token, agentData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('agent', JSON.stringify(agentData));
    setAgent({
      ...agentData,
      token
    });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('agent');
    setAgent(null);
  };

  const value = {
    agent,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};