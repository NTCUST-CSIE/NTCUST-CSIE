import { XCircle } from '@phosphor-icons/react';

interface Member {
  name: string;
  title: string;
  image: string;
  intro: string;
}

interface MemberModalProps {
  member: Member | null;
  onClose: () => void;
}

const MemberModal = ({ member, onClose }: MemberModalProps) => {
  if (!member) return null;

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className="modal-card glass-card" onClick={e => e.stopPropagation()}>
        <button className="modal-close" aria-label="Close modal" onClick={onClose}>
          <XCircle weight="fill" />
        </button>
        <div className="modal-header">
          <div className="member-icon" style={{ backgroundImage: `url(${member.image})` }}></div>
          <div className="modal-header-info">
            <div className="member-name">{member.name}</div>
            <div className="member-title">{member.title}</div>
          </div>
        </div>
        <div className="modal-body" dangerouslySetInnerHTML={{ __html: member.intro }}></div>
      </div>
    </div>
  );
};

export default MemberModal;
