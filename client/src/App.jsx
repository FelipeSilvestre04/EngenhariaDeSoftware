import React, { useState } from 'react'; 
import ProjectSidebar from './features/ProjectSidebar/ProjectSidebar';
import Header from './features/header/header'; 
import { ChatWindow } from './features/chat/ChatWindow';
import { GoogleAuth } from './features/auth/GoogleAuth'; 
import './App.css';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen( !isSidebarOpen ); 
  };

  return (
<div className="App-Wrapper">
      
      <ProjectSidebar 
        isOpen={isSidebarOpen} 
        onToggleClick={toggleSidebar} 
      />

      <main className="Main-Content">
        <Header />
        <div className="App-Container"> 
          <ChatWindow />
          <GoogleAuth />
        </div>
      </main>

    </div>
  );
}


export default App;