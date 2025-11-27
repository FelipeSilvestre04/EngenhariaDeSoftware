import React, { useState } from 'react'; 
import ProjectSidebar from './features/ProjectSidebar/ProjectSidebar';
import KanbanBoard from './features/Kanban/KanbanBoard';
import Header from './features/header/header'; 
import { ChatWindow } from './features/chat/ChatWindow';
import { GoogleAuth } from './features/auth/GoogleAuth'; 
import './App.css';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);

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
        onProjectSelect={setSelectedProject}
      />

      <main className="Main-Content">
        <Header onThemeToggle={toggleTheme} theme={theme} />
        <div className="App-Container"> 
          {selectedProject ? (
            <div style={{flex: 1, padding: 12}}>
              <KanbanBoard project={selectedProject} onClose={() => setSelectedProject(null)} />
            </div>
          ) : (
            <>
              <div style={{width: 260}} />

              <div style={{flex: 1, minWidth: 420}}>
                <ChatWindow theme={theme}/>
              </div>

              <div className="calendar-view-container">
                <GoogleAuth />
              </div>
            </>
          )}
        </div>
      </main>

    </div>
  );
}


export default App;