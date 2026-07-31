import { useState, useRef, useEffect } from 'react';
import { PaperPlaneRight, Robot, User } from '@phosphor-icons/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const AIChat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: '你好！我是中科大資訊工程科的專屬 AI 助理。你可以問我關於註冊流程、處室公告或科會活動的問題。請問有什麼我可以幫忙的嗎？'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg.content, history: messages })
      });
      const data = await response.json();
      
      const aiMsg: Message = { 
        id: (Date.now() + 1).toString(), 
        role: 'assistant', 
        content: data.reply || '沒有收到回應'
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        role: 'assistant', 
        content: '抱歉，系統目前遇到了一點問題，請稍後再試。' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

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
            <span className="highlight">AI Assistant</span>
          </h2>
          <p style={{ textAlign: 'center', marginBottom: '2rem', color: 'var(--color-text-light)' }}>
            歡迎使用！我會優先搜尋校內各處室公告來回答您的問題。<br/>
            為了提升服務品質，我們的對話紀錄將會被妥善保存並用於改善模型。
          </p>
          
          <div className="glass-card chat-container reveal active">
            <div className="chat-messages">
              {messages.map((msg) => (
                <div key={msg.id} className={`chat-message-wrapper ${msg.role}`}>
                  <div className="chat-avatar">
                    {msg.role === 'assistant' ? <Robot weight="fill" /> : <User weight="fill" />}
                  </div>
                  <div className="chat-bubble">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="chat-message-wrapper assistant">
                  <div className="chat-avatar"><Robot weight="fill" /></div>
                  <div className="chat-bubble loading">
                    <span className="dot"></span>
                    <span className="dot"></span>
                    <span className="dot"></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form className="chat-input-area" onSubmit={handleSubmit}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="輸入您的問題 (例如：請問註冊流程？)"
                disabled={isLoading}
                className="chat-input"
              />
              <button type="submit" className="chat-send-btn" disabled={!input.trim() || isLoading}>
                <PaperPlaneRight weight="fill" />
              </button>
            </form>
          </div>
        </section>
      </main>
      <style>{`
        .chat-container {
            display: flex;
            flex-direction: column;
            padding: 1.5rem !important;
            height: 600px;
            max-height: 70vh;
        }
        
        .chat-messages {
            flex: 1;
            overflow-y: auto;
            padding-right: 0.5rem;
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
            margin-bottom: 1.5rem;
        }
        
        /* 隱藏捲軸但可滾動 */
        .chat-messages::-webkit-scrollbar {
            width: 6px;
        }
        .chat-messages::-webkit-scrollbar-thumb {
            background-color: var(--bg-tertiary);
            border-radius: 10px;
        }

        .chat-message-wrapper {
            display: flex;
            gap: 1rem;
            align-items: flex-end;
            max-width: 85%;
        }

        .chat-message-wrapper.user {
            align-self: flex-end;
            flex-direction: row-reverse;
        }

        .chat-message-wrapper.assistant {
            align-self: flex-start;
        }

        .chat-avatar {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            font-size: 1.2rem;
            background-color: var(--bg-tertiary);
            color: var(--text-primary);
        }

        .chat-message-wrapper.assistant .chat-avatar {
            background-color: var(--color-brand-light);
            color: var(--color-brand-primary);
        }

        .chat-bubble {
            padding: 0.8rem 1.2rem;
            border-radius: 18px;
            background-color: var(--bg-tertiary);
            color: var(--text-primary);
            font-size: 0.95rem;
            line-height: 1.5;
            box-shadow: var(--shadow-sm);
            white-space: pre-wrap;
        }

        .chat-message-wrapper.user .chat-bubble {
            background-color: var(--color-brand-primary);
            color: #fff;
            border-bottom-right-radius: 4px;
        }

        .chat-message-wrapper.assistant .chat-bubble {
            background-color: rgba(255, 255, 255, 0.7);
            border-bottom-left-radius: 4px;
            color: var(--text-primary);
        }
        
        html[data-theme='dark'] .chat-message-wrapper.assistant .chat-bubble {
            background-color: rgba(255, 255, 255, 0.1);
        }

        .chat-input-area {
            display: flex;
            gap: 0.8rem;
            background-color: var(--bg-primary);
            padding: 0.8rem;
            border-radius: 20px;
            border: 1px solid var(--bg-tertiary);
        }

        .chat-input {
            flex: 1;
            background: transparent;
            border: none;
            outline: none;
            color: var(--text-primary);
            font-size: 1rem;
            padding: 0 0.5rem;
        }

        .chat-input::placeholder {
            color: var(--text-tertiary);
        }

        .chat-send-btn {
            background-color: var(--color-brand-primary);
            color: white;
            border: none;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.2rem;
            cursor: pointer;
            transition: all 0.2s;
        }

        .chat-send-btn:disabled {
            background-color: var(--bg-tertiary);
            color: var(--text-tertiary);
            cursor: not-allowed;
        }

        .chat-send-btn:not(:disabled):hover {
            background-color: var(--color-brand-secondary);
            transform: scale(1.05);
        }

        /* Loading Dots Animation */
        .loading {
            display: flex;
            gap: 4px;
            align-items: center;
            height: 24px;
        }
        .dot {
            width: 6px;
            height: 6px;
            background-color: var(--text-secondary);
            border-radius: 50%;
            animation: bounce 1.4s infinite ease-in-out both;
        }
        .dot:nth-child(1) { animation-delay: -0.32s; }
        .dot:nth-child(2) { animation-delay: -0.16s; }
        @keyframes bounce {
            0%, 80%, 100% { transform: scale(0); }
            40% { transform: scale(1); }
        }
      `}</style>
    </>
  );
};

export default AIChat;
