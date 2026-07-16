import { X } from '@phosphor-icons/react';

interface EventLink {
  text: string | null;
  url: string | null;
}

export interface Event {
  title: string;
  desc: string;
  image: string;
  links: EventLink[];
}

interface EventModalProps {
  event: Event | null;
  onClose: () => void;
}

const EventModal = ({ event, onClose }: EventModalProps) => {
  if (!event) return null;

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className="modal-card event-modal-card glass-card" onClick={e => e.stopPropagation()}>
        <button className="modal-close" aria-label="關閉" onClick={onClose}>
          <X weight="bold" />
        </button>
        <div className="event-modal-grid">
          <div className="event-modal-image-container">
            <img src={event.image} alt="活動圖片" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          </div>
          <div className="event-modal-left">
            <h3>{event.title}</h3>
            <p>{event.desc}</p>
          </div>
          <div className="event-modal-right">
            <h4>相關連結</h4>
            <ul className="past-events-list">
              {event.links.map((link, idx) => (
                link.url && link.text ? (
                  <li key={idx}>
                    <a href={link.url} target="_blank" rel="noopener noreferrer">{link.text}</a>
                  </li>
                ) : (
                  <li key={idx}>無相關連結</li>
                )
              ))}
              {event.links.length === 0 && <li>無相關連結</li>}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventModal;
