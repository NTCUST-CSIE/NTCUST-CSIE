import { useEffect } from 'react';

const Feedback = () => {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://tally.so/widgets/embed.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <>
      <div style={{ height: '100px' }}></div>
      <main>
        <section className="container" style={{ maxWidth: '800px', padding: '2rem 1rem' }}>
          <h2 className="section-title">匿名意見箱 <span className="highlight">Feedback</span></h2>
          <p style={{ textAlign: 'center', marginBottom: '2rem', color: 'var(--color-text-light)' }}>
            對於我們有任何想法、建議或疑問嗎？歡迎透過下方的匿名表單告訴我們！
          </p>
          <div className="glass-card iframe-container reveal active">
            <iframe 
              data-tally-src="https://tally.so/embed/RGaK24?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1" 
              loading="lazy" 
              width="100%" 
              height="200" 
              frameBorder="0" 
              marginHeight={0} 
              marginWidth={0} 
              title="匿名意見箱">
            </iframe>
          </div>
        </section>
      </main>
      <style>{`
        .iframe-container {
            width: 100%;
            border-radius: 20px;
            overflow: hidden;
            padding: 0;
            min-height: 500px;
        }
        
        .iframe-container iframe {
            width: 100%;
            border: none;
            background: transparent;
        }

        html[data-theme='dark'] .iframe-container {
            background: rgba(255, 255, 255, 0.05);
        }
      `}</style>
    </>
  );
};

export default Feedback;
