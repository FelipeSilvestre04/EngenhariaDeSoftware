// client/src/features/calendar/CalendarView.jsx
import { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

export function CalendarView() {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  // 1. Novo estado para guardar a data que o usuário selecionou
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch('/calendar/events');
        const data = await res.json();
        if (data.success) {
          // Importante: Transformamos as datas em objetos Date aqui
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
    fetchEvents();
  }, []);

  // 2. Filtra a lista de eventos para mostrar apenas os do dia selecionado
  const filteredEvents = events.filter(event =>
    event.start.toDateString() === selectedDate.toDateString()
  );

  // 3. Função que o calendário usa para renderizar conteúdo extra em cada dia
  const tileContent = ({ date, view }) => {
    // Se estiver na visão de "mês"
    if (view === 'month') {
      // Verifica se existe algum evento para esta data
      const hasEvent = events.some(event => 
        event.start.toDateString() === date.toDateString()
      );

      // Se tiver evento, retorna o "ponto amarelo"
      return hasEvent ? <div className="event-dot"></div> : null;
    }
  };

  if (isLoading) {
    return <p>Carregando calendário...</p>;
  }

  return (
    <div>
      <Calendar
        // 4. Conecta as funções e o estado ao componente
        onChange={setSelectedDate}
        value={selectedDate}
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