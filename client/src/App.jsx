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
    <>
      <Header onToggleClick={toggleSidebar} /> 

      <div className="App-Container">
        {isSidebarOpen && <ProjectSidebar />}
        <ChatWindow />
        <GoogleAuth />
      </div>
    </>
  );
}

export default App;