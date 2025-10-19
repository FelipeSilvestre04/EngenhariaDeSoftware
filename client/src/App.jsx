// client/src/App.jsx
import { ProjectList } from './features/projects/ProjectList';
import { ChatWindow } from './features/chat/ChatWindow';
import { GoogleAuth } from './features/auth/GoogleAuth'; // Vamos usar o componente de autenticação aqui
import './App.css';

function App() {
  return (
    <div className="main-container">
      <ProjectList />
      <ChatWindow />
      <GoogleAuth />
    </div>
  );
}

export default App;