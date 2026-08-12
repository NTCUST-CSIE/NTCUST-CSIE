import { Link } from 'react-router-dom';
import membersData from '../data/members.json';

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

const OrgChart = () => {
  const departments = membersData as Department[];
  const presDept = departments.find(d => d.id === 'dept-president');
  const otherDepts = departments.filter(d => d.id !== 'dept-president');

  let presVp = '';
  let execSec = '';

  if (presDept) {
    presVp = presDept.members
      .filter(m => m.title.includes('會長'))
      .map(m => m.name)
      .join('・');
    execSec = presDept.members
      .filter(m => m.title.includes('秘書'))
      .map(m => m.name)
      .join('・');
  }

  return (
    <>
      {presDept && (
        <div className="org-level top-level">
          <div className="top-level-wrapper">
            <div className="org-node-wrapper">
              <Link to="/members#dept-president" className="org-node glass-card reveal active">
                <span className="node-title" style={{ marginBottom: '0.8rem' }}>會長 / 副會長</span>
                <span className="node-name">{presVp}</span>
              </Link>
            </div>
            <div className="side-connector"></div>
            <div className="org-node-wrapper side-node-wrapper">
              <Link to="/members#dept-president" className="org-node glass-card side-node reveal active">
                <span className="node-title" style={{ marginBottom: '0.8rem' }}>執行秘書</span>
                <span className="node-name">{execSec}</span>
              </Link>
            </div>
          </div>
        </div>
      )}
      {otherDepts.length > 0 && (
        <div className="org-level bottom-level">
          {otherDepts.map(dept => {
            const headsStr = dept.members
              .filter(m => m.title.includes('長') || m.title === dept.departmentTitle)
              .map(m => m.name)
              .join('・');
            const normalMembersStr = dept.members
              .filter(m => !m.title.includes('長') && m.title !== dept.departmentTitle)
              .map(m => m.name)
              .join('・');

            return (
              <div key={dept.id} className="org-node-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Link to={`/members#${dept.id}`} className="org-node glass-card reveal active" style={{ width: '100%', height: 'auto', flex: 'none' }}>
                  <span className="node-title" style={{ marginBottom: '1rem' }}>{dept.departmentTitle}</span>
                  
                  {headsStr && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '0.25rem', letterSpacing: '1px' }}>部長</span>
                      <span className="node-name">{headsStr}</span>
                    </div>
                  )}
                  
                  {!headsStr && !normalMembersStr && (
                    <span className="node-name">{dept.members.map(m => m.name).join('・')}</span>
                  )}
                </Link>

                {normalMembersStr && (
                  <>
                    <div style={{ width: '2px', height: '1.5rem', backgroundColor: 'var(--color-brand-primary)', opacity: 0.5 }}></div>
                    <Link to={`/members#${dept.id}`} className="org-node glass-card reveal active" style={{ width: '100%', height: 'auto', flex: 'none', padding: '1rem 0.5rem' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginBottom: '0.5rem', letterSpacing: '1px', fontWeight: 600 }}>部員</span>
                      <span className="node-name">{normalMembersStr}</span>
                    </Link>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
};

export default OrgChart;
