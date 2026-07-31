import React from 'react';

const AIChat = () => {
  return (
    <>
      <div style={{ height: '100px' }}></div>
      <main>
        <section className="container" style={{ maxWidth: '800px', padding: '2rem 1rem' }}>
          <h2 className="section-title">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <i className="ph-fill ph-robot" style={{ fontSize: '1.5rem', color: 'var(--color-brand-primary)' }}></i>
              新生 AI 助理
            </span>
            <span className="highlight">AI Chat</span>
          </h2>
          <p style={{ textAlign: 'center', marginBottom: '2rem', color: 'var(--color-text-light)' }}>
            請注意，由於這個 AI Chat 是由第三方服務提供，請勿在此輸入任何敏感資訊或個人資料。<br/>
            由於各處室規定略為不同，請自行判斷其可靠性與安全性。<br/>
            為了確保AI回答的穩定性，我們會儲存使用者的對話紀錄，並用於改善模型的訓練。<br/>
          </p>
          <div className="glass-card iframe-container reveal active">
            <iframe src="https://copilotstudio.microsoft.com/environments/Default-28d0fa75-f9f9-4024-9337-485d46e75257/bots/Default_bot_c3f96b/canvas?__version__=2&enableFileAttachment=false&cliAgent=true" frameBorder={0} style={{ width: '100%', height: '100%' }}></iframe>
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
            display: flex;
        }
        
        .iframe-container iframe {
            width: 100%;
            min-height: 600px;
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

export default AIChat;
