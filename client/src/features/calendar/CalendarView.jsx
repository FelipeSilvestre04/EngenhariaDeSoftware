// client/src/features/calendar/CalendarView.jsx
import { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';

const localizer = momentLocalizer(moment);

export function CalendarView() {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch('/calendar/events');
        const data = await res.json();
        if (data.success) {
          const formattedEvents = data.events.map(event => ({
            title: event.summary,
            start: new Date(event.start),
            end: new Date(event.end),
            allDay: false
          }));
          setEvents(formattedEvents);
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

  // A MUDANÇA ESTÁ AQUI: um div pai com altura de 100%
  return (
    <div style={{ height: '100%' }}>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
      />
    </div>
  );
}