import { useEffect } from 'react';
import { ChatTeardropText, ShieldCheck, ArrowSquareOut, WarningCircle, FileText } from '@phosphor-icons/react';

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
          <h2 className="section-title">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <ChatTeardropText className="title-icon" weight="fill" />
              匿名意見箱
            </span>
            <span className="highlight">Feedback</span>
          </h2>
          <p style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'var(--color-text-light)' }}>
            對於我們有任何想法、建議或疑問嗎？歡迎透過下方的匿名表單告訴我們！
          </p>

          {/* Tally Terms & Privacy Notice Card */}
          <div className="glass-card feedback-notice-card reveal active">
            <div className="notice-header">
              <ShieldCheck size={22} weight="duotone" className="notice-icon" />
              <h3 className="notice-title">服務規範與隱私權聲明</h3>
            </div>
            
            <p className="notice-text">
              本意見箱表單採用第三方平台 <strong>Tally</strong> 作為資料收集與處理工具。使用本服務前，請詳閱並確認您已同意 Tally 之相關服務條款與隱私政策：
            </p>

            <div className="notice-links">
              <a 
                href="https://tally.so/help/gdpr" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="notice-link-btn"
              >
                <FileText size={16} weight="bold" />
                <span>Tally GDPR 資料保護規範</span>
                <ArrowSquareOut size={14} />
              </a>
              <a 
                href="https://tally.so/help/terms-and-privacy" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="notice-link-btn"
              >
                <FileText size={16} weight="bold" />
                <span>Tally 服務條款與隱私權政策</span>
                <ArrowSquareOut size={14} />
              </a>
            </div>

            <div className="notice-warning">
              <WarningCircle size={18} weight="fill" className="warning-icon" />
              <span>
                <strong>重要提醒：</strong>若您<strong>不同意</strong>上述第三方服務條款、隱私權規範或相關資料處理方式，<strong>請勿填寫或使用本意見箱</strong>。
              </span>
            </div>
          </div>

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
        .feedback-notice-card {
          margin-bottom: 2rem;
          padding: 1.5rem 1.75rem;
          border-radius: 16px;
          border: 1px solid rgba(0, 168, 240, 0.2);
          background: rgba(0, 168, 240, 0.03);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.05);
        }

        .notice-header {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          margin-bottom: 0.85rem;
        }

        .notice-icon {
          color: var(--color-primary, #00a8f0);
        }

        .notice-title {
          font-size: 1.1rem;
          font-weight: 600;
          margin: 0;
          color: var(--color-text, #f0f6fc);
        }

        .notice-text {
          font-size: 0.92rem;
          line-height: 1.6;
          color: var(--color-text-light, #8b949e);
          margin-bottom: 1rem;
        }

        .notice-links {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          margin-bottom: 1.25rem;
        }

        .notice-link-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.45rem 0.9rem;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 500;
          color: var(--color-primary, #00a8f0);
          background: rgba(0, 168, 240, 0.08);
          border: 1px solid rgba(0, 168, 240, 0.25);
          text-decoration: none;
          transition: all 0.2s ease;
        }

        .notice-link-btn:hover {
          background: rgba(0, 168, 240, 0.18);
          border-color: var(--color-primary, #00a8f0);
          transform: translateY(-1px);
        }

        .notice-warning {
          display: flex;
          align-items: flex-start;
          gap: 0.6rem;
          padding: 0.75rem 1rem;
          border-radius: 10px;
          background: rgba(240, 136, 62, 0.1);
          border-left: 3px solid #f0883e;
          font-size: 0.88rem;
          line-height: 1.5;
          color: var(--color-text, #f0f6fc);
        }

        .warning-icon {
          color: #f0883e;
          flex-shrink: 0;
          margin-top: 2px;
        }

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

        html[data-theme='dark'] .feedback-notice-card {
          background: rgba(22, 27, 34, 0.65);
          border-color: rgba(0, 168, 240, 0.3);
        }
      `}</style>
    </>
  );
};

export default Feedback;
