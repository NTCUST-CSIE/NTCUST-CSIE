import { useEffect } from 'react';
import { ChatTeardropText, ArrowSquareOut, FileText } from '@phosphor-icons/react';

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
        <section className="container" style={{ maxWidth: '860px', padding: '2rem 1rem' }}>
          <h2 className="section-title">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <ChatTeardropText className="title-icon" weight="fill" />
              匿名意見箱
            </span>
            <span className="highlight">Feedback</span>
          </h2>
          
          <p style={{ textAlign: 'center', marginBottom: '2rem', color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: '1.7' }}>
            對於我們有任何想法、建議或疑問嗎？歡迎透過下方的匿名表單告訴我們！
          </p>

          {/* Tally Embedded Form */}
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

          {/* Unified Terms & Privacy Notice */}
          <div className="glass-card feedback-notice reveal active">
            <p className="notice-desc">
              本意見箱表單採用第三方平台 <strong>Tally</strong> 提供之嵌入式服務。為維護您的權益，使用前請詳閱並確認您已充分知悉相關服務規範與資料處理條款（若不同意請勿使用本意見箱）：
            </p>
            <div className="notice-links-grid">
              <a 
                href="https://tally.so/help/gdpr" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="notice-btn"
              >
                <FileText size={18} weight="bold" />
                <span>Tally GDPR 資料保護規範</span>
                <ArrowSquareOut size={15} />
              </a>
              <a 
                href="https://tally.so/help/terms-and-privacy" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="notice-btn"
              >
                <FileText size={18} weight="bold" />
                <span>Tally 服務條款與隱私權政策</span>
                <ArrowSquareOut size={15} />
              </a>
            </div>
          </div>
        </section>
      </main>

      <style>{`
        .iframe-container {
          width: 100%;
          border-radius: 16px;
          overflow: hidden;
          padding: 0;
          min-height: 500px;
          margin-bottom: 2rem;
        }
        
        .iframe-container iframe {
          width: 100%;
          border: none;
          background: transparent;
        }

        .feedback-notice {
          padding: 1.5rem 1.75rem;
          border: 1px solid var(--bg-tertiary);
          border-radius: 16px;
        }

        .notice-desc {
          font-size: 0.92rem;
          line-height: 1.65;
          color: var(--text-secondary);
          margin-bottom: 1rem;
        }

        .notice-links-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 0.85rem;
        }

        .notice-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.55rem 1rem;
          border-radius: 8px;
          font-size: 0.88rem;
          font-weight: 500;
          color: var(--color-brand-primary);
          background-color: var(--color-brand-light);
          border: 1px solid transparent;
          text-decoration: none;
          transition: all 0.2s ease;
        }

        .notice-btn:hover {
          color: #ffffff;
          background-color: var(--color-brand-primary);
          transform: translateY(-2px);
          box-shadow: var(--shadow-sm);
        }

        [data-theme="light"] .notice-btn:hover {
          background-color: var(--color-brand-secondary);
          color: #ffffff;
        }

        @media (max-width: 768px) {
          .feedback-notice {
            padding: 1.25rem 1.5rem;
          }

          .notice-links-grid {
            flex-direction: column;
          }

          .notice-btn {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </>
  );
};

export default Feedback;
