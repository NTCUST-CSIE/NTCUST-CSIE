import { useState } from 'react';
import { getActiveSeason } from '../utils/seasonal';

// 節日限定的飄浮裝飾，只在 seasonal.json 設定的期間出現
const SeasonalDecor = () => {
  const season = getActiveSeason();
  const [items] = useState(() =>
    season && season.motion !== 'none'
      ? season.emojis.flatMap(emoji => [emoji, emoji, emoji]).map(emoji => ({
          emoji,
          left: Math.random() * 100,
          delay: Math.random() * -24,
          duration: 16 + Math.random() * 12,
          size: 1 + Math.random() * 1.1,
        }))
      : []
  );

  if (!season || items.length === 0) return null;

  return (
    <div className={`season-decor ${season.motion}`} aria-hidden="true">
      {items.map((item, i) => (
        <span
          key={i}
          style={{
            left: `${item.left}%`,
            animationDelay: `${item.delay}s`,
            animationDuration: `${item.duration}s`,
            fontSize: `${item.size}rem`,
          }}
        >
          {item.emoji}
        </span>
      ))}
    </div>
  );
};

export default SeasonalDecor;
