// client/src/features/calendar/CalendarView.jsx
import { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

export function CalendarView() {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeStartDate, setActiveStartDate] = useState(new Date());

  const fetchEvents = async (date) => {
    try {
      const year = date.getFullYear();
      const month = date.getMonth();
      
      // Primeiro dia do mês
      const start = new Date(year, month, 1);
      // Primeiro dia do próximo mês (para cobrir todo o mês atual)
      const end = new Date(year, month + 1, 1);

      const queryParams = new URLSearchParams({
        timeMin: start.toISOString(),
        timeMax: end.toISOString()
      });

      const res = await fetch(`/calendar/events?${queryParams}`);
      const data = await res.json();
      if (data.success) {
        const formattedEvents = data.events.map(event => ({
          ...event,
          start: new Date(event.start),
          end: new Date(event.end)
        }));
        setEvents(formattedEvents);
      }
    } catch (error) {
      console.error("Erro ao buscar eventos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents(activeStartDate);
    
    // Atualiza a cada 30 segundos para manter sincronizado
    const interval = setInterval(() => {
        fetchEvents(activeStartDate);
    }, 30000);

    return () => clearInterval(interval);
  }, [activeStartDate]);

  const onActiveStartDateChange = ({ activeStartDate, view }) => {
    if (view === 'month') {
      setActiveStartDate(activeStartDate);
    }
  };

  const filteredEvents = events.filter(event =>
    event.start.toDateString() === selectedDate.toDateString()
  );

  const tileContent = ({ date, view }) => {
    if (view === 'month') {
  
      const hasEvent = events.some(event => 
        event.start.toDateString() === date.toDateString()
      );

      return hasEvent ? <div className="event-dot"></div> : null;
    }
  };

  if (isLoading) {
    return <p>Carregando calendário...</p>;
  }

  return (
    <div>
      <Calendar
        onChange={setSelectedDate}
        value={selectedDate}
        onActiveStartDateChange={onActiveStartDateChange}
        tileContent={tileContent}
        className={"CalendarComponent"}
      />

      <div style={{ marginTop: '1rem' }}>
         <h4>Compromissos para {selectedDate.toLocaleDateString()}</h4>
         {filteredEvents.length > 0 ? (
           <ul style={{ paddingLeft: '20px' }}>
             {filteredEvents.map(event => (
               <li key={event.id}>{event.summary}</li>
             ))}
           </ul>
         ) : (
           <p>Nenhum compromisso para este dia.</p>
         )}
      </div>
    </div>
  );
}