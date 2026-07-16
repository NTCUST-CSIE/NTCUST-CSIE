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
                <span className="node-title">會長 / 副會長</span>
                <span className="node-name">{presVp}</span>
              </Link>
            </div>
            <div className="side-connector"></div>
            <div className="org-node-wrapper side-node-wrapper">
              <Link to="/members#dept-president" className="org-node glass-card side-node reveal active">
                <span className="node-title">執行秘書</span>
                <span className="node-name">{execSec}</span>
              </Link>
            </div>
          </div>
        </div>
      )}
      {otherDepts.length > 0 && (
        <div className="org-level bottom-level">
          {otherDepts.map(dept => {
            const membersStr = dept.members.map(m => m.name).join('・');
            return (
              <div key={dept.id} className="org-node-wrapper">
                <Link to={`/members#${dept.id}`} className="org-node glass-card reveal active">
                  <span className="node-title">{dept.departmentTitle}</span>
                  <span className="node-name">{membersStr}</span>
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
};

export default OrgChart;
