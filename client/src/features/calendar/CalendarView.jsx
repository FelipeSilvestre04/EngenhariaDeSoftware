// client/src/features/calendar/CalendarView.jsx
import { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css'; // Importa o estilo padrão do novo calendário

export function CalendarView() {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch('/calendar/events');
        const data = await res.json();
        if (data.success) {
          setEvents(data.events);
        }
      } catch (error) {
        console.error("Erro ao buscar eventos:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchEvents();
  }, []);

  if (isLoading) {
    return <p>Carregando calendário...</p>;
  }

  return (
    <div>
      {/* O novo componente de calendário! As setas já vêm por padrão. */}
      <Calendar />

      {/* Vamos manter a lista de eventos por enquanto, logo abaixo */}
      <div style={{ marginTop: '1rem', maxHeight: '200px', overflowY: 'auto' }}>
         <h4>Próximos Compromissos:</h4>
         {events.length > 0 ? (
           <ul>
             {events.map(event => (
               <li key={event.id}>{event.summary}</li>
             ))}
           </ul>
         ) : (
           <p>Nenhum compromisso encontrado.</p>
         )}
      </div>
    </div>
  );
}