import React, { useState } from 'react'; 
import ProjectSidebar from './features/ProjectSidebar/ProjectSidebar';
import Header from './features/header/header'; 
import { ChatWindow } from './features/chat/ChatWindow';
import { GoogleAuth } from './features/auth/GoogleAuth'; 
import { Routes, Route } from 'react-router-dom'
import ProjectPage from './features/ProjectPage/ProjectPage'
import './App.css';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [theme, setTheme] = useState('light');

  const toggleSidebar = () => {
    setIsSidebarOpen( !isSidebarOpen ); 
  };

  const toggleTheme = () => {
    setTheme(currentTheme => (currentTheme === 'light' ? 'dark' : 'light'));
  };

  return (
  <div className={`App-Wrapper ${theme}`}>
      
      <ProjectSidebar 
        isOpen={isSidebarOpen} 
        onToggleClick={toggleSidebar} 
      />

      <main className="Main-Content">
        <Header onThemeToggle={toggleTheme} theme={theme} />
        <div className="App-Container"> 
          <Routes>
            <Route path="/" element={
              <>
                <ChatWindow theme={theme}/>
                <div className="calendar-view-container">
                  <GoogleAuth />
                </div>
              </>
            }/>
            <Route path="/project/:projectId" element={<ProjectPage theme={theme}/>} />
          </Routes>
        </div>
      </main>

    </div>
  );
}


export default App;