import React, { useState, useEffect } from 'react'; 
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { LoginPage } from './features/login-page/login-page';
import ProjectSidebar from './features/ProjectSidebar/ProjectSidebar';
import Header from './features/header/header'; 
import { ChatWindow } from './features/chat/ChatWindow';
import { GoogleAuth } from './features/auth/GoogleAuth'; 
import './App.css';

function DashboardLayout({ onLogout, theme, toggleTheme, user }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  return (
    <div className={`App-Wrapper ${theme}`}>
      <ProjectSidebar 
        isOpen={isSidebarOpen} 
        onToggleClick={() => setIsSidebarOpen(!isSidebarOpen)} 
      />
      <main className="Main-Content">
        <Header onThemeToggle={toggleTheme} theme={theme} onLogout={onLogout} user={user}/>
        <div className="App-Container"> 
          <ChatWindow theme={theme}/>
          <div className="calendar-view-container">
            <GoogleAuth />
          </div>
        </div>
      </main>
    </div>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true); 
  const [theme, setTheme] = useState('light');

  // Verifica sessão ao iniciar o App
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/auth/check'); 
        const data = await res.json();

        console.log("Dados recebidos do backend:", data);

        if (data.authenticated) {
          setIsAuthenticated(true);
          setUser(data.decoded);
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (error) {
        console.error("Erro ao verificar autenticação:", error);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const toggleTheme = () => {
    setTheme(curr => (curr === 'light' ? 'dark' : 'light'));
  };

  const handleLogout = async () => {
    try {
      await fetch('/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error("Erro no logout", error);
    } finally {
      setIsAuthenticated(false);
      setUser(null);
    }
  };

  if (isLoading) {
    return <div style={{height: '100vh', background: '#0D0D0D', color: 'white', display:'flex', justifyContent:'center', alignItems:'center'}}>Carregando SecretarIA...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/login" 
          element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" />} 
        />

        <Route 
          path="/" 
          element={
            isAuthenticated ? (
              <DashboardLayout 
                onLogout={handleLogout} 
                theme={theme} 
                toggleTheme={toggleTheme}
                user={user} 
              />
            ) : (
              <Navigate to="/login" />
            )
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;