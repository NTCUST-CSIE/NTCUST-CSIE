import { useEffect } from 'react';
import { Robot } from '@phosphor-icons/react';

const AIChat = () => {
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
              <i class="ph-fill ph-robot"></i>
              新生 AI
            </span>
            <span className="highlight">AI Chat</span>
          </h2>
          <p style={{ textAlign: 'center', marginBottom: '2rem', color: 'var(--color-text-light)' }}>
            請注意，由於這個 AI Chat 是由第三方服務提供，請勿在此輸入任何敏感資訊或個人資料。<br/>
            由於各處室規定略為不同，請自行判斷其可靠性與安全性。<br/>
            為了確保AI回答的穩定性，我們會儲存使用者的對話紀錄，並用於改善模型的訓練。<br/>
          </p>
          <div className="glass-card iframe-container reveal active">
            <iframe src="https://copilotstudio.microsoft.com/environments/Default-28d0fa75-f9f9-4024-9337-485d46e75257/bots/Default_bot_c3f96b/canvas?__version__=2&enableFileAttachment=false&cliAgent=true" frameborder="0" style="width: 100%; height: 100%;"></iframe>
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

export default AIChat;
