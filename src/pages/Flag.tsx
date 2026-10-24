import { useState } from 'react';
import type { FormEvent } from 'react';
import { Flag as FlagIcon, Lightbulb, PaperPlaneTilt } from '@phosphor-icons/react';
import { discoverEgg } from '../utils/eggs';
import { reportEgg } from '../utils/analytics';

// 只放雜湊值；伺服器端 functions/api/egg.ts 也會再驗證一次
const FLAG_SHA256 = 'b27f175ad44243cb5b1a7075fc0ffebf1e2f5366ad724f1aeae3f6677b18cc68';

const stages = [
  { title: '第 1 片', skill: '開發者工具', hint: '工程師最常按的 F 開頭的鍵。打開之後，看看 Console 分頁。' },
  { title: '第 2 片', skill: '原始碼 / Base64', hint: '對網頁按右鍵「檢視網頁原始碼」（Ctrl+U）。有一段結尾是 = 的亂碼，資工人應該都認得這種編碼。' },
  { title: '第 3 片', skill: 'robots.txt / ROT13', hint: '每個網站都有一份「搜尋引擎機器人不准看」的清單，就放在網站根目錄。讀到的東西被轉了 13 圈。' },
  { title: '第 4 片', skill: 'HTTP Header', hint: '伺服器回傳那份檔案時，除了內容之外還「順便」帶了別的東西。試試開發者工具的 Network 分頁。' },
  { title: '第 5 片', skill: 'Linux 指令', hint: '按鍵盤左上角的 ` 打開終端機。隱藏檔的檔名以 . 開頭；權限不夠時，前面幾關可能有人把密碼寫在筆記裡。' },
];

const sha256 = async (text: string) => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
};

type Result = { status: 'idle' } | { status: 'wrong' } | { status: 'correct'; rank: number | null };

const Flag = () => {
  const [flag, setFlag] = useState('');
  const [result, setResult] = useState<Result>({ status: 'idle' });
  const [checking, setChecking] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const answer = flag.trim();
    if (!answer || checking) return;

    setChecking(true);
    if (await sha256(answer) !== FLAG_SHA256) {
      setResult({ status: 'wrong' });
      setChecking(false);
      return;
    }
    // 第一次解出會記錄名次；已經解過的話重新查詢名次
    const report = (await discoverEgg('ctf', answer)) ?? (await reportEgg('ctf', answer));
    setResult({ status: 'correct', rank: report?.rank ?? null });
    setChecking(false);
  };

  return (
    <>
      <div style={{ height: '100px' }}></div>
      <main>
        <section className="container flag-section">
          <h2 className="section-title">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <FlagIcon className="title-icon" weight="fill" />
              CSIE CTF
            </span>
            <span className="highlight">Capture The Flag</span>
          </h2>

          <div className="glass-card flag-card">
            <p>資訊部把一面旗子拆成 <strong>5 片</strong>，藏在這個網站的各個角落。把它們全部找出來、照順序拼好，就能得到完整的 flag。</p>
            <ul className="flag-rules">
              <li>Flag 格式：<code>CSIE{'{...}'}</code></li>
              <li>所有線索都能在你自己的瀏覽器裡找到，<strong>不需要、也請不要</strong>對網站或伺服器做任何掃描、暴力破解或攻擊。</li>
              <li>每一片都會告訴你下一片在哪裡。建議用電腦玩，手機很難打開開發者工具。</li>
            </ul>
          </div>

          <div className="flag-stages">
            {stages.map(stage => (
              <details key={stage.title} className="glass-card flag-stage">
                <summary>
                  <span className="flag-stage-title">{stage.title}</span>
                  <span className="flag-stage-skill">{stage.skill}</span>
                  <Lightbulb className="flag-stage-icon" weight="fill" aria-label="提示" />
                </summary>
                <p>{stage.hint}</p>
              </details>
            ))}
          </div>

          <form className="glass-card flag-form" onSubmit={handleSubmit}>
            <label htmlFor="flag-input">提交 Flag</label>
            <div className="flag-input-row">
              <input
                id="flag-input"
                value={flag}
                onChange={e => { setFlag(e.target.value); setResult({ status: 'idle' }); }}
                placeholder="CSIE{...}"
                autoComplete="off"
                spellCheck={false}
              />
              <button type="submit" className="btn btn-primary" disabled={checking}>
                <PaperPlaneTilt weight="bold" />
                提交
              </button>
            </div>
            {result.status === 'wrong' && (
              <p className="flag-result wrong">不對喔，再找找看！記得五片都要照順序拼起來。</p>
            )}
            {result.status === 'correct' && (
              <p className="flag-result correct">
                🎉 恭喜解開 CSIE CTF！{result.rank !== null && <>你是第 <strong>{result.rank}</strong> 位解出的人。</>}
                <br />截圖這個畫面向朋友炫耀吧，也歡迎來找資訊部聊聊 😎
              </p>
            )}
          </form>
        </section>
      </main>
    </>
  );
};

export default Flag;
