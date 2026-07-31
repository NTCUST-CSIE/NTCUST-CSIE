import { useEffect, useState, useRef } from 'react';

const AIChat = () => {
  const [tokenInfo, setTokenInfo] = useState<{ token?: string, error?: string } | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. Fetch token from our secure backend
    const fetchToken = async () => {
      try {
        const res = await fetch('/api/bot-token');
        const data = await res.json();
        if (data.error) {
          setTokenInfo({ error: data.error });
        } else {
          setTokenInfo({ token: data.token });
        }
      } catch (e: any) {
        setTokenInfo({ error: e.message });
      }
    };
    fetchToken();
  }, []);

  useEffect(() => {
    if (!tokenInfo?.token || !chatContainerRef.current) return;

    // 2. Dynamically load Web Chat script if it doesn't exist
    if (!(window as any).WebChat) {
      const script = document.createElement('script');
      script.src = 'https://cdn.botframework.com/botframework-webchat/latest/webchat.js';
      script.async = true;
      script.onload = renderChat;
      document.body.appendChild(script);
    } else {
      renderChat();
    }

    function renderChat() {
      const WebChat = (window as any).WebChat;
      const directLine = WebChat.createDirectLine({ token: tokenInfo?.token });

      const styleOptions = {
        hideUploadButton: true,
        backgroundColor: 'transparent',
        bubbleBackground: 'var(--color-brand-primary)',
        bubbleTextColor: '#ffffff',
        bubbleBorderRadius: 10,
        bubbleFromUserBackground: 'rgba(255, 255, 255, 0.1)',
        bubbleFromUserTextColor: 'var(--text-primary)',
        bubbleFromUserBorderRadius: 10,
        sendBoxBackground: 'rgba(255, 255, 255, 0.05)',
        sendBoxTextColor: 'var(--text-primary)',
        botAvatarInitials: 'AI',
        userAvatarInitials: 'Me',
      };

      WebChat.renderWebChat(
        {
          directLine,
          styleOptions,
          className: 'webchat-container'
        },
        chatContainerRef.current
      );
    }
  }, [tokenInfo]);

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
            歡迎使用！我會優先搜尋校內各處室公告來回答您的問題。<br/>
            為確保回答穩定性，我們將儲存對話紀錄以改善模型。<br/>
          </p>
          
          <div className="glass-card chat-wrapper reveal active">
            {tokenInfo?.error ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#ff6b6b' }}>
                <i className="ph-fill ph-warning-circle" style={{ fontSize: '3rem', marginBottom: '1rem' }}></i>
                <h3>機器人連線失敗</h3>
                <p>錯誤原因：{tokenInfo.error}</p>
                <p style={{ fontSize: '0.9rem', opacity: 0.8, marginTop: '1rem' }}>
                  請檢查您的 Cloudflare 環境變數 <code>COPILOT_TOKEN_URL</code> 或 <code>COPILOT_SECRET</code> 是否設定正確。
                </p>
              </div>
            ) : !tokenInfo?.token ? (
              <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-text-light)' }}>
                <div className="spinner"></div>
                <p style={{ marginTop: '1rem' }}>正在與 AI 核心連線...</p>
              </div>
            ) : (
              <div ref={chatContainerRef} style={{ width: '100%', height: '100%' }}></div>
            )}
          </div>
        </section>
      </main>
      <style>{`
        .chat-wrapper {
            width: 100%;
            border-radius: 20px;
            overflow: hidden;
            padding: 0;
            height: 600px;
            display: flex;
            flex-direction: column;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .webchat-container {
            width: 100%;
            height: 100%;
        }

        /* 針對深色模式調整 WebChat 輸入框 */
        .webchat__send-box {
            border-top: 1px solid rgba(255, 255, 255, 0.1) !important;
        }

        .spinner {
            width: 40px;
            height: 40px;
            border: 4px solid rgba(255, 255, 255, 0.1);
            border-left-color: var(--color-brand-primary);
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto;
        }

        @keyframes spin {
            100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
};

export default AIChat;
