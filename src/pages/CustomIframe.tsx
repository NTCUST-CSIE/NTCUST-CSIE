import { useEffect } from 'react';
import { PencilLine } from '@phosphor-icons/react';

const CustomIframe = () => {
  useEffect(() => {
    // 這裡可以載入第三方表單的 script，例如 Typeform, Google Forms, 或是 Tally
    // 這裡保留與 Feedback 相同的 Tally script 作為範例
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
          <h2 className="section-title">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <PencilLine className="title-icon" weight="fill" />
              自訂表單
            </span>
            <span className="highlight">Custom Form</span>
          </h2>
          <p style={{ textAlign: 'center', marginBottom: '2rem', color: 'var(--color-text-light)' }}>
            這是一個全新的 iframe 分頁模板，您可以在這裡置入問卷、報名表或是其他外部連結。
          </p>
          <div className="glass-card iframe-container reveal active">
            <iframe 
              // 替換下方的 data-tally-src 或 src 即可改變嵌入的內容
              data-tally-src="https://tally.so/embed/RGaK24?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1" 
              loading="lazy" 
              width="100%" 
              height="200" 
              frameBorder="0" 
              marginHeight={0} 
              marginWidth={0} 
              title="自訂表單">
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

export default CustomIframe;
