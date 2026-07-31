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
              網頁快速搜尋
            </span>
            <span className="highlight">AI Search</span>
          </h2>
          <p style={{ textAlign: 'center', marginBottom: '2rem', color: 'var(--color-text-light)' }}>
            快速搜尋中科大與科會相關資訊
          </p>
          
          <div className="glass-card search-container reveal active" style={{ padding: '2rem', display: 'flex', justifyContent: 'center' }}>
            {React.createElement('search-bar-snippet', {
              theme: 'light',
              'hide-branding': 'true'
            })}
          </div>
        </section>
      </main>
      <style>{`
        .search-container {
            min-height: 400px;
            width: 100%;
            display: flex;
            align-items: flex-start;
            justify-content: center;
        }
        /* Make the search bar snippet take up full width if possible */
        search-bar-snippet {
            width: 100%;
            max-width: 600px;
        }
      `}</style>
    </>
  );
};

export default AIChat;
