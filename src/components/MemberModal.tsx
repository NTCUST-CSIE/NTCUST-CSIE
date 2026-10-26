import { useState, useEffect, type MouseEvent } from 'react';
import { XCircle } from '@phosphor-icons/react';
import { discoverEgg } from '../utils/eggs';
import { dropItem } from '../utils/drops';

interface Member {
  name: string;
  title: string;
  image: string;
  intro: string;
  // 點介紹視窗裡的大頭照會掉出來的小圖；沒填就掉迷你版大頭照
  dropImage?: string;
}

interface MemberModalProps {
  member: Member | null;
  onClose: () => void;
}

const MemberModal = ({ member, onClose }: MemberModalProps) => {
  const [active, setActive] = useState(false);
  const [displayMember, setDisplayMember] = useState<Member | null>(null);

  useEffect(() => {
    if (member) {
      setDisplayMember(member);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setActive(true));
      });
    } else {
      setActive(false);
      const timer = setTimeout(() => setDisplayMember(null), 300);
      return () => clearTimeout(timer);
    }
  }, [member]);

  if (!displayMember) return null;

  const dropFromAvatar = (e: MouseEvent<HTMLDivElement>) => {
    const { dropImage, image } = displayMember;
    dropItem(dropImage || image, e.currentTarget.getBoundingClientRect(), !dropImage);
    discoverEgg('drop');
  };

  return (
    <div className={`modal-overlay ${active ? 'active' : ''}`} onClick={onClose}>
      <div className="modal-card glass-card" onClick={e => e.stopPropagation()}>
        <button className="modal-close" aria-label="Close modal" onClick={onClose}>
          <XCircle weight="fill" />
        </button>
        <div className="modal-header">
          <div className="member-icon" style={{ backgroundImage: `url(${displayMember.image})` }} onClick={dropFromAvatar}></div>
          <div className="modal-header-info">
            <div className="member-name">{displayMember.name}</div>
            <div className="member-title">{displayMember.title}</div>
          </div>
        </div>
        <div className="modal-body" dangerouslySetInnerHTML={{ __html: displayMember.intro }}></div>
      </div>
    </div>
  );
};

export default MemberModal;
