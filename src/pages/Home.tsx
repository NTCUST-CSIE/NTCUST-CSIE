import { useEffect } from 'react';
import { EnvelopeSimple, InstagramLogo, ChatCircleDots, GithubLogo, Link as LinkIcon } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import ParticleCanvas from '../components/ParticleCanvas';
import OrgChart from '../components/OrgChart';

const Home = () => {
  useEffect(() => {
    // Reveal elements on scroll
    const revealElements = document.querySelectorAll('.glass-card:not(.org-node), .org-tree, .member-card, .event-card, .stat-card, .contact-info, .social-links, .section-title');
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
    }
  }, []);

  return (
    <main>
      <header className="hero" id="home">
        <ParticleCanvas />
        <div className="hero-content">
          <h1 className="hero-title">探索資訊無限可能</h1>
          <p className="hero-subtitle">國立臺中科技大學<br />五專部資訊工程科 科學會</p>
          <div className="hero-cta">
            <a href="#about" className="btn btn-primary">關於我們</a>
            <Link to="/members" className="btn btn-outline">認識成員</Link>
          </div>
        </div>
      </header>

      <section id="about" className="about-section">
        <div className="container">
          <h2 className="section-title">關於我們 <span className="highlight">About Us</span></h2>
          <div className="about-grid">
            <div className="about-text glass-card">
              <p>我們是資訊工程科 科學會，<br />由一群充滿熱情與活力的學生組成。<br />科學會致力於舉辦各項活動，<br />促進同學間的情感交流，<br />協助大家在五專留下美好的回憶。</p>
            </div>
            <div className="about-stats">
              <div className="stat-card glass-card">
                <span className="stat-label">第</span>
                <span className="stat-number">8</span>
                <span className="stat-label">屆</span>
              </div>
              <div className="stat-card glass-card">
                <span className="stat-label">預計</span>
                <span className="stat-number">9+</span>
                <span className="stat-label">活動</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="organization" className="org-section">
        <div className="container">
          <h2 className="section-title">組織架構 <span className="highlight">Organization</span></h2>
          <div className="org-tree" id="index-org-tree">
            <OrgChart />
          </div>
          <div style={{ textAlign: 'center', marginTop: '3rem' }}>
            <Link to="/members" className="btn btn-primary">查看詳細成員介紹</Link>
          </div>
        </div>
      </section>

      <section id="contact" className="contact-section">
        <div className="container">
          <h2 className="section-title">聯絡我們 <span className="highlight">Contact</span></h2>
          <div className="contact-icons-container">
            <a href="mailto:nutc.csie530@gmail.com" className="icon-link" aria-label="Email">
              <EnvelopeSimple />
            </a>
            <a href="https://www.instagram.com/ntcust_csie" target="_blank" rel="noopener noreferrer" className="icon-link" aria-label="Instagram">
              <InstagramLogo />
            </a>
            <a href="https://page.line.me/797hsgke" target="_blank" rel="noopener noreferrer" className="icon-link" aria-label="LINE">
              <ChatCircleDots />
            </a>
            <a href="https://github.com/NTCUST-CSIE/NTCUST-CSIE" target="_blank" rel="noopener noreferrer" className="icon-link github-link-tooltip" aria-label="GitHub">
              <GithubLogo />
            </a>
            <a href="https://linktr.ee/nutccsie" target="_blank" rel="noopener noreferrer" className="icon-link" aria-label="Linktree">
              <LinkIcon />
            </a>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Home;
