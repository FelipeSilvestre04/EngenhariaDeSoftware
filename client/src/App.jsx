// client/src/App.jsx
import { ProjectList } from './features/projects/ProjectList';
import { ChatWindow } from './features/chat/ChatWindow';
import { CalendarView } from './features/calendar/CalendarView';
import './App.css';

function App() {
  return (
    <div className="main-container">
      <ProjectList />
      <ChatWindow />
      <CalendarView />
    </div>
  );
}

export default App;