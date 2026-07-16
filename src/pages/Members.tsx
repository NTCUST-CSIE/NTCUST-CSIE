import { useState, useEffect } from 'react';
import membersData from '../data/members.json';
import MemberModal from '../components/MemberModal';
import { Users } from '@phosphor-icons/react';

interface Member {
  name: string;
  title: string;
  image: string;
  intro: string;
}

interface Department {
  id: string;
  departmentTitle: string;
  members: Member[];
}

const Members = () => {
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  useEffect(() => {
    // Reveal elements on scroll
    const revealElements = document.querySelectorAll('.member-card, .section-title');
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
        <section id="members" className="members-section">
          <div className="container">
            <h2 className="section-title">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <Users className="title-icon" weight="fill" />
                科會成員
              </span>
              <span className="highlight">Members</span>
            </h2>
            <div id="members-container">
              {(membersData as Department[]).map(dept => {
                return (
                  <div key={dept.id} className="department">
                    <h3 className="department-title">
                      {dept.departmentTitle}
                    </h3>
                    <div className="members-grid">
                      {dept.members.map((member, idx) => (
                        <div 
                          key={idx} 
                          className="member-card glass-card clickable-card"
                        onClick={() => setSelectedMember(member)}
                      >
                        <div className="member-icon" style={{ backgroundImage: `url(${member.image})` }}></div>
                        <div className="member-info">
                          <h4 className="member-name">{member.name}</h4>
                          <p className="member-title">{member.title}</p>
                        </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>
      <MemberModal member={selectedMember} onClose={() => setSelectedMember(null)} />
    </>
  );
};

export default Members;
