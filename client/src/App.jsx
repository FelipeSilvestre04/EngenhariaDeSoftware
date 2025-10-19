// client/src/App.jsx
import { ProjectList } from './features/projects/ProjectList';
import { ChatWindow } from './features/chat/ChatWindow';
import { GoogleAuth } from './features/auth/GoogleAuth'; // MUDANÇA AQUI
import './App.css';

function App() {
  return (
    <div className="main-container">
      <ProjectList />
      <ChatWindow />
      <GoogleAuth /> {/* MUDANÇA AQUI */}
    </div>
  );
}

export default App;