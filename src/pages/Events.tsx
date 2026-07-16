import { useState, useEffect } from 'react';
import EventModal from '../components/EventModal';
import type { Event } from '../components/EventModal';
import eventsData from '../data/events.json';

const Events = () => {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  useEffect(() => {
    // Reveal elements on scroll
    const revealElements = document.querySelectorAll('.event-card, .section-title');
    revealElements.forEach(el => el.classList.add('reveal'));

    const observer = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          observer.unobserve(entry.target);
        }
      });
    }, { root: null, rootMargin: '0px', threshold: 0.1 });

    revealElements.forEach(el => observer.observe(el));
    return () => {
      revealElements.forEach(el => observer.unobserve(el));
    };
  }, []);

  return (
    <>
      <div style={{ height: '100px' }}></div>
      <main>
        <section id="events" className="events-section">
          <div className="container">
            <h2 className="section-title">近期活動 <span className="highlight">Events</span></h2>
            <div className="events-grid" id="events-container">
              {Object.entries(eventsData).map(([key, event]) => (
                <div 
                  key={key} 
                  className="event-card glass-card"
                  onClick={() => setSelectedEvent(event as Event)}
                >
                  <div className="event-image">
                    <img src={event.image} alt={event.title} onError={(e) => { e.currentTarget.src = '/img/event_nopng.png'; }} />
                  </div>
                  <div className="event-info">
                    <h3 className="event-title">{event.title}</h3>
                    <p className="event-desc">{event.desc}</p>
                    <div className="event-links">
                      <span>查看詳情 →</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <EventModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
    </>
  );
};

export default Events;
